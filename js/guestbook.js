const SAMPLE_GUESTBOOK = [
  {
    name: 'wanderer_of_kan',
    location: 'the wired',
    website: '',
    message: 'found this place at 3am. the layout feels like something i dreamed about in 1999. pirotess shrine when.',
    created_at: '2026-03-10T04:12:00Z',
  },
  {
    name: 'dark_elf_97',
    location: 'marmo',
    website: '',
    message: 'ashara if you are reading this: thank you for keeping old web alive. signed from a library computer.',
    created_at: '2026-03-17T19:44:00Z',
  },
  {
    name: 'lain_fan_04',
    location: 'layer 07',
    website: '',
    message: 'present day. present time. your guestbook is open and i am here. no need to shout.',
    created_at: '2026-03-21T23:01:00Z',
  },
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatGuestDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'unknown hour';

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const months = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
  ];

  const day = days[date.getDay()];
  const month = months[date.getMonth()];
  const dom = date.getDate();
  const hours = String(date.getHours()).padStart(2, '0');
  const mins = String(date.getMinutes()).padStart(2, '0');

  return `${day} · ${month} ${dom} · ${hours}:${mins}`;
}

function normalizeWebsite(url) {
  const trimmed = String(url || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function renderGuestEntry(entry) {
  const name = escapeHtml(entry.name);
  const location = entry.location ? escapeHtml(entry.location) : 'somewhere distant';
  const website = normalizeWebsite(entry.website);
  const websiteBlock = website
    ? `<a class="gb-website" href="${escapeHtml(website)}" target="_blank" rel="noopener noreferrer">${escapeHtml(website.replace(/^https?:\/\//i, ''))}</a>`
    : '';
  const metaParts = [`from ${location}`, formatGuestDate(entry.created_at)];
  if (websiteBlock) metaParts.push(websiteBlock);

  return `
    <article class="gb-entry">
      <div class="gb-entry-head">
        <span class="gb-name">${name}</span>
        <span class="gb-meta">${metaParts.join(' · ')}</span>
      </div>
      <div class="gb-message">${escapeHtml(entry.message)}</div>
    </article>
  `;
}

function renderGuestbook(entries) {
  const list = document.getElementById('guestbook-entries');
  const count = document.getElementById('guestbook-count');
  if (!list) return;

  list.innerHTML = entries.length
    ? entries.map(renderGuestEntry).join('<div class="gb-divider">— ✦ —</div>')
    : '<p class="prose"><em>No signatures yet. Be the first to leave a mark upon the scroll.</em></p>';

  if (count) {
    const label = entries.length === 1 ? 'soul has' : 'souls have';
    count.textContent = `${entries.length} ${label} signed the scroll`;
  }
}

async function fetchGuestbook() {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.SANCTUARY_CONFIG;
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/guestbook_entries?select=name,location,website,message,created_at&order=created_at.desc`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Guestbook request failed');
  }

  return response.json();
}

async function submitGuestbookEntry(payload) {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.SANCTUARY_CONFIG;
  const response = await fetch(`${SUPABASE_URL}/rest/v1/guestbook_entries`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Guestbook sign failed');
  }
}

async function loadGuestbook() {
  const status = document.getElementById('guestbook-status');
  if (status) status.textContent = 'unrolling the scroll…';

  try {
    if (!window.isSanctuaryConfigured?.()) {
      renderGuestbook(SAMPLE_GUESTBOOK);
      if (status) status.textContent = 'sample entries · connect supabase to save real signatures';
      return;
    }

    const entries = await fetchGuestbook();
    renderGuestbook(entries);
    if (status) status.textContent = entries.length ? 'the scroll remembers all' : 'awaiting the first signature';
  } catch {
    renderGuestbook(SAMPLE_GUESTBOOK);
    if (status) status.textContent = 'could not reach the archives · showing sample entries';
  }
}

function bindGuestbookForm() {
  const form = document.getElementById('guestbook-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const status = document.getElementById('guestbook-form-status');
    const submitBtn = form.querySelector('[type="submit"]');
    const formData = new FormData(form);

    const payload = {
      name: String(formData.get('name') || '').trim().slice(0, 40),
      location: String(formData.get('location') || '').trim().slice(0, 60),
      website: String(formData.get('website') || '').trim().slice(0, 200),
      message: String(formData.get('message') || '').trim().slice(0, 500),
    };

    if (!payload.name || !payload.message) {
      if (status) status.textContent = 'name and message are required, traveller.';
      return;
    }

    if (!window.isSanctuaryConfigured?.()) {
      if (status) status.textContent = 'supabase not configured — signature not saved.';
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    if (status) status.textContent = 'inscribing your words…';

    try {
      await submitGuestbookEntry(payload);
      form.reset();
      if (status) status.textContent = 'signed. thank you for visiting.';
      await loadGuestbook();
    } catch {
      if (status) status.textContent = 'the ink would not take. try again shortly.';
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

function initGuestbook() {
  bindGuestbookForm();
  loadGuestbook();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGuestbook);
} else {
  initGuestbook();
}

window.loadGuestbook = loadGuestbook;
