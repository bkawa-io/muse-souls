// The gallery reads character metadata from data/souls.json and the shared
// invitation from data/installation-template.md (generated from /INSTRUCTIONS.md).
// Neither the instructions nor individual character packs are hard-coded here.
const REPO_URL = 'https://github.com/bkawa-io/muse-souls';
const GITHUB_SOULS = `${REPO_URL}/tree/main/souls`;
const GITHUB_FILES = `${REPO_URL}/blob/main/souls`;
const RAW_SOULS = 'https://raw.githubusercontent.com/bkawa-io/muse-souls/main/souls';

const $ = (selector) => document.querySelector(selector);
const grid = $('#souls');
const dialog = $('#soul-dialog');
const detailView = $('#dialog-detail-view');
const choiceView = $('#dialog-choice-view');
const dialogArt = $('#dialog-art');
const artFallback = $('#dialog-art-fallback');
const copyButton = $('#copy-invitation');
const promptField = $('#invitation-prompt');
const copyStatus = $('#copy-status');
const toast = $('#toast');

let souls = [];
let template = null;
let activeSoul = null;
let lastCard = null;
let toastTimer;

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function renderCards() {
  grid.innerHTML = souls.map((soul) => `
    <button class="soul-card" type="button" data-soul="${escapeHtml(soul.slug)}" aria-label="Choose ${escapeHtml(soul.name)}">
      <span class="soul-card-media">
        <img src="assets/cards/${escapeHtml(soul.slug)}.webp" alt="${escapeHtml(soul.name)} character card" loading="lazy" decoding="async" />
        <span class="art-fallback" aria-hidden="true">${escapeHtml(soul.emoji)}</span>
      </span>
    </button>
  `).join('');
  grid.querySelectorAll('.soul-card img').forEach((img) => {
    img.addEventListener('error', () => { img.hidden = true; }, {once: true});
  });
}

function makeInvitation(soul) {
  if (!template) throw new Error('The installation instructions could not be loaded.');
  const raw = `${RAW_SOULS}/${soul.slug}`;
  const fields = {
    PACK_LABEL: soul.name,
    SOUL_URL: `${raw}/SOUL.md`,
    IDENTITY_URL: `${raw}/IDENTITY.md`,
    NAMES_URL: `${raw}/NAMES.md`,
    AVATAR_URL: `${raw}/avatar-reference.png`,
    PACK_URL: `${GITHUB_SOULS}/${soul.slug}`,
    GALLERY_REPO_URL: REPO_URL,
  };
  const result = template.replace(/\{\{([A-Z_]+)\}\}/g, (matched, key) => fields[key] ?? matched);
  if (/\{\{[^}]+\}\}/.test(result)) throw new Error('The installation instructions contain an unfilled field.');
  return result;
}

function openSoul(soul, {updateHash = true} = {}) {
  activeSoul = soul;
  detailView.hidden = false;
  choiceView.hidden = true;
  dialog.setAttribute('aria-labelledby', 'dialog-name');
  copyStatus.textContent = '';
  $('#dialog-name').textContent = soul.name;
  $('#dialog-vibe').textContent = soul.vibe;
  $('#dialog-description').textContent = soul.description;
  $('#dialog-voice').textContent = `“${soul.greeting}”`;

  dialogArt.hidden = false;
  dialogArt.src = `assets/portraits/${soul.slug}.webp`;
  dialogArt.alt = `${soul.name} character card`;
  artFallback.textContent = soul.emoji;
  dialogArt.onerror = () => { dialogArt.hidden = true; };

  $('#inspect-soul').href = `${GITHUB_FILES}/${soul.slug}/SOUL.md`;
  $('#inspect-identity').href = `${GITHUB_FILES}/${soul.slug}/IDENTITY.md`;
  $('#inspect-names').href = `${GITHUB_FILES}/${soul.slug}/NAMES.md`;
  $('#inspect-avatar').href = `${GITHUB_FILES}/${soul.slug}/avatar-reference.png`;

  $('#choice-avatar').src = `assets/avatars/${soul.slug}.webp`;
  $('#choice-avatar').alt = `Square avatar reference for ${soul.name}`;
  $('#download-avatar').href = `${GITHUB_FILES}/${soul.slug}/avatar-reference.png`;
  $('#view-character-files').href = `${GITHUB_SOULS}/${soul.slug}`;

  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
  if (updateHash) history.replaceState(null, '', `#${soul.slug}`);
}

function closeDialog({clearHash = true} = {}) {
  if (dialog.open) dialog.close();
  if (clearHash && location.hash) history.replaceState(null, '', location.pathname + location.search);
  if (lastCard) lastCard.focus({preventScroll: true});
}

function showChoice() {
  if (!activeSoul) return;
  try {
    promptField.value = makeInvitation(activeSoul);
  } catch (error) {
    copyStatus.textContent = `${error.message} Please try refreshing.`;
    return;
  }
  detailView.hidden = true;
  choiceView.hidden = false;
  dialog.setAttribute('aria-labelledby', 'choice-title');
  $('#choice-title').textContent = `Try ${activeSoul.name}`;
  copyStatus.textContent = '';
  dialog.scrollTop = 0;
  requestAnimationFrame(() => copyButton.focus());
}

async function copyInvitation() {
  if (!activeSoul || !promptField.value) return;
  let copied = false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(promptField.value);
      copied = true;
    }
  } catch { /* Older browsers and some preview origins need the selection fallback. */ }
  if (!copied) {
    try {
      promptField.focus();
      promptField.select();
      copied = Boolean(document.execCommand('copy'));
    } catch { copied = false; }
  }
  if (copied) {
    copyStatus.textContent = 'Copied. Paste these instructions into Muse. The words are yours now.';
    showToast('THE WORDS ARE YOURS NOW.');
  } else {
    copyStatus.textContent = 'The browser did not allow copying. The text is selected so you can copy it manually.';
    promptField.focus();
    promptField.select();
  }
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function soulFromHash() {
  let slug;
  try { slug = decodeURIComponent(location.hash.replace(/^#/, '')); }
  catch { return null; }
  return souls.find((item) => item.slug === slug) || null;
}

async function initialize() {
  try {
    const [dataResult, templateResult] = await Promise.all([
      fetch('data/souls.json', {cache: 'no-cache'}),
      fetch('data/installation-template.md', {cache: 'no-cache'}),
    ]);
    if (!dataResult.ok || !templateResult.ok) throw new Error('Could not read the gallery files.');
    const [data, installationTemplate] = await Promise.all([dataResult.json(), templateResult.text()]);
    if (!Array.isArray(data) || data.length !== 9) throw new Error('Unexpected character data.');
    if (!installationTemplate.includes('{{PACK_LABEL}}') || !installationTemplate.includes('{{PACK_URL}}')) {
      throw new Error('The installation template is incomplete.');
    }
    souls = data;
    template = installationTemplate;
    renderCards();
    const initialSoul = soulFromHash();
    if (initialSoul) requestAnimationFrame(() => openSoul(initialSoul, {updateHash: false}));
  } catch (error) {
    grid.innerHTML = `<p class="load-error">The gallery couldn't load its files. Try refreshing the page or <a href="${REPO_URL}">view the characters on GitHub</a>.</p>`;
    console.error('Muse Souls could not initialize:', error);
  }
}

grid.addEventListener('click', (event) => {
  const card = event.target.closest('[data-soul]');
  if (!card) return;
  const soul = souls.find((item) => item.slug === card.dataset.soul);
  if (soul) { lastCard = card; openSoul(soul); }
});
$('#accept-soul').addEventListener('click', showChoice);
copyButton.addEventListener('click', copyInvitation);
$('#choose-another').addEventListener('click', () => closeDialog());
document.querySelectorAll('[data-close]').forEach((button) => {
  button.addEventListener('click', () => closeDialog());
});
dialog.addEventListener('click', (event) => { if (event.target === dialog) closeDialog(); });
dialog.addEventListener('cancel', (event) => { event.preventDefault(); closeDialog(); });
window.addEventListener('hashchange', () => {
  const soul = soulFromHash();
  if (soul) openSoul(soul, {updateHash: false});
  else if (dialog.open) closeDialog({clearHash: false});
});

initialize();
