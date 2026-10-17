(function () {
  const gsap = window.gsap;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initLoader() {
    const loader = document.querySelector('[data-page-loader]');
    if (!loader) {
      return;
    }

    if (!gsap || reduceMotion) {
      loader.remove();
      return;
    }

    gsap.set(loader.querySelector('.loader-mark'), { y: 8, opacity: 0 });
    gsap.to(loader.querySelector('.loader-mark'), {
      y: 0,
      opacity: 1,
      duration: 0.36,
      ease: 'power2.out'
    });
    gsap.to(loader, {
      autoAlpha: 0,
      duration: 0.42,
      delay: 0.22,
      ease: 'power2.inOut',
      onComplete: function () {
        loader.remove();
      }
    });
  }

  function shouldTransition(link) {
    if (!link || link.target || link.hasAttribute('download')) {
      return false;
    }

    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return false;
    }

    const url = new URL(link.href, window.location.href);
    return url.origin === window.location.origin && url.pathname !== window.location.pathname;
  }

  function initRouteTransitions() {
    if (!gsap || reduceMotion) {
      return;
    }

    document.addEventListener('click', function (event) {
      const link = event.target.closest('a');
      if (!shouldTransition(link)) {
        return;
      }

      event.preventDefault();
      document.body.classList.add('is-transitioning');
      gsap.to('main, .site-footer', {
        opacity: 0,
        y: -8,
        duration: 0.24,
        ease: 'power2.in',
        onComplete: function () {
          window.location.href = link.href;
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initLoader();
    initRouteTransitions();
  });
})();
