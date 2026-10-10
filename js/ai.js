'use strict';
/* ============ 7. LỚP AI ============ */
let _sm,_smTried=false,_lim=null;
async function getSample(){
 if(_smTried)return _sm;_smTried=true;
 try{if(window.claude)_sm=await claude.use('sample')}catch(e){_sm=null}
 if(_sm){try{_lim=await _sm.limits()}catch(e){_lim=null}}
 return _sm||null}
const maxRef=()=>{const b=_lim?.maxPromptBytes;return b?Math.max(3000,Math.min(30000,Math.floor((b-16000)/3))):14000};
async function aiJson(prompt,tier){
 const sm=await getSample();if(!sm)throw{code:'no_ai',message:'Tính năng AI chưa khả dụng trong môi trường này.'};
 let last;
 for(let t=0;t<4;t++){
  try{return await sm.json(prompt,{modelTier:tier||'default',cache:false,signal:S.abort?.signal})}
  catch(e){last=e;const cd=e&&e.code;if(cd==='cancelled'||cd==='not_granted')throw e;checkAbort();await sleep(cd==='rate_limited'?4000*(t+1):1200*(t+1))}
 }throw last}
function checkAbort(){if(S.abort?.signal.aborted)throw{code:'cancelled',message:'Đã hủy'}}

function refBlock(c){
 if(c.sourceMode==='teacher')return'';
 let t=c.docs.map(d=>`### [${d.kind}] ${d.name}\n${d.text}`).join('\n\n');
 if(c.refText.trim())t+=(t?'\n\n':'')+'### [Nội dung dán trực tiếp]\n'+c.refText.trim();
 const m=maxRef();return t.length>m?t.slice(0,m)+'\n[…đã cắt bớt do quá dài]':t}
function ctxInfo(c){
 const sub=subjectOf(c);
 return{c,sub,cat:subjCat(sub),lvName:SCHOOL[c.level].nm,grade:c.grade,
  know:[['Tên bài/chủ đề',c.topic],['Chương',c.chapter],['Phạm vi kiến thức',c.scope],['Nội dung cần kiểm tra',c.needTest],['Yêu cầu cần đạt',c.outcomes],['Ghi chú của giáo viên',c.notes],['Nội dung bài học do giáo viên cung cấp',c.content]].filter(x=>str(x[1])).map(x=>`- ${x[0]}: ${x[1].trim()}`).join('\n'),
  ref:refBlock(c)}}
function modeRule(c,hasRef){
 if(c.sourceMode==='ref')return'CHẾ ĐỘ: CHỈ SỬ DỤNG TÀI LIỆU ĐÃ CUNG CẤP. Tuyệt đối không bổ sung kiến thức, dữ kiện, số liệu ngoài tài liệu. Nếu tài liệu không đủ để ra câu hỏi chính xác cho một câu, KHÔNG bịa: đưa câu đó vào mảng "insufficient" kèm lý do.';
 if(c.sourceMode==='teacher')return'CHẾ ĐỘ: CHỈ DỰA VÀO NỘI DUNG GIÁO VIÊN NHẬP (mục NỘI DUNG KIẾN THỨC). Không mở rộng ngoài phạm vi đó. Nếu không đủ dữ liệu cho một câu, đưa vào "insufficient" kèm lý do thay vì tự bịa.';
 return hasRef?'CHẾ ĐỘ: ƯU TIÊN TUYỆT ĐỐI nội dung trong TÀI LIỆU THAM CHIẾU; chỉ bổ sung kiến thức chương trình phổ thông chính xác, đúng lớp khi tài liệu chưa đủ. Nếu không chắc, đánh dấu uncertain.':'CHẾ ĐỘ: Dùng NỘI DUNG KIẾN THỨC giáo viên nêu và kiến thức chương trình phổ thông hiện hành đúng lớp. Nếu không chắc về dữ kiện, đánh dấu uncertain.'}
const CAT_RULE={
 calc:'MÔN CÓ TÍNH TOÁN: trước khi viết đáp án phải TỰ GIẢI LẠI từng bài từng bước (dữ kiện → công thức → phép tính → đơn vị → kết quả). Đáp án trắc nghiệm phải trùng kết quả tính. Không tạo bài vô nghiệm hoặc thiếu dữ kiện. Số liệu gọn, hợp lý, đúng thực tế. Phương án nhiễu là các kết quả sai thường gặp, cùng kiểu số và đơn vị. Phần "explanation" ghi các bước giải.',
 lang:'MÔN NGỮ VĂN/TIẾNG VIỆT/NGOẠI NGỮ: hỗ trợ đọc hiểu, từ vựng, ngữ pháp, viết. Nếu giáo viên cung cấp văn bản đọc hiểu thì dùng đúng văn bản đó. Không chép dài tác phẩm có bản quyền; nếu cần ngữ liệu mới thì tự viết ngữ liệu nguyên bản, ngắn gọn, phù hợp lứa tuổi. Với ngoại ngữ, nội dung câu hỏi bằng ngôn ngữ của môn học.',
 fact:'MÔN LỊCH SỬ/ĐỊA LÍ/GDCD/KINH TẾ-PHÁP LUẬT: kiểm tra kỹ mốc thời gian, nhân vật, địa danh, sự kiện, thuật ngữ, số liệu, quan hệ nguyên nhân–kết quả. Tuyệt đối không bịa dữ kiện hay số liệu không có căn cứ; không chắc thì đặt uncertain=true.',
 gen:''};
const TYPE_SPEC={
 mc4:'"options": mảng đúng 4 chuỗi (KHÔNG kèm A./B.), "correctAnswer": "A"|"B"|"C"|"D". Vị trí đáp án đúng phân bố ngẫu nhiên; 3 phương án nhiễu hợp lý, cùng kiểu dữ liệu; chỉ 1 đáp án đúng; không dùng "cả A và B".',
 mcMulti:'"options": 4 chuỗi (không kèm A./B.), "correctAnswer": các chữ cái đúng cách nhau dấu phẩy, ví dụ "A,C" (2–3 đáp án đúng). Câu hỏi nêu rõ "chọn tất cả các đáp án đúng".',
 tf:'"question": ngữ cảnh/dẫn chung; "options": 4 mệnh đề (không đánh a,b,c,d), "correctAnswer": 4 giá trị "Đ" hoặc "S" cách nhau dấu phẩy, ví dụ "Đ,S,Đ,S" (có ít nhất 1 Đ và 1 S).',
 match:'"pairs": 4 cặp (3–5) dạng {"left":"...","right":"..."}; mỗi vế trái chỉ khớp duy nhất 1 vế phải; "question" là yêu cầu ghép; "correctAnswer": "" (ứng dụng tự tính).',
 fill:'"question" chứa chỗ trống "……"; "correctAnswer": từ/cụm cần điền (nhiều chỗ trống thì cách nhau dấu chấm phẩy).',
 short:'"correctAnswer": một đáp án ngắn duy nhất (số/từ/cụm từ, kèm đơn vị nếu có).',
 essay:'"question" theo đúng "kind" của câu (nếu kind là Đọc hiểu: kèm đoạn ngữ liệu trong chính "question"); "correctAnswer": đáp án/gợi ý trả lời chi tiết; "rubric": 2–6 ý [{"content":"nội dung cần đạt","weight":số dương tương đối}]; "gradingNotes": lưu ý chấm.'};
function buildGenPrompt(sl,x,avoid,extra){
 const c=x.c;
 const list=sl.map(s=>({id:s.id,type:s.type,typeName:TYPES[s.type].n,level:LV[s.level],topic:s.topic,kind:s.kind||undefined,score:s.score}));
 const types=[...new Set(sl.map(s=>s.type))];
 return `Bạn là chuyên gia khảo thí và giáo viên giỏi môn ${x.sub} của Việt Nam, am hiểu Chương trình giáo dục phổ thông hiện hành. Hãy soạn CÂU HỎI cho "${examName(c)}" dành cho học sinh ${x.lvName} – Lớp ${x.grade}, môn ${x.sub}, thời gian ${durOf(c)} phút, thang điểm ${scaleOf(c)}.

NỘI DUNG KIẾN THỨC:
${x.know||'(không có – dùng kiến thức chương trình phù hợp lớp/môn)'}

${x.ref?'TÀI LIỆU THAM CHIẾU:\n'+x.ref+'\n':''}
${modeRule(c,!!x.ref)}

QUY TẮC CHUNG: đúng kiến thức, đúng môn, đúng lớp, đúng cấp, đúng chủ đề, phù hợp thời lượng; ngôn ngữ rõ ràng, không mơ hồ; không có hai đáp án đúng ngoài chủ ý; không lặp câu; không để lộ đáp án trong câu hỏi; không tạo câu vô nghĩa; không tạo dữ liệu/số liệu sai; không hỏi ngoài phạm vi kiến thức đã nêu. Viết công thức bằng ký hiệu Unicode (x², √, π, ≤, ≥, →, H₂O), KHÔNG dùng LaTeX. Đúng chính tả tiếng Việt.
${CAT_RULE[x.cat]}
MỨC ĐỘ: Nhận biết = nhớ/nhận ra kiến thức; Thông hiểu = giải thích, diễn đạt, so sánh; Vận dụng = dùng kiến thức giải quyết tình huống quen thuộc; Vận dụng cao = tình huống mới, tổng hợp, nhiều bước. Độ khó của câu phải đúng mức độ được giao.

ĐỊNH DẠNG TỪNG DẠNG CÂU (chỉ các dạng cần dùng):
${types.map(t=>`- ${t} (${TYPES[t].n}): ${TYPE_SPEC[t]}`).join('\n')}

TRƯỜNG CHUNG MỖI CÂU: "id" (giữ nguyên), "question", "knowledgeUnit" (đơn vị kiến thức), "learningOutcome" (yêu cầu cần đạt, bắt đầu bằng động từ), "explanation" (lời giải/giải thích ngắn gọn), "uncertain" (true nếu bạn không chắc chắn về đáp án hoặc dữ kiện), "uncertainNote".

DANH SÁCH CÂU CẦN SOẠN (đúng số lượng, đúng id, đúng dạng, đúng mức độ, đúng chủ đề):
${JSON.stringify(list)}
${avoid&&avoid.length?'\nKHÔNG trùng hoặc gần giống các câu sau:\n'+avoid.slice(0,40).map(a=>'- '+a.slice(0,90)).join('\n'):''}
${extra||''}

Chỉ trả về MỘT đối tượng JSON, không kèm giải thích: {"questions":[...],"insufficient":[{"id":"...","reason":"..."}]}`}
function buildVerifyPrompt(qs,x){
 const data=qs.map(q=>({id:q.id,type:q.type,level:LV[q.level],topic:q.topic,question:q.question,options:q.options.some(Boolean)?q.options:undefined,pairs:q.pairs.length?q.pairs.map((p,i)=>({n:i+1,left:p.left,right:p.right})):undefined,correctAnswer:q.type==='match'?undefined:q.correctAnswer,explanation:q.explanation.slice(0,400)}));
 return `Bạn là giám khảo khó tính, thẩm định đề thi môn ${x.sub}, ${x.lvName} lớp ${x.grade}. Với MỖI câu dưới đây, hãy TỰ GIẢI độc lập (không tin đáp án cho sẵn) rồi so với "correctAnswer".
Phạm vi kiến thức: ${x.c.topic||x.c.scope||x.sub}. ${x.c.needTest?'Cần kiểm tra: '+x.c.needTest:''}
${x.ref?'Tài liệu tham chiếu (rút gọn):\n'+x.ref.slice(0,Math.min(6000,x.ref.length))+'\n':''}
Với từng câu trả về: {"id","answerCorrect":true/false (đáp án cho sẵn đúng?),"yourAnswer":"đáp án của bạn","inScope":true/false (đúng môn, đúng lớp, đúng phạm vi?),"missingData":true/false (thiếu dữ kiện/vô nghiệm?),"ambiguous":true/false (mơ hồ hoặc có >1 đáp án đúng ngoài chủ ý?),"spellingFixes":[{"from":"đoạn sai chính tả","to":"đoạn đã sửa"}],"note":"mô tả ngắn vấn đề nếu có, nếu ổn để rỗng"}.
Với dạng tự luận chỉ cần đánh giá hợp lý của đáp án gợi ý. Với dạng ghép nối, "pairs" cùng số n là cặp đúng.
DỮ LIỆU:
${JSON.stringify(data)}
Chỉ trả về JSON: {"results":[...]}`}

/* ============ 8. ĐƯỜNG ỐNG TẠO ĐỀ ============ */
let liveFn=null;
function mkBatches(slots){const out=[];let cur=[];slots.forEach(s=>{if(s.type==='essay'){out.push([s])}else{cur.push(s);if(cur.length===5){out.push(cur);cur=[]}}});if(cur.length)out.push(cur);return out}
async function runBatch(b,x,avoid,extra,out,bad){
 checkAbort();
 try{
  const res=await aiJson(buildGenPrompt(b,x,avoid,extra),x.cat==='calc'?'complex':'default');
  const arr=Array.isArray(res)?res:(res.questions||[]);
  arr.forEach(r=>{const sl=b.find(s=>s.id===String(r.id));if(sl&&!out[sl.id]){out[sl.id]=normQ(r,sl);if(liveFn)liveFn(sl.id,out[sl.id])}});
  (res.insufficient||[]).forEach(i=>{bad[i.id]=str(i.reason)||'Không đủ dữ liệu trong tài liệu để ra câu này.'});
  b.forEach(s=>{if(!out[s.id]&&!bad[s.id])bad[s.id]='AI không trả về câu này.'});
 }catch(e){
  if(e&&(e.code==='cancelled'||e.code==='not_granted'||e.code==='no_ai'))throw e;
  if(b.length>1){for(const s of b)await runBatch([s],x,avoid,extra,out,bad)}
  else bad[b[0].id]='Lỗi AI: '+((e&&(e.message||e.code))||'không rõ')}}
async function genSlots(slots,x,avoid,extra){const out={},bad={};await pool(mkBatches(slots),2,b=>runBatch(b,x,avoid,extra,out,bad));return{out,bad}}
function applyVerify(q,r){
 q.ai={checked:true,answerOk:r.answerCorrect!==false,inScope:r.inScope!==false,missing:!!r.missingData,ambiguous:!!r.ambiguous,spelling:[],note:str(r.note),yourAnswer:str(r.yourAnswer)};
 (r.spellingFixes||[]).forEach(f=>{const a=str(f.from),b=str(f.to);if(!a||!b||a===b)return;q.ai.spelling.push(a+' → '+b);if(q.locked)return;
  ['question','explanation','correctAnswer'].forEach(k=>{if(q[k]&&q[k].includes(a)&&(k!=='correctAnswer'||q.type==='fill'||q.type==='short'))q[k]=q[k].split(a).join(b)});q.options=q.options.map(o=>o.split(a).join(b));q.pairs.forEach(p=>{p.left=p.left.split(a).join(b);p.right=p.right.split(a).join(b)})})}
const aiFail=q=>!!(q.ai&&(q.ai.answerOk===false||q.ai.missing||q.ai.ambiguous||q.ai.inScope===false));
async function aiVerify(qs,x){
 const done=[];
 await pool(chunk(qs.filter(q=>!q.empty),6),2,async b=>{
  checkAbort();
  try{const res=await aiJson(buildVerifyPrompt(b,x),x.cat==='calc'?'complex':'default');
   (res.results||[]).forEach(r=>{const q=b.find(k=>k.id===String(r.id));if(q){applyVerify(q,r);done.push(q.id)}})}
  catch(e){if(e&&(e.code==='cancelled'||e.code==='not_granted'))throw e}
 });return done}
function parseTeacher(text){
 if(!text.trim())return[];
 return text.split(/\n\s*\n/).map(b=>b.trim()).filter(Boolean).map(b=>{
  const lines=b.split('\n').map(l=>l.trim()).filter(Boolean);let ans='',expl='',stem=[],opts=[],st=[];
  lines.forEach(l=>{let m;
   if((m=l.match(/^(đáp án|dap an|đ\/a|answer)\s*[:：]\s*(.+)$/i)))ans=m[2].trim();
   else if((m=l.match(/^(giải thích|hướng dẫn|lời giải|hdc)\s*[:：]\s*(.+)$/i)))expl=m[2].trim();
   else if((m=l.match(/^([A-D])[\.\)]\s*(.+)$/)))opts.push(m[2].trim());
   else if((m=l.match(/^([a-d])[\.\)]\s*(.+)$/)))st.push(m[2].trim());
   else stem.push(l)});
  let question=stem.join('\n').replace(/^câu\s*\d+\s*[\.:\)]?\s*/i,'');
  const L=(ans.toUpperCase().match(/[A-D]/g)||[]);
  let t,q={question,options:[],correctAnswer:ans,explanation:expl};
  if(opts.length>=3){while(opts.length<4)opts.push('');q.options=opts.slice(0,4);t=[...new Set(L)].length>1?'mcMulti':'mc4';q.correctAnswer=[...new Set(L)].sort().join(',')}
  else if(st.length>=3&&/(đ|s|đúng|sai)/i.test(ans)){t='tf';while(st.length<4)st.push('');q.options=st.slice(0,4);q.correctAnswer=(ans.match(/đúng|sai|Đ|S/gi)||[]).map(v=>/^(đ|đúng)$/i.test(v)?'Đ':'S').join(',')}
  else if(BLANK.test(question)&&ans&&ans.length<60)t='fill';
  else if(ans&&ans.length<40&&!/\n/.test(ans)&&question.length<400&&!/(trình bày|giải thích|phân tích|chứng minh|so sánh|viết)/i.test(question))t='short';
  else t='essay';
  return{type:t,q}})}
function teacherQ(tq,slot){
 const q={id:slot.id,type:slot.type,level:slot.level,topic:slot.topic,kind:slot.kind||'',unit:'',outcome:'',question:tq.q.question,options:tq.q.options.slice(),pairs:[],rightOrder:[],correctAnswer:tq.q.correctAnswer,explanation:tq.q.explanation,rubric:[],gradingNotes:'',score:slot.score,locked:true,uncertain:false,uncertainNote:'',src:'teacher'};
 if(q.type==='essay')q.rubric=rubricFrom([{content:q.explanation||q.correctAnswer||'Trả lời đúng, đầy đủ theo yêu cầu',weight:1}],q.score,0.25);
 if(!q.options.length)q.options=['','','',''];
 return q}

/* progress overlay */
let progClose=null;
function showProg(){
 const labels=['Đang phân tích yêu cầu…','Đang xây dựng ma trận…','Đang tạo câu hỏi…','Đang kiểm tra đáp án…','Đang hoàn thiện đề…'];
 S.abort=new AbortController();
 const close=openModal({title:'Đang tạo đề',body:`<ul class="prog" id="progList" style="padding:0;margin:0">${labels.map(l=>`<li>${l}</li>`).join('')}</ul><div class="bar"><i id="progBar"></i></div><div class="hint" id="progNote">Quá trình có thể mất 1–3 phút tùy số câu. Vui lòng giữ nguyên trang.</div><div id="progLive" style="max-height:170px;overflow:auto;font-size:12.5px;border-top:1px solid var(--border);padding-top:6px"></div>`,actions:[{label:'Hủy',onClick:()=>{S.abort.abort();return true}}],static:true});
 progClose=close;
 liveFn=(id,q)=>{const d=$('#progLive');if(d){const r=document.createElement('div');r.textContent='✔ '+id+' · '+TYPES[q.type].n+' · '+LV[q.level]+' — '+(q.question||'').replace(/\s+/g,' ').slice(0,70);d.appendChild(r);d.scrollTop=d.scrollHeight}};
 return{set(i,note,frac){$$('#progList li').forEach((li,k)=>{li.className=k<i?'done':k===i?'on':''});const b=$('#progBar');if(b)b.style.width=Math.round(((i+(frac||0))/5)*100)+'%';if(note){const n=$('#progNote');if(n)n.textContent=note}},close(){liveFn=null;close()}}}

async function runPipeline(slots,opts){
 const c=S.cfg,x=ctxInfo(c),P=showProg();
 let qs={};let notes=[];
 try{
  P.set(0);await sleep(250);
  const sm=await getSample();
  if(!sm)notes.push('AI chưa khả dụng – các câu chưa có nội dung được để trống để bạn tự nhập.');
  P.set(1);await sleep(250);
  // câu giáo viên nhập
  const lockedIds=new Set();
  (opts.fixed||[]).forEach(f=>{qs[f.id]=f;lockedIds.add(f.id)});
  const todo=slots.filter(s=>!qs[s.id]);
  const avoid=[...(opts.avoid||[]),...Object.values(qs).map(q=>q.question)];
  P.set(2,`Đang soạn ${todo.length} câu…`);
  let bad={};
  if(sm&&todo.length){const r=await genSlots(todo,x,avoid,opts.extra);Object.assign(qs,r.out);bad=r.bad}
  else todo.forEach(s=>bad[s.id]='AI chưa khả dụng.');
  // sửa lỗi cấu trúc
  for(let round=0;round<2&&sm;round++){
   checkAbort();
   const fix=slots.filter(s=>!lockedIds.has(s.id)&&(!qs[s.id]||validateQ(qs[s.id]).e.length)&&!/Không đủ|tài liệu/i.test(bad[s.id]||''));
   if(!fix.length)break;
   P.set(2,`Đang sửa ${fix.length} câu chưa đạt…`);
   const r=await genSlots(fix,x,[...avoid,...Object.values(qs).map(q=>q.question)],'Lưu ý: lần soạn trước bị lỗi cấu trúc/đáp án, hãy soạn lại thật cẩn thận.');
   Object.assign(qs,r.out);Object.assign(bad,r.bad);Object.keys(r.out).forEach(k=>delete bad[k])}
  slots.forEach(s=>{if(!qs[s.id]||(validateQ(qs[s.id]).e.length&&!lockedIds.has(s.id)))qs[s.id]=blankQ(s,bad[s.id]||'Chưa tạo được câu hợp lệ.')});
  // kiểm tra bằng AI
  let list=slots.map(s=>qs[s.id]);
  if(sm){
   P.set(3,'Đang tự giải lại và đối chiếu đáp án…');
   await aiVerify(list,x);
   for(let round=0;round<2;round++){
    const fail=list.filter(q=>!q.locked&&!q.empty&&aiFail(q));
    if(!fail.length)break;
    checkAbort();P.set(3,`Đang sửa ${fail.length} câu AI phát hiện chưa đạt…`);
    const fs=fail.map(q=>slots.find(s=>s.id===q.id));
    const r=await genSlots(fs,x,[...avoid,...list.map(q=>q.question)],'Lưu ý: câu trước bị phát hiện sai đáp án/thiếu dữ kiện/mơ hồ. Hãy soạn lại chính xác.');
    const nw=Object.values(r.out).filter(q=>!validateQ(q).e.length);
    nw.forEach(q=>qs[q.id]=q);list=slots.map(s=>qs[s.id]);
    await aiVerify(nw,x)}
  }
  P.set(4,'Đang hoàn thiện đề…');
  list.forEach(q=>{
   if(aiFail(q)){q.uncertain=true;q.uncertainNote=q.uncertainNote||q.ai.note||'Kiểm tra bằng AI phát hiện vấn đề.'}
   const v=validateQ(q);if(v.w.length&&!q.empty){q.uncertain=true;q.uncertainNote=q.uncertainNote||v.w.join('; ')}
   if(!q.explanation&&!q.empty&&q.type!=='essay')q.explanation='Đáp án đúng: '+ansText(q)+'.';
   q.subject=subjectOf(c);q.grade=c.grade;q.schoolLevel=c.level});
  await sleep(250);P.close();return{questions:list,notes};
 }catch(e){P.close();throw e}}

/* ============ 9. KIỂM TRA ĐỀ (12 mục) ============ */
function runChecks(ex){
 const qs=ex.questions,t=tally(qs),tg=ex.target,ck=[];
 const add=(n,title,st,detail)=>ck.push({n,title,st,detail});
 const ai=qs.some(q=>q.ai?.checked);
 add(1,'Số câu có đúng cấu hình không?',t.total===tg.total?'ok':'fail',`Đề có ${t.total} câu, cấu hình ${tg.total} câu.`);
 add(2,'Tổng điểm có đúng không?',Math.abs(t.score-ex.meta.scale)<0.005?'ok':'fail',`Tổng điểm ${fmt(t.score)} / thang ${fmt(ex.meta.scale)}.`);
 const lvOk=LEVELS.every(l=>t.byLevel[l.k]===tg.byLevel[l.k]);
 add(3,'Tỷ lệ mức độ có đúng không?',lvOk?'ok':'fail',LEVELS.map(l=>`${l.n}: ${t.byLevel[l.k]}/${tg.byLevel[l.k]}`).join(' • '));
 const dup=[];for(let i=0;i<qs.length;i++)for(let j=i+1;j<qs.length;j++){if(qs[i].empty||qs[j].empty)continue;const a=words(qs[i].question),b=words(qs[j].question);if(a.size<4||b.size<4)continue;let inter=0;a.forEach(w=>{if(b.has(w))inter++});if(inter/(a.size+b.size-inter)>0.8)dup.push(`${qs[i].id} ≈ ${qs[j].id}`)}
 add(4,'Có câu bị trùng không?',dup.length?'warn':'ok',dup.length?'Nghi trùng: '+dup.join(', '):'Không phát hiện câu trùng.');
 const sErr=qs.map(q=>({id:q.id,v:validateQ(q)})).filter(o=>o.v.e.length);
 const aFail=qs.filter(aiFail);
 add(5,'Đáp án có chính xác không?',sErr.length||aFail.length?'fail':(ai?'ok':'warn'),sErr.length||aFail.length?[...sErr.map(o=>`${o.id}: ${o.v.e.join(', ')}`),...aFail.filter(q=>q.ai.answerOk===false).map(q=>`${q.id}: AI giải ra "${q.ai.yourAnswer}" – ${q.ai.note}`)].join(' | ')||'Có câu bị AI đánh dấu.':(ai?'AI đã tự giải lại toàn bộ câu và đối chiếu đáp án.':'Chưa kiểm tra bằng AI (chỉ kiểm tra cấu trúc).'));
 const sc=qs.filter(q=>q.ai&&q.ai.inScope===false);
 add(6,'Câu hỏi có đúng môn/lớp không?',sc.length?'warn':(ai?'ok':'warn'),sc.length?sc.map(q=>q.id+': '+q.ai.note).join(' | '):(ai?'Không phát hiện câu sai môn/lớp.':'Chưa kiểm tra bằng AI.'));
 add(7,'Có nội dung ngoài phạm vi không?',sc.length?'warn':(ai?'ok':'warn'),sc.length?sc.map(q=>q.id).join(', ')+' có thể ngoài phạm vi.':(ai?'Mọi câu nằm trong phạm vi đã quy định.':'Chưa kiểm tra bằng AI.'));
 const ms=qs.filter(q=>q.ai?.missing||q.ai?.ambiguous||q.empty);
 add(8,'Có câu thiếu dữ kiện/mơ hồ không?',ms.length?'fail':(ai?'ok':'warn'),ms.length?ms.map(q=>q.id+(q.empty?' (trống)':'')).join(', '):(ai?'Không phát hiện.':'Chưa kiểm tra bằng AI.'));
 const sp=qs.filter(q=>q.ai?.spelling?.length);
 add(9,'Có lỗi chính tả không?',sp.length?'warn':(ai?'ok':'warn'),sp.length?'Đã tự sửa: '+sp.map(q=>q.id+' ('+q.ai.spelling.join('; ')+')').join(' | '):(ai?'Không phát hiện lỗi chính tả.':'Chưa kiểm tra bằng AI.'));
 const m=buildMatrix(qs);const mOk=m.total===qs.length&&Math.abs(m.score-t.score)<0.005&&LEVELS.every(l=>m.lv[l.k].n===t.byLevel[l.k]);
 add(10,'Ma trận có khớp với đề không?',mOk?'ok':'fail',`Ma trận: ${m.total} câu, ${fmt(m.score)} điểm.`);
 const ansBad=qs.filter(q=>!q.empty&&(validateQ(q).e.length));
 add(11,'Đáp án có khớp với câu hỏi không?',ansBad.length?'fail':'ok',ansBad.length?ansBad.map(q=>q.id).join(', '):'Mỗi câu đều có đáp án đúng định dạng, khớp dạng câu.');
 const hd=qs.filter(q=>q.type==='essay'&&(!q.rubric.length||Math.abs(q.rubric.reduce((a,r)=>a+r.score,0)-q.score)>0.005));
 const noAns=qs.filter(q=>!q.empty&&!q.correctAnswer&&q.type!=='match');
 add(12,'Hướng dẫn chấm có đủ không?',hd.length||noAns.length?'fail':'ok',hd.length||noAns.length?[...hd.map(q=>q.id+': thang điểm ý không bằng điểm câu'),...noAns.map(q=>q.id+': thiếu đáp án')].join('; '):'Mọi câu đều có đáp án/hướng dẫn; điểm thành phần cộng đúng bằng điểm câu.');
 return ck}
function autoFixLocal(ex){
 // tự sửa: điểm lệch (nếu chưa chỉnh tay) và rubric lệch
 if(!ex.manualScores&&Math.abs(sumScore(ex.questions)-ex.meta.scale)>0.005)rebalanceScores(ex);
 ex.questions.forEach(q=>{if(q.type==='essay'&&q.rubric?.length){const s=q.rubric.reduce((a,r)=>a+r.score,0);if(Math.abs(s-q.score)>0.005)q.rubric=rubricFrom(q.rubric.map(r=>({content:r.content,weight:r.weight||r.score})),q.score,ex.step||0.25)}});}

/* ============ 10. MA TRẬN / ĐẶC TẢ ============ */
function buildMatrix(items){
 const topics=[...new Set(items.map(i=>i.topic))];const lv={};LEVELS.forEach(l=>lv[l.k]={n:0,s:0});
 const rows=topics.map(tp=>{const cell={};LEVELS.forEach(l=>cell[l.k]={n:0,s:0,nums:[]});let n=0,s=0;
  items.filter(i=>i.topic===tp).forEach(i=>{const c=cell[i.level];c.n++;c.s=r3(c.s+i.score);if(i.num)c.nums.push(i.num);n++;s=r3(s+i.score);lv[i.level].n++;lv[i.level].s=r3(lv[i.level].s+i.score)});
  return{topic:tp,cell,n,s}});
 return{rows,lv,total:items.length,score:r3(items.reduce((a,i)=>a+i.score,0))}}
function matrixHtml(m,scale){
 const pc=s=>m.score?fmt(s/m.score*100)+'%':'0%';
 const cell=(c)=>c.n?`<td class="c cell">${c.n} câu<small>${fmt(c.s)} đ</small><small>${pc(c.s)}</small>${c.nums.length?`<small>(Câu ${c.nums.join(', ')})</small>`:''}</td>`:'<td class="c cell">–</td>';
 return `<div class="tw"><table class="t"><thead><tr><th>Chủ đề/Nội dung</th>${LEVELS.map(l=>`<th>${l.n}</th>`).join('')}<th>Tổng</th></tr></thead><tbody>
 ${m.rows.map(r=>`<tr><td>${esc(r.topic)}</td>${LEVELS.map(l=>cell(r.cell[l.k])).join('')}<td class="c cell"><b>${r.n} câu</b><small>${fmt(r.s)} đ</small><small>${pc(r.s)}</small></td></tr>`).join('')}
 <tr class="rowtot"><td>Tổng số câu</td>${LEVELS.map(l=>`<td class="c">${m.lv[l.k].n}</td>`).join('')}<td class="c">${m.total}</td></tr>
 <tr class="rowtot"><td>Tổng điểm</td>${LEVELS.map(l=>`<td class="c">${fmt(m.lv[l.k].s)}</td>`).join('')}<td class="c">${fmt(m.score)}</td></tr>
 <tr class="rowtot"><td>Tỷ lệ từng mức độ (theo điểm)</td>${LEVELS.map(l=>`<td class="c">${pc(m.lv[l.k].s)}</td>`).join('')}<td class="c">${m.score?'100%':'0%'}</td></tr>
 <tr class="rowtot"><td>Tỷ lệ từng mức độ (theo số câu)</td>${LEVELS.map(l=>`<td class="c">${m.total?fmt(m.lv[l.k].n/m.total*100):0}%</td>`).join('')}<td class="c">100%</td></tr>
 </tbody></table></div>`}
function typeTable(items){const g={};items.forEach(i=>{g[i.type]=g[i.type]||{n:0,s:0};g[i.type].n++;g[i.type].s=r3(g[i.type].s+i.score)});
 return `<table class="t"><thead><tr><th>Dạng câu hỏi</th><th>Số câu</th><th>Số điểm</th></tr></thead><tbody>${Object.keys(TYPES).filter(t=>g[t]).map(t=>`<tr><td>${TYPES[t].n}</td><td class="c">${g[t].n}</td><td class="c">${fmt(g[t].s)}</td></tr>`).join('')}</tbody></table>`}
