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

  /* ── Toast notification system ── */
  function showToast(text, type) {
    var existing = document.querySelector('.nu-toast');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

    var toast = document.createElement('div');
    toast.className = 'nu-toast ' + (type || 'success');
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg><span>' + text + '</span>';
    document.body.appendChild(toast);
    requestAnimationFrame(function () {
      toast.classList.add('visible');
    });
    setTimeout(function () {
      toast.classList.remove('visible');
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3800);
  }
  window.showToast = showToast;

  /* ── Copy to clipboard helper ── */
  window.copyDownloadLink = function (url, label) {
    var txt = url || window.location.href;
    var name = label || 'Download';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(function () {
        showToast(name + ' link copied to clipboard!');
      }).catch(function () {
        fallbackCopy(txt, name);
      });
    } else {
      fallbackCopy(txt, name);
    }
  };

  function fallbackCopy(text, name) {
    var temp = document.createElement('textarea');
    temp.value = text;
    temp.style.position = 'fixed';
    temp.style.opacity = '0';
    document.body.appendChild(temp);
    temp.select();
    try {
      document.execCommand('copy');
      showToast(name + ' link copied to clipboard!');
    } catch (err) {
      showToast('Could not copy link automatically.');
    }
    document.body.removeChild(temp);
  }

  document.addEventListener('DOMContentLoaded', function () {
    /* ── Theme Toggle in nav-actions ── */
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

    /* Follow the OS setting until the visitor picks one */
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var onChange = function (e) {
      var saved = null;
      try { saved = localStorage.getItem('nu-theme'); } catch (err) {}
      if (!saved) setTheme(e.matches, false);
    };
    if (mq.addEventListener) mq.addEventListener('change', onChange);

    /* ── Nav shadow after scrolling & Back-to-Top ── */
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

    /* ── Mobile Sidebar / Navigation Drawer ── */
    var mobileBtn = document.getElementById('mobileMenuBtn') || document.querySelector('.mobile-toggle');
    var mobileDrawer = document.getElementById('mobileDrawer') || document.querySelector('.mobile-drawer');

    // Create backdrop overlay if not present
    var backdrop = document.querySelector('.mobile-drawer-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'mobile-drawer-backdrop';
      backdrop.setAttribute('aria-hidden', 'true');
      document.body.appendChild(backdrop);
    }

    var hamburgerSvg = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
    var closeSvg = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

    function setMobileNav(open) {
      if (!mobileDrawer) return;
      var isOpen = !!open;
      mobileDrawer.classList.toggle('open', isOpen);
      backdrop.classList.toggle('is-active', isOpen);
      document.body.classList.toggle('nav-open', isOpen);
      if (mobileBtn) {
        mobileBtn.classList.toggle('is-active', isOpen);
        mobileBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        mobileBtn.innerHTML = isOpen ? closeSvg : hamburgerSvg;
      }
    }

    function toggleMobileNav() {
      if (!mobileDrawer) return;
      var isOpen = mobileDrawer.classList.contains('open');
      setMobileNav(!isOpen);
    }

    window.toggleMobileNav = toggleMobileNav;
    window.openMobileNav = function () { setMobileNav(true); };
    window.closeMobileNav = function () { setMobileNav(false); };

    if (mobileBtn) {
      mobileBtn.innerHTML = hamburgerSvg;
      mobileBtn.setAttribute('aria-expanded', 'false');
      mobileBtn.setAttribute('aria-controls', 'mobileDrawer');
      mobileBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        toggleMobileNav();
      });
    }

    backdrop.addEventListener('click', function () {
      setMobileNav(false);
    });

    if (mobileDrawer) {
      mobileDrawer.querySelectorAll('a, .mobile-drawer-link').forEach(function (link) {
        link.addEventListener('click', function () {
          setMobileNav(false);
        });
      });
    }

    window.addEventListener('resize', function () {
      if (window.innerWidth > 1024) {
        setMobileNav(false);
      }
    });

    /* ── Download Modal with Clear Feedback and Guidance ── */
    window.openDownloadModal = function () {
      var m = document.getElementById('downloadModal');
      if (m) {
        m.classList.add('open');
        document.body.classList.add('modal-lock');
      }
    };

    window.closeDownloadModal = function (e) {
      if (!e || e.target === document.getElementById('downloadModal') || (e.target.classList && e.target.classList.contains('modal-close')) || (e.currentTarget && e.currentTarget.classList && e.currentTarget.classList.contains('modal-close'))) {
        var m = document.getElementById('downloadModal');
        if (m) {
          m.classList.remove('open');
          document.body.classList.remove('modal-lock');
        }
      }
    };

    // Wire up download option buttons to provide live loading and step guidance
    document.querySelectorAll('.modal-option-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        var platform = btn.getAttribute('data-platform') || (btn.textContent.indexOf('Android') !== -1 ? 'Android' : 'Windows');
        var href = btn.getAttribute('href');

        var selectView = document.getElementById('modalSelectView');
        var startedView = document.getElementById('modalStartedView');

        if (selectView && startedView) {
          selectView.style.display = 'none';
          startedView.style.display = 'block';

          var titleEl = document.getElementById('startedTitle');
          var subEl = document.getElementById('startedSub');
          var stepsEl = document.getElementById('startedSteps');
          var retryBtn = document.getElementById('retryDownloadBtn');
          var copyBtn = document.getElementById('copyDownloadBtn');

          if (titleEl) titleEl.textContent = platform + ' Download Started!';
          if (subEl) subEl.textContent = 'Your file is downloading. Follow these quick steps to install Nu Age:';

          if (stepsEl) {
            if (platform === 'Android') {
              stepsEl.innerHTML =
                '<li><strong>Check your notification bar:</strong> Swipe down to watch download progress for <code>Nu Age.apk</code>.</li>' +
                '<li><strong>Allow installation:</strong> If Android warns <em>"File might be harmful"</em>, tap <strong>Download anyway</strong> (our APK is 100% verified and secure).</li>' +
                '<li><strong>Open &amp; Study:</strong> Tap the finished download to install and study completely offline.</li>';
            } else {
              stepsEl.innerHTML =
                '<li><strong>Locate installer:</strong> Find <code>NuAgeSetup.exe</code> in your Downloads folder.</li>' +
                '<li><strong>Run setup:</strong> Double-click the installer and follow the prompt to finish installation.</li>' +
                '<li><strong>Launch Nu Age:</strong> Open the desktop app to start studying with zero data needed.</li>';
            }
          }

          if (retryBtn) {
            retryBtn.onclick = function () {
              var a = document.createElement('a');
              a.href = href;
              a.setAttribute('download', '');
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              showToast('Re-triggering ' + platform + ' download...');
            };
          }

          if (copyBtn) {
            copyBtn.onclick = function () {
              copyDownloadLink(href, platform + ' Installer');
            };
          }
        }

        showToast('Starting ' + platform + ' download...', 'success');
      });
    });

    var backBtn = document.getElementById('modalBackBtn');
    if (backBtn) {
      backBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var selectView = document.getElementById('modalSelectView');
        var startedView = document.getElementById('modalStartedView');
        if (selectView && startedView) {
          startedView.style.display = 'none';
          selectView.style.display = 'block';
        }
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        setMobileNav(false);
        var m = document.getElementById('downloadModal');
        if (m) {
          m.classList.remove('open');
          document.body.classList.remove('modal-lock');
        }
      }
    });

    /* ── Staggered reveal on cards ── */
    var cardSel = '.pillar-row, .offline-flow-card, .faq-item, .stat-card, .founder-wrap';
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

    /* ── Accessible FAQ Accordion ── */
    document.querySelectorAll('.faq-btn').forEach(function (b) {
      b.setAttribute('aria-expanded', 'false');
      b.addEventListener('click', function () {
        var content = b.nextElementSibling;
        var wasOpen = content && content.style.display === 'block';

        document.querySelectorAll('.faq-content').forEach(function (c) { c.style.display = 'none'; });
        document.querySelectorAll('.faq-btn').forEach(function (x) {
          x.setAttribute('aria-expanded', 'false');
          var svg = x.querySelector('svg');
          if (svg) svg.style.transform = 'rotate(0deg)';
        });

        if (!wasOpen && content) {
          content.style.display = 'block';
          b.setAttribute('aria-expanded', 'true');
          var svg = b.querySelector('svg');
          if (svg) svg.style.transform = 'rotate(180deg)';
        }
      });
    });
  });
})();
