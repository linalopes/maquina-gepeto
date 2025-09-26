// src/toolbox_loader.js
(function () {
  // Evita carregar duas vezes se incluído por engano
  if (window.__GEPETO_TOOLBOX_LOADER__) return;
  window.__GEPETO_TOOLBOX_LOADER__ = true;

  // Mapeia chaves → arquivos
  const LIBS = {
    tutorial: 'src/lib_tutorial.js', // rampa + gangorra
    level1:   'src/lib_level1.js',   // só rampa
    level2:   'src/lib_level2.js',   // só rampa
  };

  // Lê ?lib= da querystring; se não tiver, tenta no hash (#lib=)
  function readLibFromURL() {
    const usp = new URLSearchParams(window.location.search);
    let lib = usp.get('lib');

    if (!lib && window.location.hash) {
      const h = window.location.hash.replace(/^#/, '');
      const hashParams = new URLSearchParams(h.includes('=') ? h : `lib=${h}`);
      lib = hashParams.get('lib');
    }

    lib = (lib || 'tutorial').toLowerCase();
    if (!LIBS[lib]) lib = 'tutorial';
    return lib;
  }

  // Insere um <script> dinâmico
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      // scripts dinâmicos ignoram 'defer'; mantém async padrão
      s.onload = () => resolve(src);
      s.onerror = (e) => reject(new Error(`Falha ao carregar: ${src}`));
      document.head.appendChild(s);
    });
  }

  // Carrega a biblioteca escolhida após o DOM estar pronto
  function boot() {
    const libKey = readLibFromURL();
    const libSrc = LIBS[libKey];
    // Log útil para debug
    console.info(`[toolbox_loader] carregando biblioteca: ${libKey} -> ${libSrc}`);
    loadScript(libSrc).catch(err => {
      console.error('[toolbox_loader] erro ao carregar biblioteca', err);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
