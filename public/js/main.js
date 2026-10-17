(function () {
  const gsap = window.gsap;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function wrapIndex(value, total) {
    return ((value % total) + total) % total;
  }

  function getShortestDistance(index, activeIndex, total) {
    let distance = index - activeIndex;
    const half = total / 2;

    if (distance > half) {
      distance -= total;
    }

    if (distance < -half) {
      distance += total;
    }

    return distance;
  }

  function getVisibleRange(width) {
    if (width >= 980) {
      return 2;
    }

    return 1;
  }

  function getGalleryPose(distance, stageWidth) {
    const abs = Math.abs(distance);
    const direction = distance < 0 ? -1 : 1;
    const isMobile = stageWidth < 640;
    const isTablet = stageWidth >= 640 && stageWidth < 980;

    if (abs === 0) {
      return {
        x: 0,
        z: isMobile ? 92 : 140,
        rotationY: 0,
        scale: 1,
        opacity: 1,
        brightness: 1,
        blur: 0,
        zIndex: 30
      };
    }

    if (abs === 1) {
      return {
        x: direction * Math.min(stageWidth * (isMobile ? 0.58 : isTablet ? 0.32 : 0.23), isMobile ? 215 : 300),
        z: isMobile ? 18 : 44,
        rotationY: direction * (isMobile ? -24 : -22),
        scale: isMobile ? 0.78 : 0.88,
        opacity: isMobile ? 0.68 : 0.82,
        brightness: 0.84,
        blur: isMobile ? 0.25 : 0,
        zIndex: 20
      };
    }

    return {
      x: direction * Math.min(stageWidth * 0.41, 500),
      z: -70,
      rotationY: direction * -34,
      scale: 0.72,
      opacity: 0.54,
      brightness: 0.72,
      blur: 0.45,
      zIndex: 10
    };
  }

  function setItemPose(item, pose, immediate) {
    const duration = immediate || reduceMotion ? 0 : 0.82;
    const filter = `brightness(${pose.brightness}) blur(${pose.blur}px)`;

    item.style.zIndex = String(pose.zIndex);

    if (gsap) {
      gsap.to(item, {
        xPercent: -50,
        yPercent: -50,
        x: pose.x,
        z: pose.z,
        rotationY: pose.rotationY,
        scale: pose.scale,
        opacity: pose.opacity,
        filter,
        duration,
        ease: 'power3.out',
        overwrite: true,
        force3D: true
      });
      return;
    }

    item.style.opacity = String(pose.opacity);
    item.style.filter = filter;
    item.style.transform = `translate(-50%, -50%) translateX(${pose.x}px) translateZ(${pose.z}px) rotateY(${pose.rotationY}deg) scale(${pose.scale})`;
  }

  function initGalleryCarousel() {
    const root = document.querySelector('[data-gallery-carousel]');
    const controls = root ? root.querySelector('[data-gallery-filters]') : null;
    const grid = root ? root.querySelector('[data-gallery-grid]') : null;
    const stage = root ? root.querySelector('[data-gallery-stage]') : null;

    if (!root || !grid || !stage) {
      return;
    }

    const items = Array.from(grid.querySelectorAll('[data-gallery-item]'));
    const previousButton = root.querySelector('[data-gallery-prev]');
    const nextButton = root.querySelector('[data-gallery-next]');
    const caption = root.querySelector('.gallery-3d-caption');
    const captionIndex = caption ? caption.querySelector('[data-gallery-index]') : null;
    const captionTitle = caption ? caption.querySelector('[data-gallery-title]') : null;
    const captionCategory = caption ? caption.querySelector('[data-gallery-category]') : null;
    let activeItems = items.slice();
    let currentIndex = 0;
    let autoTimer = null;
    let resumeTimer = null;
    let pointerStart = null;

    if (!items.length) {
      root.classList.add('is-empty');
      return;
    }

    function updateCaption(activeItem) {
      if (!activeItem) {
        return;
      }

      if (captionIndex) {
        captionIndex.textContent = String(currentIndex + 1).padStart(2, '0');
      }

      if (captionTitle) {
        captionTitle.textContent = activeItem.dataset.galleryTitle || '';
      }

      if (captionCategory) {
        captionCategory.textContent = activeItem.dataset.galleryLabel || activeItem.dataset.category || '';
      }
    }

    function render(immediate) {
      const total = activeItems.length;
      const stageWidth = stage.clientWidth || window.innerWidth;
      const range = Math.min(getVisibleRange(stageWidth), Math.max(total - 1, 0));

      items.forEach(function (item) {
        const activePosition = activeItems.indexOf(item);
        const isFiltered = activePosition === -1;

        item.classList.toggle('is-filtered', isFiltered);
        item.classList.remove('is-active', 'is-offstage');
        item.removeAttribute('aria-current');

        if (isFiltered || total === 0) {
          item.setAttribute('aria-hidden', 'true');
          item.tabIndex = -1;
          return;
        }

        const distance = getShortestDistance(activePosition, currentIndex, total);
        const isVisible = Math.abs(distance) <= range;
        const isActive = distance === 0;

        item.classList.toggle('is-active', isActive);
        item.classList.toggle('is-offstage', !isVisible);
        item.setAttribute('aria-hidden', String(!isVisible));
        item.tabIndex = isVisible ? 0 : -1;

        if (isActive) {
          item.setAttribute('aria-current', 'true');
        }

        const pose = isVisible
          ? getGalleryPose(distance, stageWidth)
          : {
              x: distance < 0 ? -stageWidth * 0.52 : stageWidth * 0.52,
              z: -180,
              rotationY: distance < 0 ? 42 : -42,
              scale: 0.58,
              opacity: 0,
              brightness: 0.62,
              blur: 0.8,
              zIndex: 0
            };

        setItemPose(item, pose, immediate);
      });

      updateCaption(activeItems[currentIndex]);
    }

    function stopAuto() {
      if (autoTimer) {
        window.clearInterval(autoTimer);
        autoTimer = null;
      }
    }

    function startAuto() {
      stopAuto();

      if (reduceMotion || activeItems.length < 2) {
        return;
      }

      autoTimer = window.setInterval(function () {
        goTo(currentIndex + 1, false);
      }, 6500);
    }

    function scheduleAutoResume() {
      window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(startAuto, 7000);
    }

    function pauseAuto(shouldResume) {
      stopAuto();
      window.clearTimeout(resumeTimer);

      if (shouldResume) {
        scheduleAutoResume();
      }
    }

    function goTo(nextIndex, userInitiated) {
      if (!activeItems.length) {
        return;
      }

      currentIndex = wrapIndex(nextIndex, activeItems.length);
      render(false);

      if (userInitiated) {
        pauseAuto(true);
      }
    }

    function goBy(offset, userInitiated) {
      goTo(currentIndex + offset, userInitiated);
    }

    function applyFilter(filter) {
      activeItems = items.filter(function (item) {
        return filter === 'all' || item.dataset.category === filter;
      });
      currentIndex = 0;
      render(true);
      pauseAuto(true);
    }

    if (controls) {
      controls.addEventListener('click', function (event) {
        const button = event.target.closest('[data-filter]');
        if (!button) {
          return;
        }

      const filter = button.dataset.filter || 'all';

      controls.querySelectorAll('[data-filter]').forEach(function (item) {
        item.classList.toggle('active', item === button);
      });

        applyFilter(filter);
      });
    }

    items.forEach(function (item) {
      item.addEventListener('click', function () {
        const itemIndex = activeItems.indexOf(item);

        if (itemIndex !== -1 && itemIndex !== currentIndex) {
          goTo(itemIndex, true);
        }
      });

      item.addEventListener('keydown', function (event) {
        if (event.key !== 'Enter' && event.key !== ' ') {
          return;
        }

        event.preventDefault();
        const itemIndex = activeItems.indexOf(item);

        if (itemIndex !== -1) {
          goTo(itemIndex, true);
        }
      });
    });

    if (previousButton) {
      previousButton.addEventListener('click', function () {
        goBy(-1, true);
      });
    }

    if (nextButton) {
      nextButton.addEventListener('click', function () {
        goBy(1, true);
      });
    }

    stage.addEventListener('pointerdown', function (event) {
      pointerStart = {
        x: event.clientX,
        y: event.clientY,
        pointerId: event.pointerId
      };
      pauseAuto(false);
    });

    stage.addEventListener('pointerup', function (event) {
      if (!pointerStart || pointerStart.pointerId !== event.pointerId) {
        scheduleAutoResume();
        return;
      }

      const deltaX = event.clientX - pointerStart.x;
      const deltaY = event.clientY - pointerStart.y;
      pointerStart = null;

      if (Math.abs(deltaX) > 42 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
        goBy(deltaX < 0 ? 1 : -1, true);
        return;
      }

      scheduleAutoResume();
    });

    stage.addEventListener('pointercancel', function () {
      pointerStart = null;
      scheduleAutoResume();
    });

    root.addEventListener('mouseenter', function () {
      pauseAuto(false);
    });

    root.addEventListener('mouseleave', function () {
      scheduleAutoResume();
    });

    root.addEventListener('focusin', function () {
      pauseAuto(false);
    });

    root.addEventListener('focusout', function () {
      scheduleAutoResume();
    });

    window.addEventListener('resize', function () {
      window.requestAnimationFrame(function () {
        render(true);
      });
    });

    render(true);
    startAuto();
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.documentElement.classList.add('is-ready');
    initGalleryCarousel();

    document.querySelectorAll('img[loading="lazy"]').forEach(function (image) {
      image.decoding = 'async';
    });
  });
})();
