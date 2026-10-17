(function () {
  const gsap = window.gsap;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!gsap) {
    return;
  }

  function random(min, max) {
    return min + Math.random() * (max - min);
  }

  function collectTargets() {
    return Array.prototype.slice.call(arguments).reduce(function (targets, item) {
      if (!item) {
        return targets;
      }

      if (item instanceof NodeList || item instanceof HTMLCollection) {
        return targets.concat(Array.from(item));
      }

      return targets.concat(item);
    }, []);
  }

  function animateCard(card) {
    const image = card.querySelector('[data-auth-image]');
    const imageNode = image && image.querySelector('img');
    const headingLines = card.querySelectorAll('[data-auth-heading] span');
    const copy = card.querySelector('.auth-copy .muted');
    const eyebrow = card.querySelector('.eyebrow');
    const formFields = card.querySelectorAll('.field');
    const actions = card.querySelectorAll('[data-auth-action]');
    const revealTargets = collectTargets(eyebrow, headingLines, copy, formFields, actions);

    if (reduceMotion) {
      gsap.set(collectTargets(card, image, imageNode, revealTargets), {
        clearProps: 'all'
      });
      return;
    }

    gsap.set(card, {
      autoAlpha: 0,
      y: 24,
      filter: 'blur(16px)'
    });
    gsap.set(image, {
      clipPath: 'inset(0 100% 0 0)'
    });
    gsap.set(imageNode, {
      scale: 1.1
    });
    gsap.set(revealTargets, {
      autoAlpha: 0,
      y: 26,
      filter: 'blur(10px)'
    });

    const timeline = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.28 })
      .to(card, {
        autoAlpha: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.82
      })
      .to(image, {
        clipPath: 'inset(0 0% 0 0)',
        duration: 0.9
      }, '-=0.54')
      .to(imageNode, {
        scale: 1.01,
        duration: 1.15
      }, '<');

    if (eyebrow) {
      timeline.to(eyebrow, {
        autoAlpha: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.52
      }, '-=0.56');
    }

    if (headingLines.length) {
      timeline.to(headingLines, {
        autoAlpha: 1,
        y: 0,
        filter: 'blur(0px)',
        stagger: 0.09,
        duration: 0.62
      }, eyebrow ? '-=0.35' : '-=0.56');
    }

    if (copy) {
      timeline.to(copy, {
        autoAlpha: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.55
      }, '-=0.28');
    }

    if (formFields.length) {
      timeline.to(formFields, {
        autoAlpha: 1,
        y: 0,
        filter: 'blur(0px)',
        stagger: 0.07,
        duration: 0.48
      }, '-=0.3');
    }

    if (actions.length) {
      timeline.to(actions, {
        autoAlpha: 1,
        y: 0,
        filter: 'blur(0px)',
        stagger: 0.07,
        duration: 0.52
      }, '-=0.3');
    }
  }

  function initImageHover(card) {
    const image = card.querySelector('[data-auth-image] img');
    if (!image || reduceMotion) {
      return;
    }

    card.addEventListener('mouseenter', function () {
      gsap.to(image, {
        scale: 1.045,
        duration: 0.7,
        ease: 'power3.out'
      });
    });

    card.addEventListener('mouseleave', function () {
      gsap.to(image, {
        scale: 1.01,
        duration: 0.85,
        ease: 'power3.out'
      });
    });
  }

  function initParticles(card) {
    const particles = card.querySelectorAll('.auth-particle');
    if (!particles.length || reduceMotion) {
      return;
    }

    particles.forEach(function (particle, index) {
      gsap.to(particle, {
        x: index % 2 ? -18 : 22,
        y: index % 2 ? 20 : -24,
        rotation: index % 2 ? -18 : 18,
        opacity: random(0.36, 0.68),
        duration: random(4.8, 7.6),
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: index * 0.24
      });
    });
  }

  function initSoftGlow() {
    if (reduceMotion) {
      return;
    }

    document.querySelectorAll('.auth-actions .btn, .admin-auth-form .btn, .admin-login-link, .center-link').forEach(function (control) {
      control.addEventListener('mouseenter', function () {
        gsap.to(control, {
          scale: 1.025,
          filter: 'drop-shadow(0 12px 28px rgba(154, 95, 255, 0.22))',
          duration: 0.24,
          ease: 'power2.out'
        });
      });

      control.addEventListener('mouseleave', function () {
        gsap.to(control, {
          scale: 1,
          filter: 'drop-shadow(0 0 0 rgba(154, 95, 255, 0))',
          duration: 0.32,
          ease: 'power2.out'
        });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-auth-card]').forEach(function (card) {
      animateCard(card);
      initImageHover(card);
      initParticles(card);
    });
    initSoftGlow();
  });
})();
