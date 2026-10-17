(function () {
  const gsap = window.gsap;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ScrollTrigger = window.ScrollTrigger;

  if (!gsap) {
    return;
  }

  if (ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  function fromWithOptionalScroll(targets, vars, trigger) {
    const elements = gsap.utils.toArray(targets);
    if (!elements.length || reduceMotion) {
      return;
    }

    if (ScrollTrigger && trigger) {
      gsap.from(elements, Object.assign({}, vars, {
        scrollTrigger: {
          trigger,
          start: 'top 86%',
          once: true
        }
      }));
      return;
    }

    gsap.from(elements, vars);
  }

  function initCustomerDashboard() {
    const dashboard = document.querySelector('[data-dashboard]');
    if (!dashboard || reduceMotion) {
      return;
    }

    gsap.from(dashboard.querySelectorAll('.stat-bubble'), {
      y: 18,
      opacity: 0,
      duration: 0.54,
      stagger: 0.07,
      delay: 0.14,
      ease: 'power2.out'
    });
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (character) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[character];
    });
  }

  function setTodayBookingsEmpty(body) {
    body.innerHTML = [
      '<tr>',
      '<td colspan="4">',
      '<div class="admin-empty-state">',
      '<strong>No bookings scheduled for today.</strong>',
      '<span>The full schedule remains available in the bookings ledger.</span>',
      '<a class="small-action" href="/admin/appointments" data-nav-link>Open Bookings</a>',
      '</div>',
      '</td>',
      '</tr>'
    ].join('');
  }

  function hydrateTodayBookings(dashboard) {
    const body = dashboard.querySelector('[data-today-bookings-body]');
    if (!body || body.dataset.hasServerRows === 'true' || !window.fetch || !window.DOMParser) {
      return;
    }

    fetch('/admin/appointments', { credentials: 'same-origin' })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Unable to load appointments.');
        }
        return response.text();
      })
      .then(function (html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const todayLabel = new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
        const appointmentRows = Array.from(doc.querySelectorAll('main table tbody tr'));
        const rows = appointmentRows
          .map(function (row) {
            const cells = row.querySelectorAll('td');
            if (cells.length < 6) {
              return null;
            }

            const date = cells[2].textContent.trim();
            if (date !== todayLabel) {
              return null;
            }

            const customer = (cells[0].querySelector('strong') || cells[0]).textContent.trim();
            const service = cells[1].textContent.trim();
            const time = cells[3].textContent.trim();
            const paymentStatus = cells[4].textContent.trim();
            const visitStatus = cells[5].textContent.trim();
            const normalizedPayment = paymentStatus.toLowerCase();
            const normalizedVisit = visitStatus.toLowerCase();
            const status = normalizedVisit.includes('recorded')
              ? 'Completed'
              : normalizedPayment.includes('paid')
                ? 'Confirmed'
                : 'Pending';
            const statusClass = status === 'Confirmed' ? 'status-live' : status === 'Pending' ? 'status-warm' : 'status-muted';

            return [
              '<tr>',
              '<td>', escapeHtml(time), '</td>',
              '<td><strong>', escapeHtml(customer), '</strong></td>',
              '<td>', escapeHtml(service), '</td>',
              '<td><span class="status-pill ', statusClass, '">', status, '</span></td>',
              '</tr>'
            ].join('');
          })
          .filter(Boolean)
          .slice(0, 8);

        if (!rows.length) {
          setTodayBookingsEmpty(body);
          return;
        }

        body.innerHTML = rows.join('');
        if (!reduceMotion) {
          gsap.from(body.querySelectorAll('tr'), {
            y: 10,
            opacity: 0,
            duration: 0.34,
            stagger: 0.035,
            ease: 'power2.out'
          });
        }
      })
      .catch(function () {
        setTodayBookingsEmpty(body);
      });
  }

  function initAdminTableRows(dashboard) {
    dashboard.querySelectorAll('.admin-data-table tbody').forEach(function (body) {
      fromWithOptionalScroll(body.querySelectorAll('tr'), {
        y: 10,
        opacity: 0,
        duration: 0.34,
        stagger: 0.035,
        ease: 'power2.out'
      }, body.closest('.admin-widget'));
    });
  }

  function initAdminDashboard() {
    const dashboard = document.querySelector('[data-admin-dashboard]');
    if (!dashboard) {
      return;
    }

    hydrateTodayBookings(dashboard);

    if (reduceMotion) {
      return;
    }

    gsap.from(dashboard.querySelector('.admin-overview-header'), {
      y: 14,
      opacity: 0,
      duration: 0.48,
      ease: 'power2.out'
    });

    gsap.from(dashboard.querySelectorAll('.admin-kpi-card'), {
      y: 16,
      opacity: 0,
      duration: 0.5,
      stagger: 0.05,
      delay: 0.08,
      ease: 'power2.out'
    });

    dashboard.querySelectorAll('.admin-dashboard-section').forEach(function (section) {
      fromWithOptionalScroll(section, {
        y: 16,
        opacity: 0,
        duration: 0.48,
        ease: 'power2.out'
      }, section);
    });

    initAdminTableRows(dashboard);

    fromWithOptionalScroll(dashboard.querySelectorAll('.admin-activity-item'), {
      x: 10,
      opacity: 0,
      duration: 0.36,
      stagger: 0.05,
      ease: 'power2.out'
    }, dashboard.querySelector('.admin-activity-panel'));
  }

  document.addEventListener('DOMContentLoaded', function () {
    initCustomerDashboard();
    initAdminDashboard();
  });
})();
