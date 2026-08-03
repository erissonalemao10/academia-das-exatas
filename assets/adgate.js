// Academia das Exatas — motor compartilhado de cards + desbloqueio por vídeo
// Inclua este arquivo em qualquer página e chame AdGate.init() uma vez.
(function(){
  var AD_SRC = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
  var overlay, video, closeBtn, fileLabel, unlockMsg, finalDownload, shackle, fallbackTimer;
  var ALL_RESOURCES = [];

  var MODAL_HTML = '' +
    '<div class="modal-overlay" id="modalOverlay" role="dialog" aria-modal="true" aria-labelledby="modalTitle">' +
      '<div class="modal">' +
        '<div class="modal-head">' +
          '<h3 id="modalTitle">Assista para liberar o download</h3>' +
          '<button class="modal-close" id="modalClose" aria-label="Fechar">✕</button>' +
        '</div>' +
        '<span class="modal-sub" id="modalFileLabel">arquivo.pdf</span>' +
        '<div class="video-wrap">' +
          '<span class="video-badge">publicidade</span>' +
          '<video id="adVideo" playsinline muted autoplay></video>' +
        '</div>' +
        '<div class="unlock-row">' +
          '<svg class="unlock-icon" id="unlockIcon" viewBox="0 0 24 24" fill="none" stroke="#E8384F" stroke-width="2">' +
            '<rect x="5" y="11" width="14" height="9" rx="2"/>' +
            '<path id="shackle" d="M8 11V7a4 4 0 0 1 8 0v4"/>' +
          '</svg>' +
          '<span class="unlock-msg" id="unlockMsg">Assistindo ao vídeo… o download será liberado ao final.</span>' +
        '</div>' +
        '<a class="final-download" id="finalDownload" href="#" download>⬇ Baixar PDF agora</a>' +
      '</div>' +
    '</div>';

  function cardHTML(r){
    return '' +
      '<div class="resource-card">' +
        '<span class="file-tag">' + r.meta + '</span>' +
        '<h4>' + r.title + '</h4>' +
        '<p>' + r.desc + '</p>' +
        '<button class="download-btn" type="button" data-resource="' + r.id + '">⬇ Baixar PDF</button>' +
      '</div>';
  }

  function openModalFor(resourceId){
    var r = ALL_RESOURCES.filter(function(x){ return x.id === resourceId; })[0];
    if(!r) return;

    fileLabel.textContent = r.filename;
    unlockMsg.textContent = 'Assistindo ao vídeo… o download será liberado ao final.';
    finalDownload.classList.remove('ready');
    finalDownload.removeAttribute('href');
    finalDownload.setAttribute('aria-disabled', 'true');
    shackle.setAttribute('d', 'M8 11V7a4 4 0 0 1 8 0v4');

    video.src = AD_SRC;
    video.currentTime = 0;
    video.muted = true;
    video.play().catch(function(){});

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    clearTimeout(fallbackTimer);
    fallbackTimer = setTimeout(function(){
      if(!finalDownload.classList.contains('ready')){
        unlockDownload(r, 'Não foi possível carregar o vídeo agora — liberando o download.');
      }
    }, 9000);

    video.onended = function(){ unlockDownload(r); };
    video.onerror = function(){ unlockDownload(r, 'Não foi possível carregar o vídeo agora — liberando o download.'); };
  }

  function unlockDownload(r, customMsg){
    clearTimeout(fallbackTimer);
    unlockMsg.textContent = customMsg || 'Vídeo concluído! Seu download está liberado.';
    shackle.setAttribute('d', 'M8 11V7a4 4 0 0 1 8 0v0');
    finalDownload.href = r.file;
    finalDownload.setAttribute('download', r.filename);
    finalDownload.classList.add('ready');
    finalDownload.removeAttribute('aria-disabled');
  }

  function closeModal(){
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    video.pause();
    video.removeAttribute('src');
    video.load();
    clearTimeout(fallbackTimer);
  }

  window.AdGate = {
    /**
     * Inicializa o sistema de anúncio + download.
     * resources: array de objetos {id, title, desc, meta, filename, file}
     */
    init: function(resources){
      ALL_RESOURCES = resources || [];
      if(!document.getElementById('modalOverlay')){
        document.body.insertAdjacentHTML('beforeend', MODAL_HTML);
      }
      overlay = document.getElementById('modalOverlay');
      video = document.getElementById('adVideo');
      closeBtn = document.getElementById('modalClose');
      fileLabel = document.getElementById('modalFileLabel');
      unlockMsg = document.getElementById('unlockMsg');
      finalDownload = document.getElementById('finalDownload');
      shackle = document.getElementById('shackle');

      document.addEventListener('click', function(e){
        var btn = e.target.closest('[data-resource]');
        if(btn){ openModalFor(btn.dataset.resource); }
      });
      closeBtn.addEventListener('click', closeModal);
      overlay.addEventListener('click', function(e){ if(e.target === overlay) closeModal(); });
      document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && overlay.classList.contains('open')) closeModal(); });
    },
    cardHTML: cardHTML,
    // Permite adicionar novos recursos depois do init (ex: cards montados dinamicamente)
    registerResources: function(resources){
      ALL_RESOURCES = ALL_RESOURCES.concat(resources);
    }
  };
})();
