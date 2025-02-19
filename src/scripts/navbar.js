export function createNavbar(currentPage) {
  const navbar = document.createElement('nav');
  navbar.className = 'navbar';

  navbar.innerHTML = `
    <a href="/" class="brand">FitPal</a>
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

  return navbar;
}
