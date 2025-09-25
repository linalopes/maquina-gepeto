// Cria a coluna esquerda (toolbox) vazia e insere no #toolboxMount
(function buildEmptyToolbox(){
  const mount = document.getElementById('toolboxMount');
  const box = document.createElement('div');

  // título
  const h2 = document.createElement('h2');
  h2.className = 'toolbox-title';
  h2.textContent = 'Caixa de Ferramentas';
  box.appendChild(h2);

  // container vazio onde os itens serão colocados pelo tutorial.js
  const list = document.createElement('div');
  list.id = 'toolboxList';
  box.appendChild(list);

  // Dicas
  const tips = document.createElement('p');
  tips.className = 'muted';
  tips.style.margin = '.2rem 0 0';
  tips.innerHTML = '• Arraste itens da <b>Toolbox</b> para o campo.<br>• Clique para <b>selecionar</b>; gire com <kbd>Q</kbd>/<kbd>E</kbd>; arraste para reposicionar.<br>• <b>Play</b> inicia a simulação; <b>Reset</b> recomeça.';
  box.appendChild(tips);

  mount.replaceChildren(box);
})();
