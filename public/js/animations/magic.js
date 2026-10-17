(function () {
  const gsap = window.gsap;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function random(min, max) {
    return min + Math.random() * (max - min);
  }

  function burst(x, y, amount) {
    if (!gsap || reduceMotion) {
      return;
    }

    const total = Math.min(Math.max(amount || 8, 4), 14);
    const colors = ['#ffffff', '#e8c8f4', '#a66bde', '#432052'];
    const pieces = [];

    for (let index = 0; index < total; index += 1) {
      const piece = document.createElement('span');
      piece.className = index % 3 === 0 ? 'sparkle' : 'confetti-piece';
      piece.style.left = `${x}px`;
      piece.style.top = `${y}px`;
      piece.style.background = colors[index % colors.length];
      document.body.appendChild(piece);
      pieces.push(piece);
    }

    gsap.to(pieces, {
      x: function (index) {
        return Math.cos((Math.PI * 2 * index) / total) * random(34, 110);
      },
      y: function (index) {
        return Math.sin((Math.PI * 2 * index) / total) * random(26, 90) - 30;
      },
      rotation: function () {
        return random(-160, 160);
      },
      opacity: 0,
      scale: function () {
        return random(0.6, 1.05);
      },
      duration: 0.9,
      stagger: 0.01,
      ease: 'power2.out',
      onComplete: function () {
        pieces.forEach(function (piece) {
          piece.remove();
        });
      }
    });
  }

  window.NailchemistMagic = {
    burst,
    random
  };
})();
