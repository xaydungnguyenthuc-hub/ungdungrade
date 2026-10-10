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
 <div class="grid2">${inp('Chương','chapter','Chương…')}${inp('Phạm vi kiến thức','scope','Từ bài … đến bài …')}</div>
 ${ta('Nội dung cần kiểm tra','needTest','Các nội dung trọng tâm',2)}
 ${ta('Yêu cầu cần đạt','outcomes','Dán yêu cầu cần đạt (nếu có)',2)}
 ${ta('Ghi chú của giáo viên','notes','Lưu ý riêng cho đề này',2)}
 ${ta('Nội dung bài học (dán vào đây)','content','Dán nội dung bài học, kiến thức trọng tâm…',8,'big')}
 <h2>TÀI LIỆU THAM CHIẾU</h2>
 <div class="radio"><input type="radio" name="sm" data-k="sourceMode" data-re value="ref" ${c.sourceMode==='ref'?'checked':''}><div><b>Chỉ sử dụng tài liệu tải lên</b><br><small>Không bổ sung kiến thức ngoài tài liệu.</small></div></div>
 <div class="radio"><input type="radio" name="sm" data-k="sourceMode" data-re value="plus" ${c.sourceMode==='plus'?'checked':''}><div><b>Tài liệu tải lên + kiến thức chương trình phổ thông</b></div></div>
 <div class="radio"><input type="radio" name="sm" data-k="sourceMode" data-re value="teacher" ${c.sourceMode==='teacher'?'checked':''}><div><b>Giáo viên tự nhập nội dung</b><br><small>Chỉ dùng nội dung nhập ở trên.</small></div></div>
 ${c.sourceMode==='teacher'?'':`<label class="fld"><span>Loại tài liệu sắp tải</span><select data-k="docKind">${DOC_KINDS.map(k=>`<option ${c.docKind===k?'selected':''}>${k}</option>`).join('')}</select></label>
 <input type="file" id="fileDocs" multiple accept=".pdf,.docx,.txt,.md,image/*" style="margin-bottom:8px">
 <div class="hint">Hỗ trợ PDF (có lớp chữ), Word (.docx), TXT, hình ảnh. PDF scan hoặc .doc cũ: hãy dán nội dung vào ô bên dưới.</div>
 <div id="docList">${docListHtml()}</div>
 ${ta('Hoặc dán nội dung tài liệu (SGK, giáo án, đề cũ, tài liệu ôn tập…)','refText','Dán nội dung tài liệu tham chiếu',5)}`}`}
function docListHtml(){return S.cfg.docs.map((d,i)=>`<div class="doc"><span>📄 [${esc(d.kind)}] ${esc(d.name)} · ${d.text.length.toLocaleString('vi')} ký tự</span><button class="btn sm danger" data-act="rmDoc" data-v="${i}">Xóa</button></div>`).join('')}
function s3(){const c=S.cfg;
 return `<h2>Bước 5 – Loại đề kiểm tra</h2>
 <label class="fld"><span>Loại đề</span><select data-k="examType">${EXAM_TYPES.map(t=>`<option ${c.examType===t?'selected':''}>${t}</option>`).join('')}</select></label>
 ${inp('Tên đề','examName','Để trống để tự đặt: '+examName(c))}
 ${inp('Tên trường (không bắt buộc)','school','Tên trường in trên đề')}
 <label class="fld"><span>Thời gian làm bài</span><select data-k="duration" data-re>${DURS.map(d=>`<option value="${d}" ${c.duration===d?'selected':''}>${d} phút</option>`).join('')}<option value="custom" ${c.duration==='custom'?'selected':''}>Tự nhập</option></select></label>
 ${c.duration==='custom'?inp('Số phút','customDuration','','number'):''}`}
function s4(){const c=S.cfg;
 return `<h2>Bước 6 – Hình thức & số câu</h2>${tplHtml()}<h3>Trắc nghiệm</h3>
 ${Object.keys(c.counts).map(t=>`<div class="cnt"><label>${TYPES[t].n}</label>${numIn('counts.'+t)}</div>`).join('')}
 <h3>Tự luận</h3>${ESSAY.map(e=>`<div class="cnt"><label>${e[1]}</label>${numIn('essay.'+e[0])}</div>`).join('')}
 <div class="alert info">Tổng số câu: <b id="totalQ">0</b> <span id="essayQ"></span></div>
 <div class="hint">Mỗi dạng tự luận được tính là một câu tự luận độc lập. Điểm được chia tự động theo dạng câu; có thể chỉnh từng câu sau khi tạo đề.</div>${topicAllocHtml()}<h3>Xem trước điểm</h3><div id="scorePrev"></div>`}
function topicAllocHtml(){const c=S.cfg,tp=topicsOf(c);if(tp.length<2||c.matrixLock)return'';
 return `<h3>Số câu theo chủ đề</h3><div class="seg"><button class="${c.topicMode==='auto'?'on':''}" data-act="tpMode" data-v="auto">Chia đều</button><button class="${c.topicMode==='manual'?'on':''}" data-act="tpMode" data-v="manual">Tự nhập</button></div>${c.topicMode==='manual'?tp.map(t=>`<div class="cnt"><label>${esc(t)}</label><input type="number" min="0" step="1" data-tq="${esc(t)}" value="${+c.topicQ[t]||0}"></div>`).join('')+'<div id="tpInfo"></div>':'<div class="hint">Các chủ đề được chia đều, đan xen mọi mức độ.</div>'}`}
function s5(){const c=S.cfg;const m=c.levelMode;
 return `<h2>Bước 7 – Mức độ & thang điểm</h2>
 <div class="seg"><button class="${m==='count'?'on':''}" data-act="lvMode" data-v="count">Số câu</button><button class="${m==='percent'?'on':''}" data-act="lvMode" data-v="percent">Tỷ lệ %</button></div>
 ${LEVELS.map(l=>`<div class="cnt"><label>${l.n} (${m==='count'?'câu':'%'})</label>${m==='count'?numIn('lvCount.'+l.k):`<input type="number" min="0" step="1" data-k="lvPct.${l.k}" data-int value="${c.lvPct[l.k]}">`}</div>`).join('')}
 <div id="lvInfo"></div>
 ${m==='count'?'<button class="btn sm" data-act="autoSplit">Chia tự động 40/30/20/10</button>':''}
 <h3>Thang điểm</h3>
 <label class="fld"><select data-k="scale" data-re>${['10','20','100'].map(s=>`<option value="${s}" ${c.scale===s?'selected':''}>${s} điểm</option>`).join('')}<option value="custom" ${c.scale==='custom'?'selected':''}>Tự nhập</option></select></label>
 ${c.scale==='custom'?inp('Tổng điểm','customScale','','number'):''}
 <div id="scaleInfo" class="hint"></div>
 <h3>Cách chia điểm</h3>
 <label class="fld"><select data-k="scoreMode" data-re><option value="weight" ${c.scoreMode==='weight'?'selected':''}>Tự động theo dạng câu (tự luận nhiều điểm hơn)</option><option value="equal" ${c.scoreMode==='equal'?'selected':''}>Mỗi câu điểm bằng nhau</option><option value="part" ${c.scoreMode==='part'?'selected':''}>Theo từng phần (tự nhập điểm mỗi phần)</option></select></label>
 ${c.scoreMode==='part'?partInputs()+'<div id="partInfo"></div>':''}
 <div id="scorePrev"></div>`}
function typeCounts(c){const o={};Object.keys(c.counts).forEach(t=>{if(+c.counts[t])o[t]=+c.counts[t]});if(essayTotal(c))o.essay=essayTotal(c);return o}
function partInputs(){const c=S.cfg;const tc=typeCounts(c);return Object.keys(TYPES).filter(t=>tc[t]).map(t=>`<div class="cnt"><label>Phần ${TYPES[t].sec.toLowerCase()} (${tc[t]} câu)</label><input type="number" min="0" step="0.25" data-k="partScores.${t}" value="${c.partScores[t]||0}"></div>`).join('')||'<div class="hint">Chưa có dạng câu.</div>'}
function s6(){const c=S.cfg;
 return `<h2>Nâng cao</h2><h3>Số mã đề</h3>
 <label class="fld"><select data-k="versions" data-int>${[1,2,3,4].map(n=>`<option value="${n}" ${+c.versions===n?'selected':''}>${n} mã đề${n>1?' ('+Array.from({length:n},(_,i)=>101+i).join(', ')+')':''}</option>`).join('')}</select></label>
 <label class="radio"><input type="checkbox" data-k="shuffleQ" ${c.shuffleQ?'checked':''}> Đảo thứ tự câu giữa các mã đề</label>
 <label class="radio"><input type="checkbox" data-k="shuffleO" ${c.shuffleO?'checked':''}> Đảo thứ tự đáp án (đáp án đúng được cập nhật tự động)</label>
 <h3>TẢI MA TRẬN/ĐẶC TẢ</h3>
 <div class="hint">Dán hoặc tải ma trận/đặc tả có sẵn. AI sẽ đọc và tạo đề đúng theo ma trận, không tự đổi tỷ lệ.</div>
 ${ta('Nội dung ma trận/đặc tả','matrixText','Dán bảng ma trận (chủ đề, dạng câu, mức độ, số câu)…',5)}
 <input type="file" id="fileMatrix" accept=".pdf,.docx,.txt,.md,image/*" style="margin-bottom:8px">
 <div class="grid2"><button class="btn" data-act="parseMatrix">🔎 Phân tích ma trận</button><button class="btn danger" data-act="clearMatrix">Bỏ ma trận</button></div>
 <div id="matrixStatus">${c.matrixLock&&c.matrixRows?`<div class="alert ok">Đang dùng ma trận đã tải: ${c.matrixRows.reduce((a,r)=>a+r.count,0)} câu, ${new Set(c.matrixRows.map(r=>r.topic)).size} chủ đề. Số câu/mức độ đã được khóa theo ma trận.</div>`:''}</div>
 <h3>Ngân hàng câu hỏi</h3>
 <label class="radio"><input type="checkbox" data-k="useBank" ${c.useBank?'checked':''}> Ưu tiên dùng câu đã lưu trong ngân hàng (cùng môn, lớp, chủ đề, dạng, mức độ) trước khi nhờ AI soạn</label>
 <h3>Câu hỏi giáo viên đã có</h3>
 <label class="radio"><input type="checkbox" data-k="keepTeacher" ${c.keepTeacher?'checked':''}> Giữ nguyên câu hỏi giáo viên đã nhập (AI không chỉnh sửa, chỉ sinh các câu còn thiếu)</label>
 ${ta('Nhập các câu có sẵn','teacherText','Mỗi câu cách nhau 1 dòng trống.\nCâu 1. Nội dung câu hỏi?\nA. …\nB. …\nC. …\nD. …\nĐáp án: B\n\nCâu 2. Câu điền khuyết ……\nĐáp án: từ cần điền',8)}
 <div class="hint">Mỗi câu được xếp vào một vị trí cùng dạng trong cấu trúc đề; câu thừa so với cấu hình sẽ bị bỏ qua.</div>
 <h3>Dữ liệu</h3><div class="grid2"><button class="btn" data-act="saveLastCfg">Lưu cấu hình</button><button class="btn" data-act="restoreCfg">Khôi phục cấu hình gần nhất</button></div>`}
function refreshLive(){
 const c=S.cfg,tot=totalOf(c);
 const a=$('#totalQ');if(a){a.textContent=tot;$('#essayQ').textContent=`(trắc nghiệm ${tot-essayTotal(c)} • tự luận ${essayTotal(c)})`}
 const li=$('#lvInfo');if(li){const lc=levelCounts(c,tot);
  li.innerHTML=`<div class="alert ${lc.ok?'ok':'warn'}">${c.levelMode==='count'?`Tổng: <b>${lc.sum}</b> / ${tot} câu`:`Tổng: <b>${fmt(lc.sum)}%</b>`} ${lc.ok?'✓ hợp lệ':'⚠ '+esc(lc.msg)}</div>${c.levelMode==='percent'&&tot?`<div class="hint">Quy đổi: ${LEVELS.map(l=>`${l.n} ${lc.counts[l.k]} câu`).join(' • ')}</div>`:''}`}
 const si=$('#scaleInfo');if(si){const sc=scaleOf(c);si.textContent=tot?`${tot} câu • thang ${fmt(sc)} điểm • bước chia điểm ${fmt(stepFor(sc,tot))} • điểm trung bình ${fmt(sc/tot)}/câu`:'Chưa có câu hỏi.'}
 const sp=$('#scorePrev');if(sp){try{const p=buildPlan(c);const g={};p.slots.forEach(s=>{(g[s.type]=g[s.type]||[]).push(s.score)});
  sp.innerHTML=p.slots.length?Object.keys(TYPES).filter(t=>g[t]).map(t=>{const a=g[t],mn=Math.min(...a),mx=Math.max(...a),sm=r3(a.reduce((x,y)=>x+y,0));return `<div class="hint" style="margin:2px 0">• ${TYPES[t].n}: ${a.length} câu × ${mn===mx?fmt(mn):fmt(mn)+'–'+fmt(mx)} đ = <b>${fmt(sm)} đ</b></div>`}).join('')+`<div class="hint"><b>Tổng ${fmt(r3(p.slots.reduce((x,s)=>x+s.score,0)))} / ${fmt(p.scale)} điểm</b></div>`:'<div class="hint">Chưa có câu hỏi.</div>'}catch(e){sp.textContent=''}}
 const pi=$('#partInfo');if(pi){const tc=typeCounts(c);const sm=r3(Object.keys(tc).reduce((a,t)=>a+(+c.partScores[t]||0),0));pi.innerHTML=sm?`<div class="alert ${Math.abs(sm-scaleOf(c))<0.005?'ok':'info'}">Tổng điểm các phần: <b>${fmt(sm)}</b> / thang ${fmt(scaleOf(c))}${Math.abs(sm-scaleOf(c))<0.005?' ✓':' – điểm sẽ được quy tỷ lệ về đúng thang.'}</div>`:'<div class="hint">Phần để 0 sẽ tự chia theo trọng số.</div>'}
 const ti=$('#tpInfo');if(ti){const tp=topicsOf(c),sm=tp.reduce((a,t)=>a+(+c.topicQ[t]||0),0);ti.innerHTML=`<div class="alert ${sm===tot?'ok':'warn'}">Tổng theo chủ đề: <b>${sm}</b> / ${tot} câu ${sm===tot?'✓':'⚠ cần bằng tổng số câu'}</div>`}
 updateSummary();
 const gb=$('#genBtn');if(gb)gb.disabled=S.busy}
function updateSummary(){const c=S.cfg,el=$('#summary');if(!el)return;const b=[];if(c.level)b.push(SCHOOL[c.level].nm+(c.grade?' · Lớp '+c.grade:''));const s=subjectOf(c);if(s)b.push(s);const t=totalOf(c);if(t)b.push(t+' câu');b.push('Thang '+fmt(scaleOf(c)));b.push(durOf(c)+' phút');b.push(c.examType);if(+c.versions>1)b.push(c.versions+' mã đề');el.innerHTML=b.map(x=>`<span class="badge">${esc(x)}</span>`).join('')}

/* sự kiện nhập liệu */
document.addEventListener('input',e=>onField(e,'input'));
document.addEventListener('change',e=>onField(e,'change'));
function onField(e,type){
 const el=e.target;
 if(el.id==='fileDocs'&&type==='change'){handleFiles(el.files,'docs');el.value='';return}
 if(el.id==='fileMatrix'&&type==='change'){handleFiles(el.files,'matrix');el.value='';return}
 if(el.id==='verSel'&&type==='change'){S.ver=+el.value;renderPreview();return}
 if(el.dataset&&el.dataset.tq!==undefined&&el.closest('#setup')){if(type==='input'){S.cfg.topicQ[el.dataset.tq]=Math.max(0,parseInt(el.value)||0);refreshLive();saveDraft()}return}
 const k=el.dataset?.k;if(!k||!el.closest('#setup'))return;
 const textual=el.tagName==='TEXTAREA'||(el.tagName==='INPUT'&&['text','number'].includes(el.type));
 if(textual&&type!=='input')return;if(!textual&&type!=='change')return;
 if(el.type==='radio'&&!el.checked)return;
 let v=el.type==='checkbox'?el.checked:el.value;
 if(el.hasAttribute('data-int'))v=Math.max(0,parseInt(v)||0);else if(el.type==='number')v=Math.max(0,parseFloat(v)||0);
 setp(S.cfg,k,v);
 if(k==='versions'&&S.exam){S.exam.versions=+v;renderPreview();persistExam()}
 if(k==='matrixText'||k.startsWith('counts.')||k.startsWith('essay.')){if(S.cfg.matrixLock&&k!=='matrixText'){S.cfg.matrixLock=false;toast('Đã bỏ khóa ma trận tải lên do bạn chỉnh số câu.')}}
 if(el.hasAttribute('data-re'))renderSetup();else refreshLive();
 saveDraft()}

/* ============ 14. TẢI TÀI LIỆU ============ */
async function fileText(f){
 const n=f.name.toLowerCase();
 if(f.type.startsWith('image/')){const sm=await getSample();if(!sm||!_lim?.images)throw new Error('Môi trường này chưa hỗ trợ đọc hình ảnh – hãy dán nội dung văn bản vào ô bên dưới.');
  const r=await sm('Hãy chép lại CHÍNH XÁC toàn bộ văn bản, công thức, bảng biểu trong hình (tiếng Việt). Không bình luận thêm.',{images:[f],modelTier:'quick',cache:false});return r.text}
 if(n.endsWith('.pdf')){if(!window.pdfjsLib)throw new Error('Không tải được thư viện đọc PDF – hãy dán nội dung vào ô bên dưới.');
  pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const pdf=await pdfjsLib.getDocument({data:new Uint8Array(await f.arrayBuffer())}).promise;let t='';
  for(let i=1;i<=Math.min(pdf.numPages,80);i++){const p=await pdf.getPage(i);const tc=await p.getTextContent();t+=tc.items.map(x=>x.str).join(' ')+'\n'}
  if(t.replace(/\s/g,'').length<30)throw new Error('PDF không có lớp chữ (có thể là bản scan). Hãy tải dưới dạng hình ảnh hoặc dán nội dung.');return t}
 if(n.endsWith('.docx')){if(!window.mammoth)throw new Error('Không tải được thư viện đọc Word – hãy dán nội dung.');return(await mammoth.extractRawText({arrayBuffer:await f.arrayBuffer()})).value}
 if(n.endsWith('.doc'))throw new Error('Chưa đọc được file .doc cũ – hãy lưu lại thành .docx hoặc dán nội dung.');
 return await f.text()}
async function handleFiles(files,target){
 for(const f of files){
  try{toast('Đang đọc '+f.name+'…');const t=(await fileText(f)).trim();
   if(!t){toast('Không đọc được nội dung: '+f.name);continue}
   if(target==='docs'){S.cfg.docs.push({name:f.name,kind:S.cfg.docKind,text:t});const l=$('#docList');if(l)l.innerHTML=docListHtml()}
   else{S.cfg.matrixText=(S.cfg.matrixText?S.cfg.matrixText+'\n':'')+t;renderSetup()}
   toast('Đã đọc '+f.name);saveDraft()}
  catch(e){alertBox('Không đọc được tệp',`<p><b>${esc(f.name)}</b>: ${esc(e.message||String(e))}</p>`)}}}
async function parseMatrixAI(){
 const c=S.cfg;if(!c.matrixText.trim())return toast('Hãy dán hoặc tải nội dung ma trận/đặc tả trước.');
 const P=openModal({title:'Đang phân tích ma trận…',body:'<p>AI đang đọc ma trận. Vui lòng chờ.</p>',static:true});
 S.abort=new AbortController();
 try{
  const res=await aiJson(`Đọc ma trận/bản đặc tả đề kiểm tra sau và chuyển thành danh sách dòng. Mỗi dòng: {"topic":"tên chủ đề/nội dung","type":"mc4|mcMulti|tf|match|fill|short|essay","level":"nb|th|vd|vdc","count":số câu nguyên >0,"essayKind":"(chỉ khi essay) một trong: ${ESSAY.map(e=>e[1]).join(' | ')} hoặc rỗng"}.
Quy ước: nb=Nhận biết, th=Thông hiểu, vd=Vận dụng, vdc=Vận dụng cao; mc4=trắc nghiệm 4 lựa chọn (mặc định cho "trắc nghiệm"), tf=đúng/sai, short=trả lời ngắn, essay=tự luận. KHÔNG tự thay đổi số liệu trong ma trận; nếu ô ghi số câu theo mức độ thì tách thành các dòng riêng.
MA TRẬN:
${c.matrixText.slice(0,Math.min(20000,maxRef()))}
Chỉ trả về JSON: {"rows":[...]}`,'default');
  const rows=(res.rows||[]).map(r=>({topic:str(r.topic)||'Nội dung chung',type:TYPES[r.type]?r.type:'mc4',level:LV[r.level]?r.level:'nb',count:Math.max(0,parseInt(r.count)||0),essayKind:str(r.essayKind)})).filter(r=>r.count>0);
  P();if(!rows.length)return alertBox('Không đọc được ma trận','<p>AI không tìm thấy dòng ma trận hợp lệ. Hãy kiểm tra nội dung đã dán.</p>');
  c.matrixRows=rows;c.matrixLock=true;
  Object.keys(c.counts).forEach(k=>c.counts[k]=0);Object.keys(c.essay).forEach(k=>c.essay[k]=0);
  LEVELS.forEach(l=>c.lvCount[l.k]=0);
  rows.forEach(r=>{if(r.type==='essay'){const e=ESSAY.find(x=>x[1]===r.essayKind)||ESSAY[2];c.essay[e[0]]+=r.count}else c.counts[r.type]+=r.count;c.lvCount[r.level]+=r.count});
  c.levelMode='count';c.topic=[...new Set(rows.map(r=>r.topic))].join('\n');
  renderSetup();saveDraft();toast('Đã đọc ma trận: '+rows.reduce((a,r)=>a+r.count,0)+' câu.');
 }catch(e){P();alertBox('Lỗi phân tích ma trận',`<p>${esc(e.message||e.code||'Không rõ')}</p>`)}}

function tplHtml(){const c=S.cfg,sub=subjectOf(c);
 const mine=[],gen=[];TEMPLATES.forEach((t,i)=>{if(!t.m)gen.push(i);else if(sub&&t.m.test(sub)&&(!t.L||!c.level||t.L.includes(c.level)))mine.push(i)});
 const btn=i=>`<button class="chip" data-act="applyTpl" data-v="${i}">${esc(TEMPLATES[i].n)}</button>`;
 return `<h3>Mẫu cấu trúc đề (tùy chọn)</h3>${mine.length?`<div class="hint">Mẫu cho môn <b>${esc(sub)}</b>${c.level?' – '+SCHOOL[c.level].nm:''}:</div><div class="tpl">${mine.map(btn).join('')}</div>`:(sub?`<div class="hint">Chưa có mẫu riêng cho môn “${esc(sub)}”${c.level?' ở cấp '+SCHOOL[c.level].nm:''} – hãy dùng mẫu chung bên dưới.</div>`:'<div class="hint">Chọn môn học ở bước 2 để hiện mẫu theo môn.</div>')}<div class="hint">Mẫu chung:</div><div class="tpl">${gen.map(btn).join('')}</div>`}
