// Gera um reel (MP4 1080×1920, 30 fps, com narração) a partir do HTML.
// Uso: NODE_PATH=$(npm root -g) REEL_PY=<python com sherpa-onnx> node instagram/_modelo/render-reel.js instagram/AAAA-MM-DD/nome.html
// Saída na pasta do HTML: nome.mp4 e nome-capa.jpg. Prévias (fim de cada cena) em $REEL_PREVIEW_DIR, se definido.
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn, execFileSync } = require('child_process');
const { chromium } = require('playwright');

(async () => {
  const file = process.argv[2];
  if (!file) { console.error('Informe o arquivo HTML do reel.'); process.exit(1); }
  const abs = path.resolve(file);
  const prefix = abs.replace(/\.html$/, '');
  const name = path.basename(prefix);
  const py = process.env.REEL_PY || 'python3';
  const tts = path.join(__dirname, 'tts.py');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'reel-'));

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + abs, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  // 1. narração
  const narr = await page.evaluate(() => REEL.getNarration());
  const flat = narr.flat();
  fs.writeFileSync(path.join(tmp, 'in.json'), JSON.stringify(flat));
  execFileSync(py, [tts, 'synth', path.join(tmp, 'in.json'), path.join(tmp, 'out.json')], { stdio: 'inherit' });
  const res = JSON.parse(fs.readFileSync(path.join(tmp, 'out.json')));
  let k = 0;
  const durs = narr.map(sc => sc.map(() => res[k++].dur));

  // 2. linha do tempo e áudio
  const tl = await page.evaluate(d => REEL.setTiming(d), durs);
  const files = res.map(r => r.file);
  let idx = 0;
  const clips = tl.clips.map(c => ({ file: files[idx++], start: c.start }));
  fs.writeFileSync(path.join(tmp, 'tl.json'), JSON.stringify({ total: tl.total, clips }));
  const wav = path.join(tmp, 'voz.wav');
  execFileSync(py, [tts, 'mix', path.join(tmp, 'tl.json'), wav], { stdio: 'inherit' });

  // 3. quadros → ffmpeg
  const fps = 30, n = Math.ceil(tl.total * fps);
  const out = prefix + '.mp4';
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-', '-i', wav,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', String(fps),
    '-c:a', 'aac', '-b:a', '160k', '-ar', '44100', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const clip = { x: 0, y: 0, width: 1080, height: 1920 };
  for (let f = 0; f < n; f++) {
    await page.evaluate(t => REEL.render(t), f / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 92, clip });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 150 === 0) process.stdout.write(`\r${name}: quadro ${f}/${n}`);
  }
  ff.stdin.end();
  await new Promise((r, j) => ff.on('close', c => c === 0 ? r() : j(new Error('ffmpeg falhou: ' + c))));
  process.stdout.write('\n');

  // 4. prévias e capa
  const prev = process.env.REEL_PREVIEW_DIR;
  if (prev) {
    fs.mkdirSync(prev, { recursive: true });
    const ends = await page.evaluate(() => REEL.sceneEnds());
    for (let i = 0; i < ends.length; i++) {
      await page.evaluate(t => REEL.render(t), ends[i] - 0.6);
      await page.screenshot({ path: path.join(prev, `${name}-cena${i + 1}.jpg`), type: 'jpeg', quality: 80, clip });
    }
  }
  await page.evaluate(() => REEL.renderCover());
  await page.screenshot({ path: prefix + '-capa.jpg', type: 'jpeg', quality: 95, clip });

  const sub = narr.map((sc, i) => `cena ${i + 1}: ${sc.join(' ')}`).join('\n');
  console.log(`${name}.mp4: ${tl.total.toFixed(1)} s, ${narr.length} cenas\n${sub}`);
  await browser.close();
  fs.rmSync(tmp, { recursive: true, force: true });
})();
