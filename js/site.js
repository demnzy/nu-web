(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Theme toggle ── */
  var sun = '<svg class="i-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var moon = '<svg class="i-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';

  function isDark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }
  function setTheme(dark, persist) {
    if (dark) document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    if (persist) { try { localStorage.setItem('nu-theme', dark ? 'dark' : 'light'); } catch (e) {} }
    var b = document.querySelector('.theme-toggle');
    if (b) b.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var actions = document.querySelector('.nav-actions');
    if (actions) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'theme-toggle';
      btn.innerHTML = moon + sun;
      btn.addEventListener('click', function () { setTheme(!isDark(), true); });
      actions.insertBefore(btn, actions.firstChild);
      setTheme(isDark(), false);
    }

    /* follow the OS setting until the visitor picks one */
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var onChange = function (e) {
      var saved = null;
      try { saved = localStorage.getItem('nu-theme'); } catch (err) {}
      if (!saved) setTheme(e.matches, false);
    };
    if (mq.addEventListener) mq.addEventListener('change', onChange);

    /* ── Nav shadow after scrolling ── */
    var nav = document.querySelector('.site-nav');
    var toTop = document.createElement('button');
    toTop.type = 'button';
    toTop.className = 'to-top';
    toTop.setAttribute('aria-label', 'Back to top');
    toTop.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
    document.body.appendChild(toTop);
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (nav) nav.classList.toggle('scrolled', y > 8);
        toTop.classList.toggle('show', y > 700);
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ── Staggered reveal on cards ── */
    var cardSel = '.stakeholder-feature-card, .pricing-card, .gallery-card, .spare-feature-card, .perk-card, .offline-flow-card, .faq-row, .download-card';
    if ('IntersectionObserver' in window && !reduce) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('rv-in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      document.querySelectorAll(cardSel).forEach(function (el) {
        var sibs = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
        el.style.setProperty('--rv-delay', Math.min(sibs, 4) * 70 + 'ms');
        el.classList.add('rv');
        io.observe(el);
      });
    }

    /* ── Count-up for stats ── */
    var nums = document.querySelectorAll('.stat-number');
    if ('IntersectionObserver' in window && !reduce) {
      var co = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          co.unobserve(en.target);
          countUp(en.target);
        });
      }, { threshold: 0.6 });
      nums.forEach(function (n) { co.observe(n); });
    }
    function countUp(el) {
      var node = null;
      el.childNodes.forEach(function (c) { if (c.nodeType === 3 && /\d/.test(c.nodeValue)) node = c; });
      if (!node) return;
      var m = node.nodeValue.match(/^(\s*)(\d+)(.*)$/s);
      if (!m) return;
      var target = parseInt(m[2], 10);
      if (target < 2) return;
      var start = null, dur = 900;
      function step(t) {
        if (start === null) start = t;
        var p = Math.min((t - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        node.nodeValue = m[1] + Math.round(target * eased) + m[3];
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    /* ── Keyboard support for the FAQ and Escape for the download modal already exist; make FAQ buttons announce state ── */
    document.querySelectorAll('.faq-btn').forEach(function (b) {
      b.setAttribute('aria-expanded', 'false');
      b.addEventListener('click', function () {
        var open = b.nextElementSibling && b.nextElementSibling.style.display === 'block';
        document.querySelectorAll('.faq-btn').forEach(function (x) { x.setAttribute('aria-expanded', 'false'); });
        b.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
  });
})();
