(function () {
  const form = document.querySelector('[data-booking-form]');
  if (!form) {
    return;
  }

  const dateInput = document.getElementById('appointmentDate');
  const slotGrid = document.querySelector('[data-slot-grid]');
  const selectedSlotInput = document.querySelector('[data-selected-slot]');
  const submitButton = document.querySelector('[data-booking-submit]');
  const defaultSlots = (slotGrid.dataset.defaultSlots || '').split(',').filter(Boolean);
  const summaryService = document.querySelector('[data-summary-service]');
  const summaryPrice = document.querySelector('[data-summary-price]');
  const summaryDate = document.querySelector('[data-summary-date]');
  const summarySlot = document.querySelector('[data-summary-slot]');
  const progressLine = document.querySelector('[data-booking-progress]');
  const stepOrder = ['service', 'date', 'slot', 'confirmation'];

  function formatDate(value) {
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return value || 'Choose date';
    }

    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  function setStep(step) {
    const activeIndex = Math.max(0, stepOrder.indexOf(step));

    document.querySelectorAll('[data-step-pill]').forEach(function (pill) {
      const pillIndex = stepOrder.indexOf(pill.dataset.stepPill);
      pill.classList.toggle('active', pill.dataset.stepPill === step);
      pill.classList.toggle('complete', pillIndex >= 0 && pillIndex < activeIndex);
    });

    if (progressLine) {
      const progress = activeIndex <= 0 ? 0 : (activeIndex / (stepOrder.length - 1)) * 100;
      progressLine.style.width = `${progress}%`;
    }
  }

  function resetSelection() {
    selectedSlotInput.value = '';
    submitButton.disabled = true;
    if (summarySlot) {
      summarySlot.textContent = 'Choose slot';
    }
    setStep(dateInput.value ? 'slot' : 'date');
  }

  function updateServiceSummary(option) {
    if (!option) {
      return;
    }

    if (summaryService) {
      summaryService.textContent = option.dataset.serviceLabel || 'Choose service';
    }

    if (summaryPrice) {
      summaryPrice.textContent = option.dataset.servicePrice || 'Pending';
    }

    setStep('date');
  }

  function renderSlots(slots) {
    resetSelection();
    slotGrid.innerHTML = '';

    if (!slots.length) {
      const note = document.createElement('span');
      note.className = 'slot-note';
      note.textContent = 'No slots available.';
      slotGrid.appendChild(note);
      return;
    }

    slots.forEach(function (slot) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'slot-button';
      button.dataset.soundClick = 'true';
      button.textContent = slot;
      button.addEventListener('click', function () {
        slotGrid.querySelectorAll('.slot-button').forEach(function (item) {
          item.classList.remove('active');
        });
        button.classList.add('active');
        selectedSlotInput.value = slot;
        submitButton.disabled = false;
        if (summarySlot) {
          summarySlot.textContent = slot;
        }
        setStep('confirmation');
        document.dispatchEvent(new CustomEvent('nailchemist:slot-selected', { detail: { slot } }));
      });
      slotGrid.appendChild(button);
    });

    if (window.gsap && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.gsap.from(slotGrid.querySelectorAll('.slot-button'), {
        y: 14,
        opacity: 0,
        duration: 0.42,
        stagger: 0.035,
        ease: 'power3.out'
      });
    }
  }

  async function loadSlots() {
    const date = dateInput.value;
    resetSelection();
    if (summaryDate) {
      summaryDate.textContent = formatDate(date);
    }
    slotGrid.innerHTML = '<span class="slot-note">Loading slots...</span>';

    try {
      const response = await fetch(`/booking/slots?date=${encodeURIComponent(date)}`);
      if (!response.ok) {
        throw new Error('Slot lookup failed.');
      }

      const payload = await response.json();
      renderSlots(payload.slots || []);
    } catch (error) {
      renderSlots(defaultSlots);
    }
  }

  form.querySelectorAll('input[name="service_id"]').forEach(function (input) {
    input.addEventListener('change', function () {
      updateServiceSummary(input.closest('[data-service-label]'));
      document.dispatchEvent(new CustomEvent('nailchemist:service-selected'));
    });
  });

  dateInput.addEventListener('change', function () {
    setStep('slot');
    document.dispatchEvent(new CustomEvent('nailchemist:date-selected'));
    loadSlots();
  });

  updateServiceSummary(form.querySelector('input[name="service_id"]:checked')?.closest('[data-service-label]'));
  if (summaryDate) {
    summaryDate.textContent = formatDate(dateInput.value);
  }
  loadSlots();
})();
