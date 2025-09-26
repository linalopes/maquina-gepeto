// src/lib_tutorial.js
(function () {
  if (window.__GEPETO_LIB_TUTORIAL_INIT__) return;
  window.__GEPETO_LIB_TUTORIAL_INIT__ = true;

  const mount = document.getElementById('toolboxMount');
  if (!mount) return;

  let itemsContainer = document.getElementById('toolboxItems');
  if (!itemsContainer) {
    itemsContainer = document.createElement('div');
    itemsContainer.id = 'toolboxItems';
    itemsContainer.className = 'toolbox-items';
    mount.appendChild(itemsContainer);
  }
  itemsContainer.innerHTML = '';

  const state = {
    ramp:   { label: 'Rampa',    count: 4, id: 'tool-ramp'   },
    seesaw: { label: 'Gangorra', count: 2, id: 'tool-seesaw' },
    boost:  { label: 'Pista Turbo', count: 2, id: 'tool-boost' },
  };

  const rampSVG = `
    <svg width="46" height="28" viewBox="0 0 46 28">
      <path d="M2 26 L42 26 L2 6 Z" fill="#e7c8a8" stroke="#8a5a3b" stroke-width="2"/>
      <path d="M4 25 L38 25 L4 8 Z" fill="none" stroke="#8a5a3b" stroke-width="1" stroke-dasharray="4 3"/>
    </svg>`;

  const seesawSVG = `
    <svg width="46" height="28" viewBox="0 0 46 28">
      <rect x="6" y="12" width="34" height="6" rx="3" fill="#a8d1f1" stroke="#8a5a3b" stroke-width="2"/>
      <path d="M23 18 L16 26 L30 26 Z" fill="#e7c8a8" stroke="#8a5a3b" stroke-width="2"/>
      <circle cx="23" cy="18" r="2.5" fill="#8a5a3b"/>
    </svg>`;

  // novo ícone: boost mais grosso, cinza e seta laranja
  const boostSVG = `
    <svg width="46" height="28" viewBox="0 0 46 28">
      <rect x="3" y="5" width="40" height="18" rx="9" fill="#b6b8bf" stroke="#4a4d57" stroke-width="2"/>
      <path d="M12 14 H28" stroke="#f28c28" stroke-width="3" stroke-linecap="round"/>
      <path d="M28 9 L36 14 L28 19 Z" fill="#f28c28"/>
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

    el.addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const item = state[type];
      if (!item || item.count <= 0) return;
      document.dispatchEvent(new CustomEvent('toolbox:start', {
        detail: { type, clientX: ev.clientX, clientY: ev.clientY }
      }));
      document.dispatchEvent(new PointerEvent('pointermove', ev));
    });

    return el;
  }

  itemsContainer.appendChild(createTool('ramp',   state.ramp.label,   state.ramp.count,   state.ramp.id,   rampSVG));
  itemsContainer.appendChild(createTool('seesaw', state.seesaw.label, state.seesaw.count, state.seesaw.id, seesawSVG));
  itemsContainer.appendChild(createTool('boost',  state.boost.label,  state.boost.count,  state.boost.id,  boostSVG));

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
