// Define quantas rampas existem inicialmente
window.initialRampCount = 4;

(function addRampTool(){
  const container = document.getElementById('toolboxList');

  // Cria o item da rampa com contador
  const toolRamp = document.createElement('div');
  toolRamp.id = 'toolRamp';
  toolRamp.className = 'tool';
  toolRamp.title = 'Arraste para o campo';

  const left = document.createElement('div');
  left.style.display = 'flex';
  left.style.alignItems = 'center';
  left.style.gap = '.55rem';
  left.innerHTML = `
    <svg width="46" height="28" viewBox="0 0 46 28" aria-hidden="true">
      <path d="M2 26 L42 26 L2 6 Z" fill="#e7c8a8" stroke="#8a5a3b" stroke-width="2"/>
      <path d="M4 25 L38 25 L4 8 Z" fill="none" stroke="#8a5a3b" stroke-width="1" stroke-dasharray="4 3"/>
    </svg>
    <b>Rampa</b>
  `;
  toolRamp.appendChild(left);

  const chip = document.createElement('span');
  chip.id = 'toolRampCount';
  chip.className = 'chip';
  chip.textContent = 'x' + window.initialRampCount;
  toolRamp.appendChild(chip);

  container.appendChild(toolRamp);
})();
