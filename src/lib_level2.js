// src/lib_tutorial.js
(function () {
  // Evita rodar duas vezes se incluído por engano
  if (window.__GEPETO_LIB_TUTORIAL_INIT__) return;
  window.__GEPETO_LIB_TUTORIAL_INIT__ = true;

  const mount = document.getElementById('toolboxMount');
  if (!mount) return;

  // contêiner dos itens
  let itemsContainer = document.getElementById('toolboxItems');
  if (!itemsContainer) {
    itemsContainer = document.createElement('div');
    itemsContainer.id = 'toolboxItems';
    itemsContainer.className = 'toolbox-items';
    mount.appendChild(itemsContainer);
  }
  // limpa só a área de itens (mantém o “card” do toolbox.js)
  itemsContainer.innerHTML = '';

  // Estado: Rampa + Gangorra
  const state = {
    ramp:   { label: 'Rampa',    count: 4, id: 'tool-ramp'   },
    seesaw: { label: 'Gangorra', count: 2, id: 'tool-seesaw' },
  };

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

    // único handler (evita click+pointerdown duplicado)
    el.addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const item = state[type];
      if (!item || item.count <= 0) return;

      // dispara o evento que o playground entende
      document.dispatchEvent(new CustomEvent('toolbox:start', {
        detail: { type, clientX: ev.clientX, clientY: ev.clientY } // type: 'ramp' | 'seesaw'
      }));
      // move o ghost imediatamente
      document.dispatchEvent(new PointerEvent('pointermove', ev));
    });

    return el;
  }

  // adiciona os dois itens
  itemsContainer.appendChild(createTool('ramp',   state.ramp.label,   state.ramp.count,   state.ramp.id,   rampSVG));
  itemsContainer.appendChild(createTool('seesaw', state.seesaw.label, state.seesaw.count, state.seesaw.id, seesawSVG));

  // contadores sincronizados com o playground
  document.addEventListener('toolbox:consume', (e) => {
    const { type } = e.detail || {};
    if (!state[type]) return;
    state[type].count = Math.max(0, state[type].count - 1);
    const chip = document.getElementById('chip-' + type);
    if (chip) chip.textContent = 'x' + state[type].count;
  });

  document.addEventListener('toolbox:refund', (e) => {
    const { type } = e.detail || {};
    if (!state[type]) return;
    state[type].count++;
    const chip = document.getElementById('chip-' + type);
    if (chip) chip.textContent = 'x' + state[type].count;
  });
})();
