'use strict';
/*
 * Chế độ độc lập (GitHub Pages / mở file trực tiếp).
 * Khi chạy trong Claude.ai, đối tượng window.claude đã có sẵn nên tệp này không làm gì.
 * Khi chạy ở nơi khác, tệp này tạo window.claude với:
 *   - use('sample')    → gọi Anthropic Messages API bằng khóa API do người dùng nhập
 *   - use('downloads') → tải tệp xuống bằng thẻ <a download>
 * Khóa API chỉ lưu trong localStorage của trình duyệt người dùng, KHÔNG được commit vào mã nguồn.
 */
(function(){
 if(window.claude)return;
 window.__STANDALONE=true;
 const K='rdk_ai_cfg';
 const DEFAULTS={key:'',model:'claude-sonnet-5-5',quick:'claude-haiku-5-5'};
 const getCfg=()=>{try{return Object.assign({},DEFAULTS,JSON.parse(localStorage.getItem(K)||'{}'))}catch(e){return Object.assign({},DEFAULTS)}};
 const setCfg=c=>{try{localStorage.setItem(K,JSON.stringify(c))}catch(e){}};
 const b64=blob=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(',')[1]);r.onerror=rej;r.readAsDataURL(blob)});

 async function call(prompt,o){
  o=o||{};const cfg=getCfg();
  if(!cfg.key)throw{code:'not_granted',message:'Chưa nhập khóa API. Hãy bấm “⚙ Cài đặt AI” để nhập khóa API Anthropic.'};
  const model=o.modelTier==='quick'?(cfg.quick||DEFAULTS.quick):(cfg.model||DEFAULTS.model);
  const content=[];
  for(const img of (o.images||[])){content.push({type:'image',source:{type:'base64',media_type:img.type||'image/png',data:await b64(img)}})}
  content.push({type:'text',text:prompt});
  let res;
  try{
   res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',signal:o.signal,
    headers:{'content-type':'application/json','x-api-key':cfg.key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
    body:JSON.stringify({model,max_tokens:8000,messages:[{role:'user',content}]})});
  }catch(e){
   if(e&&e.name==='AbortError')throw{code:'cancelled',message:'Đã hủy'};
   throw{code:'network',message:'Không kết nối được tới Anthropic API. Kiểm tra mạng.'};
  }
  if(!res.ok){
   let msg='';try{msg=(await res.json()).error?.message||''}catch(e){}
   const code=res.status===429||res.status===529?'rate_limited':(res.status===401||res.status===403)?'not_granted':'error';
   throw{code,message:code==='not_granted'?'Khóa API không hợp lệ hoặc không có quyền. '+msg:'Lỗi API ('+res.status+'). '+msg};
  }
  const data=await res.json();
  return{text:(data.content||[]).filter(b=>b.type==='text').map(b=>b.text).join(''),truncated:data.stop_reason==='max_tokens'};
 }

 const sample={async complete(prompt,o){return call(prompt,o)}};
 const MIME={docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',json:'application/json',html:'text/html',txt:'text/plain',png:'image/png'};
 const downloads={async save(filename,data){
  const ext=(filename.split('.').pop()||'').toLowerCase();
  const blob=data instanceof Blob?data:new Blob([data],{type:MIME[ext]||'application/octet-stream'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);
  return{status:'saved'};
 }};
 window.claude={use:async n=>n==='sample'?sample:n==='downloads'?downloads:null};

 function openSettings(){
  const c=getCfg();
  openModal({title:'⚙ Cài đặt AI (chế độ độc lập)',
   body:`<p class="hint">Ứng dụng gọi trực tiếp Anthropic API từ trình duyệt của bạn. Khóa API chỉ được lưu trong trình duyệt này (localStorage), không gửi đi đâu khác ngoài api.anthropic.com. Không dùng khóa này trên máy tính dùng chung.</p>
   <label class="fld"><span>Khóa API Anthropic</span><input type="password" id="aiKey" autocomplete="off" placeholder="sk-ant-..." value="${esc(c.key)}"></label>
   <label class="fld"><span>Model dùng để soạn và kiểm tra đề</span><input type="text" id="aiModel" value="${esc(c.model)}"></label>
   <label class="fld"><span>Model nhanh (đọc ảnh/OCR)</span><input type="text" id="aiQuick" value="${esc(c.quick)}"></label>
   <div id="aiTest"></div>`,
   actions:[
    {label:'Kiểm tra kết nối',onClick:async b=>{save(b);const t=$('#aiTest',b);t.innerHTML='<div class="alert info">Đang kiểm tra…</div>';
      try{const r=await sample.complete('Chỉ trả lời đúng một từ: OK',{modelTier:'default'});t.innerHTML='<div class="alert ok">Kết nối thành công: '+esc((r.text||'').slice(0,40))+'</div>'}
      catch(e){t.innerHTML='<div class="alert err">'+esc(e.message||e.code||'Lỗi')+'</div>'}return false}},
    {label:'Xóa khóa',cls:'danger',onClick:()=>{setCfg(Object.assign(getCfg(),{key:''}));toast('Đã xóa khóa API.');return true}},
    {label:'Lưu',cls:'primary',onClick:b=>{save(b);toast('Đã lưu cài đặt AI.');return true}}]});
  function save(b){setCfg({key:$('#aiKey',b).value.trim(),model:$('#aiModel',b).value.trim()||DEFAULTS.model,quick:$('#aiQuick',b).value.trim()||DEFAULTS.quick})}
 }
 window.rdkOpenAiSettings=openSettings;
 const top=document.querySelector('.top-actions');
 if(top){const b=document.createElement('button');b.className='tbtn';b.textContent='⚙ Cài đặt AI';b.onclick=openSettings;top.prepend(b)}
 window.addEventListener('load',()=>{if(!getCfg().key)setTimeout(()=>{try{toast('Chưa có khóa API – bấm “⚙ Cài đặt AI” để bắt đầu.',6000)}catch(e){}},600)});
})();
