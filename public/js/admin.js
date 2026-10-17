(function () {
  document.querySelectorAll('form[data-confirm]').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      const message = form.dataset.confirm || 'Continue?';
      if (!window.confirm(message)) {
        event.preventDefault();
      }
    });
  });
})();
