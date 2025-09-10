// Mobile nav toggle
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
}

// Copy email to clipboard
function copyFromSelector(selector) {
  const el = document.querySelector(selector);
  const status = document.getElementById('copy-status');
  if (!el) return;
  const text = el.getAttribute('href')?.replace('mailto:', '') || el.textContent.trim();

  navigator.clipboard?.writeText(text).then(() => {
    if (status) status.textContent = 'E-mail copié.';
    setTimeout(() => { if (status) status.textContent = ''; }, 2000);
  }).catch(() => {
    // Fallback
    const area = document.createElement('textarea');
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
    if (status) status.textContent = 'E-mail copié.';
    setTimeout(() => { if (status) status.textContent = ''; }, 2000);
  });
}

document.querySelectorAll('[data-copy]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    copyFromSelector(btn.getAttribute('data-copy'));
  });
});

// Current year in footer
const yearSpan = document.getElementById('year');
if (yearSpan) yearSpan.textContent = new Date().getFullYear();
