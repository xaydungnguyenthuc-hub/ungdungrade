'use strict';
/* ============ 1. DỮ LIỆU CẤU HÌNH TĨNH ============ */
const LEVELS=[{k:'nb',n:'Nhận biết'},{k:'th',n:'Thông hiểu'},{k:'vd',n:'Vận dụng'},{k:'vdc',n:'Vận dụng cao'}];
const LV=Object.fromEntries(LEVELS.map(l=>[l.k,l.n]));
const TYPES={
 mc4:{n:'Trắc nghiệm 4 lựa chọn',sec:'TRẮC NGHIỆM NHIỀU LỰA CHỌN',w:1,o:1,a:1,ins:'Thí sinh chọn một phương án đúng nhất cho mỗi câu.'},
 mcMulti:{n:'Trắc nghiệm nhiều đáp án đúng',sec:'TRẮC NGHIỆM NHIỀU ĐÁP ÁN ĐÚNG',w:1.5,o:2,a:4,ins:'Mỗi câu có thể có nhiều đáp án đúng. Thí sinh chọn tất cả các đáp án đúng.'},
 tf:{n:'Đúng/Sai',sec:'TRẮC NGHIỆM ĐÚNG/SAI',w:2,o:3,a:5,ins:'Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn Đúng hoặc Sai.'},
 match:{n:'Ghép nối',sec:'GHÉP NỐI',w:1.5,o:4,a:3,ins:'Ghép mỗi nội dung ở cột bên trái với một nội dung phù hợp ở cột bên phải.'},
 fill:{n:'Điền khuyết',sec:'ĐIỀN KHUYẾT',w:1.25,o:5,a:2,ins:'Điền từ/cụm từ thích hợp vào chỗ trống.'},
 short:{n:'Trả lời ngắn',sec:'TRẢ LỜI NGẮN',w:1.5,o:6,a:6,ins:'Chỉ ghi kết quả/đáp án ngắn gọn.'},
 essay:{n:'Tự luận',sec:'TỰ LUẬN',w:3,o:7,a:7,ins:'Trình bày câu trả lời/lời giải đầy đủ.'}
};
const ESSAY=[['short','Câu hỏi ngắn',2],['explain','Giải thích',2.5],['present','Trình bày',3],['solve','Giải bài tập',3],['analyze','Phân tích',3.5],['compare','So sánh',3],['prove','Chứng minh',3.5],['apply','Vận dụng thực tế',3],['reading','Đọc hiểu',4],['write','Viết đoạn/bài',5]];
const SUBJ_COMMON=['Toán','Ngữ văn','Tiếng Anh','Tin học','Công nghệ','Âm nhạc','Mĩ thuật'];
const SCHOOL={
 tieuhoc:{n:'TIỂU HỌC',nm:'Tiểu học',sub:'Lớp 1 – 5',grades:[1,2,3,4,5],subjects:['Toán','Tiếng Việt','Tiếng Anh','Khoa học','Tự nhiên và Xã hội','Lịch sử và Địa lí','Tin học','Công nghệ','Đạo đức','Âm nhạc','Mĩ thuật']},
 thcs:{n:'THCS',nm:'THCS',sub:'Lớp 6 – 9',grades:[6,7,8,9],subjects:['Toán','Ngữ văn','Tiếng Anh','Khoa học tự nhiên','Lịch sử và Địa lí','Giáo dục công dân','Tin học','Công nghệ','Âm nhạc','Mĩ thuật']},
 thpt:{n:'THPT',nm:'THPT',sub:'Lớp 10 – 12',grades:[10,11,12],subjects:['Toán','Ngữ văn','Tiếng Anh','Vật lí','Hóa học','Sinh học','Lịch sử','Địa lí','Giáo dục kinh tế và pháp luật','Tin học','Công nghệ','Âm nhạc','Mĩ thuật']}
};
const EXAM_TYPES=['Kiểm tra thường xuyên','Kiểm tra 15 phút','Kiểm tra giữa kỳ','Kiểm tra cuối kỳ','Đề ôn tập','Đề luyện tập','Đề khảo sát','Đề tuyển chọn học sinh','Đề tự tạo'];
const DURS=['10','15','30','45','60','90','120'];
const DOC_KINDS=['SGK','Giáo án','Kế hoạch bài dạy','Ma trận đề cũ','Đề kiểm tra cũ','Tài liệu ôn tập','Văn bản đọc hiểu','Khác'];
const STEPS=['Cấp & lớp','Môn học','Nội dung','Loại đề','Dạng câu','Mức độ & điểm','Nâng cao'];

const DEF=()=>({level:'',grade:'',subject:'',customSubject:'',topic:'',chapter:'',scope:'',needTest:'',outcomes:'',notes:'',content:'',
 sourceMode:'plus',docKind:'SGK',docs:[],refText:'',
 examType:'Kiểm tra giữa kỳ',examName:'',school:'',duration:'45',customDuration:45,
 counts:{mc4:12,mcMulti:0,tf:0,match:0,fill:0,short:0},
 essay:{short:0,explain:0,present:2,solve:0,analyze:0,compare:0,prove:0,apply:0,reading:0,write:0},
 levelMode:'percent',lvCount:{nb:0,th:0,vd:0,vdc:0},lvPct:{nb:40,th:30,vd:20,vdc:10},
 scale:'10',customScale:10,scoreMode:'weight',partScores:{mc4:0,mcMulti:0,tf:0,match:0,fill:0,short:0,essay:0},topicMode:'auto',topicQ:{},essayW:{},useBank:false,versions:1,shuffleQ:true,shuffleO:true,
 matrixText:'',matrixRows:null,matrixLock:false,teacherText:'',keepTeacher:true});

/* ============ 2. TIỆN ÍCH ============ */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>String(Math.round((+n||0)*100)/100).replace('.',',');
const str=x=>x==null?'':(typeof x==='string'?x.trim():(Array.isArray(x)?x.join('; '):String(x)));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clone=o=>JSON.parse(JSON.stringify(o));
const get=(o,p)=>p.split('.').reduce((a,k)=>a==null?a:a[k],o);
const setp=(o,p,v)=>{const ks=p.split('.');const l=ks.pop();ks.reduce((a,k)=>a[k],o)[l]=v};
const chunk=(a,n)=>{const r=[];for(let i=0;i<a.length;i+=n)r.push(a.slice(i,i+n));return r};
const roman=n=>['','I','II','III','IV','V','VI','VII'][n]||n;
const LET='ABCD';
let uidN=0;const uid=()=>'u'+Date.now().toString(36)+(uidN++);
function mulberry(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function shuffleArr(arr,r){const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
async function pool(items,n,fn){let i=0;await Promise.all(Array.from({length:Math.min(n,items.length)},async()=>{while(i<items.length){const it=items[i++];await fn(it)}}))}
const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
function lrm(total,weights){const sw=weights.reduce((a,b)=>a+b,0);if(!sw||total<=0)return weights.map(()=>0);const raw=weights.map(w=>total*w/sw);const fl=raw.map(Math.floor);let rem=total-fl.reduce((a,b)=>a+b,0);raw.map((r,i)=>[r-fl[i],i]).sort((a,b)=>b[0]-a[0]).slice(0,rem).forEach(x=>fl[x[1]]++);return fl}
function distUnits(units,w){const n=w.length;if(!n)return[];if(units<n){const out=w.map(()=>0);w.map((x,i)=>[x,i]).sort((a,b)=>b[0]-a[0]).slice(0,units).forEach(x=>out[x[1]]=1);return out}
 const out=lrm(units,w);for(let i=0;i<n;i++){if(out[i]<1){let m=0;out.forEach((v,k)=>{if(v>out[m])m=k});out[m]--;out[i]=1}}return out}
const scaleOf=c=>c.scale==='custom'?(+c.customScale||10):(+c.scale||10);
function stepFor(S,n){let s=S>=100?1:(S>=20?.5:.25);while(S/s<n*2&&s>0.01)s/=2;return s}
const r3=x=>Math.round(x*1000)/1000;

/* ============ 3. TRẠNG THÁI ============ */
const S={cfg:DEF(),step:0,tab:'exam',ver:101,exam:null,hist:[],planPrev:null,busy:false,abort:null};
const subjectOf=(c=S.cfg)=>(c.customSubject||'').trim()||c.subject||'';
const subjCat=n=>/toán|vật lí|vật lý|hóa|khoa học tự nhiên|sinh học/i.test(n)?'calc':/ngữ văn|tiếng việt|tiếng anh|ngoại ngữ|tiếng (pháp|trung|nhật|hàn|nga|đức)|english/i.test(n)?'lang':/lịch sử|địa lí|địa lý|giáo dục công dân|kinh tế và pháp luật|đạo đức|tự nhiên và xã hội/i.test(n)?'fact':'gen';
const essayTotal=c=>Object.values(c.essay).reduce((a,b)=>a+(+b||0),0);
const totalOf=c=>Object.values(c.counts).reduce((a,b)=>a+(+b||0),0)+essayTotal(c);
const examName=c=>c.examName.trim()||`${c.examType} môn ${subjectOf(c)} lớp ${c.grade}`;
const durOf=c=>c.duration==='custom'?(+c.customDuration||45):(+c.duration||45);

function levelCounts(c,total){
 if(c.levelMode==='count'){const v=LEVELS.map(l=>+c.lvCount[l.k]||0);const sum=v.reduce((a,b)=>a+b,0);return{counts:Object.fromEntries(LEVELS.map((l,i)=>[l.k,v[i]])),sum,ok:sum===total,msg:sum===total?'':`Tổng mức độ = ${sum} câu, khác tổng số câu = ${total} (${sum<total?'thiếu':'thừa'} ${Math.abs(total-sum)} câu).`}}
 const p=LEVELS.map(l=>+c.lvPct[l.k]||0);const sum=Math.round(p.reduce((a,b)=>a+b,0)*100)/100;
 const arr=lrm(total,p);
 return{counts:Object.fromEntries(LEVELS.map((l,i)=>[l.k,arr[i]])),sum,ok:Math.abs(sum-100)<0.001,msg:Math.abs(sum-100)<0.001?'':`Tổng tỷ lệ = ${fmt(sum)}% – bắt buộc bằng 100%.`}}

/* ============ 4. LẬP KẾ HOẠCH (MA TRẬN) ============ */
function topicsOf(c){const t=(c.topic||'').split(/[\n;]+/).map(s=>s.trim()).filter(Boolean);return t.length?t:[c.chapter.trim()||subjectOf(c)||'Nội dung chung']}
const BIAS={mc4:0,fill:.5,match:.3,mcMulti:1,tf:1.2,short:1.5,essay:2.5};
function diffOrder(raw){const cnt={},seen={};raw.forEach(s=>cnt[s.type]=(cnt[s.type]||0)+1);
 return raw.map((s,i)=>{const n=cnt[s.type],j=(seen[s.type]=(seen[s.type]??-1)+1);return{i,v:BIAS[s.type]+(n>1?j/(n-1)*3:.5)}}).sort((a,b)=>a.v-b.v||a.i-b.i).map(x=>x.i)}
const wOfItem=s=>s.type==='essay'?(s.kw||ESSAY.find(e=>e[1]===s.kind)?.[2]||3):TYPES[s.type].w;
function allocScores(items,sc,step,mode,parts){
 const units=Math.round(sc/step);let u;
 if(mode==='equal')u=distUnits(units,items.map(()=>1));
 else if(mode==='part'){
  const types=[...new Set(items.map(s=>s.type))];const totW=items.reduce((a,s)=>a+TYPES[s.type].w,0)||1;
  const budgets=types.map(t=>{const p=+(parts&&parts[t])||0;if(p>0)return p;return sc*TYPES[t].w*items.filter(s=>s.type===t).length/totW});
  const bu=lrm(units,budgets);u=items.map(()=>0);
  types.forEach((t,ti)=>{const idx=items.map((s,i)=>s.type===t?i:-1).filter(i=>i>=0);const d=distUnits(bu[ti],idx.map(i=>wOfItem(items[i])));idx.forEach((i,k)=>u[i]=d[k])})}
 else u=distUnits(units,items.map(wOfItem));
 return u.map(x=>r3(x*step))}
function buildPlan(c){
 let raw=[];const errs=[];
 const kinds=[];ESSAY.forEach(e=>{for(let i=0;i<(+c.essay[e[0]]||0);i++)kinds.push(e)});
 const KW=e=>(c.essayW&&+c.essayW[e[0]])||e[2];
 const fromMatrix=!!(c.matrixLock&&c.matrixRows&&c.matrixRows.length);
 if(fromMatrix){
  let ki=0;c.matrixRows.forEach(r=>{for(let i=0;i<r.count;i++){let kind=null;if(r.type==='essay'){kind=(r.essayKind&&ESSAY.find(e=>e[1]===r.essayKind))||kinds[ki++%Math.max(kinds.length,1)]||ESSAY[2]}raw.push({type:r.type,level:r.level,topic:r.topic,kind:kind?kind[1]:'',kw:kind?KW(kind):0})}});
 }else{
  Object.keys(c.counts).forEach(t=>{for(let i=0;i<(+c.counts[t]||0);i++)raw.push({type:t,kind:'',kw:0})});
  kinds.forEach(k=>raw.push({type:'essay',kind:k[1],kw:KW(k)}));
  const total=raw.length;if(!total)errs.push('Chưa chọn số câu cho dạng câu hỏi nào.');
  const lc=levelCounts(c,total);if(total&&!lc.ok)errs.push(lc.msg);
  const order=diffOrder(raw);const lv=[];LEVELS.forEach(l=>{for(let i=0;i<lc.counts[l.k];i++)lv.push(l.k)});
  order.forEach((idx,k)=>{raw[idx].level=lv[k]||'nb'});
  const tp=topicsOf(c);let target;
  if(c.topicMode==='manual'&&tp.length>1){target=tp.map(t=>+c.topicQ[t]||0);const sm=target.reduce((a,b)=>a+b,0);if(sm!==total){errs.push(`Tổng số câu theo chủ đề (${sm}) khác tổng số câu của đề (${total}).`);target=lrm(total,tp.map(()=>1))}}
  else target=lrm(total,tp.map(()=>1));
  const rem=target.slice();
  order.forEach(idx=>{let bi=0,br=-Infinity;rem.forEach((r,ti)=>{const ratio=target[ti]?r/target[ti]:-1;if(ratio>br){br=ratio;bi=ti}});raw[idx].topic=tp[bi];rem[bi]--});
 }
 if(!raw.length&&!errs.length)errs.push('Chưa có câu hỏi nào trong cấu hình.');
 raw.sort((a,b)=>TYPES[a.type].o-TYPES[b.type].o);
 const sc=scaleOf(c),step=stepFor(sc,raw.length);
 const u=allocScores(raw,sc,step,c.scoreMode,c.partScores);
 raw.forEach((s,i)=>{s.id='Q'+String(i+1).padStart(2,'0');s.score=u[i]});
 return{slots:raw,errs,step,scale:sc}}
function rebalanceScores(ex){
 const qs=ex.questions,sc=ex.meta.scale,step=stepFor(sc,qs.length);ex.step=step;
 const ord=qs.slice().sort((a,b)=>TYPES[a.type].o-TYPES[b.type].o);
 const items=ord.map(q=>Object.assign({},q,{kw:q.type==='essay'?((()=>{const e=ESSAY.find(x=>x[1]===q.kind);return e&&ex.essayW&&+ex.essayW[e[0]]})()||0):0}));
 const u=allocScores(items,sc,step,ex.scoreMode||'weight',ex.partScores);ord.forEach((q,i)=>setScore(q,u[i],step))}
function rubricFrom(items,score,step){
 let it=(items||[]).map(x=>({content:str(x.content||x.text),w:Math.max(+(x.weight??x.score??1)||1,0.0001)})).filter(x=>x.content);
 if(!it.length)return[];
 const st=Math.abs(score/step-Math.round(score/step))<1e-6?step:0.05;
 const units=Math.max(1,Math.round(score/st));
 if(it.length>units){const keep=it.slice(0,units-1);const rest=it.slice(units-1);keep.push({content:rest.map(x=>x.content).join('; '),w:rest.reduce((a,b)=>a+b.w,0)});it=keep}
 const u=distUnits(units,it.map(x=>x.w));return it.map((x,i)=>({content:x.content,score:r3(u[i]*st),weight:x.w}))}
function setScore(q,score,step){q.score=score;if(q.type==='essay'&&q.rubric?.length)q.rubric=rubricFrom(q.rubric.map(r=>({content:r.content,weight:r.weight||r.score||1})),score,step||0.25)}
const sumScore=qs=>Math.round(qs.reduce((a,q)=>a+(+q.score||0),0)*1000)/1000;
function tally(qs){const byLevel={nb:0,th:0,vd:0,vdc:0},byType={};qs.forEach(q=>{byLevel[q.level]++;byType[q.type]=(byType[q.type]||0)+1});return{total:qs.length,byLevel,byType,score:sumScore(qs)}}

/* ============ 5. CHUẨN HÓA & KIỂM TRA CẤU TRÚC CÂU HỎI ============ */
const stripOpt=s=>str(s).replace(/^\s*[A-Da-d][\.\)\:]\s+/,'');
function makeRight(pairs,seedKey){const n=pairs.length;const r=mulberry(hash(seedKey));let o=shuffleArr([...Array(n).keys()],r);if(n>2&&o.every((v,i)=>v===i))o=o.slice(1).concat(o[0]);return o}
function normQ(r,slot){
 const q={id:slot.id,type:slot.type,level:slot.level,topic:slot.topic,kind:slot.kind||'',unit:str(r.knowledgeUnit||r.unit),outcome:str(r.learningOutcome||r.outcome),
  question:str(r.question),options:[],pairs:[],rightOrder:[],correctAnswer:'',explanation:str(r.explanation),rubric:[],gradingNotes:str(r.gradingNotes),
  score:slot.score,locked:false,uncertain:!!r.uncertain,uncertainNote:str(r.uncertainNote),src:'ai'};
 const ca=r.correctAnswer;
 if(q.type==='mc4'||q.type==='mcMulti'){
  q.options=(Array.isArray(r.options)?r.options:[]).slice(0,4).map(stripOpt);while(q.options.length<4)q.options.push('');
  if(q.type==='mc4'){let s=str(Array.isArray(ca)?ca[0]:ca);let L=(s.match(/^\(?([A-Da-d])\)?(?:[\.\):\s]|$)/)||[])[1];if(!L){const i=q.options.findIndex(o=>o&&o.toLowerCase()===stripOpt(s).toLowerCase());if(i>=0)L=LET[i]}q.correctAnswer=(L||'').toUpperCase()}
  else{const s=Array.isArray(ca)?ca.join(','):str(ca);q.correctAnswer=[...new Set((s.toUpperCase().match(/[A-D]/g)||[]))].sort().join(',')}
 }else if(q.type==='tf'){
  q.options=(Array.isArray(r.options)?r.options:[]).slice(0,4).map(s=>str(s).replace(/^\s*[a-dA-D][\)\.]\s*/,''));while(q.options.length<4)q.options.push('');
  const arr=Array.isArray(ca)?ca:(str(ca).match(/đúng|sai|true|false|Đ|S/gi)||[]);
  q.correctAnswer=arr.slice(0,4).map(x=>(x===true||/^(đ|đúng|true|t|d)$/i.test(String(x).trim()))?'Đ':'S').join(',');
 }else if(q.type==='match'){
  q.pairs=(Array.isArray(r.pairs)?r.pairs:[]).map(p=>({left:str(p.left),right:str(p.right)})).filter(p=>p.left&&p.right).slice(0,6);
  q.rightOrder=makeRight(q.pairs,q.id+q.question);
 }else if(q.type==='fill'||q.type==='short'){q.correctAnswer=str(ca)}
 else{q.correctAnswer=str(ca);q.rubric=rubricFrom(r.rubric,q.score,0.25)}
 return q}
const BLANK=/(…+|_{3,}|\.{4,}|\[\s*\])/;
const numLike=s=>/^[\-−+(]?\s*(\d|√|π|½|⅓|¼|¾)/.test(String(s).trim());
const words=s=>new Set(String(s).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean));
function validateQ(q){
 const e=[],w=[];
 if(q.empty){e.push('Chưa có nội dung');return{e,w}}
 if(!q.question)e.push('Thiếu nội dung câu hỏi');
 if(q.type==='mc4'||q.type==='mcMulti'){
  if(q.options.some(o=>!o))e.push('Thiếu phương án');
  const lo=q.options.map(o=>o.toLowerCase());if(new Set(lo).size<lo.length)e.push('Có phương án trùng nhau');
  if(q.type==='mc4'&&!/^[A-D]$/.test(q.correctAnswer))e.push('Đáp án không hợp lệ');
  if(q.type==='mcMulti'){if(!q.correctAnswer)e.push('Chưa có đáp án đúng');else if(q.correctAnswer.split(',').length<2)w.push('Dạng nhiều đáp án nhưng chỉ có 1 đáp án đúng')}
  const ci=q.type==='mc4'?LET.indexOf(q.correctAnswer):-1;
  if(ci>=0&&q.options[ci]){const c=q.options[ci];
   if(numLike(c)&&q.options.some(o=>o&&!numLike(o)))e.push('Phương án nhiễu khác kiểu dữ liệu với đáp án (kết quả số)');
   if(c.length>=6&&q.question.toLowerCase().includes(c.toLowerCase()))w.push('Đáp án có thể bị lộ trong câu hỏi')}
 }else if(q.type==='tf'){
  if(q.options.some(o=>!o))e.push('Thiếu mệnh đề');
  const t=q.correctAnswer.split(',').filter(Boolean);if(t.length!==4)e.push('Đáp án Đúng/Sai phải đủ 4 ý');
 }else if(q.type==='match'){
  if(q.pairs.length<3)e.push('Cần tối thiểu 3 cặp ghép nối');
  if(new Set(q.pairs.map(p=>p.right.toLowerCase())).size<q.pairs.length)e.push('Có vế phải trùng nhau');
 }else if(q.type==='fill'){
  if(!BLANK.test(q.question))w.push('Không thấy chỗ trống (……) trong câu');
  if(!q.correctAnswer)e.push('Thiếu đáp án');
 }else if(q.type==='short'){if(!q.correctAnswer)e.push('Thiếu đáp án')}
 else{if(!q.correctAnswer)e.push('Thiếu đáp án/gợi ý trả lời');if(!q.rubric?.length)e.push('Thiếu hướng dẫn chấm')}
 return{e,w}}
function blankQ(slot,reason){
 const q={id:slot.id,type:slot.type,level:slot.level,topic:slot.topic,kind:slot.kind||'',unit:'',outcome:'',question:'',options:['','','',''],pairs:[],rightOrder:[],correctAnswer:'',explanation:'',rubric:[],gradingNotes:'',score:slot.score,locked:false,uncertain:true,uncertainNote:reason,empty:true,src:'ai'};
 q.question='⚠ '+reason+' Bấm "Chỉnh sửa" để nhập câu hỏi hoặc "Tạo lại".';return q}

/* ============ 6. BIẾN THỂ MÃ ĐỀ ============ */
const NOSHUF=/(cả\s+[a-d]|tất cả|các đáp án|đáp án nào|không có|ý trên|phương án trên|\b[a-d]\s*(và|,)\s*[a-d]\b)/i;
function variantOf(code){
 const ex=S.exam;let qs=ex.questions.map(clone);const base=code===101;
 const r=mulberry(code*7919+13);
 const types=Object.keys(TYPES).sort((a,b)=>TYPES[a].o-TYPES[b].o);
 let out=[];
 types.forEach(t=>{let g=qs.filter(q=>q.type===t);if(!base&&ex.shuffleQ)g=shuffleArr(g,r);out=out.concat(g)});
 if(!base)out.forEach(q=>{
  if(q.type==='match'&&ex.shuffleO){q.rightOrder=makeRight(q.pairs,q.id+q.question+code)}
  if(!ex.shuffleO||q.locked)return;
  if(q.type==='mc4'||q.type==='mcMulti'){
   if(q.options.some(o=>NOSHUF.test(o)))return;
   const perm=shuffleArr([0,1,2,3],r);const old=q.options;q.options=perm.map(i=>old[i]);
   const cor=q.correctAnswer.split(',').filter(Boolean).map(l=>LET.indexOf(l));
   q.correctAnswer=perm.map((o,ni)=>cor.includes(o)?LET[ni]:'').filter(Boolean).join(',');
  }else if(q.type==='tf'){
   const perm=shuffleArr([0,1,2,3],r);const old=q.options,tk=q.correctAnswer.split(',');q.options=perm.map(i=>old[i]);q.correctAnswer=perm.map(i=>tk[i]).join(',');
  }});
 out.forEach((q,i)=>q.num=i+1);return out}
function ansText(q){
 if(q.empty)return'—';
 if(q.type==='mc4')return q.correctAnswer;
 if(q.type==='mcMulti')return q.correctAnswer.split(',').join(', ');
 if(q.type==='tf')return q.correctAnswer.split(',').map((t,i)=>'abcd'[i]+')-'+t).join('; ');
 if(q.type==='match')return q.pairs.map((p,i)=>(i+1)+'-'+LET[q.rightOrder.indexOf(i)]).join('; ');
 if(q.type==='essay')return 'Xem hướng dẫn';
 return q.correctAnswer}
const versionCodes=()=>Array.from({length:S.exam?S.exam.versions:1},(_,i)=>101+i);

const D4={nb:40,th:30,vd:20,vdc:10};
const TEMPLATES=[
 /* ---- mẫu chung ---- */
 {n:'THPT 2025 – 3 phần (12 TN + 4 Đ/S + 6 trả lời ngắn)',dur:'90',counts:{mc4:12,tf:4,short:6},essay:{},parts:{mc4:3,tf:4,short:3}},
 {n:'15 phút – 10 câu trắc nghiệm',dur:'15',counts:{mc4:10},essay:{},type:'Kiểm tra 15 phút'},
 {n:'45 phút – Trắc nghiệm 3đ + Tự luận 7đ',dur:'45',counts:{mc4:12},essay:{present:3},parts:{mc4:3,essay:7}},
 {n:'Giữa kỳ THCS – 16 TN + 3 tự luận',dur:'60',counts:{mc4:16},essay:{present:3},parts:{mc4:4,essay:6}},
 {n:'Tiểu học 35 phút – nhiều dạng câu',dur:'custom',cdur:35,counts:{mc4:8,fill:2,short:2},essay:{short:2}},
 {n:'Cuối kỳ 90 phút',dur:'90',counts:{mc4:20,tf:4,short:4},essay:{present:4},type:'Kiểm tra cuối kỳ'},
 /* ---- Toán ---- */
 {m:/^toán/i,L:['thpt'],n:'Toán THPT 90 phút – 12 TN + 4 Đ/S + 6 trả lời ngắn (3đ/4đ/3đ)',dur:'90',counts:{mc4:12,tf:4,short:6},essay:{},parts:{mc4:3,tf:4,short:3},lv:{nb:35,th:30,vd:25,vdc:10}},
 {m:/^toán/i,L:['thpt'],n:'Toán THPT 45 phút – 10 TN + 2 tự luận giải bài tập',dur:'45',counts:{mc4:10},essay:{solve:2},parts:{mc4:4,essay:6}},
 {m:/^toán/i,L:['thcs'],n:'Toán THCS 90 phút – 12 TN + 4 tự luận (3đ/7đ)',dur:'90',counts:{mc4:12},essay:{solve:4},parts:{mc4:3,essay:7},type:'Kiểm tra cuối kỳ'},
 {m:/^toán/i,L:['thcs'],n:'Toán THCS 45 phút – 8 TN + 3 tự luận',dur:'45',counts:{mc4:8},essay:{solve:3},parts:{mc4:2,essay:8}},
 {m:/^toán/i,L:['tieuhoc'],n:'Toán Tiểu học 40 phút – 6 TN + 2 trả lời ngắn + 2 bài toán',dur:'custom',cdur:40,counts:{mc4:6,short:2},essay:{solve:2},parts:{mc4:3,short:2,essay:5},lv:{nb:40,th:30,vd:20,vdc:10}},
 /* ---- Ngữ văn / Tiếng Việt ---- */
 {m:/ngữ văn/i,L:['thpt','thcs'],n:'Ngữ văn 90 phút – Đọc hiểu 4đ + Nghị luận xã hội 2đ + Nghị luận văn học 4đ',dur:'90',counts:{},essay:{reading:1,apply:1,write:1},parts:{essay:10},ew:{reading:4,apply:2,write:4},lv:{nb:25,th:25,vd:25,vdc:25},type:'Kiểm tra giữa kỳ'},
 {m:/ngữ văn/i,L:['thpt','thcs'],n:'Ngữ văn 45 phút – 6 TN từ vựng/ngữ pháp + Đọc hiểu + Viết đoạn',dur:'45',counts:{mc4:6},essay:{reading:1,write:1},parts:{mc4:2,essay:8},ew:{reading:4,write:4}},
 {m:/tiếng việt/i,L:['tieuhoc'],n:'Tiếng Việt Tiểu học 40 phút – Đọc hiểu + Luyện từ và câu + Viết',dur:'custom',cdur:40,counts:{mc4:5,fill:2,short:1},essay:{reading:1,write:1},parts:{mc4:2.5,fill:1.5,short:1,essay:5},ew:{reading:1,write:1},lv:{nb:40,th:30,vd:20,vdc:10}},
 /* ---- Tiếng Anh ---- */
 {m:/tiếng anh|english/i,L:['thpt'],n:'Tiếng Anh THPT 60 phút – 24 TN + 4 điền khuyết + 1 đọc hiểu + 1 viết',dur:'60',counts:{mc4:24,fill:4},essay:{reading:1,write:1},parts:{mc4:6,fill:1,essay:3},ew:{reading:1,write:1},lv:{nb:35,th:30,vd:25,vdc:10}},
 {m:/tiếng anh|english/i,L:['thcs'],n:'Tiếng Anh THCS 45 phút – 16 TN + 4 điền khuyết + 1 ghép + 1 viết',dur:'45',counts:{mc4:16,fill:4,match:1},essay:{write:1},parts:{mc4:4,fill:1.5,match:1,essay:3.5}},
 {m:/tiếng anh|english/i,L:['tieuhoc'],n:'Tiếng Anh Tiểu học 35 phút – TN + ghép + điền từ + trả lời ngắn',dur:'custom',cdur:35,counts:{mc4:8,match:2,fill:3,short:2},essay:{}},
 /* ---- Khoa học tự nhiên ---- */
 {m:/vật lí|vật lý/i,L:['thpt'],n:'Vật lí THPT 45 phút – 12 TN + 4 Đ/S + 2 trả lời ngắn (3đ/4đ/3đ)',dur:'45',counts:{mc4:12,tf:4,short:2},essay:{},parts:{mc4:3,tf:4,short:3}},
 {m:/vật lí|vật lý/i,L:['thpt','thcs'],n:'Vật lí 45 phút – 12 TN + 2 bài tập + 1 giải thích hiện tượng',dur:'45',counts:{mc4:12},essay:{solve:2,explain:1},parts:{mc4:3,essay:7}},
 {m:/hóa/i,L:['thpt'],n:'Hóa học THPT 45 phút – 12 TN + 4 Đ/S + 2 trả lời ngắn (3đ/4đ/3đ)',dur:'45',counts:{mc4:12,tf:4,short:2},essay:{},parts:{mc4:3,tf:4,short:3}},
 {m:/hóa/i,L:['thpt','thcs'],n:'Hóa học 45 phút – 12 TN + 2 bài tập + 1 giải thích',dur:'45',counts:{mc4:12},essay:{solve:2,explain:1},parts:{mc4:3,essay:7}},
 {m:/sinh/i,L:['thpt'],n:'Sinh học THPT 45 phút – 12 TN + 4 Đ/S + 2 trả lời ngắn (3đ/4đ/3đ)',dur:'45',counts:{mc4:12,tf:4,short:2},essay:{},parts:{mc4:3,tf:4,short:3}},
 {m:/sinh/i,L:['thpt','thcs'],n:'Sinh học 45 phút – 12 TN + 2 Đ/S + 2 tự luận (giải thích, vận dụng)',dur:'45',counts:{mc4:12,tf:2},essay:{explain:1,apply:1},parts:{mc4:3,tf:2,essay:5}},
 {m:/khoa học tự nhiên/i,L:['thcs'],n:'KHTN THCS 60 phút – 16 TN + 3 tự luận (giải thích, bài tập, vận dụng)',dur:'60',counts:{mc4:16},essay:{explain:1,solve:1,apply:1},parts:{mc4:4,essay:6}},
 {m:/^khoa học$/i,L:['tieuhoc'],n:'Khoa học Tiểu học 35 phút – TN + ghép + điền khuyết + câu hỏi ngắn',dur:'custom',cdur:35,counts:{mc4:8,match:1,fill:2},essay:{short:2,apply:1}},
 {m:/tự nhiên và xã hội/i,L:['tieuhoc'],n:'Tự nhiên và Xã hội 30 phút – TN + đúng/sai + ghép + điền',dur:'30',counts:{mc4:6,tf:1,match:1,fill:2},essay:{short:1}},
 /* ---- Khoa học xã hội ---- */
 {m:/lịch sử/i,L:['thpt','thcs'],n:'Lịch sử 45 phút – 12 TN + 2 Đ/S + 2 tự luận (trình bày, vận dụng)',dur:'45',counts:{mc4:12,tf:2},essay:{present:1,apply:1},parts:{mc4:3,tf:2,essay:5}},
 {m:/lịch sử/i,L:['tieuhoc'],n:'Lịch sử và Địa lí Tiểu học 35 phút – TN + ghép + điền + câu hỏi ngắn',dur:'custom',cdur:35,counts:{mc4:6,match:1,fill:2},essay:{short:2}},
 {m:/địa lí|địa lý/i,L:['thpt','thcs'],n:'Địa lí 45 phút – 12 TN + 2 Đ/S + 2 tự luận (phân tích số liệu, vận dụng)',dur:'45',counts:{mc4:12,tf:2},essay:{analyze:1,apply:1},parts:{mc4:3,tf:2,essay:5}},
 {m:/công dân|kinh tế và pháp luật/i,L:['thpt','thcs'],n:'GDCD / KT-PL 45 phút – 12 TN + 2 Đ/S + 2 tự luận (xử lí tình huống)',dur:'45',counts:{mc4:12,tf:2},essay:{apply:1,explain:1},parts:{mc4:3,tf:2,essay:5}},
 {m:/đạo đức/i,L:['tieuhoc'],n:'Đạo đức Tiểu học 30 phút – TN + đúng/sai + xử lí tình huống',dur:'30',counts:{mc4:6,tf:2},essay:{apply:2}},
 /* ---- Môn khác ---- */
 {m:/tin học/i,L:['thpt','thcs'],n:'Tin học 45 phút – 12 TN + 2 Đ/S + 1 trả lời ngắn + 1 tự luận',dur:'45',counts:{mc4:12,tf:2,short:1},essay:{solve:1},parts:{mc4:3,tf:2,short:1,essay:4}},
 {m:/công nghệ/i,L:['thpt','thcs','tieuhoc'],n:'Công nghệ 45 phút – 12 TN + 2 Đ/S + 2 tự luận (giải thích, vận dụng)',dur:'45',counts:{mc4:12,tf:2},essay:{explain:1,apply:1},parts:{mc4:3,tf:2,essay:5}},
 {m:/âm nhạc|mĩ thuật|mỹ thuật/i,n:'Âm nhạc / Mĩ thuật 15 phút – 8 TN + 1 ghép + 1 điền khuyết',dur:'15',counts:{mc4:8,match:1,fill:1},essay:{},type:'Kiểm tra 15 phút'}
];
