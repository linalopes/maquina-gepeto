// Cria o <header> com botões Play/Reset/Menu e injeta no topo do <body>
(function buildHeader(){
  const header = document.createElement('header');

  const title = document.createElement('div');
  title.className = 'title';
  title.innerHTML = 'Infância do GPT — <span style="color:var(--orange)">Nível 0</span> (Tutorial) • Planck.js';

  const controls = document.createElement('div');
  controls.className = 'controls';

  const btnPlay = document.createElement('button');
  btnPlay.id = 'btnPlay';
  btnPlay.className = 'btn play';
  btnPlay.innerHTML = `<img src="assets/png/play_icon.png" alt="">Play`;

  const btnReset = document.createElement('button');
  btnReset.id = 'btnReset';
  btnReset.className = 'btn reset';
  btnReset.textContent = 'Reset';

  const btnMenu = document.createElement('button');
  btnMenu.id = 'btnMenu';
  btnMenu.className = 'btn';
  btnMenu.innerHTML = `<img src="assets/png/diary_icon.png" alt="">Menu`;

  controls.append(btnPlay, btnReset, btnMenu);
  header.append(title, controls);

  // insere como primeiro elemento do body
  document.body.insertBefore(header, document.body.firstChild);
})();
