'use strict';
/* ============ 11. TIỆN ÍCH GIAO DIỆN ============ */
function toast(msg,ms=3200){const t=document.createElement('div');t.className='toast';t.textContent=msg;$('#toast').appendChild(t);setTimeout(()=>t.remove(),ms)}
function openModal({title,body,actions=[],wide,static:st,onMount}){
 const back=document.createElement('div');back.className='modal-back';
 back.innerHTML=`<div class="modal ${wide?'wide':''}" role="dialog" aria-modal="true"><div class="mh"><span>${esc(title)}</span>${st?'':'<button class="btn sm" data-x>✕</button>'}</div><div class="mb">${body}</div><div class="mf"></div></div>`;
 $('#modal-root').appendChild(back);
 const close=()=>back.remove();
 const mf=$('.mf',back);
 actions.forEach(a=>{const b=document.createElement('button');b.className='btn '+(a.cls||'');b.textContent=a.label;b.onclick=async()=>{const r=await a.onClick?.(back,close);if(r===true)close()};mf.appendChild(b)});
 if(!actions.length)mf.remove();
 const x=$('[data-x]',back);if(x)x.onclick=close;
 if(!st)back.addEventListener('mousedown',e=>{if(e.target===back)close()});
 onMount?.(back,close);return close}
function confirmBox(msg,ok='Đồng ý'){return new Promise(res=>{let done=false;const fin=v=>{if(!done){done=true;res(v)}};openModal({title:'Xác nhận',body:`<p>${esc(msg)}</p>`,actions:[{label:'Hủy',onClick:()=>{fin(false);return true}},{label:ok,cls:'primary',onClick:()=>{fin(true);return true}}]})})}
function alertBox(title,html){openModal({title,body:html,actions:[{label:'Đã hiểu',cls:'primary',onClick:()=>true}]})}

/* ============ 12. LƯU TRỮ ============ */
let tSave,tEx;
function saveDraft(){clearTimeout(tSave);tSave=setTimeout(()=>store.set('rdk_cfg_draft',slimCfg()),700)}
function slimCfg(){const c=clone(S.cfg);c.docs.forEach(d=>{if(d.text.length>20000)d.text=d.text.slice(0,20000)});return c}
function saveLast(){store.set('rdk_cfg',slimCfg())}
function persistExam(){clearTimeout(tEx);tEx=setTimeout(()=>{if(S.exam)store.set('rdk_exam_cur',S.exam);else store.del('rdk_exam_cur')},500)}
function pushHist(label){if(!S.exam)return;S.hist.push({t:Date.now(),label:label||'Chỉnh sửa',n:S.exam.questions.length,json:JSON.stringify(S.exam)});if(S.hist.length>30)S.hist.shift()}
function loadCfg(c){S.cfg=Object.assign(DEF(),c);S.cfg.counts=Object.assign(DEF().counts,c.counts);S.cfg.essay=Object.assign(DEF().essay,c.essay);S.cfg.lvCount=Object.assign(DEF().lvCount,c.lvCount);S.cfg.lvPct=Object.assign(DEF().lvPct,c.lvPct);S.cfg.partScores=Object.assign(DEF().partScores,c.partScores||{});S.cfg.topicQ=Object.assign({},c.topicQ||{});S.cfg.essayW=Object.assign({},c.essayW||{})}

/* ============ 13. PANEL THIẾT LẬP ============ */
const inp=(label,k,ph='',t='text',cls='')=>`<label class="fld"><span>${label}</span><input type="${t}" data-k="${k}" value="${esc(get(S.cfg,k))}" placeholder="${esc(ph)}"></label>`;
const ta=(label,k,ph,rows=3,cls='')=>`<label class="fld"><span>${label}</span><textarea class="${cls}" rows="${rows}" data-k="${k}" placeholder="${esc(ph)}">${esc(get(S.cfg,k))}</textarea></label>`;
const numIn=(k,min=0)=>`<input type="number" min="${min}" step="1" data-k="${k}" data-int value="${get(S.cfg,k)}">`;
function stepDone(i){const c=S.cfg;return[!!(c.level&&c.grade),!!subjectOf(c),!!(c.topic||c.content||c.scope||c.docs.length||c.refText),true,totalOf(c)>0,levelCounts(c,totalOf(c)).ok,true][i]}
function renderSetup(){
 $('#stepper').innerHTML=STEPS.map((s,i)=>`<button class="stp ${S.step===i?'on':''} ${stepDone(i)&&i<6?'done':''}" data-act="goStep" data-v="${i}"><b>${i+1}</b>${s}</button>`).join('');
 $('#stepbody').innerHTML=[s0,s1,s2,s3,s4,s5,s6][S.step]();
 refreshLive()}
function s0(){const c=S.cfg;return `<h2>Bước 1 – Chọn cấp học</h2><div class="cards">${Object.entries(SCHOOL).map(([k,v])=>`<button class="lvcard ${c.level===k?'on':''}" data-act="setLevel" data-v="${k}"><b>${v.n}</b><span>${v.sub}</span></button>`).join('')}</div>
 ${c.level?`<h2>Bước 2 – Chọn lớp</h2><div class="chips">${SCHOOL[c.level].grades.map(g=>`<button class="chip ${+c.grade===g?'on':''}" data-act="setGrade" data-v="${g}">Lớp ${g}</button>`).join('')}</div>`:'<p class="hint">Chọn cấp học để hiển thị danh sách lớp phù hợp.</p>'}`}
function s1(){const c=S.cfg;const list=c.level?SCHOOL[c.level].subjects:[...new Set(Object.values(SCHOOL).flatMap(x=>x.subjects))];
 return `<h2>Bước 3 – Chọn môn học</h2><div class="chips">${list.map(s=>`<button class="chip ${c.subject===s&&!c.customSubject.trim()?'on':''}" data-act="setSubject" data-v="${esc(s)}">${esc(s)}</button>`).join('')}</div>
 ${inp('Nhập tên môn học khác','customSubject','Ví dụ: Giáo dục thể chất, Hoạt động trải nghiệm, Chuyên đề Toán…')}
 <div class="alert info">Môn đã chọn: <b>${esc(subjectOf(c)||'(chưa chọn)')}</b>. Ứng dụng áp dụng được cho mọi môn/chuyên đề.</div>`}
function s2(){const c=S.cfg;
 return `<h2>Bước 4 – Nội dung kiến thức</h2>
 ${ta('Tên bài / chủ đề','topic','Mỗi chủ đề một dòng (hoặc cách nhau dấu ;). Mỗi chủ đề sẽ là một hàng trong ma trận.',3)}
 ${ta('Nội dung / kiến thức trọng tâm','content','Tóm tắt nội dung cần kiểm tra, công thức, định nghĩa…',5)}
 ${ta('Phạm vi / giới hạn','scope','Những phần không ra đề, lưu ý đặc biệt…',2)}
 <h3>Tài liệu tham chiếu</h3>
 <div class="hint">Hỗ trợ PDF (có lớp chữ), Word .docx, TXT, hình ảnh. Chế độ "chỉ dùng tài liệu" sẽ báo thiếu dữ liệu thay vì tự bịa.</div>
 <div id="docList"></div>
 <div class="navrow" style="margin-top:8px"><button class="btn" data-act="addDoc">+ Thêm tài liệu</button><button class="btn" data-act="pasteRef">Dán nội dung</button></div>
 ${ta('Nội dung dán trực tiếp','refText','Dán đoạn văn, bảng, công thức…',4)}
 <div class="seg" style="margin-top:10px"><button class="${c.srcMode==='mix'?'on':''}" data-act="setSrc" data-v="mix">Kết hợp</button><button class="${c.srcMode==='doc'?'on':''}" data-act="setSrc" data-v="doc">Chỉ tài liệu</button><button class="${c.srcMode==='kb'?'on':''}" data-act="setSrc" data-v="kb">Kiến thức chung</button></div>`}
function s3(){const c=S.cfg;
 return `<h2>Bước 5 – Loại đề & mẫu cấu trúc</h2>
 <div class="seg"><button class="${c.examType==='mixed'?'on':''}" data-act="setExamType" data-v="mixed">Hỗn hợp</button><button class="${c.examType==='mc'?'on':''}" data-act="setExamType" data-v="mc">Trắc nghiệm</button><button class="${c.examType==='essay'?'on':''}" data-act="setExamType" data-v="essay">Tự luận</button></div>
 <h3>Mẫu cấu trúc đề</h3>
 <div class="tpl" id="tpls"></div>
 <div class="hint">Chọn mẫu để tự điền số câu, mức độ. Có thể chỉnh sửa sau.</div>`}
function s4(){const c=S.cfg;
 return `<h2>Bước 6 – Dạng câu & số lượng</h2>
 <div class="cnt"><label>Trắc nghiệm 4 lựa chọn (MC4)</label>${numIn('counts.mc4')}</div>
 <div class="cnt"><label>Nhiều đáp án đúng</label>${numIn('counts.multi')}</div>
 <div class="cnt"><label>Đúng / Sai</label>${numIn('counts.tf')}</div>
 <div class="cnt"><label>Ghép nối</label>${numIn('counts.match')}</div>
 <div class="cnt"><label>Điền khuyết</label>${numIn('counts.fill')}</div>
 <div class="cnt"><label>Trả lời ngắn</label>${numIn('counts.short')}</div>
 <div class="cnt"><label>Tự luận</label>${numIn('counts.essay')}</div>
 <div class="alert info">Tổng: <b id="totLive">0</b> câu</div>`}
function s5(){const c=S.cfg;
 return `<h2>Bước 7 – Mức độ & thang điểm</h2>
 <div class="seg"><button class="${c.lvMode==='count'?'on':''}" data-act="setLvMode" data-v="count">Theo số câu</button><button class="${c.lvMode==='pct'?'on':''}" data-act="setLvMode" data-v="pct">Theo %</button></div>
 <div class="grid2">
  <div class="cnt"><label>Nhận biết</label>${numIn('lvCount.nb')}</div>
  <div class="cnt"><label>Thông hiểu</label>${numIn('lvCount.th')}</div>
  <div class="cnt"><label>Vận dụng</label>${numIn('lvCount.vd')}</div>
  <div class="cnt"><label>Vận dụng cao</label>${numIn('lvCount.vdc')}</div>
 </div>
 <h3>Thang điểm</h3>
 <div class="cnt"><label>Tổng điểm</label>${numIn('totalScore',1)}</div>
 <div class="seg"><button class="${c.scoreMode==='equal'?'on':''}" data-act="setScoreMode" data-v="equal">Đều nhau</button><button class="${c.scoreMode==='weight'?'on':''}" data-act="setScoreMode" data-v="weight">Theo trọng số</button><button class="${c.scoreMode==='part'?'on':''}" data-act="setScoreMode" data-v="part">Theo phần</button></div>`}
function s6(){const c=S.cfg;
 return `<h2>Bước 8 – Nâng cao</h2>
 ${inp('Tên trường / đơn vị','school','Trường THPT …')}
 ${inp('Họ tên giáo viên','teacher','')}
 ${inp('Thời gian làm bài (phút)','time','45')}
 ${inp('Năm học','year','2025-2026')}
 <div class="cnt"><label>Số mã đề</label>${numIn('codes',1)}</div>
 <div class="hint">Mã đề 101–104: đảo câu, đảo đáp án.</div>
 <label class="fld"><span>Ghi chú thêm cho AI</span><textarea data-k="extra" rows="3">${esc(c.extra)}</textarea></label>`}
function refreshLive(){const t=totalOf(S.cfg);const el=$('#totLive');if(el)el.textContent=t}

/* ============ 14. TẢI TÀI LIỆU ============ */
async function addDoc(){
 const input=document.createElement('input');input.type='file';input.multiple=true;input.accept='.pdf,.docx,.txt,.png,.jpg,.jpeg,.webp';
 input.onchange=async()=>{for(const f of input.files){try{const d=await readFile(f);S.cfg.docs.push(d);saveDraft();renderSetup();toast('Đã thêm: '+f.name)}catch(e){toast(e.message||'Lỗi đọc tệp')}}};
 input.click()}
async function readFile(f){
 const ext=(f.name.split('.').pop()||'').toLowerCase();
 if(['png','jpg','jpeg','webp'].includes(ext))return{name:f.name,type:'image',text:'[Hình ảnh]',blob:f};
 if(ext==='txt')return{name:f.name,type:'txt',text:await f.text()};
 if(ext==='docx'){
  if(!window.mammoth)throw new Error('Không tải được mammoth');
  const r=await mammoth.extractRawText({arrayBuffer:await f.arrayBuffer()});
  return{name:f.name,type:'docx',text:r.value};
 }
 if(ext==='pdf'){
  if(!window.pdfjsLib)throw new Error('Không tải được pdf.js');
  const pdf=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise;
  let t='';for(let i=1;i<=pdf.numPages;i++){const p=await pdf.getPage(i);const c=await p.getTextContent();t+=c.items.map(x=>x.str).join(' ')+'\n'}
  return{name:f.name,type:'pdf',text:t};
 }
 throw new Error('Định dạng không hỗ trợ: '+ext)}
function pasteRef(){openModal({title:'Dán nội dung',body:`<textarea id="pasteArea" class="big" rows="12" placeholder="Dán nội dung tại đây…"></textarea>`,actions:[{label:'Hủy',onClick:()=>true},{label:'Thêm',cls:'primary',onClick:b=>{const t=$('#pasteArea',b).value.trim();if(t){S.cfg.refText=(S.cfg.refText?S.cfg.refText+'\n\n':'')+t;saveDraft();renderSetup();toast('Đã thêm nội dung dán');return true}}]})}

/* ============ 15. SỰ KIỆN THIẾT LẬP ============ */
function bindSetup(){
 document.addEventListener('click',e=>{
  const a=e.target.closest('[data-act]');if(!a)return;
  const act=a.dataset.act,v=a.dataset.v;
  if(act==='goStep'){S.step=+v;renderSetup()}
  if(act==='setLevel'){S.cfg.level=v;S.cfg.grade='';S.cfg.subject='';S.cfg.customSubject='';saveDraft();renderSetup()}
  if(act==='setGrade'){S.cfg.grade=v;saveDraft();renderSetup()}
  if(act==='setSubject'){S.cfg.subject=v;S.cfg.customSubject='';saveDraft();renderSetup()}
  if(act==='setSrc'){S.cfg.srcMode=v;saveDraft();renderSetup()}
  if(act==='setExamType'){S.cfg.examType=v;saveDraft();renderSetup()}
  if(act==='setLvMode'){S.cfg.lvMode=v;saveDraft();renderSetup()}
  if(act==='setScoreMode'){S.cfg.scoreMode=v;saveDraft();renderSetup()}
  if(act==='addDoc')addDoc();
  if(act==='pasteRef')pasteRef();
  if(act==='prevStep'){if(S.step>0){S.step--;renderSetup()}}
  if(act==='nextStep'){if(S.step<6){S.step++;renderSetup()}}
 });
 document.addEventListener('input',e=>{
  const el=e.target;if(!el.dataset.k)return;
  const k=el.dataset.k;let val=el.value;
  if(el.dataset.int)val=+val||0;
  set(S.cfg,k,val);saveDraft();refreshLive();
 });
}
