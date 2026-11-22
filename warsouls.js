/* War Souls E-Sports — navegación y estado de la cabecera */
(() => {
  'use strict';

  const top = document.getElementById('top');
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('nav');
  const label = toggle ? toggle.querySelector('.sr-only') : null;

  /* cabecera con fondo al hacer scroll */
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      top.classList.toggle('is-stuck', window.scrollY > 12);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* menú móvil */
  function setNav(open) {
    top.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    if (label) label.textContent = open ? 'Cerrar menú' : 'Abrir menú';
  }

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      setNav(!top.classList.contains('nav-open'));
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setNav(false));
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && top.classList.contains('nav-open')) {
        setNav(false);
        toggle.focus();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 840) setNav(false);
    });
  }

  /* año del pie */
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
