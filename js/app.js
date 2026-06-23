const SAMPLE_POSTS = [
  {
    title: 'on the nature of the dark elf',
    meta_line: 'saturday · march 20 · the third watch',
    body:
      'I have been thinking about Pirotess for three days now. Not in the way you think about a character — in the way you think about a person you met once and never forgot. She exists entirely in devotion to Ashram, and the series never condescends to her for it. <em>She chose. That is the whole of it.</em><br><br>There is something in Record of Lodoss War that understands grief better than most things made after it. The animation has weight. Things that die stay dead.',
    image_url: '',
  },
  {
    title: 'rewatching serial experiments lain, layer 07',
    meta_line: 'wednesday · march 17 · past midnight',
    body:
      'Left the NAVI on all night. Not for any reason. Just for the glow. There is something about a machine that is always receiving — it feels more present than I do sometimes. <em>The Wired does not ask you to explain yourself.</em>',
    image_url: '',
  },
  {
    title: 'this layout & why i rebuilt it in the dark',
    meta_line: 'saturday · march 14 · 6:30 pm',
    body:
      'Deleted everything. Started again. The old layout was too much colour — too present, too loud. This one is closer to the inside of my head. Parchment and shadow. <em>Old things and the systems that remember them.</em>',
    image_url: '',
  },
];

const VIEW_LABELS = {
  home: 'Home · The Sanctuary',
  blog: 'Chronicle · Recent Entries',
  about: 'The Wanderer · About',
  shrine: 'Shrine · Pirotess of Marmo',
};

let lightTheme = false;

const root = document.getElementById('rootEl');
const swordCursor = document.getElementById('swordCursor');

let cursorAngle = -Math.PI / 2;
let displayAngle = -Math.PI / 2;
let targetX = 0;
let targetY = 0;
let lastCursorX = 0;
let lastCursorY = 0;
let cursorVisible = false;
let cursorHasMoved = false;
let cursorFrame = null;

function lerpAngle(from, to, amount) {
  let delta = to - from;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return from + delta * amount;
}

function angleDelta(from, to) {
  let delta = to - from;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return Math.abs(delta);
}

function renderSwordCursor() {
  if (angleDelta(displayAngle, cursorAngle) > 0.002) {
    displayAngle = lerpAngle(displayAngle, cursorAngle, 0.42);
  } else {
    displayAngle = cursorAngle;
  }

  swordCursor.style.transform =
    `translate3d(${targetX}px, ${targetY}px, 0) rotate(${displayAngle}rad)`;

  if (cursorVisible && angleDelta(displayAngle, cursorAngle) > 0.002) {
    cursorFrame = requestAnimationFrame(renderSwordCursor);
  } else {
    cursorFrame = null;
  }
}

function updateSwordCursor() {
  swordCursor.style.transform =
    `translate3d(${targetX}px, ${targetY}px, 0) rotate(${displayAngle}rad)`;

  if (!cursorFrame) {
    cursorFrame = requestAnimationFrame(renderSwordCursor);
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatBody(body) {
  return String(body || '');
}

function renderPost(post) {
  const imageBlock = post.image_url
    ? `<img class="post-image" src="${escapeHtml(post.image_url)}" alt="">`
    : '';

  return `
    <article class="blog-post">
      <h3 class="post-title">${escapeHtml(post.title)}</h3>
      <div class="post-meta">${escapeHtml(post.meta_line || '')}</div>
      ${imageBlock}
      <div class="post-body">${formatBody(post.body)}</div>
    </article>
  `;
}

function renderPosts(posts) {
  const container = document.getElementById('chronicle-posts');
  if (!container) return;

  container.innerHTML = posts.length
    ? posts.map(renderPost).join('')
    : '<p class="prose"><em>No entries yet.</em></p>';
}

async function loadChronicle() {
  const container = document.getElementById('chronicle-posts');
  if (!container) return;

  if (!window.isSanctuaryConfigured?.()) {
    renderPosts(SAMPLE_POSTS);
    return;
  }

  const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.SANCTUARY_CONFIG;

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/posts?select=title,meta_line,body,image_url,created_at&published=eq.true&order=created_at.desc`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Chronicle request failed');
    }

    const posts = await response.json();
    renderPosts(posts);
  } catch {
    container.innerHTML =
      '<p class="prose"><em>The chronicle could not be read. Showing sample entries.</em></p>';
    renderPosts(SAMPLE_POSTS);
  }
}

function initSwordCursor() {
  if (!swordCursor) return;

  document.addEventListener('mousemove', (event) => {
    const dx = event.clientX - lastCursorX;
    const dy = event.clientY - lastCursorY;
    const speed = Math.hypot(dx, dy);

    if (speed > 4) {
      cursorAngle = Math.atan2(dy, dx) + Math.PI / 2;
    }

    if (!cursorHasMoved) {
      displayAngle = cursorAngle;
      cursorHasMoved = true;
    }

    targetX = event.clientX;
    targetY = event.clientY;
    lastCursorX = event.clientX;
    lastCursorY = event.clientY;
    cursorVisible = true;
    swordCursor.style.opacity = '1';
    updateSwordCursor();
  });

  document.addEventListener('mouseleave', () => {
    cursorVisible = false;
    cursorFrame = null;
    swordCursor.style.opacity = '0';
  });

  document.addEventListener('mouseenter', () => {
    if (cursorHasMoved) {
      cursorVisible = true;
      swordCursor.style.opacity = '1';
      updateSwordCursor();
    }
  });
}

function initEffects() {
  initSwordCursor();
}

function tickClock() {
  const clock = document.getElementById('hclock');
  if (!clock) return;

  const now = new Date();
  clock.textContent = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}

function showView(id, link) {
  document.querySelectorAll('.view').forEach((view) => view.classList.remove('active'));
  const target = document.getElementById(`v-${id}`);
  if (target) target.classList.add('active');

  const label = document.getElementById('clabel');
  if (label && VIEW_LABELS[id]) label.textContent = VIEW_LABELS[id];

  document.querySelectorAll('.nav-links a, .nav-bar a').forEach((anchor) => {
    anchor.classList.remove('active');
  });

  if (link) link.classList.add('active');
}

function toggleTheme() {
  if (!root) return;
  lightTheme = !lightTheme;
  root.style.color = lightTheme ? '#c8a84a' : '#b0a080';

  const spaceBg = document.getElementById('spaceBg');
  if (spaceBg) {
    spaceBg.style.filter = lightTheme ? 'brightness(1.2) saturate(0.85)' : 'none';
  }
}

function bindNavigation() {
  document.addEventListener('click', (event) => {
    const viewLink = event.target.closest('[data-view]');
    if (viewLink) {
      event.preventDefault();
      showView(viewLink.dataset.view, viewLink);
    }
  });

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  bindNavigation();
  initEffects();
  tickClock();
  setInterval(tickClock, 1000);
  loadChronicle();
});
