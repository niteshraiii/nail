(function () {
  const gsap = window.gsap;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!gsap || reduceMotion) {
    return;
  }

  function lift(selector) {
    const target = document.querySelector(selector);
    if (!target) {
      return;
    }

    gsap.fromTo(target, { y: 8 }, { y: 0, duration: 0.24, ease: 'power2.out' });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!document.querySelector('[data-booking-form]')) {
      return;
    }

    gsap.from('[data-booking-stage]', {
      y: 16,
      opacity: 0,
      duration: 0.52,
      stagger: 0.06,
      ease: 'power2.out'
    });

    document.addEventListener('nailchemist:service-selected', function () {
      lift('[data-booking-stage="service"]');
      lift('[data-booking-summary]');
    });

    document.addEventListener('nailchemist:date-selected', function () {
      lift('[data-booking-stage="date"]');
      lift('[data-booking-stage="slot"]');
    });

    document.addEventListener('nailchemist:slot-selected', function () {
      lift('[data-booking-summary]');
      gsap.fromTo('[data-booking-submit]', { scale: 0.985 }, { scale: 1, duration: 0.22, ease: 'power2.out' });
    });
  });
})();
