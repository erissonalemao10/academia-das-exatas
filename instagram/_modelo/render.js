// Gera as imagens de um post a partir do HTML.
// Uso: NODE_PATH=$(npm root -g) node instagram/_modelo/render.js instagram/AAAA-MM-DD/nome.html
// Saída: nome-01.jpg, nome-02.jpg, ... (1080×1350, JPEG) na mesma pasta do HTML.
// Também avisa se algum bloco de texto invadir o rodapé ou a margem direita.
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const file = process.argv[2];
  if (!file) { console.error('Informe o arquivo HTML do post.'); process.exit(1); }
  const abs = path.resolve(file);
  const prefix = abs.replace(/\.html$/, '');

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  await page.goto('file://' + abs, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  const slides = page.locator('.slide');
  const n = await slides.count();
  for (let i = 0; i < n; i++) {
    await slides.nth(i).screenshot({ path: `${prefix}-${String(i + 1).padStart(2, '0')}.jpg`, type: 'jpeg', quality: 95 });
  }

  const problems = await page.evaluate(() => [...document.querySelectorAll('.slide')].flatMap((sl, i) => {
    const sr = sl.getBoundingClientRect();
    const foot = sl.querySelector('.foot').getBoundingClientRect();
    return [...sl.querySelectorAll('p,h1,h2,.card,div')]
      .filter(e => !e.closest('.foot') && !e.classList.contains('slide'))
      .filter(e => { const r = e.getBoundingClientRect(); return r.height && (r.bottom > foot.top - 8 || r.right > sr.right - 70); })
      .map(e => `slide ${i + 1}: "${e.textContent.trim().slice(0, 30)}"`);
  }));
  console.log(`${n} slides gerados em ${path.dirname(abs)}`);
  if (problems.length) console.log('ATENÇÃO, texto encostando no rodapé/margem:\n' + problems.join('\n'));
  await browser.close();
})();
