/* Runs in <head> before first paint so the page never flashes the wrong theme. */
(function () {
  try {
    var saved = localStorage.getItem('nu-theme');
    var dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) document.documentElement.setAttribute('data-theme', 'dark');
  } catch (e) {}
})();
