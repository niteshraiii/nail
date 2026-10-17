(function () {
  const gsap = window.gsap;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setProgressWithoutGsap() {
    document.querySelectorAll('.progress-bar[data-progress]').forEach(function (bar) {
      bar.style.width = `${bar.dataset.progress || 0}%`;
    });

    document.querySelectorAll('.progress-ring[data-ring]').forEach(function (ring) {
      ring.style.setProperty('--ring', Number(ring.dataset.ring || 0));
    });
  }

  if (!gsap) {
    setProgressWithoutGsap();
    return;
  }

  function initNav() {
    const shell = document.querySelector('[data-nav-shell]');
    if (shell && !reduceMotion) {
      gsap.from(shell, { y: -12, opacity: 0, duration: 0.5, ease: 'power2.out' });
    }
  }

  function initReveals() {
    const items = document.querySelectorAll('[data-reveal]');
    if (!items.length) {
      return;
    }

    if (reduceMotion || !('IntersectionObserver' in window)) {
      gsap.set(items, { opacity: 1, y: 0 });
      return;
    }

    gsap.set(items, { opacity: 0, y: 18 });

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }

          gsap.to(entry.target, {
            opacity: 1,
            y: 0,
            duration: 0.58,
            ease: 'power2.out'
          });
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.14 }
    );

    items.forEach(function (item) {
      observer.observe(item);
    });
  }

  function initButtonPress() {
    document.querySelectorAll('.btn, .nav-command, .small-action, .slot-button, .icon-button').forEach(function (button) {
      button.addEventListener('pointerdown', function () {
        if (!button.disabled && !reduceMotion) {
          gsap.to(button, { scale: 0.98, duration: 0.08, ease: 'power2.out' });
        }
      });

      button.addEventListener('pointerup', function () {
        if (!button.disabled && !reduceMotion) {
          gsap.to(button, { scale: 1, duration: 0.14, ease: 'power2.out' });
        }
      });

      button.addEventListener('pointerleave', function () {
        if (!button.disabled && !reduceMotion) {
          gsap.to(button, { scale: 1, duration: 0.14, ease: 'power2.out' });
        }
      });
    });
  }

  function initProgress() {
    document.querySelectorAll('.progress-bar[data-progress]').forEach(function (bar) {
      gsap.to(bar, {
        width: `${bar.dataset.progress || 0}%`,
        duration: reduceMotion ? 0 : 0.9,
        delay: reduceMotion ? 0 : 0.08,
        ease: 'power2.out'
      });
    });

    document.querySelectorAll('.progress-ring[data-ring]').forEach(function (ring) {
      gsap.to(ring, {
        '--ring': Number(ring.dataset.ring || 0),
        duration: reduceMotion ? 0 : 0.9,
        delay: reduceMotion ? 0 : 0.08,
        ease: 'power2.out'
      });
    });
  }

  function initCounters() {
    document.querySelectorAll('[data-count-up]').forEach(function (node) {
      const target = Number(node.dataset.countUp || 0);
      const value = { current: 0 };

      if (reduceMotion) {
        node.textContent = target.toLocaleString('en-IN');
        return;
      }

      gsap.to(value, {
        current: target,
        duration: 0.8,
        ease: 'power2.out',
        onUpdate: function () {
          node.textContent = Math.round(value.current).toLocaleString('en-IN');
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initReveals();
    initButtonPress();
    initProgress();
    initCounters();
  });
})();
