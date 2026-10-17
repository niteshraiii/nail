(function () {
  const gsap = window.gsap;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!gsap) {
    return;
  }

  function initHero() {
    const hero = document.querySelector('[data-hero]');
    if (!hero || reduceMotion) {
      return;
    }

    gsap.from('.hero-kicker, .hero-title, .hero-copy, .hero-actions .btn', {
      y: 18,
      opacity: 0,
      duration: 0.72,
      stagger: 0.08,
      delay: 0.1,
      ease: 'power3.out'
    });

    gsap.from('.hero-image-composition [data-image-reveal]', {
      clipPath: 'inset(0 0 100% 0)',
      y: 18,
      opacity: 0,
      duration: 0.9,
      stagger: 0.12,
      delay: 0.18,
      ease: 'power3.out'
    });

    gsap.from('.hero-service-note, .editorial-info-strip', {
      y: 14,
      opacity: 0,
      duration: 0.64,
      stagger: 0.08,
      delay: 0.48,
      ease: 'power2.out'
    });
  }

  function initParallax() {
    if (reduceMotion) {
      return;
    }

    const layers = document.querySelectorAll('[data-parallax]');
    if (!layers.length) {
      return;
    }

    window.addEventListener(
      'scroll',
      function () {
        const scrollY = window.scrollY || 0;
        layers.forEach(function (layer) {
          const speed = Number(layer.dataset.speed || 0.04);
          gsap.set(layer, { y: scrollY * speed });
        });
      },
      { passive: true }
    );
  }

  document.addEventListener('DOMContentLoaded', function () {
    initHero();
    initParallax();
  });
})();
