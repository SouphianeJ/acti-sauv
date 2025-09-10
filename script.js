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

// === Modales (Programme de formation) ===
(function(){
  const focusableSelector = [
    'a[href]', 'button:not([disabled])', 'textarea:not([disabled])',
    'input:not([disabled])', 'select:not([disabled])', '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  let lastFocused = null;

  function openModal(modal){
    if (!modal) return;
    lastFocused = document.activeElement;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Focus le premier élément actionnable
    const first = modal.querySelector(focusableSelector) || modal;
    (first instanceof HTMLElement) && first.focus();
  }

  function closeModal(modal){
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  // Délégation : ouverture
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-modal-target]');
    if (!trigger) return;
    e.preventDefault();
    const sel = trigger.getAttribute('data-modal-target');
    const modal = sel ? document.querySelector(sel) : null;
    openModal(modal);
  });

  // Délégation : fermeture par bouton
  document.addEventListener('click', (e) => {
    const btnClose = e.target.closest('[data-modal-close]');
    if (!btnClose) return;
    const modal = e.target.closest('.modal');
    closeModal(modal);
  });

  // Fermeture en cliquant l’overlay (en dehors du .modal-dialog)
  document.addEventListener('mousedown', (e) => {
    const modal = e.target.closest('.modal');
    if (!modal) return;
    const dialog = e.target.closest('.modal-dialog');
    if (!dialog) { // clic sur l’overlay
      closeModal(modal);
    }
  });

  // Échap et tab trap
  document.addEventListener('keydown', (e) => {
    const openModalEl = document.querySelector('.modal.open');
    if (!openModalEl) return;

    if (e.key === 'Escape'){
      e.preventDefault();
      closeModal(openModalEl);
      return;
    }
    if (e.key === 'Tab'){
      // Focus trap
      const focusables = Array.from(openModalEl.querySelectorAll(focusableSelector))
        .filter(el => el.offsetParent !== null || getComputedStyle(el).position === 'fixed');
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement;
      if (e.shiftKey){
        if (current === first || !openModalEl.contains(current)){
          e.preventDefault();
          last.focus();
        }
      } else {
        if (current === last){
          e.preventDefault();
          first.focus();
        }
      }
    }
  });
})();


// === Galerie auto depuis /assets/formation ===
(function(){
  const gallery = document.querySelector('#images .gallery#gallery') || document.querySelector('#images .gallery');
  if (!gallery) return;

  const basePathAttr = gallery.getAttribute('data-gallery-path') || 'assets/formation/';
  const basePath = basePathAttr.endsWith('/') ? basePathAttr : (basePathAttr + '/');
  const IMG_EXT_RE = /\.(avif|webp|jpg|jpeg|png|gif|bmp|svg)$/i;

  // 1) Tente de charger un manifest JSON facultatif : assets/formation/index.json
  async function tryManifest(){
    try{
      const res = await fetch(basePath + 'index.json', { cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      return normalizeList(data);
    }catch(e){ return null; }
  }

  // 2) Repli : tente de parser l’auto-index HTML du dossier (si activé côté serveur)
  async function tryAutoIndex(){
    try{
      const res = await fetch(basePath, { cache: 'no-store' });
      if (!res.ok) return null;
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const hrefs = Array.from(doc.querySelectorAll('a'))
        .map(a => a.getAttribute('href') || '')
        .filter(h => IMG_EXT_RE.test(h));
      return normalizeList(hrefs);
    }catch(e){ return null; }
  }

  // Transforme divers formats (array de strings, array d’objets) => [{url,title}]
  function normalizeList(input){
    if (!input) return [];
    const arr = Array.isArray(input) ? input
      : (Array.isArray(input.files) ? input.files : []);

    return arr.map(item => {
      let file = '';
      let title = '';
      if (typeof item === 'string'){
        file = item;
      } else if (item && typeof item === 'object'){
        file = item.file || item.name || '';
        title = item.title || '';
      }
      if (!file) return null;

      const isAbsolute = /^(https?:)?\/\//i.test(file) || file.startsWith('/');
      const url = isAbsolute ? file : (basePath + file.replace(/^\.?\//, ''));
      const derived = title || fileNameToTitle(file);
      return { url, title: derived };
    }).filter(Boolean);
  }

  function fileNameToTitle(file){
    try{
      const name = file.split('/').pop().replace(/\.[^.]+$/, '');
      return name.replace(/[-_]+/g, ' ').trim();
    }catch(e){ return ''; }
  }

  function render(items){
    if (!items || !items.length) return;
    const frag = document.createDocumentFragment();
    items.forEach(({ url, title }) => {
      const a = document.createElement('a');
      a.href = url;
      a.className = 'gallery-item';
      a.setAttribute('role', 'listitem');
      if (title) a.title = title;

      const img = document.createElement('img');
      img.src = url;
      img.loading = 'lazy';
      img.alt = title || '';
      img.width = 600;
      img.height = 400;

      a.appendChild(img);
      frag.appendChild(a);
    });
    gallery.appendChild(frag);
  }

  async function init(){
    // Essaie manifest.json puis auto-index
    let items = await tryManifest();
    if (!items || !items.length){
      items = await tryAutoIndex();
    }
    // Si rien trouvé, on ne rend rien (galerie vide, pas de texte comme demandé)
    if (items && items.length){
      render(items);
    } else {
      console.warn('[Galerie] Aucune image trouvée dans', basePath);
    }
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// === Décalage auto des ancres pour header sticky ===
(function(){
  function setHeaderOffset(){
    const header = document.querySelector('.site-header');
    if (!header) return;
    const gap = 12; // petit espace pour ne pas coller le titre au header
    const h = Math.ceil(header.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--header-h', (h + gap) + 'px');
  }

  // Init + MAJ sur resize / chargement des polices
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', setHeaderOffset);
  } else {
    setHeaderOffset();
  }
  window.addEventListener('load', setHeaderOffset);
  window.addEventListener('resize', setHeaderOffset);
  if (document.fonts && document.fonts.ready){
    document.fonts.ready.then(setHeaderOffset).catch(()=>{});
  }
})();