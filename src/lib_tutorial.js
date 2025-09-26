// src/lib_tutorial.js
// ----------------------------------------------------------------------------
// Preenche a toolbox com os itens disponíveis (mantendo estrutura existente).
// Adiciona "Gangorra" (id: 'seesaw') ao lado da "Rampa".
// Dispara eventos:
//   - toolbox:start  { type: 'ramp' | 'seesaw' }
//   - toolbox:consume / toolbox:refund { type }
// ----------------------------------------------------------------------------
(function () {
  const mount = document.getElementById('toolboxMount');
  if (!mount) return;

  // Usa (ou cria) o contêiner de itens da toolbox
  let itemsContainer = document.getElementById('toolboxItems');
  if (!itemsContainer) {
    itemsContainer = document.createElement('div');
    itemsContainer.id = 'toolboxItems';
    itemsContainer.className = 'toolbox-items';
    mount.appendChild(itemsContainer);
  }

  // Limpa somente a lista de itens (não mexe na moldura/estilos)
  itemsContainer.innerHTML = '';

  // Estado local dos itens (mantenha as quantidades que preferir)
  const state = {
    ramp:   { label: 'Rampa',    count: 4, id: 'tool-ramp'   },
    seesaw: { label: 'Gangorra', count: 2, id: 'tool-seesaw' },
  };

  // SVGs inline para não criar arquivos novos
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

  function createToolEl(type, label, count, id, svg) {
    const el = document.createElement('div');
    el.className = 'tool';
    el.id = id;
    el.dataset.type = type;
    el.title = 'Clique para posicionar';

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

    el.addEventListener('click', () => {
      const item = state[type];
      if (!item || item.count <= 0) return;
      document.dispatchEvent(new CustomEvent('toolbox:start', { detail: { type } }));
    });

    return el;
  }

  // Monta a lista
  itemsContainer.appendChild(createToolEl('ramp',   state.ramp.label,   state.ramp.count,   state.ramp.id,   rampSVG));
  itemsContainer.appendChild(createToolEl('seesaw', state.seesaw.label, state.seesaw.count, state.seesaw.id, seesawSVG));

  // Mantém contadores em sincronia com o playground
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
