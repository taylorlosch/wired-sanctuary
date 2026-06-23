const NOW_PLAYING = {
  title: 'Adesso e Fortuna — Record of Lodoss War OST',
  src: 'assets/audio/adesso-e-fortuna.mp3',
};

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function initNowPlaying() {
  const audio = document.getElementById('np-audio');
  const playBtn = document.getElementById('np-play');
  const fill = document.getElementById('np-fill');
  const bar = document.getElementById('np-bar');
  const elapsed = document.getElementById('np-elapsed');
  const duration = document.getElementById('np-duration');
  const title = document.getElementById('np-song-title');
  const status = document.getElementById('np-status');

  if (!audio || !playBtn || !fill || !bar) return;

  audio.src = NOW_PLAYING.src;
  if (title) {
    title.textContent = NOW_PLAYING.title;
    title.title = NOW_PLAYING.title;
  }

  function setPlaying(playing) {
    playBtn.textContent = playing ? '❚❚' : '▶';
    playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    playBtn.classList.toggle('np-btn--active', playing);
  }

  function setProgress() {
    const total = audio.duration;
    const current = audio.currentTime;
    const ratio = total > 0 ? current / total : 0;
    fill.style.width = `${ratio * 100}%`;
    if (elapsed) elapsed.textContent = formatTime(current);
    if (duration) duration.textContent = formatTime(total);
  }

  function setReady(ready) {
    playBtn.disabled = !ready;
    if (status) {
      status.textContent = ready ? '' : 'drop mp3 in assets/audio/';
      status.hidden = ready;
    }
  }

  playBtn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play().catch(() => {
        if (status) {
          status.textContent = 'could not play — check audio file';
          status.hidden = false;
        }
      });
    } else {
      audio.pause();
    }
  });

  audio.addEventListener('play', () => setPlaying(true));
  audio.addEventListener('pause', () => setPlaying(false));
  audio.addEventListener('ended', () => {
    setPlaying(false);
    audio.currentTime = 0;
    setProgress();
  });
  audio.addEventListener('timeupdate', setProgress);
  audio.addEventListener('loadedmetadata', () => {
    setReady(true);
    setProgress();
  });
  audio.addEventListener('canplay', () => setReady(true));

  audio.addEventListener('error', () => {
    setReady(false);
    setPlaying(false);
    if (status) {
      status.textContent = 'add adesso-e-fortuna.mp3 to assets/audio/';
      status.hidden = false;
    }
  });

  bar.addEventListener('click', (event) => {
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * audio.duration;
    setProgress();
  });

  setPlaying(false);
  setReady(false);
  setProgress();
  audio.load();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNowPlaying);
} else {
  initNowPlaying();
}
