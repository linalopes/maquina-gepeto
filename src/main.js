// Orientation handling
function checkOrientation() {
  const overlay = document.getElementById('orientationOverlay');
  const app = document.getElementById('appContainer');

  if (window.matchMedia('(orientation: portrait)').matches) {
    overlay.classList.add('show');
    app.classList.remove('show');
  } else {
    overlay.classList.remove('show');
    app.classList.add('show');
  }
}

// Check orientation on load and resize
window.addEventListener('load', checkOrientation);
window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', checkOrientation);

// Modal utility
const modalBackdrop = document.getElementById('modalBackdrop');
const modalCard = document.getElementById('modalCard');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');

let lastFocusedElement = null;

function openModal({ title, bodyHTML }) {
  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHTML;
  modalBackdrop.classList.add('show');

  // Store the currently focused element
  lastFocusedElement = document.activeElement;

  // Focus the close button
  modalClose.focus();

  // Trap focus within the modal
  trapFocus(modalCard);
}

function closeModal() {
  modalBackdrop.classList.remove('show');

  // Restore focus to the element that opened the modal
  if (lastFocusedElement) {
    lastFocusedElement.focus();
    lastFocusedElement = null;
  }
}

function trapFocus(element) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  element.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
  });
}

// Modal event listeners
modalClose.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', function(e) {
  if (e.target === modalBackdrop) {
    closeModal();
  }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && modalBackdrop.classList.contains('show')) {
    closeModal();
  }
});

// Machine buttons functionality
function openMachine(machineNumber) {
  switch (machineNumber) {
    case 1:
      // abre a página com a biblioteca tutorial (rampa + gangorra)
      window.open('jogo.html?lib=level1', '_self');
      break;
    case 2:
      // abre a página com a biblioteca level1 (só rampa)
      window.open('jogo.html?lib=level2', '_self');
      break;
    default:
      // para as demais máquinas, apenas mostra um aviso
      openModal({
        title: `Machine ${machineNumber}`,
        bodyHTML: `<p>Esta máquina ainda não tem link definido.</p>`
      });
  }
}

// Generate machine buttons
const machinesGrid = document.getElementById('machinesGrid');
machinesGrid.innerHTML = ''; // garante que não duplique se recarregar
for (let i = 1; i <= 6; i++) {
  const button = document.createElement('button');
  button.className = 'machine-button';
  button.textContent = i;
  button.setAttribute('aria-label', `Open Machine ${i}`);
  button.addEventListener('click', () => openMachine(i));
  machinesGrid.appendChild(button);
}

// Sidebar button functionality
function openTutorial() {
  openModal({
    title: 'Tutorial',
    bodyHTML: `
      <p>Welcome to The Machine's Gepeto! This is a physics-based puzzle game where you'll help guide objects through various challenges.</p>
      <p>Use the machine buttons to select different puzzles. Each machine presents a unique challenge that requires creative thinking and understanding of physics principles.</p>
      <p>Good luck and have fun exploring the machine!</p>
      <a href="jogo.html?lib=tutorial">Tutorial</a>
    `
  });
}

function openAuthors() {
  openModal({
    title: 'Authors',
    bodyHTML: `
      <p>Created with passion and creativity by a team of developers who love physics and interactive experiences.</p>
      <p>This project combines the beauty of hand-drawn aesthetics with the precision of modern web technologies.</p>
      <p>Special thanks to the open-source community for the amazing tools and libraries that made this possible.</p>
      <a href="jogo.html?lib=level1">Level 1</a>
    `
  });
}

function openBook() {
  openModal({
    title: 'Book',
    bodyHTML: `
      <p>Welcome to the Book section! Here you'll find additional information about the game's mechanics, tips, and tricks.</p>
      <p>This section is currently under development and will contain detailed guides, level walkthroughs, and behind-the-scenes content.</p>
      <p>Check back soon for updates!</p>
    `
  });
}

// Sidebar button event listeners
document.getElementById('tutorialBtn').addEventListener('click', openTutorial);
document.getElementById('authorsBtn').addEventListener('click', openAuthors);
document.getElementById('bookBtn').addEventListener('click', openBook);

// Initialize the app
checkOrientation();
