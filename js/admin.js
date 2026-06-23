let supabaseClient = null;

function setStatus(message, type) {
  const status = document.getElementById('admin-status');
  if (!status) return;
  status.textContent = message;
  status.className = 'admin-status';
  if (type) status.classList.add(type);
}

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  if (!window.isSanctuaryConfigured?.()) {
    throw new Error('Add your Supabase URL and anon key in js/supabase-config.js first.');
  }

  if (!window.supabase) {
    throw new Error('Supabase client failed to load.');
  }

  const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.SANCTUARY_CONFIG;
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return supabaseClient;
}

function buildMetaLine() {
  const now = new Date();
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const monthDay = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }).toLowerCase();
  const hours = now.getHours();
  const watch =
    hours >= 5 && hours < 12
      ? 'morning watch'
      : hours >= 12 && hours < 17
        ? 'afternoon watch'
        : hours >= 17 && hours < 21
          ? 'evening watch'
          : 'past midnight';

  return `${weekday} · ${monthDay} · ${watch}`;
}

function showEditor(isLoggedIn) {
  const loginSection = document.getElementById('login');
  const editorSection = document.getElementById('editor');
  if (loginSection) loginSection.hidden = isLoggedIn;
  if (editorSection) editorSection.hidden = !isLoggedIn;
}

async function checkSession() {
  try {
    const client = getSupabaseClient();
    const { data } = await client.auth.getSession();
    showEditor(Boolean(data.session));
    if (data.session) {
      setStatus('Session active. The chronicle awaits your words.', 'success');
    }
  } catch (error) {
    showEditor(false);
    setStatus(error.message, 'error');
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const email = form.email.value.trim();
  const password = form.password.value;

  try {
    const client = getSupabaseClient();
    setStatus('Opening the gate…');
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    showEditor(true);
    setStatus('Welcome back, chronicler.', 'success');
    form.reset();
  } catch (error) {
    setStatus(error.message || 'Login failed.', 'error');
  }
}

async function handleLogout() {
  try {
    const client = getSupabaseClient();
    await client.auth.signOut();
    showEditor(false);
    setStatus('You have left the admin layer.', 'success');
  } catch (error) {
    setStatus(error.message || 'Logout failed.', 'error');
  }
}

async function uploadImage(file) {
  const client = getSupabaseClient();
  const extension = file.name.split('.').pop() || 'jpg';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

  const { error } = await client.storage.from('blog-images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) throw error;

  const { data } = client.storage.from('blog-images').getPublicUrl(path);
  return data.publicUrl;
}

async function handlePublish(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const title = form.title.value.trim();
  const body = form.body.value.trim();
  const metaLine = form.meta_line.value.trim() || buildMetaLine();
  const imageInput = form.image;

  if (!title || !body) {
    setStatus('Title and body are required.', 'error');
    return;
  }

  try {
    const client = getSupabaseClient();
    setStatus('Recording entry in the chronicle…');

    let imageUrl = '';
    if (imageInput.files && imageInput.files[0]) {
      imageUrl = await uploadImage(imageInput.files[0]);
    }

    const { error } = await client.from('posts').insert({
      title,
      body,
      meta_line: metaLine,
      image_url: imageUrl,
      published: true,
    });

    if (error) throw error;

    form.reset();
    setStatus('Entry published. Refresh the homepage Chronicle tab to read it.', 'success');
  } catch (error) {
    setStatus(error.message || 'Publish failed.', 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const postForm = document.getElementById('post-form');
  const logoutButton = document.getElementById('logout-button');
  const metaField = document.getElementById('meta-line');

  if (metaField && !metaField.value) {
    metaField.placeholder = buildMetaLine();
  }

  if (loginForm) loginForm.addEventListener('submit', handleLogin);
  if (postForm) postForm.addEventListener('submit', handlePublish);
  if (logoutButton) logoutButton.addEventListener('click', handleLogout);

  checkSession();
});
