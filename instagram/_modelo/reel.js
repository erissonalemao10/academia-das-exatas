// Motor dos reels: monta o cabeçalho, as legendas e a linha do tempo de cada cena.
// Cada <section class="cena" data-fala="..."> é narrada; a duração da cena vem do áudio.
//
// Marcação da fala (data-fala):
//   *palavras*          destaque amarelo na legenda
//   [mostra|fala]       a legenda mostra "mostra" e a voz lê "fala" (ex.: [340 m/s|trezentos e quarenta metros por segundo])
//
// Animação dos elementos de uma cena:
//   data-at="0.4"       começa 0,4 s depois do início da cena
//   data-at="s2"        começa junto com a 2ª frase da fala (aceita "s2+0.5")
//   data-anim="up"      up (padrão) · fade · pop · left · right · draw (traço SVG) · grow (cresce da esquerda) · count
//   data-dur="0.5"      duração da entrada
//   count: data-from, data-to, data-dec (casas decimais), data-pre, data-suf
//   data-fx="nome"      chama window.FX.nome(el, t, info) a cada quadro (animações contínuas)
(function(){
  const stage = document.querySelector('.reel');
  const cenas = [...stage.querySelectorAll('.cena')];
  const LEAD = 0.25, GAP = 0.32, TAIL = 0.5, FIRST_LEAD = 0.1;

  stage.insertAdjacentHTML('afterbegin',
    `<div class="r-top"><span class="r-serie">${stage.dataset.serie || 'FENÔMENOS EXPLICADOS COM IA'}</span><span class="r-ep">${stage.dataset.ep || ''}</span></div>`);
  stage.insertAdjacentHTML('beforeend',
    `<div class="r-cap"><div class="r-cap-in"></div></div><div class="r-foot"><span class="brand handle">@erisson.alemao.prof</span></div>`);
  const capEl = stage.querySelector('.r-cap-in');

  function tokenize(s){
    const out = []; let hl = false; let m;
    const re = /(\*?)\[([^|\]]+)\|([^\]]+)\](\*?)([.,!?:;]*)|(\S+)/g;
    while ((m = re.exec(s))) {
      if (m[2] !== undefined) {
        if (m[1]) hl = true;
        out.push({ shown: m[2] + m[5], spoken: m[3] + m[5], hl });
        if (m[4]) hl = false;
      } else {
        let w = m[6];
        if (w.startsWith('*')) { hl = true; w = w.slice(1); }
        const end = w.match(/^(.*?)\*([.,!?:;]*)$/);
        if (end) { w = end[1] + end[2]; out.push({ shown: w, spoken: w, hl: true }); hl = false; continue; }
        out.push({ shown: w, spoken: w, hl });
      }
    }
    return out;
  }
  function sentences(fala){
    return fala.replace(/\s+/g, ' ').trim().split(/(?<=[.!?]\*?)\s+(?=[A-ZÀ-Ú*\[])/).filter(Boolean);
  }
  // agrupa as palavras em blocos curtos de legenda
  function chunks(tokens, maxChars = 26){
    const out = []; let cur = [], len = 0;
    tokens.forEach((t, i) => {
      const L = t.shown.length;
      if (cur.length && len + 1 + L > maxChars) { out.push(cur); cur = []; len = 0; }
      cur.push(t); len += (cur.length > 1 ? 1 : 0) + L;
      if (/[.!?:;]$/.test(t.shown) && i < tokens.length - 1) { out.push(cur); cur = []; len = 0; }
      else if (/,$/.test(t.shown) && len > maxChars * 0.45 && i < tokens.length - 1) { out.push(cur); cur = []; len = 0; }
    });
    if (cur.length) out.push(cur);
    // evita bloco final com uma palavra só
    if (out.length > 1 && out[out.length - 1].length === 1 && out[out.length - 2].map(t => t.shown).join(' ').length + out[out.length - 1][0].shown.length < maxChars + 8)
      out[out.length - 2].push(out.pop()[0]);
    return out;
  }

  const S = cenas.map(c => ({
    el: c,
    sents: sentences(c.dataset.fala || '').map(s => { const tk = tokenize(s); return { tokens: tk, spoken: tk.map(t => t.spoken).join(' ') }; }),
    hold: parseFloat(c.dataset.hold || 0),
  }));

  const R = window.REEL = { fps: 30, total: 0, scenes: S };
  R.getNarration = () => S.map(s => s.sents.map(x => x.spoken));

  R.setTiming = (durs) => {
    let t = 0; const clips = [];
    S.forEach((s, i) => {
      s.start = t; t += i === 0 ? FIRST_LEAD : LEAD;
      s.sents.forEach((x, j) => {
        x.start = t; x.dur = durs[i][j]; clips.push({ scene: i, sent: j, start: t });
        const w = x.tokens.map(k => k.spoken.length + 1), W = w.reduce((a, b) => a + b, 0);
        let acc = 0, k = 0;
        x.chunks = chunks(x.tokens).map(ch => {
          const c0 = acc / W; ch.forEach(() => { acc += w[k++]; });
          return { start: x.start + x.dur * c0 - 0.06, html: ch.map(tok => tok.hl ? `<span class="ch">${tok.shown}</span>` : tok.shown).join(' ') };
        });
        t += x.dur + (j < s.sents.length - 1 ? GAP : 0);
      });
      t += TAIL + s.hold; s.end = t;
      s.anims = [...s.el.querySelectorAll('[data-at]')].map(el => {
        const a = el.dataset.at.match(/^s(\d+)([+-][\d.]+)?$/);
        if (a && !s.sents[+a[1] - 1]) throw new Error(`cena ${i + 1}: data-at="${el.dataset.at}", mas a fala tem ${s.sents.length} frase(s)`);
        const at = a ? s.sents[+a[1] - 1].start - s.start + parseFloat(a[2] || 0) : parseFloat(el.dataset.at);
        const kind = el.dataset.anim || 'up';
        const o = { el, at, kind, dur: parseFloat(el.dataset.dur || (kind === 'draw' ? 0.9 : kind === 'count' ? 1.2 : 0.45)) };
        if (kind === 'draw') {
          o.paths = (el.matches('path,line,polyline,circle,rect,ellipse,polygon') ? [el] : [...el.querySelectorAll('path,line,polyline,circle,rect,ellipse,polygon')])
            .map(p => { const L = p.getTotalLength(); p.style.strokeDasharray = L; return { p, L }; });
        }
        return o;
      });
      s.fx = [...s.el.querySelectorAll('[data-fx]')];
    });
    R.total = t;
    return { total: t, clips };
  };

  const clamp = x => Math.max(0, Math.min(1, x));
  const easeOut = x => 1 - Math.pow(1 - x, 3);
  const back = x => { const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const fmt = (v, d) => v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });

  function apply(o, lt){
    const p = clamp((lt - o.at) / o.dur), e = easeOut(p), st = o.el.style;
    switch (o.kind) {
      case 'fade': st.opacity = e; break;
      case 'up': st.opacity = e; st.transform = `translateY(${(1 - e) * 46}px)`; break;
      case 'left': st.opacity = e; st.transform = `translateX(${-(1 - e) * 70}px)`; break;
      case 'right': st.opacity = e; st.transform = `translateX(${(1 - e) * 70}px)`; break;
      case 'pop': st.opacity = clamp(p * 3); st.transform = `scale(${p <= 0 ? 0.5 : 0.5 + 0.5 * back(p)})`; break;
      case 'grow': st.transformOrigin = 'left center'; st.transform = `scaleX(${e})`; st.opacity = p > 0 ? 1 : 0; break;
      case 'draw': st.opacity = p > 0 ? 1 : 0; o.paths.forEach(({ p: el, L }) => { el.style.strokeDashoffset = L * (1 - e); }); break;
      case 'count': {
        const d = +(o.el.dataset.dec || 0), a = +(o.el.dataset.from || 0), b = +o.el.dataset.to;
        o.el.textContent = (o.el.dataset.pre || '') + fmt(a + (b - a) * e, d) + (o.el.dataset.suf || '');
        st.opacity = p > 0 ? 1 : 0; break;
      }
    }
  }

  R.render = (t, opts = {}) => {
    let cur = S.findIndex(s => t >= s.start && t < s.end);
    if (cur < 0) cur = S.length - 1;
    S.forEach((s, i) => s.el.classList.toggle('on', i === cur));
    const s = S[cur], lt = t - s.start;
    s.anims.forEach(o => apply(o, lt));
    s.fx.forEach(el => { const f = window.FX && window.FX[el.dataset.fx]; if (f) f(el, lt, { dur: s.end - s.start, scene: s }); });
    let html = '';
    if (!opts.noCaption) {
      for (const x of s.sents) for (const c of x.chunks) if (t >= c.start && t < x.start + x.dur + GAP * 0.9) html = c.html;
    }
    capEl.innerHTML = html ? `<span class="box">${html}</span>` : '';
  };

  // capa: primeira cena com todos os elementos no estado final, sem legenda
  R.renderCover = () => { stage.classList.add('capa'); R.render(S[0].end - 0.001, { noCaption: true }); };
  // quadros de conferência: fim de cada cena
  R.sceneEnds = () => S.map(s => s.end - 0.02);
})();
