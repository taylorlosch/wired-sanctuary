const COUNTER_SESSION_KEY = 'wired-sanctuary-counted';
const COUNTER_DIGITS = 6;
const COUNTER_FALLBACK = 7741;

function formatCount(value) {
  const safe = Math.max(0, Math.floor(Number(value) || 0));
  return String(safe).padStart(COUNTER_DIGITS, '0');
}

function flashCounter(el) {
  el.classList.remove('counter-digits--tick');
  void el.offsetWidth;
  el.classList.add('counter-digits--tick');
}

function displayCount(el, value, animate) {
  const formatted = formatCount(value);
  if (animate && el.textContent !== formatted) {
    flashCounter(el);
  }
  el.textContent = formatted;
}

async function fetchVisitorCount() {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.SANCTUARY_CONFIG;
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/site_counters?id=eq.visitors&select=value`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Counter read failed');
  }

  const rows = await response.json();
  return rows[0]?.value ?? COUNTER_FALLBACK;
}

async function incrementVisitorCount() {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.SANCTUARY_CONFIG;
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_visitor_count`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  });

  if (!response.ok) {
    throw new Error('Counter increment failed');
  }

  const value = await response.json();
  return typeof value === 'number' ? value : Number(value);
}

async function initVisitorCounter() {
  const counterEl = document.getElementById('visitor-counter');
  if (!counterEl) return;

  if (!window.isSanctuaryConfigured?.()) {
    displayCount(counterEl, COUNTER_FALLBACK, false);
    return;
  }

  const alreadyCounted = sessionStorage.getItem(COUNTER_SESSION_KEY) === '1';
  let count = COUNTER_FALLBACK;

  try {
    if (alreadyCounted) {
      count = await fetchVisitorCount();
    } else {
      count = await incrementVisitorCount();
      sessionStorage.setItem(COUNTER_SESSION_KEY, '1');
    }
    displayCount(counterEl, count, !alreadyCounted);
  } catch {
    displayCount(counterEl, COUNTER_FALLBACK, false);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVisitorCounter);
} else {
  initVisitorCounter();
}
