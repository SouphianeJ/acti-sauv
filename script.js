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

// === Lightbox pour la galerie d’images ===
(function(){
  const lb = document.getElementById('lightbox');
  const lbImg = lb ? lb.querySelector('img') : null;
  const lbClose = lb ? lb.querySelector('.close') : null;

  function openLb(src, alt){
    if (!lb || !lbImg) return;
    lbImg.src = src;
    lbImg.alt = alt || '';
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLb(){
    if (!lb || !lbImg) return;
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    // Petit délai pour éviter un flash au rechargement
    setTimeout(() => { lbImg.src = ''; }, 150);
  }

  // Clic sur une vignette de la galerie
  document.addEventListener('click', (e) => {
    const link = e.target.closest('.gallery-item');
    if (!link) return;
    e.preventDefault();
    const img = link.querySelector('img');
    openLb(link.getAttribute('href'), img ? img.alt : '');
  });

  // Fermetures
  lbClose && lbClose.addEventListener('click', closeLb);
  (lb) && lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && lb && lb.classList.contains('open')) closeLb(); });
})();
