/*
 * Kiểm thử nhanh bằng Playwright, có giả lập Anthropic API (không tốn tiền, không cần khóa thật).
 *   npm install && npx playwright install chromium && npm test
 */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');

function fakeQuestions(prompt) {
  if (prompt.includes('DANH SÁCH CÂU CẦN SOẠN')) {
    const list = JSON.parse(prompt.match(/DANH SÁCH CÂU CẦN SOẠN[^\n]*\n(\[.*\])/)[1]);
    return { questions: list.map((s, i) => {
      const r = { id: s.id, question: `Nội dung câu ${s.id} về ${s.topic} (mức ${s.level}) số ${i * 7 + 3}`, knowledgeUnit: 'Đơn vị ' + s.topic, learningOutcome: 'Vận dụng kiến thức', explanation: 'Giải thích ' + s.id };
      if (s.type === 'mc4') { r.options = [1, 2, 3, 4].map(k => `Phương án ${i + 1}-${k}`); r.correctAnswer = 'ABCD'[i % 4]; }
      if (s.type === 'tf') { r.options = [1, 2, 3, 4].map(k => `Mệnh đề ${k} của câu ${i}`); r.correctAnswer = 'Đ,S,Đ,S'; }
      if (s.type === 'short') r.correctAnswer = String(i + 10);
      if (s.type === 'essay') { r.correctAnswer = 'Gợi ý trả lời ' + s.id; r.rubric = [{ content: 'Ý 1', weight: 1 }, { content: 'Ý 2', weight: 2 }]; }
      return r;
    }) };
  }
  const ids = [...prompt.matchAll(/"id":"(Q\d+)"/g)].map(m => m[1]);
  return { results: ids.map(id => ({ id, answerCorrect: true, inScope: true, missingData: false, ambiguous: false, spellingFixes: [], note: '' })) };
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await ctx.route('https://api.anthropic.com/**', route => {
    const body = JSON.parse(route.request().postData());
    const content = body.messages[0].content;
    const prompt = content[content.length - 1].text;
    route.fulfill({ contentType: 'application/json', body: JSON.stringify({ content: [{ type: 'text', text: JSON.stringify(fakeQuestions(prompt)) }], stop_reason: 'end_turn' }) });
  });
  await ctx.route(/jszip/, route => process.env.JSZIP_PATH ? route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(process.env.JSZIP_PATH, 'utf8') }) : route.continue());
  if (process.env.OFFLINE) await ctx.route(/^https?:\/\/(?!api\.anthropic).*/, r => /jszip/.test(r.request().url()) ? r.fallback() : r.abort());
  await page.addInitScript(() => localStorage.setItem('rdk_ai_cfg', JSON.stringify({ key: 'sk-ant-test', model: 'claude-sonnet-5-5', quick: 'claude-haiku-5-5' })));
  await page.goto('file://' + path.join(ROOT, 'index.html'));

  await page.click('[data-act=setLevel][data-v=thpt]');
  await page.click('[data-act=setGrade][data-v="10"]');
  await page.click('[data-act=setSubject][data-v="Toán"]');
  await page.fill('[data-k=topic]', 'Hàm số\nPhương trình');
  await page.fill('[data-k=content]', 'Nội dung bài học thử nghiệm.');
  await page.click('[data-act=goStep][data-v="4"]');
  await page.click('#stepbody .tpl >> nth=0 >> .chip >> nth=0'); // mẫu đầu tiên theo môn
  await page.click('[data-act=generate]');
  await page.waitForSelector('.sheet .q', { timeout: 60000 });
  const n = await page.$$eval('.sheet .q', els => els.length);
  console.log('Số câu hiển thị:', n);
  if (n !== 22) throw new Error('Kỳ vọng 22 câu (mẫu Toán THPT), thực tế ' + n);

  for (const tab of ['answer', 'hdc', 'matrix', 'spec', 'omr', 'check']) {
    await page.click(`[data-act=tab][data-v=${tab}]`);
    if (!(await page.textContent('#pcontent')).trim()) throw new Error('Tab trống: ' + tab);
  }
  await page.click('[data-act=exportMenu]');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-x=docExam]')]);
  const file = await dl.path();
  const head = fs.readFileSync(file).subarray(0, 2).toString();
  console.log('Tệp xuất:', dl.suggestedFilename(), head === 'PK' ? '(docx hợp lệ)' : '(KHÔNG hợp lệ)');
  if (head !== 'PK') throw new Error('docx không hợp lệ');

  if (errors.length) throw new Error('Lỗi JS: ' + errors.join(' | '));
  console.log('✅ Smoke test đạt');
  await browser.close();
})().catch(e => { console.error('❌', e.message); process.exit(1); });
