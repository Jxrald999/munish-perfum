// Dark mode toggler
(function() {
  'use strict';

  const STORAGE_KEY = 'munish-theme';

  function getTheme() {
    return localStorage.getItem(STORAGE_KEY) || 'light';
  }

  function setTheme(theme) {
    localStorage.setItem(STORAGE_KEY, theme);
    document.documentElement.setAttribute('data-theme', theme);
    updateButton(theme);
  }

  function updateButton(theme) {
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.textContent = theme === 'dark' ? '☀️' : '🌙';
      btn.setAttribute('aria-label', theme === 'dark' ? 'Modo claro' : 'Modo oscuro');
    });
  }

  function toggleTheme() {
    const current = getTheme();
    setTheme(current === 'dark' ? 'light' : 'dark');
  }

  // Apply saved theme on load
  document.addEventListener('DOMContentLoaded', function() {
    setTheme(getTheme());
  });

  // Listen for clicks on theme toggles
  document.addEventListener('click', function(e) {
    if (e.target.closest('.theme-toggle')) {
      toggleTheme();
    }
  });

  // Expose
  window.toggleTheme = toggleTheme;
  window.getTheme = getTheme;
})();
