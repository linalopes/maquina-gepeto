// src/lib_tutorial.js
(function () {
  // --- Singleton guard: evita registrar tudo 2x se o script for incluído novamente
  if (window.__GEPETO_LIB_TUTORIAL_INIT__) {
    console.warn('[lib_tutorial] já inicializado — ignorando segunda carga.');
    return;
  }
  window.__GEPETO_LIB_TUTORIAL_INIT__ = true;

  const mount = document.getElementById('toolboxMount');
  if (!mount) return;

  // contêiner de itens
  let itemsContainer = document.getElementById('toolboxItems');
  if (!itemsContainer) {
    itemsContainer = document.createElement('div');
    itemsContainer.id = 'toolboxItems';
    itemsContainer.className = 'toolbox-items';
    mount.appendChild(itemsContainer);
  }
  itemsContainer.innerHTML = '';

  // estado dos itens da toolbox
  const state = {
    ramp:   { label: 'Rampa',    count: 4, id: 'tool-ramp'   },
    seesaw: { label: 'Gangorra', count: 2, id: 'tool-seesaw' },
  };

  // svgs inline
  const rampSVG = `
    <svg width="46" height="28" viewBox="0 0 46 28" aria-hidden="true">
      <path d="M2 26 L42 26 L2 6 Z" fill="#e7c8a8" stroke="#8a5a3b" stroke-width="2"/>
      <path d="M4 25 L38 25 L4 8 Z" fill="none" stroke="#8a5a3b" stroke-width="1" stroke-dasharray="4 3"/>
    </svg>`;
  const seesawSVG = `
    <svg width="46" height="28" viewBox="0 0 46 28" aria-hidden="true">
      <rect x="6" y="12" width="34" height="6" rx="3" fill="#a8d1f1" stroke="#8a5a3b" stroke-width="2"/>
      <path d="M23 18 L16 26 L30 26 Z" fill="#e7c8a8" stroke="#8a5a3b" stroke-width="2"/>
      <circle cx="23" cy="18" r="2.5" fill="#8a5a3b"/>
    </svg>`;

  function createTool(type, label, count, id, svg) {
    const el = document.createElement('div');
    el.className = 'tool';
    el.id = id;
    el.dataset.type = type;
    el.title = 'Clique ou arraste para o canvas';

    const left = document.createElement('div');
    left.style.display = 'flex';
    left.style.alignItems = 'center';
    left.style.gap = '.55rem';
    left.innerHTML = `${svg}<b>${label}</b>`;

    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.id = `chip-${type}`;
    chip.textContent = `x${count}`;

    el.appendChild(left);
    el.appendChild(chip);

    // Handler ÚNICO (evita click + pointerdown em duplicidade)
    el.addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const item = state[type];
      if (!item || item.count <= 0) return;

      // Inicia o ghost já na posição do ponteiro
      document.dispatchEvent(new CustomEvent('toolbox:start', {
        detail: { type, clientX: ev.clientX, clientY: ev.clientY }
      }));

      // Atualiza imediatamente a posição do ghost
      document.dispatchEvent(new PointerEvent('pointermove', ev));
    });

    return el;
  }

  itemsContainer.appendChild(
    createTool('ramp', state.ramp.label, state.ramp.count, state.ramp.id, rampSVG)
  );
  itemsContainer.appendChild(
    createTool('seesaw', state.seesaw.label, state.seesaw.count, state.seesaw.id, seesawSVG)
  );

  // --- DEDUPE por tipo: ignora consumes duplicados que cheguem "colados"
  const lastConsumeAt = { ramp: 0, seesaw: 0 };
  const lastRefundAt  = { ramp: 0, seesaw: 0 };
  const DEDUPE_MS = 80;

  function safeDecrement(type){
    const now = performance.now();
    if (now - lastConsumeAt[type] < DEDUPE_MS) {
      // duplicata provável (duas inscrições de listener ou evento duplicado)
      return;
    }
    lastConsumeAt[type] = now;

    state[type].count = Math.max(0, state[type].count - 1);
    const chip = document.getElementById('chip-' + type);
    if (chip) chip.textContent = 'x' + state[type].count;
  }

  function safeIncrement(type){
    const now = performance.now();
    if (now - lastRefundAt[type] < DEDUPE_MS) {
      return;
    }
    lastRefundAt[type] = now;

    state[type].count++;
    const chip = document.getElementById('chip-' + type);
    if (chip) chip.textContent = 'x' + state[type].count;
  }

  // contadores sincronizados com o playground
  // OBS: com o guard acima, esses listeners serão registrados apenas uma vez.
  document.addEventListener('toolbox:consume', (e) => {
    const { type } = e.detail || {};
    if (!state[type]) return;
    safeDecrement(type);
  });

  document.addEventListener('toolbox:refund', (e) => {
    const { type } = e.detail || {};
    if (!state[type]) return;
    safeIncrement(type);
  });
})();
