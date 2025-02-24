export function createNavbar(currentPage) {
  const navbar = document.createElement('nav');
  navbar.className = 'navbar';

  navbar.innerHTML = `
    <div class="navbar-content">
      <a href="/" class="brand">FitPal</a>
      <button class="burger-menu" aria-label="Toggle navigation menu">
        <span class="burger-line"></span>
        <span class="burger-line"></span>
        <span class="burger-line"></span>
      </button>
    </div>
    <div class="nav-links">
      <a href="/pages/workout-logging.html" class="nav-link ${
        currentPage === 'logging' ? 'active' : ''
      }">Log Workout</a>
      <a href="/pages/workout-stats.html" class="nav-link ${
        currentPage === 'stats' ? 'active' : ''
      }">Statistics</a>
      <a href="/pages/fitness-tracking.html" class="nav-link ${
        currentPage === 'tracking' ? 'active' : ''
      }">Track Progress</a>
    </div>
  `;

  // Add burger menu functionality
  const burgerMenu = navbar.querySelector('.burger-menu');
  const navLinks = navbar.querySelector('.nav-links');

  burgerMenu.addEventListener('click', () => {
    burgerMenu.classList.toggle('active');
    navLinks.classList.toggle('active');
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!navbar.contains(e.target) && navLinks.classList.contains('active')) {
      burgerMenu.classList.remove('active');
      navLinks.classList.remove('active');
    }
  });

  // Close menu when clicking a link
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      burgerMenu.classList.remove('active');
      navLinks.classList.remove('active');
    });
  });

  return navbar;
}