'use strict';
/* ============ 15. HIỂN THỊ ĐỀ ============ */
const DISC='<p style="font-style:italic;font-size:.85em;margin-top:14px">Đề được AI hỗ trợ tạo. Giáo viên cần kiểm duyệt nội dung, đáp án và mức độ phù hợp trước khi sử dụng chính thức.</p>';
const sheet=(inner,pb)=>`<div class="sheet${pb?' pb':''}">${inner}</div>`;
const flagHtml=q=>q.uncertain?`<span class="flag no-print" title="${esc(q.uncertainNote)}">⚠ Cần giáo viên kiểm tra${q.uncertainNote?': '+esc(q.uncertainNote.slice(0,120)):''}</span>`:'';
const lockHtml=q=>q.src==='bank'?'<span class="lock no-print">📚 Ngân hàng</span>':q.locked?'<span class="lock no-print">🔒 GV nhập</span>':'';
function optClass(opts){const m=Math.max(...opts.map(o=>o.length));return m<=16?'c4':m<=42?'c2':'c1'}
function renderQ(q,act,withKey){
 let h=`<div class="q${act?' act':''}" data-id="${q.id}">${act?'<button class="btn sm qdots no-print" data-act="qSel" title="Hiện/ẩn thao tác" aria-label="Thao tác">⋯</button>':''}<div class="qt"><b>Câu ${q.num}.</b> <i>(${fmt(q.score)} điểm)</i> ${esc(q.question)}${flagHtml(q)}${lockHtml(q)}</div>`;
 if(q.type==='mc4'||q.type==='mcMulti')h+=`<div class="opts ${optClass(q.options)}">${q.options.map((o,i)=>`<div><b>${LET[i]}.</b> ${esc(o)}</div>`).join('')}</div>`;
 else if(q.type==='tf')h+=q.options.map((o,i)=>`<div class="stm"><b>${'abcd'[i]})</b> ${esc(o)}</div>`).join('');
 else if(q.type==='match')h+=`<table class="mt"><tr><td>${q.pairs.map((p,i)=>`<div><b>${i+1}.</b> ${esc(p.left)}</div>`).join('')}</td><td>${q.rightOrder.map((pi,k)=>`<div><b>${LET[k]}.</b> ${esc(q.pairs[pi].right)}</div>`).join('')}</td></tr></table>`;
 if(withKey)h+=`<div class="ans">Đáp án: ${esc(ansText(q))}</div>`;
 if(act)h+=`<div class="qact no-print"><button class="btn sm" data-act="qRegen" data-id="${q.id}" ${q.locked?'disabled title="Câu giáo viên nhập được giữ nguyên"':''}>🔄 Tạo lại</button><button class="btn sm" data-act="qEdit" data-id="${q.id}">✏ Chỉnh sửa</button><button class="btn sm danger" data-act="qDel" data-id="${q.id}">🗑 Xóa</button><button class="btn sm" data-act="qAdd" data-id="${q.id}">➕ Thêm câu</button><button class="btn sm" data-act="qBank" data-id="${q.id}">📚 Lưu ngân hàng</button></div>`;
 return h+'</div>'}
function sections(list){const g={};list.forEach(q=>(g[q.type]=g[q.type]||[]).push(q));return Object.keys(TYPES).sort((a,b)=>TYPES[a].o-TYPES[b].o).filter(t=>g[t]).map(t=>({type:t,qs:g[t]}))}
function headerHtml(code){const m=S.exam.meta,nv=S.exam.versions>1,bl='<span class="blank">______________________</span>';
 return `<div class="exh"><div class="exh-top"><div>Tên trường: ${m.school?esc(m.school):bl}</div>${nv?`<div>Mã đề: <b>${code}</b></div>`:''}</div>
 <div class="exh-title">${esc((m.name||'').toUpperCase())}</div>
 <div class="exh-grid"><div>Họ và tên: ${bl}</div><div>Lớp: __________</div><div>Môn: ${esc(m.subject)}</div><div>Thời gian: ${m.duration} phút</div><div class="full">Tên bài kiểm tra: ${esc(m.name)}</div></div></div>`}
function examBody(code,act){
 const list=variantOf(code);
 return headerHtml(code)+sections(list).map((s,i)=>`<div class="sec">PHẦN ${roman(i+1)}. ${TYPES[s.type].sec} <span style="font-weight:400">(${s.qs.length} câu – ${fmt(sumScore(s.qs))} điểm)</span><small>${TYPES[s.type].ins}</small></div>${s.qs.map(q=>renderQ(q,act)).join('')}`).join('')+'<p style="text-align:center;margin-top:16px"><i>— HẾT —</i></p>'}
function objTable(list){const rows=list.filter(q=>q.type!=='essay');if(!rows.length)return'';
 return `<table class="t"><thead><tr><th>Câu</th><th>Đáp án</th><th>Điểm</th></tr></thead><tbody>${rows.map(q=>`<tr><td class="c">${q.num}</td><td class="c ans">${esc(ansText(q))}${q.uncertain?' ⚠':''}</td><td class="c">${fmt(q.score)}</td></tr>`).join('')}</tbody></table>`}
function answerBody(code){
 const all=versionCodes();let h='<h4 style="text-align:center;font-size:1.15em">ĐÁP ÁN – '+esc((S.exam.meta.name||'').toUpperCase())+'</h4>';
 all.forEach(cd=>{const l=variantOf(cd);h+=`${all.length>1?`<h4>Mã đề ${cd}</h4>`:''}${objTable(l)||''}`});
 const list=variantOf(code);
 h+=`<h4>Đáp án chi tiết${all.length>1?' – Mã đề '+code:''}</h4>`;
 list.forEach(q=>{h+=`<div class="q"><b>Câu ${q.num}</b> (${LV[q.level]} • ${fmt(q.score)} điểm)${flagHtml(q)}<br>`;
  if(q.type==='essay')h+=`<div class="qt"><b>Đáp án/gợi ý:</b> ${esc(q.correctAnswer)}</div>`;
  else h+=`<b>Đáp án:</b> ${esc(ansText(q))}`+(q.explanation?`<div class="qt"><b>Giải thích:</b> ${esc(q.explanation)}</div>`:'');
  h+='</div>'});
 return h+DISC}
const TYPE_NOTE={mc4:'Chọn đúng 1 đáp án: đạt toàn bộ điểm; chọn sai, không chọn hoặc chọn nhiều hơn 1: 0 điểm.',mcMulti:'Chọn đúng và đủ các đáp án: đạt toàn bộ điểm; thiếu hoặc sai: 0 điểm (giáo viên có thể điều chỉnh chấm từng phần).',tf:'Đúng 1 ý: 10%; 2 ý: 25%; 3 ý: 50%; 4 ý: 100% số điểm của câu.',match:'Mỗi cặp ghép đúng được điểm bằng nhau.',fill:'Điền đúng mỗi chỗ trống được điểm bằng nhau; chấp nhận từ ngữ tương đương phù hợp.',short:'Kết quả đúng (kèm đơn vị nếu có): đủ điểm; sai: 0 điểm.',essay:'Chấm theo từng ý; học sinh làm cách khác đúng vẫn cho điểm tối đa phần đó.'};
function hdcBody(code){
 const list=variantOf(code),tot=sumScore(list);
 let h=`<h4 style="text-align:center;font-size:1.15em">HƯỚNG DẪN CHẤM – ${esc((S.exam.meta.name||'').toUpperCase())}${S.exam.versions>1?' – MÃ ĐỀ '+code:''}</h4><p>Tổng điểm toàn bài: <b>${fmt(tot)}</b> / ${fmt(S.exam.meta.scale)} ${Math.abs(tot-S.exam.meta.scale)<0.005?'✓':'⚠ lệch thang điểm'}</p>`;
 sections(list).forEach((s,i)=>{
  h+=`<h4>PHẦN ${roman(i+1)}. ${TYPES[s.type].sec} (${fmt(sumScore(s.qs))} điểm)</h4><table class="t"><thead><tr><th style="width:9%">Câu</th><th>Nội dung cần đạt</th><th style="width:13%">Điểm thành phần</th><th style="width:30%">Lưu ý chấm</th></tr></thead><tbody>`;
  s.qs.forEach(q=>{
   if(q.type==='essay'){
    const rb=q.rubric.length?q.rubric:[{content:q.correctAnswer,score:q.score}];
    rb.forEach((r,k)=>{h+=`<tr>${k===0?`<td class="c" rowspan="${rb.length+1}">${q.num}</td>`:''}<td class="qt">${esc(r.content)}</td><td class="c">${fmt(r.score)}</td>${k===0?`<td rowspan="${rb.length+1}" class="qt">${esc(q.gradingNotes||TYPE_NOTE.essay)}${q.uncertain?'\n⚠ Cần giáo viên kiểm tra':''}</td>`:''}</tr>`});
    h+=`<tr class="rowtot"><td>Tổng điểm câu ${q.num}</td><td class="c">${fmt(q.score)}</td></tr>`;
   }else{
    let pts=fmt(q.score),note=TYPE_NOTE[q.type];
    if(q.type==='tf')pts=[.1,.25,.5,1].map(f=>fmt(q.score*f)).join(' / ');
    if(q.type==='match'||q.type==='fill')pts=fmt(q.score)+' (chia đều)';
    h+=`<tr><td class="c">${q.num}</td><td class="qt">Đáp án: <b>${esc(ansText(q))}</b>${q.explanation?'\n'+esc(q.explanation):''}</td><td class="c">${pts}</td><td>${note}${q.uncertain?' ⚠ Cần giáo viên kiểm tra.':''}</td></tr>`}});
  h+='</tbody></table>'});
 return h+`<p><b>Tổng điểm: ${fmt(tot)}</b></p>`+DISC}
function planSig(){const c=S.cfg;return JSON.stringify([c.counts,c.essay,c.levelMode,c.lvCount,c.lvPct,c.topic,c.topicMode,c.topicQ,c.scale,c.customScale,c.scoreMode,c.partScores,c.essayW,c.matrixLock&&c.matrixRows])}
function matrixItems(){return variantOf(101).map(q=>({topic:q.topic,level:q.level,type:q.type,score:q.score,num:q.num}))}
function matrixBody(){
 let h='<h4 style="text-align:center;font-size:1.15em">MA TRẬN ĐỀ KIỂM TRA</h4>';
 if(S.exam){const it=matrixItems();h+=`<p>Môn ${esc(S.exam.meta.subject)} – Lớp ${S.exam.meta.grade} • Số câu theo mã đề gốc 101. Số liệu tính trực tiếp từ đề đã tạo.</p>`+matrixHtml(buildMatrix(it))+'<h4>Phân bổ theo dạng câu hỏi</h4>'+typeTable(it)}
 if(S.planPrev){const stale=S.planPrev.sig!==planSig();h+=`<h4>Ma trận dự kiến theo thiết lập ${S.exam?'(để đối chiếu)':''}</h4>${stale?'<div class="alert warn no-print">⚠ Thiết lập đã thay đổi từ lần tạo ma trận này. <button class="btn sm" data-act="makeMatrix">Cập nhật ma trận</button></div>':''}`+matrixHtml(buildMatrix(S.planPrev.slots))+typeTable(S.planPrev.slots)}
 return h+DISC}
function specBody(){
 const list=variantOf(101),g={};
 list.forEach(q=>{const k=[q.topic,q.unit,q.outcome,q.level,q.type].join('|');(g[k]=g[k]||{q,n:0,s:0,nums:[]});g[k].n++;g[k].s=r3(g[k].s+q.score);g[k].nums.push(q.num)});
 const rows=Object.values(g).sort((a,b)=>a.q.topic.localeCompare(b.q.topic,'vi')||LEVELS.findIndex(l=>l.k===a.q.level)-LEVELS.findIndex(l=>l.k===b.q.level));
 return `<h4 style="text-align:center;font-size:1.15em">BẢN ĐẶC TẢ ĐỀ KIỂM TRA</h4><div class="tw"><table class="t"><thead><tr><th>Chủ đề</th><th>Đơn vị kiến thức</th><th>Yêu cầu cần đạt</th><th>Mức độ</th><th>Dạng câu hỏi</th><th>Số lượng câu</th><th>Số điểm</th><th>Câu số</th></tr></thead><tbody>
 ${rows.map(r=>`<tr><td>${esc(r.q.topic)}</td><td>${esc(r.q.unit||'—')}</td><td>${esc(r.q.outcome||'—')}</td><td>${LV[r.q.level]}</td><td>${TYPES[r.q.type].n}</td><td class="c">${r.n}</td><td class="c">${fmt(r.s)}</td><td class="c">${r.nums.join(', ')}</td></tr>`).join('')}
 <tr class="rowtot"><td colspan="5">Tổng</td><td class="c">${list.length}</td><td class="c">${fmt(sumScore(list))}</td><td></td></tr></tbody></table></div>`+DISC}
function checkBody(){
 const ex=S.exam;ex.checks=runChecks(ex);const ic={ok:'✅',warn:'⚠️',fail:'❌'};
 const flagged=ex.questions.filter(q=>q.uncertain);
 const base=variantOf(101);
 const issues=ex.questions.map(q=>{const v=validateQ(q);const arr=[...v.e,...v.w];if(q.ai){if(q.ai.answerOk===false)arr.push('AI giải ra đáp án khác: '+(q.ai.yourAnswer||'?'));if(q.ai.missing)arr.push('Thiếu dữ kiện');if(q.ai.ambiguous)arr.push('Mơ hồ hoặc có nhiều đáp án');if(q.ai.inScope===false)arr.push('Có thể ngoài phạm vi/lớp');if(q.ai.note)arr.push(q.ai.note)}if(q.uncertainNote&&!arr.length)arr.push(q.uncertainNote);return{q,arr:[...new Set(arr)]}}).filter(x=>x.arr.length);
 const issueHtml=issues.length?`<h4 style="font-size:1.05em;margin:8px 0 0">Gợi ý xử lý theo từng câu</h4>${issues.map(x=>`<div class="issue"><span><b>Câu ${base.find(v=>v.id===x.q.id)?.num||x.q.id}</b>: ${x.arr.map(esc).join('; ')}</span><span class="qact no-print" style="display:flex"><button class="btn sm" data-act="qRegen" data-id="${x.q.id}" ${x.q.locked?'disabled':''}>🔄 Tạo lại câu này</button><button class="btn sm" data-act="qEdit" data-id="${x.q.id}">✏ Chỉnh sửa</button></span></div>`).join('')}`:'';
 return `<div class="chk"><h4 style="font-size:1.1em;margin:0">KIỂM TRA ĐỀ – 12 hạng mục</h4>${ex.checks.map(c=>`<div class="it"><span class="ic">${ic[c.st]}</span><div><b>${c.n}. ${esc(c.title)}</b><span>${esc(c.detail)}</span></div></div>`).join('')}
 ${flagged.length?`<div class="alert warn"><b>⚠ Cần giáo viên kiểm tra:</b> ${flagged.map(q=>`Câu ${variantOf(101).find(v=>v.id===q.id)?.num||q.id}${q.uncertainNote?' ('+esc(q.uncertainNote.slice(0,100))+')':''}`).join('; ')}</div>`:'<div class="alert ok">Không có câu nào bị đánh dấu cần kiểm tra thêm. Giáo viên vẫn cần duyệt đề trước khi sử dụng.</div>'}${issueHtml}</div>`}
function omrBody(code){
 const m=S.exam.meta,list=variantOf(code).filter(q=>q.type!=='essay');
 if(!list.length)return'<h4 style="text-align:center;font-size:1.15em">PHIẾU TRẢ LỜI</h4><p>Đề không có câu trắc nghiệm hoặc trả lời ngắn.</p>';
 const NB='&nbsp;&nbsp;';
 const cell=q=>q.type==='mc4'||q.type==='mcMulti'?LET.split('').map(l=>'○ '+l).join(NB):q.type==='tf'?[0,1,2,3].map(i=>'abcd'[i]+') ○Đ ○S').join(NB):q.type==='match'?q.pairs.map((p,i)=>(i+1)+'–____').join(NB):'[ ____________ ]';
 let rows='';for(let i=0;i<list.length;i+=2){const a=list[i],b=list[i+1];rows+=`<tr><td class="c"><b>${a.num}</b></td><td>${cell(a)}</td>${b?`<td class="c"><b>${b.num}</b></td><td>${cell(b)}</td>`:'<td></td><td></td>'}</tr>`}
 return `<h4 style="text-align:center;font-size:1.15em">PHIẾU TRẢ LỜI TRẮC NGHIỆM</h4><p>Họ và tên: ______________________ &nbsp; Lớp: ______ ${S.exam.versions>1?'&nbsp; Mã đề: <b>'+code+'</b>':''}<br>Môn: ${esc(m.subject)} • ${esc(m.name)}</p><p><i>Tô kín (●) vào ô tròn tương ứng với phương án chọn; câu trả lời ngắn ghi vào ô.</i></p><table class="t"><thead><tr><th style="width:7%">Câu</th><th>Trả lời</th><th style="width:7%">Câu</th><th>Trả lời</th></tr></thead><tbody>${rows}</tbody></table>`}
const TABS=[['exam','Đề kiểm tra'],['answer','Đáp án'],['hdc','Hướng dẫn chấm'],['matrix','Ma trận'],['spec','Bản đặc tả'],['omr','Phiếu trả lời'],['check','Kiểm tra']];
function readiness(){const c=S.cfg;return[[c.level&&c.grade,'Cấp học & lớp'],[subjectOf(c),'Môn học'],[c.topic||c.content||c.scope||c.docs.length||c.refText||c.matrixLock,'Nội dung kiến thức / tài liệu'],[totalOf(c)>0,'Dạng & số câu hỏi'],[levelCounts(c,totalOf(c)).ok,'Phân bổ mức độ hợp lệ']]}
function tabContent(tab,code,act){const ex=S.exam;
 if(tab==='matrix')return(ex||S.planPrev)?sheet(matrixBody()):emptyHtml('Chưa có ma trận','Bấm “Tạo ma trận” để xem ma trận dự kiến theo thiết lập, hoặc “Tạo đề” để có ma trận khớp tuyệt đối với đề.');
 if(!ex)return emptyHtml();
 return sheet({exam:()=>examBody(code,act),answer:()=>answerBody(code),hdc:()=>hdcBody(code),spec:specBody,omr:()=>omrBody(code),check:checkBody}[tab]())}
function emptyHtml(t,d){return `<div class="empty"><div style="font-size:42px">📝</div><h3>${t||'Chưa có đề kiểm tra'}</h3><p>${d||'Hoàn thành các bước thiết lập bên trái rồi bấm “TẠO ĐỀ KIỂM TRA”.'}</p><div class="checklist">${readiness().map(r=>`<div>${r[0]?'✅':'⬜'} ${r[1]}</div>`).join('')}</div></div>`}
function renderPreview(){
 if(S.exam&&!versionCodes().includes(S.ver))S.ver=101;
 const nv=S.exam?.versions>1&&['exam','answer','hdc','omr'].includes(S.tab);
 $('#tabs').innerHTML=TABS.map(t=>`<button class="tab ${S.tab===t[0]?'on':''}" data-act="tab" data-v="${t[0]}">${t[1]}</button>`).join('')+'<span class="sp"></span>'+(nv?`<select id="verSel" aria-label="Mã đề">${versionCodes().map(c=>`<option value="${c}" ${S.ver===c?'selected':''}>Mã đề ${c}</option>`).join('')}</select>`:'');
 $('#pcontent').innerHTML=tabContent(S.tab,S.ver,true)}
const rerender=()=>{renderPreview();persistExam()};

/* ============ 16. TẠO ĐỀ ============ */
function validateCfg(){
 const c=S.cfg,e=[];
 if(!c.level)e.push('Chưa chọn cấp học.');else if(!c.grade)e.push('Chưa chọn lớp.');
 if(!subjectOf(c))e.push('Chưa chọn hoặc nhập môn học.');
 if(c.sourceMode==='ref'&&!c.docs.length&&!c.refText.trim())e.push('Bạn chọn “Chỉ sử dụng tài liệu tải lên” nhưng chưa tải/dán tài liệu.');
 if(c.sourceMode==='teacher'&&!(c.content.trim()||c.topic.trim()||c.scope.trim()||c.needTest.trim()))e.push('Bạn chọn “Giáo viên tự nhập nội dung” nhưng chưa nhập nội dung kiến thức.');
 if(c.sourceMode==='plus'&&!(c.content.trim()||c.topic.trim()||c.scope.trim()||c.needTest.trim()||c.docs.length||c.refText.trim()||c.matrixLock))e.push('Chưa có nội dung kiến thức: hãy nhập tên bài/chủ đề, phạm vi hoặc tải tài liệu.');
 return e}
function targetOf(items){const t=tally(items);return{total:t.total,byLevel:t.byLevel}}
function retarget(ex){const t=tally(ex.questions);ex.target={total:t.total,byLevel:t.byLevel}}
async function doGenerate(){
 if(S.busy)return;const c=S.cfg;
 const ve=validateCfg();const plan=buildPlan(c);
 const errs=[...ve,...plan.errs];
 if(errs.length)return alertBox('Cần bổ sung thiết lập',`<ul>${errs.map(e=>`<li>${esc(e)}</li>`).join('')}</ul>`);
 if(S.exam&&!await confirmBox('Đề hiện tại sẽ được thay bằng đề mới (có thể Hoàn tác). Tiếp tục?'))return;
 saveLast();S.planPrev={slots:plan.slots,step:plan.step,sig:planSig()};
 const fixed=[];const notes=[];
 if(c.keepTeacher&&c.teacherText.trim()){
  const used=new Set();
  parseTeacher(c.teacherText).forEach(tq=>{const sl=plan.slots.find(s=>s.type===tq.type&&!used.has(s.id));if(sl){used.add(sl.id);fixed.push(teacherQ(tq,sl))}else notes.push(`Một câu ${TYPES[tq.type].n} của giáo viên không còn vị trí trong cấu trúc đề nên bị bỏ qua.`)})}
 let nb=0;
 if(c.useBank){const bank=bankGet();const used=new Set(fixed.map(f=>f.id));
  plan.slots.forEach(sl=>{if(used.has(sl.id))return;const i=bank.findIndex(b=>!b._u&&b.type===sl.type&&b.level===sl.level&&b.subject===subjectOf(c)&&String(b.grade)===String(c.grade)&&b.topic===sl.topic&&!b.empty&&b.question);
   if(i>=0){bank[i]._u=1;const b=Object.assign({options:['','','',''],pairs:[],rightOrder:[],rubric:[],unit:'',outcome:'',explanation:'',gradingNotes:'',correctAnswer:''},clone(bank[i]));delete b.bid;delete b._u;b.id=sl.id;b.score=sl.score;b.locked=true;b.src='bank';b.kind=sl.kind||b.kind||'';b.level=sl.level;b.topic=sl.topic;
    if(b.type==='essay'&&b.rubric.length)b.rubric=rubricFrom(b.rubric.map(r=>({content:r.content,weight:r.weight||r.score})),sl.score,0.25);
    if(b.type==='match'&&b.rightOrder.length!==b.pairs.length)b.rightOrder=makeRight(b.pairs,b.id);
    used.add(sl.id);fixed.push(b);nb++}})}
 S.busy=true;refreshLive();
 try{
  const r=await runPipeline(plan.slots,{fixed});
  if(S.exam)pushHist('Trước khi tạo đề mới');
  S.exam={id:uid(),createdAt:Date.now(),meta:{level:c.level,grade:c.grade,subject:subjectOf(c),examType:c.examType,name:examName(c),school:c.school,duration:durOf(c),scale:scaleOf(c)},questions:r.questions,step:plan.step,manualScores:false,scoreMode:c.scoreMode,partScores:clone(c.partScores),essayW:clone(c.essayW||{}),versions:+c.versions||1,shuffleQ:c.shuffleQ,shuffleO:c.shuffleO,target:targetOf(plan.slots),checks:[]};
  autoFixLocal(S.exam);S.ver=101;S.tab='exam';rerender();scrollPreview();if(nb)toast(`📚 Đã dùng ${nb} câu từ ngân hàng.`,4500);
  const bad=S.exam.questions.filter(q=>q.uncertain||q.empty).length;
  toast('✅ Đề đã được tạo và kiểm tra.'+(bad?` Có ${bad} câu cần giáo viên kiểm tra.`:''),5000);
  [...r.notes,...notes].forEach(n=>toast(n,6000));
 }catch(e){if(e?.code==='cancelled')toast('Đã hủy tạo đề.');else if(window.__STANDALONE&&e?.code==='not_granted'){toast('Cần nhập khóa API để dùng AI.',5000);window.rdkOpenAiSettings()}else alertBox('Không tạo được đề',`<p>${esc(e?.message||e?.code||'Lỗi không xác định')}</p>${e?.code==='not_granted'?'<p>Bạn cần cho phép trang gọi Claude để tạo câu hỏi.</p>':''}`)}
 finally{S.busy=false;refreshLive()}}
async function doEquivalent(){
 if(!S.exam)return toast('Hãy tạo đề trước.');if(S.busy)return;
 const ex=S.exam,c=S.cfg;
 if(!await confirmBox('Tạo đề tương đương: giữ nguyên kiến thức, số câu, dạng, mức độ, tổng điểm, ma trận nhưng thay nội dung câu hỏi. Tiếp tục?'))return;
 const slots=ex.questions.map(q=>({id:q.id,type:q.type,level:q.level,topic:q.topic,kind:q.kind,score:q.score}));
 const fixed=ex.questions.filter(q=>q.locked);
 S.busy=true;
 try{
  const r=await runPipeline(slots,{fixed,avoid:ex.questions.map(q=>q.question),extra:'ĐÂY LÀ ĐỀ TƯƠNG ĐƯƠNG: giữ nguyên kiến thức, dạng câu, mức độ, chủ đề; thay hoàn toàn ngữ cảnh, số liệu, ví dụ và cách diễn đạt so với các câu cần tránh.'});
  pushHist('Trước khi tạo đề tương đương');ex.questions=r.questions;ex.id=uid();autoFixLocal(ex);rerender();toast('✅ Đã tạo đề tương đương và kiểm tra.',4500);
 }catch(e){if(e?.code==='cancelled')toast('Đã hủy.');else alertBox('Không tạo được đề tương đương',`<p>${esc(e?.message||e?.code||'')}</p>`)}
 finally{S.busy=false;refreshLive()}}
async function doVerify(){
 if(!S.exam)return toast('Hãy tạo đề trước.');if(S.busy)return;
 S.busy=true;S.abort=new AbortController();
 const close=openModal({title:'Đang kiểm tra đề…',body:'<p>AI đang tự giải lại từng câu và đối chiếu đáp án.</p>',static:true,actions:[{label:'Hủy',onClick:()=>{S.abort.abort();return true}}]});
 try{
  const x=ctxInfo(S.cfg);x.sub=S.exam.meta.subject;x.cat=subjCat(x.sub);x.lvName=SCHOOL[S.exam.meta.level].nm;x.grade=S.exam.meta.grade;
  if(await getSample()){S.exam.questions.forEach(q=>{q.ai=null});await aiVerify(S.exam.questions,x);S.exam.questions.forEach(q=>{if(aiFail(q)&&!q.locked){q.uncertain=true;q.uncertainNote=q.ai.note||'AI phát hiện vấn đề'}})}
  else toast('AI chưa khả dụng – chỉ kiểm tra cấu trúc.');
  autoFixLocal(S.exam);close();S.tab='check';rerender();toast('Đã kiểm tra xong.');
 }catch(e){close();if(e?.code!=='cancelled')alertBox('Lỗi kiểm tra',`<p>${esc(e?.message||e?.code||'')}</p>`);else{S.tab='check';rerender()}}
 finally{S.busy=false;refreshLive()}}
function doMatrix(){
 const plan=buildPlan(S.cfg);if(plan.errs.length)return alertBox('Chưa thể tạo ma trận',`<ul>${plan.errs.map(e=>`<li>${esc(e)}</li>`).join('')}</ul>`);
 S.planPrev={slots:plan.slots,step:plan.step,sig:planSig()};saveLast();S.tab='matrix';rerender();scrollPreview();toast('Đã tạo ma trận dự kiến.')}
function scrollPreview(){try{if(window.matchMedia('(max-width:920px)').matches)$('.preview').scrollIntoView({behavior:'smooth',block:'start'})}catch(e){}}

/* ============ 17. THAO TÁC TỪNG CÂU ============ */
const qById=id=>S.exam.questions.find(q=>q.id===id);
const nextId=()=>{const m=Math.max(0,...S.exam.questions.map(q=>+q.id.replace(/\D/g,'')||0));return 'Q'+String(m+1).padStart(2,'0')};
async function regenOne(id){
 const q=qById(id);if(!q||q.locked||S.busy)return;S.busy=true;S.abort=new AbortController();
 const close=openModal({title:'Đang tạo lại câu…',body:`<p>Chỉ tạo lại Câu này; các câu khác giữ nguyên.</p>`,static:true,actions:[{label:'Hủy',onClick:()=>{S.abort.abort();return true}}]});
 try{
  const x=ctxInfo(S.cfg);x.sub=S.exam.meta.subject;x.cat=subjCat(x.sub);x.lvName=SCHOOL[S.exam.meta.level].nm;x.grade=S.exam.meta.grade;
  const slot={id:q.id,type:q.type,level:q.level,topic:q.topic,kind:q.kind,score:q.score};
  let nq=null,why='';
  for(let t=0;t<3&&!nq;t++){const r=await genSlots([slot],x,S.exam.questions.map(k=>k.question),'Soạn câu MỚI hoàn toàn khác câu cũ.');
   const c=r.out[id];if(c&&!validateQ(c).e.length){await aiVerify([c],x);if(!aiFail(c)||t===2)nq=c}else why=r.bad[id]||''}
  if(!nq)throw new Error(why||'Không tạo được câu hợp lệ.');
  if(aiFail(nq)){nq.uncertain=true;nq.uncertainNote=nq.ai.note||'AI phát hiện vấn đề'}
  nq.subject=q.subject;nq.grade=q.grade;if(!nq.explanation&&nq.type!=='essay')nq.explanation='Đáp án đúng: '+ansText(nq)+'.';
  pushHist('Tạo lại câu');S.exam.questions[S.exam.questions.findIndex(k=>k.id===id)]=nq;close();rerender();toast('Đã tạo lại câu.');
 }catch(e){close();if(e?.code!=='cancelled')alertBox('Không tạo lại được',`<p>${esc(e?.message||e?.code||'')}</p>`)}
 finally{S.busy=false}}
async function delQ(id){if(!await confirmBox('Xóa câu hỏi này khỏi đề?','Xóa'))return;pushHist('Xóa câu');const ex=S.exam;ex.questions=ex.questions.filter(q=>q.id!==id);retarget(ex);if(!ex.manualScores)rebalanceScores(ex);rerender();toast('Đã xóa câu (có thể Hoàn tác).')}
function addQ(afterId){
 const topics=[...new Set(S.exam.questions.map(q=>q.topic))];
 openModal({title:'Thêm câu hỏi',body:`<label class="fld"><span>Dạng câu</span><select id="adT">${Object.keys(TYPES).map(t=>`<option value="${t}">${TYPES[t].n}</option>`).join('')}</select></label><label class="fld"><span>Mức độ</span><select id="adL">${LEVELS.map(l=>`<option value="${l.k}">${l.n}</option>`).join('')}</select></label><label class="fld"><span>Chủ đề</span><select id="adP">${topics.map(t=>`<option>${esc(t)}</option>`).join('')}</select></label>`,
  actions:[{label:'Hủy',onClick:()=>true},{label:'✍ Tự nhập',onClick:b=>{const s=readAd(b);openEditor(blankQ(s,'Nhập nội dung câu hỏi.'),{title:'Thêm câu mới',blank:true,onSave:q=>insertQ(q,afterId)});return true}},{label:'✨ AI tạo câu',cls:'primary',onClick:b=>{genAdd(readAd(b),afterId);return true}}]})}
function readAd(b){return{id:nextId(),type:$('#adT',b).value,level:$('#adL',b).value,topic:$('#adP',b).value,kind:$('#adT',b).value==='essay'?'Trình bày':'',score:1}}
function insertQ(q,afterId){pushHist('Thêm câu');const ex=S.exam;q.id=q.id||nextId();q.empty=false;const i=ex.questions.findIndex(k=>k.id===afterId);ex.questions.splice(i<0?ex.questions.length:i+1,0,q);retarget(ex);if(!ex.manualScores)rebalanceScores(ex);else toast('Điểm đang chỉnh tay – hãy kiểm tra lại tổng điểm.');rerender()}
async function genAdd(slot,afterId){
 if(S.busy)return;S.busy=true;S.abort=new AbortController();
 const close=openModal({title:'Đang tạo câu mới…',body:'<p>Vui lòng chờ.</p>',static:true,actions:[{label:'Hủy',onClick:()=>{S.abort.abort();return true}}]});
 try{const x=ctxInfo(S.cfg);x.sub=S.exam.meta.subject;x.cat=subjCat(x.sub);x.lvName=SCHOOL[S.exam.meta.level].nm;x.grade=S.exam.meta.grade;
  const r=await genSlots([slot],x,S.exam.questions.map(k=>k.question));const q=r.out[slot.id];if(!q||validateQ(q).e.length)throw new Error(r.bad[slot.id]||'Không tạo được câu hợp lệ.');
  await aiVerify([q],x);if(aiFail(q)){q.uncertain=true;q.uncertainNote=q.ai.note}
  q.subject=S.exam.meta.subject;q.grade=S.exam.meta.grade;if(!q.explanation&&q.type!=='essay')q.explanation='Đáp án đúng: '+ansText(q)+'.';
  close();insertQ(q,afterId);toast('Đã thêm câu.');
 }catch(e){close();if(e?.code!=='cancelled')alertBox('Không thêm được câu',`<p>${esc(e?.message||e?.code||'')}</p>`)}finally{S.busy=false}}

/* ---- trình soạn câu hỏi ---- */
function openEditor(q0,{title,onSave,blank,showType}){
 let q=clone(q0);
 const fv=id=>{const e=$('#'+id);return e?e.value:''};
 function body(){
  const t=q.type;let h='';
  if(showType)h+=`<label class="fld"><span>Dạng câu hỏi</span><select id="ed_type">${Object.keys(TYPES).map(k=>`<option value="${k}" ${t===k?'selected':''}>${TYPES[k].n}</option>`).join('')}</select></label>`;
  h+=`<div class="grid2"><label class="fld"><span>Chủ đề</span><input type="text" id="ed_topic" value="${esc(q.topic)}"></label><label class="fld"><span>Mức độ</span><select id="ed_level">${LEVELS.map(l=>`<option value="${l.k}" ${q.level===l.k?'selected':''}>${l.n}</option>`).join('')}</select></label>
  <label class="fld"><span>Đơn vị kiến thức</span><input type="text" id="ed_unit" value="${esc(q.unit)}"></label><label class="fld"><span>Điểm</span><input type="number" step="0.05" min="0" id="ed_score" value="${q.score}"></label></div>
  <label class="fld"><span>Yêu cầu cần đạt</span><input type="text" id="ed_out" value="${esc(q.outcome)}"></label>
  <label class="fld"><span>Nội dung câu hỏi</span><textarea id="ed_q" rows="4">${esc(q.empty?'':q.question)}</textarea></label>`;
  if(t==='mc4'||t==='mcMulti')h+=q.options.map((o,i)=>`<div class="cnt" style="grid-template-columns:30px 1fr 30px"><b>${LET[i]}</b><input type="text" id="ed_o${i}" value="${esc(o)}">${t==='mcMulti'?`<input type="checkbox" id="ed_c${i}" ${q.correctAnswer.includes(LET[i])?'checked':''}>`:''}</div>`).join('')+(t==='mc4'?`<label class="fld"><span>Đáp án đúng</span><select id="ed_ans">${LET.split('').map(l=>`<option ${q.correctAnswer===l?'selected':''}>${l}</option>`).join('')}</select></label>`:'<div class="hint">Tích ô bên phải các đáp án đúng.</div>');
  if(t==='tf'){const tk=q.correctAnswer.split(',');h+=q.options.map((o,i)=>`<div class="cnt" style="grid-template-columns:24px 1fr 70px"><b>${'abcd'[i]})</b><input type="text" id="ed_o${i}" value="${esc(o)}"><select id="ed_t${i}"><option ${tk[i]==='Đ'?'selected':''}>Đ</option><option ${tk[i]==='S'?'selected':''}>S</option></select></div>`).join('')}
  if(t==='match')h+=`<label class="fld"><span>Các cặp ghép đúng (mỗi dòng: vế trái | vế phải)</span><textarea id="ed_pairs" rows="5">${esc(q.pairs.map(p=>p.left+' | '+p.right).join('\n'))}</textarea></label>`;
  if(t==='fill'||t==='short')h+=`<label class="fld"><span>Đáp án</span><input type="text" id="ed_ans" value="${esc(q.correctAnswer)}"></label>`;
  if(t==='essay')h+=`<label class="fld"><span>Đáp án/gợi ý trả lời chi tiết</span><textarea id="ed_ans" rows="4">${esc(q.correctAnswer)}</textarea></label><label class="fld"><span>Thang điểm ý (mỗi dòng: nội dung | điểm)</span><textarea id="ed_rub" rows="4">${esc(q.rubric.map(r=>r.content+' | '+fmt(r.score)).join('\n'))}</textarea></label><label class="fld"><span>Lưu ý chấm</span><textarea id="ed_notes" rows="2">${esc(q.gradingNotes)}</textarea></label>`;
  h+=`<label class="fld"><span>Giải thích / lời giải</span><textarea id="ed_ex" rows="3">${esc(q.explanation)}</textarea></label><div id="ed_err"></div>`;return h}
 function collect(){
  const t=q.type;q.topic=fv('ed_topic').trim();q.level=fv('ed_level')||q.level;q.unit=fv('ed_unit').trim();q.outcome=fv('ed_out').trim();q.score=Math.max(0,parseFloat(fv('ed_score'))||0);
  q.question=fv('ed_q').trim();q.explanation=fv('ed_ex').trim();
  if(t==='mc4'||t==='mcMulti'||t==='tf'){q.options=[0,1,2,3].map(i=>fv('ed_o'+i).trim())}
  if(t==='mc4')q.correctAnswer=fv('ed_ans');
  if(t==='mcMulti')q.correctAnswer=[0,1,2,3].filter(i=>$('#ed_c'+i)?.checked).map(i=>LET[i]).join(',');
  if(t==='tf')q.correctAnswer=[0,1,2,3].map(i=>fv('ed_t'+i)||'Đ').join(',');
  if(t==='match'){const old=JSON.stringify(q.pairs);q.pairs=fv('ed_pairs').split('\n').map(l=>l.split('|')).filter(a=>a.length>=2&&a[0].trim()&&a[1].trim()).map(a=>({left:a[0].trim(),right:a.slice(1).join('|').trim()}));if(JSON.stringify(q.pairs)!==old||q.rightOrder.length!==q.pairs.length)q.rightOrder=makeRight(q.pairs,q.id+q.question)}
  if(t==='fill'||t==='short')q.correctAnswer=fv('ed_ans').trim();
  if(t==='essay'){q.correctAnswer=fv('ed_ans').trim();q.gradingNotes=fv('ed_notes').trim();
   const items=fv('ed_rub').split('\n').map(l=>l.split('|')).filter(a=>a[0].trim()).map(a=>({content:a[0].trim(),weight:parseFloat((a[1]||'').replace(',','.'))||1}));
   q.rubric=items.length?rubricFrom(items,q.score,S.exam?.step||0.25):[]}}
 const close=openModal({title,wide:true,body:body(),onMount:b=>{const ty=$('#ed_type',b);if(ty)ty.onchange=()=>{collect();const nt=ty.value;q=blankQ({id:q.id,type:nt,level:q.level,topic:q.topic,kind:nt==='essay'?'Trình bày':'',score:q.score},'Nhập nội dung.');q.question='';q.empty=false;$('.mb',b).innerHTML=body();$('#ed_type',b).onchange=ty.onchange}},
  actions:[{label:'Hủy',onClick:()=>true},{label:'💾 Lưu',cls:'primary',onClick:()=>{
   collect();const prevScore=q0.score;q.empty=false;
   if(q.type==='essay'&&!q.rubric.length&&q.correctAnswer)q.rubric=rubricFrom([{content:q.correctAnswer,weight:1}],q.score,0.25);
   const v=validateQ(q);if(v.e.length){$('#ed_err').innerHTML=`<div class="alert err">${v.e.map(esc).join('<br>')}</div>`;return false}
   q.uncertain=false;q.uncertainNote='';q.ai=null;q.src=q.src==='ai'?'ai-edited':q.src;q.scoreChanged=Math.abs(q.score-prevScore)>1e-6;
   onSave(q);return true}}]})}
function editQ(id){const q=qById(id);openEditor(q,{title:'Chỉnh sửa câu hỏi',onSave:nq=>{pushHist('Sửa câu');const ex=S.exam;if(nq.scoreChanged)ex.manualScores=true;delete nq.scoreChanged;ex.questions[ex.questions.findIndex(k=>k.id===id)]=nq;retarget(ex);rerender();toast('Đã lưu chỉnh sửa.')}})}

/* ============ 18. NGÂN HÀNG CÂU HỎI ============ */
const bankGet=()=>store.get('rdk_bank',[]);
function toBank(q){const b=bankGet();const m=S.exam?.meta||{};const it=Object.assign(clone(q),{bid:uid(),schoolLevel:m.level||q.schoolLevel||'',grade:q.grade||m.grade||'',subject:q.subject||m.subject||'',locked:false,uncertain:false,ai:null});b.unshift(it);store.set('rdk_bank',b);return it}
function openBank(){
 let f={grade:'',subject:'',topic:'',level:'',type:'',text:''};
 const m=openModal({title:'📚 Ngân hàng câu hỏi',wide:true,body:'<div id="bkRoot"></div>',actions:[{label:'⬇ Xuất JSON',onClick:()=>{const b=bankGet();if(!b.length){toast('Ngân hàng đang trống.');return false}download('ngan_hang_cau_hoi.json',JSON.stringify(b,null,2));return false}},{label:'⬆ Nhập JSON',onClick:()=>{const inp=document.createElement('input');inp.type='file';inp.accept='.json,application/json';inp.onchange=async()=>{try{const arr=JSON.parse(await inp.files[0].text());if(!Array.isArray(arr))throw 0;const cur=bankGet();let n=0;arr.forEach(q=>{if(q&&q.question&&q.type&&TYPES[q.type]){q.bid=uid();cur.push(Object.assign({options:['','','',''],pairs:[],rightOrder:[],rubric:[]},q));n++}});store.set('rdk_bank',cur);toast('Đã nhập '+n+' câu.');draw()}catch(e){alertBox('Không nhập được','<p>Tệp phải là JSON ngân hàng do ứng dụng này xuất ra.</p>')}};inp.click();return false}},{label:'+ Thêm câu mới',onClick:()=>{openEditor(blankQ({id:'B',type:'mc4',level:'nb',topic:'',score:1},''),{title:'Câu hỏi mới (ngân hàng)',blank:true,showType:true,onSave:q=>{q.subject=subjectOf()||q.subject;q.grade=S.cfg.grade||'';q.schoolLevel=S.cfg.level;const it=toBank(q);toast('Đã lưu vào ngân hàng.');draw()}});return false}},{label:'Đóng',onClick:()=>true}],onMount:()=>draw()});
 function opts(key){return[...new Set(bankGet().map(b=>b[key]).filter(Boolean))]}
 function draw(){
  const all=bankGet();const root=$('#bkRoot');if(!root)return;
  const list=all.filter(b=>(!f.grade||String(b.grade)===f.grade)&&(!f.subject||b.subject===f.subject)&&(!f.topic||b.topic===f.topic)&&(!f.level||b.level===f.level)&&(!f.type||b.type===f.type)&&(!f.text||(b.question||'').toLowerCase().includes(f.text.toLowerCase())));
  const sel=(k,lab,arr,lbl)=>`<select data-f="${k}"><option value="">${lab}</option>${arr.map(v=>`<option value="${esc(v)}" ${f[k]===String(v)?'selected':''}>${esc(lbl?lbl(v):v)}</option>`).join('')}</select>`;
  root.innerHTML=`<div class="flt">${sel('grade','Mọi lớp',opts('grade').sort((a,b)=>a-b),v=>'Lớp '+v)}${sel('subject','Mọi môn',opts('subject'))}${sel('topic','Mọi chủ đề',opts('topic'))}${sel('level','Mọi mức độ',LEVELS.map(l=>l.k),v=>LV[v])}${sel('type','Mọi dạng',Object.keys(TYPES),v=>TYPES[v].n)}<input type="text" data-f="text" placeholder="Tìm trong nội dung" value="${esc(f.text)}"></div><div class="hint">${list.length}/${all.length} câu</div>`+(list.length?list.map(b=>`<div class="bk"><div class="m">${SCHOOL[b.schoolLevel]?.nm||''} • Lớp ${esc(b.grade)} • ${esc(b.subject)} • ${esc(b.topic)} • ${LV[b.level]} • ${TYPES[b.type]?.n} • ${fmt(b.score)} điểm</div><div class="qt">${esc((b.question||'').slice(0,300))}</div><div class="hint">Đáp án: ${esc(ansText(Object.assign({rightOrder:[]},b,{rightOrder:b.rightOrder||[]})).slice(0,150))}${b.explanation?' • Giải thích: '+esc(b.explanation.slice(0,150)):''}</div><div class="qact"><button class="btn sm" data-b="edit" data-id="${b.bid}">✏ Sửa</button><button class="btn sm" data-b="dup" data-id="${b.bid}">⧉ Nhân bản</button><button class="btn sm" data-b="use" data-id="${b.bid}">➕ Thêm vào đề</button><button class="btn sm danger" data-b="del" data-id="${b.bid}">🗑 Xóa</button></div></div>`).join(''):'<div class="empty">Ngân hàng chưa có câu hỏi nào. Bấm “💾 Lưu ngân hàng” ở từng câu của đề hoặc “+ Thêm câu mới”.</div>');
  $$('[data-f]',root).forEach(e=>{e.oninput=e.onchange=()=>{f[e.dataset.f]=e.value;if(e.tagName==='INPUT'){const p=e.selectionStart;draw();const n=$('[data-f="text"]');n.focus();n.setSelectionRange(p,p)}else draw()}});
  $$('[data-b]',root).forEach(e=>e.onclick=async()=>{
   const arr=bankGet(),i=arr.findIndex(b=>b.bid===e.dataset.id),b=arr[i];if(!b)return;
   if(e.dataset.b==='del'){if(await confirmBox('Xóa câu này khỏi ngân hàng?','Xóa')){arr.splice(i,1);store.set('rdk_bank',arr);draw()}}
   else if(e.dataset.b==='dup'){const d=clone(b);d.bid=uid();arr.splice(i+1,0,d);store.set('rdk_bank',arr);draw();toast('Đã nhân bản.')}
   else if(e.dataset.b==='edit'){openEditor(Object.assign({options:['','','',''],pairs:[],rightOrder:[],rubric:[]},b),{title:'Sửa câu trong ngân hàng',showType:false,onSave:q=>{q.bid=b.bid;const a2=bankGet();a2[a2.findIndex(x=>x.bid===b.bid)]=q;store.set('rdk_bank',a2);draw();toast('Đã lưu.')}})}
   else if(e.dataset.b==='use'){if(!S.exam)return toast('Hãy tạo đề trước, rồi thêm câu từ ngân hàng.');const q=clone(b);delete q.bid;q.id=nextId();q.locked=false;q.src='bank';q.score=1;if(!q.rightOrder?.length&&q.type==='match')q.rightOrder=makeRight(q.pairs,q.id);insertQ(q,S.exam.questions[S.exam.questions.length-1]?.id);toast('Đã thêm vào đề.')}})}}

/* ============ 19. LƯU / XUẤT / IN / SAO CHÉP ============ */
function saveExam(){if(!S.exam)return toast('Chưa có đề để lưu.');const l=store.get('rdk_exams',[]);const e={id:S.exam.id,name:S.exam.meta.name,savedAt:Date.now(),exam:S.exam};const i=l.findIndex(x=>x.id===e.id);if(i>=0)l[i]=e;else l.unshift(e);if(!store.set('rdk_exams',l.slice(0,20)))return toast('Bộ nhớ trình duyệt đầy – hãy xóa bớt đề đã lưu.');toast('💾 Đã lưu đề vào trình duyệt.')}
function openSaved(){
 const draw=()=>{const l=store.get('rdk_exams',[]);const r=$('#svRoot');if(!r)return;r.innerHTML=l.length?l.map(e=>`<div class="bk"><b>${esc(e.name)}</b><div class="m">${esc(e.exam.meta.subject)} • Lớp ${e.exam.meta.grade} • ${e.exam.questions.length} câu • ${new Date(e.savedAt).toLocaleString('vi-VN')}</div><div class="qact"><button class="btn sm" data-o="${e.id}">Mở</button><button class="btn sm danger" data-d="${e.id}">Xóa</button></div></div>`).join(''):'<div class="empty">Chưa có đề nào được lưu.</div>';
  $$('[data-o]',r).forEach(b=>b.onclick=()=>{const e=l.find(x=>x.id===b.dataset.o);if(S.exam)pushHist('Trước khi mở đề đã lưu');S.exam=clone(e.exam);S.ver=101;S.tab='exam';rerender();$('#modal-root').innerHTML='';toast('Đã mở đề.')});
  $$('[data-d]',r).forEach(b=>b.onclick=async()=>{if(await confirmBox('Xóa đề đã lưu này?','Xóa')){store.set('rdk_exams',l.filter(x=>x.id!==b.dataset.d));draw()}})};
 openModal({title:'🗂 Đề đã lưu',body:'<div id="svRoot"></div>',actions:[{label:'Đóng',onClick:()=>true}],onMount:draw})}
function docHtml(title,inner){return `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{margin:20px auto;max-width:820px;padding:0 14px}${$('#sheetcss').textContent}@media print{.sheet.pb{page-break-after:always}}</style></head><body>${inner}</body></html>`}
function cleanHtml(tab,code,all){
 const ex=S.exam;const codes=all?versionCodes():[code];
 if(tab==='exam'||tab==='answer'||tab==='hdc'||tab==='omr')return codes.map((cd,i)=>sheet({exam:()=>examBody(cd,false),answer:()=>answerBody(cd),hdc:()=>hdcBody(cd),omr:()=>omrBody(cd)}[tab](),i<codes.length-1)).join('');
 return tabContent(tab,code,false)}
async function download(name,data){
 try{const d=window.claude?await claude.use('downloads'):null;if(!d)throw 0;await d.save({filename:name,data});toast('Đã xuất tệp '+name)}
 catch(e){if(e?.code==='declined')return;if(typeof data!=='string')return alertBox('Không tải được tệp','<p>Môi trường này chặn tải tệp trực tiếp. Hãy dùng “Sao chép” rồi dán vào Word/Google Docs.</p>');try{await navigator.clipboard.writeText(data);toast('Không tải trực tiếp được – nội dung đã được sao chép vào bộ nhớ tạm.',5000)}catch(_){alertBox('Không xuất được tệp','<p>Môi trường này chặn tải tệp. Hãy dùng nút “Sao chép” và dán vào Word/Google Docs.</p>')}}}
function slug(){return (S.exam?.meta.name||'de').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').replace(/[^a-zA-Z0-9]+/g,'_').slice(0,40)}
function exportMenu(){
 if(!S.exam&&!S.planPrev)return toast('Chưa có nội dung để xuất.');
 const it=[['Đề kiểm tra (.docx)','docExam',1],['Đề kiểm tra (HTML)','htmlExam',1],['Đáp án + hướng dẫn chấm (.docx)','docAns',1],['Đáp án + hướng dẫn chấm (HTML)','htmlAns',1],['Ma trận + đặc tả (.docx)','docMat',0],['Ma trận + đặc tả (HTML)','htmlMat',0],['Phiếu trả lời (.docx)','docOmr',1],['Ngân hàng JSON của đề','json',1]];
 openModal({title:'⬇ Xuất tệp',body:`<p class="hint">Tệp .docx mở trực tiếp bằng Word/Google Docs; tệp HTML mở bằng trình duyệt để in. Nếu đề có nhiều mã đề, tệp chứa tất cả mã đề.</p><div class="xgrid">${it.map(i=>`<button class="btn" data-x="${i[1]}" ${i[2]&&!S.exam?'disabled':''}>${i[0]}</button>`).join('')}</div>`,actions:[{label:'Đóng',onClick:()=>true}],onMount:(b,close)=>$$('[data-x]',b).forEach(x=>x.onclick=()=>{close();doExport(x.dataset.x)})})}
async function doExport(k){
 const t=S.exam?.meta.name||'Ma trận';
 try{
  if(k==='docExam')return download(slug()+'_de.docx',await docxFromHtml(cleanHtml('exam',S.ver,true)));
  if(k==='htmlExam')return download(slug()+'_de.html',docHtml(t,cleanHtml('exam',S.ver,true)));
  if(k==='docAns')return download(slug()+'_dap_an.docx',await docxFromHtml(cleanHtml('answer',S.ver,false)+cleanHtml('hdc',S.ver,true)));
  if(k==='htmlAns')return download(slug()+'_dap_an.html',docHtml('Đáp án',cleanHtml('answer',S.ver,false)+cleanHtml('hdc',S.ver,true)));
  const m=cleanHtml('matrix',S.ver)+(S.exam?cleanHtml('spec',S.ver):'');
  if(k==='docMat')return download(slug()+'_ma_tran.docx',await docxFromHtml(m));
  if(k==='htmlMat')return download(slug()+'_ma_tran.html',docHtml('Ma trận',m));
  if(k==='docOmr')return download(slug()+'_phieu_tra_loi.docx',await docxFromHtml(cleanHtml('omr',S.ver,true)));
  if(k==='json')return download(slug()+'.json',JSON.stringify(S.exam.questions.map((q,i)=>({id:'Q'+String(i+1).padStart(2,'0'),subject:S.exam.meta.subject,grade:String(S.exam.meta.grade),topic:q.topic,questionType:TYPES[q.type].n,level:LV[q.level],question:q.question,options:q.options.some(Boolean)?q.options:q.pairs.map(p=>p.left+' | '+p.right),correctAnswer:q.type==='essay'?q.correctAnswer:ansText(q),explanation:q.explanation,score:q.score,learningOutcome:q.outcome})),null,2));
 }catch(e){alertBox('Không xuất được tệp',`<p>${esc(e.message||String(e))}</p>`)}}
async function copyExam(){
 if(!S.exam&&S.tab!=='matrix')return toast('Chưa có nội dung để sao chép.');
 const div=document.createElement('div');div.style.cssText='position:fixed;left:-9999px;top:0;background:#fff;color:#000;width:800px';div.innerHTML=cleanHtml(S.tab,S.ver,false);document.body.appendChild(div);
 let ok=false;try{const r=document.createRange();r.selectNodeContents(div);const s=getSelection();s.removeAllRanges();s.addRange(r);ok=document.execCommand('copy');s.removeAllRanges()}catch(e){}
 if(!ok){try{await navigator.clipboard.writeText(div.innerText);ok=true}catch(e){}}
 div.remove();toast(ok?'📋 Đã sao chép – dán vào Word/Google Docs.':'Trình duyệt chặn sao chép. Hãy bôi đen nội dung và nhấn Ctrl+C.')}
function printExam(){
 if(!S.exam&&S.tab!=='matrix')return toast('Chưa có nội dung để in.');
 const go=all=>{$('#printArea').innerHTML=cleanHtml(S.tab,S.ver,all);try{window.print()}catch(e){toast('Trình duyệt chặn in – hãy dùng “Xuất đề” rồi mở tệp để in.',6000)}};
 if(S.exam&&S.exam.versions>1&&['exam','answer','hdc','omr'].includes(S.tab))openModal({title:'In đề',body:`<p>Có ${S.exam.versions} mã đề. In tất cả hay chỉ mã đề ${S.ver}?</p>`,actions:[{label:'Mã đề '+S.ver,onClick:()=>{setTimeout(()=>go(false),50);return true}},{label:'Tất cả mã đề',cls:'primary',onClick:()=>{setTimeout(()=>go(true),50);return true}}]});
 else go(false)}
function undo(){if(!S.hist.length)return toast('Không còn thao tác để hoàn tác.');const h=S.hist.pop();S.exam=JSON.parse(h.json);rerender();toast('↩ Đã hoàn tác: '+h.label)}
function openHist(){
 if(!S.hist.length)return toast('Chưa có lịch sử chỉnh sửa trong phiên này.');
 openModal({title:'🕘 Lịch sử phiên bản',body:'<div class="hint">Mỗi dòng là trạng thái của đề trước một thao tác. Khôi phục sẽ không làm mất trạng thái hiện tại (nó được lưu lại để có thể hoàn tác).</div>'+S.hist.map((h,i)=>({h,i})).reverse().map(({h,i})=>`<div class="bk"><div class="m">${new Date(h.t).toLocaleTimeString('vi-VN')} • ${h.n} câu</div><b>${esc(h.label)}</b><div class="qact" style="display:flex"><button class="btn sm" data-h="${i}">↺ Khôi phục bản này</button></div></div>`).join(''),
  actions:[{label:'Đóng',onClick:()=>true}],
  onMount:(b,close)=>$$('[data-h]',b).forEach(x=>x.onclick=()=>{const j=S.hist[+x.dataset.h].json;pushHist('Trước khi khôi phục');S.exam=JSON.parse(j);rerender();close();toast('Đã khôi phục phiên bản.')})})}
async function clearExam(){if(!S.exam)return;if(!await confirmBox('Xóa đề hiện tại? (có thể Hoàn tác)','Xóa'))return;pushHist('Trước khi xóa đề');S.exam=null;S.planPrev=null;rerender();toast('Đã xóa đề.')}

/* ============ 20. HÀNH ĐỘNG ============ */
const ACT={
 goStep:d=>{S.step=+d.v;renderSetup()},
 prevStep:()=>{S.step=Math.max(0,S.step-1);renderSetup();$('#setup').scrollIntoView?.({block:'nearest'})},
 nextStep:()=>{S.step=Math.min(STEPS.length-1,S.step+1);renderSetup()},
 setLevel:d=>{if(S.cfg.level!==d.v){S.cfg.level=d.v;S.cfg.grade='';if(S.cfg.subject&&!SCHOOL[d.v].subjects.includes(S.cfg.subject)&&!S.cfg.customSubject)S.cfg.subject=''}renderSetup();saveDraft()},
 setGrade:d=>{S.cfg.grade=+d.v;S.step=1;renderSetup();saveDraft()},
 setSubject:d=>{S.cfg.subject=d.v;S.cfg.customSubject='';S.step=2;renderSetup();saveDraft()},
 applyTpl:d=>{const t=TEMPLATES[+d.v],c=S.cfg;Object.keys(c.counts).forEach(k=>c.counts[k]=0);Object.keys(c.essay).forEach(k=>c.essay[k]=0);Object.keys(c.partScores).forEach(k=>c.partScores[k]=0);Object.assign(c.counts,t.counts);Object.assign(c.essay,t.essay);c.duration=t.dur;if(t.cdur)c.customDuration=t.cdur;c.scoreMode=t.parts?'part':'weight';if(t.parts)Object.assign(c.partScores,t.parts);c.essayW=Object.assign({},t.ew||{});c.levelMode='percent';c.lvPct=Object.assign({},t.lv||D4);if(t.type)c.examType=t.type;c.scale='10';c.matrixLock=false;c.matrixRows=null;renderSetup();saveDraft();toast('Đã áp dụng mẫu: '+t.n+' – tổng '+totalOf(c)+' câu. Bạn vẫn có thể chỉnh lại số câu.',5000)},
 tpMode:d=>{const c=S.cfg;c.topicMode=d.v;if(d.v==='manual'&&!Object.values(c.topicQ).some(v=>+v)){const tp=topicsOf(c),a=lrm(totalOf(c),tp.map(()=>1));tp.forEach((t,i)=>c.topicQ[t]=a[i])}renderSetup();saveDraft()},
 qSel:(d,b)=>{b.closest('.q')?.classList.toggle('sel')},
 rmDoc:d=>{S.cfg.docs.splice(+d.v,1);$('#docList').innerHTML=docListHtml();saveDraft()},
 lvMode:d=>{S.cfg.levelMode=d.v;renderSetup();saveDraft()},
 autoSplit:()=>{const t=totalOf(S.cfg),a=lrm(t,[40,30,20,10]);LEVELS.forEach((l,i)=>S.cfg.lvCount[l.k]=a[i]);renderSetup();saveDraft()},
 parseMatrix:()=>parseMatrixAI(),
 clearMatrix:()=>{S.cfg.matrixRows=null;S.cfg.matrixLock=false;renderSetup();toast('Đã bỏ ma trận tải lên.')},
 saveLastCfg:()=>{saveLast();toast('Đã lưu cấu hình.')},
 restoreCfg:()=>{const c=store.get('rdk_cfg',null);if(!c)return toast('Chưa có cấu hình đã lưu.');loadCfg(c);renderSetup();renderPreview();toast('Đã khôi phục cấu hình gần nhất.')},
 clearCfg:async()=>{if(!await confirmBox('Xóa toàn bộ cấu hình đã lưu và đặt lại thiết lập? (Đề đang xem không bị xóa)','Xóa cấu hình'))return;store.del('rdk_cfg');store.del('rdk_cfg_draft');S.cfg=DEF();S.step=0;S.planPrev=null;renderSetup();renderPreview();toast('Đã xóa toàn bộ cấu hình.')},
 makeMatrix:doMatrix,verifyExam:doVerify,generate:doGenerate,
 regenAll:()=>{if(!S.exam)return toast('Hãy tạo đề trước.');doGenerate()},equivalent:doEquivalent,
 saveExam,copyExam,printExam,exportMenu,history:openHist,undo,clearExam,
 tab:d=>{S.tab=d.v;renderPreview()},
 qRegen:d=>regenOne(d.id),qEdit:d=>editQ(d.id),qDel:d=>delQ(d.id),qAdd:d=>addQ(d.id),
 qBank:d=>{const q=qById(d.id);if(!q||q.empty)return toast('Câu chưa có nội dung.');toBank(q);toast('📚 Đã lưu vào ngân hàng câu hỏi.')},
 openBank,openSaved};
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b||b.disabled)return;const f=ACT[b.dataset.act];if(f){try{const r=f(b.dataset,b,e);if(r&&r.catch)r.catch(err=>{console.error(err);toast('Có lỗi: '+(err.message||err))})}catch(err){console.error(err);toast('Có lỗi: '+(err.message||err))}}});
window.addEventListener('pagehide',()=>{store.set('rdk_cfg_draft',slimCfg())});

/* ============ 21. KHỞI TẠO ============ */
(function init(){
 const d=store.get('rdk_cfg_draft',null)||store.get('rdk_cfg',null);if(d){try{loadCfg(d)}catch(e){}}
 const ex=store.get('rdk_exam_cur',null);if(ex&&ex.questions&&ex.meta){S.exam=ex}
 renderSetup();renderPreview();
 if(d)toast('Đã khôi phục cấu hình lần làm việc trước.');
 getSample();
})();
