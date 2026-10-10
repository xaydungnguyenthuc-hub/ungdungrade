'use strict';
/* ============ 19b. XUẤT WORD (.docx) THẬT ============ */
const XMLNS='xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
const xe=s=>String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').replace(/&/g,'&').replace(/</g,'<').replace(/>/g,'>').replace(/"/g,'"');
function runXml(r){
 if(r.br)return '<w:r><w:br/></w:r>';
 if(r.tab)return '<w:r><w:tab/></w:r>';
 const pr=(r.b?'<w:b/>':'')+(r.i?'<w:i/>':'')+(r.sz?`<w:sz w:val="${r.sz}"/>`:'');
 return String(r.t).split('\n').map((p,k)=>(k?'<w:r><w:br/></w:r>':'')+(p===''?'':`<w:r>${pr?`<w:rPr>${pr}</w:rPr>`:''}<w:t xml:space="preserve">${xe(p)}</w:t></w:r>`)).join('')}
function paraXml(runs,o={}){
 const tabs=o.tabs?`<w:tabs>${o.tabs.map(p=>`<w:tab w:val="${o.tabVal||'left'}" w:pos="${p}"/>`).join('')}</w:tabs>`:'';
 return `<w:p><w:pPr>${o.keep?'<w:keepNext/>':''}${tabs}<w:spacing w:before="${o.before||0}" w:after="${o.after??60}"/>${o.ind?`<w:ind w:left="${o.ind}"/>`:''}${o.align?`<w:jc w:val="${o.align}"/>`:''}</w:pPr>${runs}</w:p>`}
function inlineRuns(n,st,buf){
 n.childNodes.forEach(c=>{
  if(c.nodeType===3){let t=c.nodeValue;if(!st.pre)t=t.replace(/\s+/g,' ');if(t!=='')buf.push(Object.assign({t},st.b?{b:1}:{},st.i?{i:1}:{},st.sz?{sz:st.sz}:{}))}
  else if(c.nodeType===1){if(c.classList.contains('no-print'))return;const tg=c.tagName;if(tg==='BR'){buf.push({br:1});return}
   const s=Object.assign({},st);if(tg==='B'||tg==='STRONG')s.b=1;if(tg==='I'||tg==='EM')s.i=1;if(tg==='SMALL')s.sz=20;inlineRuns(c,s,buf)}})}
const INLINE=['B','I','STRONG','EM','SPAN','A','U'];
function walkBlocks(el,out,ctx){
 ctx=ctx||{};let buf=[];
 const flush=()=>{if(buf.some(r=>r.br||r.tab||(r.t&&r.t.trim()!==''))){out.push(paraXml(buf.map(r=>runXml(ctx.bold&&r.t!==undefined?Object.assign({},r,{b:1}):r)).join(''),ctx.p||{}))}buf=[]};
 el.childNodes.forEach(c=>{
  if(c.nodeType===3){let t=c.nodeValue;if(!ctx.pre)t=t.replace(/\s+/g,' ');if(t!=='')buf.push({t});return}
  if(c.nodeType!==1||c.classList.contains('no-print'))return;
  const tg=c.tagName,cl=c.classList;
  if(INLINE.includes(tg)){const s={};inlineRuns({childNodes:[c]},{pre:ctx.pre},buf);return}
  if(tg==='BR'){buf.push({br:1});return}
  flush();
  if(tg==='SMALL'){out.push(paraXml(runXml({t:c.textContent.trim(),sz:20,i:cl.contains('x')?0:1}),Object.assign({},ctx.p||{},{after:20})));return}
  if(tg==='TABLE'){out.push(tableXml(c));out.push(paraXml('',{after:60}));return}
  if(tg==='H4'||tg==='H3'||tg==='H2'){const al=c.style&&c.style.textAlign==='center'?'center':null;const b=[];inlineRuns(c,{},b);out.push(paraXml(b.map(r=>runXml(Object.assign({},r,{b:1}))).join(''),{before:160,after:80,keep:1,align:al}));return}
  if(tg==='P'){const b=[];inlineRuns(c,{},b);const al=c.style&&c.style.textAlign==='center'?'center':null;out.push(paraXml(b.map(runXml).join(''),{align:al,after:80}));return}
  if(cl.contains('exh-top')){const k=[...c.children];const b=[];inlineRuns(k[0]||{childNodes:[]},{},b);if(k[1]){b.push({tab:1});inlineRuns(k[1],{},b)}out.push(paraXml(b.map(runXml).join(''),{tabs:[9638],tabVal:'right'}));return}
  if(cl.contains('exh-title')){out.push(paraXml(runXml({t:c.textContent.trim(),b:1,sz:30}),{align:'center',before:120,after:80}));return}
  if(cl.contains('sec')){const b=[];inlineRuns(c,{},b);const main=b.filter(r=>r.sz!==20);out.push(paraXml(main.map(r=>runXml(Object.assign({},r,{b:1}))).join(''),{before:200,after:40,keep:1}));const sm=c.querySelector('small');if(sm)out.push(paraXml(runXml({t:sm.textContent.trim(),i:1,sz:22}),{after:60,keep:1}));return}
  if(cl.contains('opts')){const ops=[...c.children].map(o=>{const b=[];inlineRuns(o,{},b);return b});
   if(cl.contains('c4')){out.push(paraXml(ops.map((o,i)=>(i?runXml({tab:1}):'')+o.map(runXml).join('')).join(''),{tabs:[2400,4800,7200],ind:280}))}
   else if(cl.contains('c2')){for(let i=0;i<ops.length;i+=2)out.push(paraXml(ops[i].map(runXml).join('')+(ops[i+1]?runXml({tab:1})+ops[i+1].map(runXml).join(''):''),{tabs:[4800],ind:280,after:20}))}
   else ops.forEach(o=>out.push(paraXml(o.map(runXml).join(''),{ind:280,after:20})));return}
  if(cl.contains('stm')){const b=[];inlineRuns(c,{},b);out.push(paraXml(b.map(runXml).join(''),{ind:280,after:20}));return}
  if(cl.contains('ans')){const b=[];inlineRuns(c,{},b);out.push(paraXml(b.map(r=>runXml(Object.assign({},r,{b:1}))).join(''),{after:60}));return}
  const sub=Object.assign({},ctx);if(cl.contains('qt'))sub.pre=true;
  walkBlocks(c,out,sub);
  if(cl.contains('pb'))out.push('<w:p><w:r><w:br w:type="page"/></w:r></w:p>');
  if(cl.contains('q')&&!cl.contains('qt')){}
 });
 flush()}
function tableXml(tbl){
 const rows=[...tbl.rows];const occ=[];const lay=[];let ncol=0;const wd=[];
 rows.forEach((tr,ri)=>{occ[ri]=occ[ri]||{};let col=0;const line=[];
  const fo=()=>{while(occ[ri][col]){line.push({cont:1,span:occ[ri][col]});col+=occ[ri][col]}};
  fo();
  for(const td of tr.cells){const cs=+td.colSpan||1,rs=+td.rowSpan||1;line.push({td,cs,rs,col});
   const m=/(\d+(?:\.\d+)?)%/.exec(td.style&&td.style.width||'');if(m&&cs===1&&wd[col]==null)wd[col]=+m[1];
   for(let k=1;k<rs;k++){occ[ri+k]=occ[ri+k]||{};occ[ri+k][col]=cs}col+=cs;fo()}
  ncol=Math.max(ncol,col);lay.push(line)});
 const W=9638;const fixed=wd.reduce((a,v)=>a+(v||0),0),free=ncol-wd.filter(v=>v!=null).length;
 const colW=Array.from({length:ncol},(_,i)=>wd[i]!=null?Math.round(W*wd[i]/100):Math.round((W-W*fixed/100)/Math.max(free,1)));
 const border=tbl.classList.contains('mt')?'':'<w:tblBorders>'+['top','left','bottom','right','insideH','insideV'].map(s=>`<w:${s} w:val="single" w:sz="4" w:space="0" w:color="444444"/>`).join('')+'</w:tblBorders>';
 let x=`<w:tbl><w:tblPr><w:tblW w:w="${W}" w:type="dxa"/>${border}<w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${colW.map(w=>`<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>`;
 let c0=0;
 lay.forEach((line,ri)=>{
  x+='<w:tr>';let col=0;
  line.forEach(cell=>{
   const cs=cell.cs||cell.span||1;const idx=cell.cont?col:cell.col;const w=colW.slice(idx,idx+cs).reduce((a,b)=>a+b,0);
   let pr=`<w:tcW w:w="${w}" w:type="dxa"/>${cs>1?`<w:gridSpan w:val="${cs}"/>`:''}`;
   if(cell.cont){x+=`<w:tc><w:tcPr>${pr}<w:vMerge/></w:tcPr><w:p/></w:tc>`;col+=cs;return}
   const td=cell.td,isH=td.tagName==='TH';if(cell.rs>1)pr+='<w:vMerge w:val="restart"/>';
   if(isH)pr+='<w:shd w:val="clear" w:color="auto" w:fill="D9E2F3"/>';else if(td.parentNode.classList.contains('rowtot'))pr+='<w:shd w:val="clear" w:color="auto" w:fill="F3F6FC"/>';
   const ps=[];const cx={bold:isH||td.parentNode.classList.contains('rowtot'),pre:td.classList.contains('qt'),p:{after:20,align:(isH||td.classList.contains('c'))?'center':null}};
   walkBlocks(td,ps,cx);if(!ps.length)ps.push('<w:p/>');
   x+=`<w:tc><w:tcPr>${pr}</w:tcPr>${ps.join('')}</w:tc>`;col+=cs});
  x+='</w:tr>'});
 return x+'</w:tbl>'}
async function docxFromHtml(html){
 if(!window.JSZip)throw new Error('Không tải được thư viện tạo file Word (JSZip). Hãy dùng bản HTML rồi mở bằng Word.');
 const doc=new DOMParser().parseFromString('<body>'+html+'</body>','text/html');
 const out=[];walkBlocks(doc.body,out);
 // bỏ trang trống cuối
 while(out.length&&out[out.length-1].includes('w:type="page"'))out.pop();
 const body=out.join('')+'<w:sectPr><w:footerReference w:type="default" r:id="rId1"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr>';
 const z=new JSZip();
 z.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>');
 z.file('_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
 z.file('word/_rels/document.xml.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>');
 z.file('word/styles.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles ${XMLNS}><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman"/><w:sz w:val="26"/><w:szCs w:val="26"/><w:lang w:val="vi-VN"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="60" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>`);
 z.file('word/footer1.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr ${XMLNS}><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t xml:space="preserve">Trang </w:t></w:r><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>1</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>`);
 z.file('word/document.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${XMLNS}><w:body>${body}</w:body></w:document>`);
 return await z.generateAsync({type:'arraybuffer',compression:'DEFLATE'})}
