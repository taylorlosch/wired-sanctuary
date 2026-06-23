const STAMP_PATH = 'assets/images/stamps/';

// Add your stamp filenames here (png or gif). Drop the files in assets/images/stamps/
const STAMP_FILES = [
  'stamp-1.gif',
  'stamp-2.gif',
  'stamp-3.gif',
  'stamp-5.gif',
  'stamp-6.gif',
  'stamp-7.gif',
  'stamp-9.gif',
  'stamp-10.gif',
  'stamp-11.gif',
];

function buildStampCarousel() {
  const mount = document.getElementById('stamp-carousel');
  if (!mount || !STAMP_FILES.length) return;

  const renderSet = () =>
    STAMP_FILES.map(
      (file) =>
        `<img class="stamp-carousel__img" src="${STAMP_PATH}${file}" alt="" width="80" height="80" loading="lazy">`
    ).join('');

  const duration = Math.max(18, STAMP_FILES.length * 4);

  mount.innerHTML = `
    <div class="stamp-carousel-track" style="--stamp-duration: ${duration}s">
      <div class="stamp-carousel-set">${renderSet()}</div>
      <div class="stamp-carousel-set" aria-hidden="true">${renderSet()}</div>
    </div>
  `;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', buildStampCarousel);
} else {
  buildStampCarousel();
}
