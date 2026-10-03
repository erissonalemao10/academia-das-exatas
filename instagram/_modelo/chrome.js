// Injeta cabeçalho (eyebrow + contador) e rodapé (@handle + "arrasta") em cada .slide
(function(){
  // ícones reutilizáveis (<use href="#icon-...">), injetados só se a página não os definir
  if(!document.getElementById('icon-save')){
    document.body.insertAdjacentHTML('afterbegin', `<svg width="0" height="0" style="position:absolute"><defs>
      <g id="icon-save"><path d="M12 6 H36 V42 L24 33 L12 42 Z" fill="none" style="stroke:var(--red)" stroke-width="4" stroke-linejoin="round"/></g>
      <g id="icon-send"><path d="M6 22 L42 6 L30 42 L22 27 Z M22 27 L42 6" fill="none" style="stroke:var(--blue)" stroke-width="4" stroke-linejoin="round"/></g>
      <g id="icon-chat"><path d="M8 10 H40 V32 H22 L13 40 V32 H8 Z" fill="none" style="stroke:var(--paper)" stroke-width="4" stroke-linejoin="round"/></g>
      <g id="icon-check"><circle cx="24" cy="24" r="20" fill="none" style="stroke:var(--red)" stroke-width="4"/><path d="M14 25 L21 32 L35 17" fill="none" style="stroke:var(--red)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></g>
      <g id="icon-x"><circle cx="24" cy="24" r="20" fill="none" style="stroke:var(--paper-dim)" stroke-width="4"/><path d="M16 16 L32 32 M32 16 L16 32" fill="none" style="stroke:var(--paper-dim)" stroke-width="4.5" stroke-linecap="round"/></g>
      <g id="icon-timer"><circle cx="24" cy="27" r="17" fill="none" style="stroke:var(--paper)" stroke-width="4"/><path d="M24 27 V16 M19 5 H29" fill="none" style="stroke:var(--red)" stroke-width="4" stroke-linecap="round"/></g>
    </defs></svg>`);
  }
  const slides = document.querySelectorAll('.slide'), total = slides.length;
  const pad = n => String(n).padStart(2,'0');
  const arrow = '<svg viewBox="0 0 44 24"><path d="M2 12 H40 M30 3 L41 12 L30 21" fill="none" style="stroke:var(--red)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  slides.forEach((s, i) => {
    s.insertAdjacentHTML('afterbegin', `<div class="top"><span>${s.dataset.eyebrow||''}</span><span class="count">${pad(i+1)}/${pad(total)}</span></div>`);
    const last = i === total - 1;
    const right = last ? '<span class="swipe" style="color:var(--paper-dim)">física · matemática</span>'
                       : `<span class="swipe">${s.dataset.swipe||'arrasta'} ${arrow}</span>`;
    s.insertAdjacentHTML('beforeend', `<div class="foot"><span class="brand handle">@erisson.alemao.prof</span>${right}</div>`);
  });
})();
