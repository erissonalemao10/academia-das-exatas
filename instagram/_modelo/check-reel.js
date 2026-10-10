// Confere os limites de cada cena de um reel antes de gerar o vídeo (não precisa de narração).
// Uso: NODE_PATH=$(npm root -g) node instagram/_modelo/check-reel.js instagram/AAAA-MM-DD/reel-*.html
// Avisa quando algum texto desce até a área da legenda (y > 1180) ou entra na coluna de botões do
// Instagram (x > 990 abaixo de y = 1050). Fundos de cartão e desenhos decorativos não entram na conta.
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  let problems = 0;
  for (const file of process.argv.slice(2)) {
    await page.goto('file://' + path.resolve(file), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const narr = await page.evaluate(() => REEL.getNarration());
    await page.evaluate(d => REEL.setTiming(d), narr.map(sc => sc.map(s => s.length / 14)));
    const ends = await page.evaluate(() => REEL.sceneEnds());
    for (let i = 0; i < ends.length; i++) {
      await page.evaluate(t => REEL.render(t), ends[i]);
      const out = await page.evaluate(() => {
        const res = [];
        const check = (r, label) => {
          if (!r.width || !r.height) return;
          if (r.bottom > 1180) res.push(`desce até y = ${Math.round(r.bottom)}: "${label}"`);
          else if (r.right > 990 && r.bottom > 1050) res.push(`entra nos botões (x = ${Math.round(r.right)}): "${label}"`);
        };
        const visible = el => !el.closest('[data-fx="flash"]') && [...function* () { for (let e = el; e && e.nodeType === 1; e = e.parentElement) yield e; }()].every(e => getComputedStyle(e).opacity !== '0');
        // texto: mede os glifos, não a caixa do bloco
        const walker = document.createTreeWalker(document.querySelector('.cena.on'), NodeFilter.SHOW_TEXT);
        for (let n; (n = walker.nextNode());) {
          if (!n.textContent.trim() || !visible(n.parentElement)) continue;
          const rg = document.createRange(); rg.selectNodeContents(n);
          check(rg.getBoundingClientRect(), n.textContent.trim().slice(0, 30));
        }
        return [...new Set(res)].slice(0, 3);
      });
      out.forEach(m => console.log(`${path.basename(file)} cena ${i + 1}: ${m}`));
      problems += out.length;
    }
  }
  console.log(problems ? `${problems} aviso(s).` : 'Nenhum problema de limite.');
  await browser.close();
})();
