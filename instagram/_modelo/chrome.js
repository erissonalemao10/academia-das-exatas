// Injeta cabeçalho (eyebrow + contador) e rodapé (@handle + "arrasta") em cada .slide
(function(){
  const slides = document.querySelectorAll('.slide'), total = slides.length;
  const pad = n => String(n).padStart(2,'0');
  const arrow = '<svg viewBox="0 0 44 24"><path d="M2 12 H40 M30 3 L41 12 L30 21" fill="none" stroke="#E8384F" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  slides.forEach((s, i) => {
    s.insertAdjacentHTML('afterbegin', `<div class="top"><span>${s.dataset.eyebrow||''}</span><span class="count">${pad(i+1)}/${pad(total)}</span></div>`);
    const last = i === total - 1;
    const right = last ? '<span class="swipe" style="color:var(--paper-dim)">física · matemática</span>'
                       : `<span class="swipe">${s.dataset.swipe||'arrasta'} ${arrow}</span>`;
    s.insertAdjacentHTML('beforeend', `<div class="foot"><span class="brand handle">@erisson.alemao.prof</span>${right}</div>`);
  });
})();
