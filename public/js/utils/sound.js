(function () {
  const state = {
    context: null,
    audio: {}
  };

  function makeAudio(src) {
    const audio = new Audio(src);
    audio.preload = 'auto';
    audio.volume = 0.1;
    return audio;
  }

  function getContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      return null;
    }

    if (!state.context) {
      state.context = new AudioContext();
    }

    if (state.context.state === 'suspended') {
      state.context.resume();
    }

    return state.context;
  }

  function crystalTone(frequency, delay, duration, volume) {
    const context = getContext();
    if (!context) {
      return;
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime + delay;

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.018, now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.03);
  }

  function crystalChime() {
    crystalTone(920, 0, 0.12, 0.025);
    crystalTone(1380, 0.018, 0.14, 0.018);
    crystalTone(1840, 0.04, 0.16, 0.012);
  }

  function playFile(name, fallback) {
    const audio = state.audio[name];
    if (!audio) {
      fallback();
      return;
    }

    audio.pause();
    audio.currentTime = 0;
    audio.volume = 0.1;

    const result = audio.play();
    if (result && typeof result.catch === 'function') {
      result.catch(fallback);
    }
  }

  function playClick() {
    playFile('click', crystalChime);
  }

  function shouldClickSound(target) {
    const control = target && target.closest('button, .btn, .small-action, .nav-command, .slot-button, [data-sound-click]');
    if (!control) {
      return false;
    }

    return !control.disabled && control.getAttribute('aria-disabled') !== 'true';
  }

  function initSound() {
    state.audio.click = makeAudio('/audio/click.mp3');

    document.addEventListener('click', function (event) {
      if (shouldClickSound(event.target)) {
        playClick();
      }
    });
  }

  window.NailchemistSound = {
    playClick
  };

  document.addEventListener('DOMContentLoaded', initSound);
})();
