(function () {
  const gsap = window.gsap;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function createCelebration(container) {
    if (!container || !gsap || reduceMotion) {
      return;
    }

    const rect = container.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = Math.max(window.innerHeight * 0.28, rect.top + 80);

    if (window.NailchemistMagic) {
      window.NailchemistMagic.burst(x, y, 12);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    const card = document.querySelector('.reward-card[data-unlocked]');
    const stamps = document.querySelectorAll('[data-stamp-grid] .stamp.is-filled');

    if (gsap && !reduceMotion && stamps.length) {
      gsap.from(stamps, {
        scale: 0.82,
        opacity: 0,
        duration: 0.34,
        stagger: 0.035,
        delay: 0.2,
        ease: 'power2.out'
      });
    }

    if (gsap && !reduceMotion) {
      gsap.from('.membership-card', {
        y: 22,
        rotate: -4,
        opacity: 0,
        duration: 0.72,
        ease: 'power2.out'
      });
    }

    if (card && card.dataset.unlocked === 'true') {
      window.setTimeout(function () {
        createCelebration(document.querySelector('[data-celebration]'));
      }, 520);
    }
  });
})();
