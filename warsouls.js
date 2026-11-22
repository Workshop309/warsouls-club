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

  /* carrusel de imágenes */
  const carousel = document.querySelector('[data-carousel]');

  if (carousel) {
    const slides = Array.from(carousel.querySelectorAll('[data-slide]'));
    const dots = Array.from(carousel.querySelectorAll('[data-dot]'));
    const prev = carousel.querySelector('[data-prev]');
    const next = carousel.querySelector('[data-next]');
    const still = window.matchMedia('(prefers-reduced-motion: reduce)');
    const DELAY = 6000;
    let index = 0;
    let timer = null;

    function show(target) {
      index = (target + slides.length) % slides.length;
      slides.forEach((slide, n) => {
        const on = n === index;
        slide.classList.toggle('is-on', on);
        slide.setAttribute('aria-hidden', String(!on));
      });
      dots.forEach((dot, n) => {
        if (n === index) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
    }

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function start() {
      stop();
      if (still.matches || document.hidden || slides.length < 2) return;
      timer = setInterval(() => show(index + 1), DELAY);
    }

    if (prev) prev.addEventListener('click', () => { show(index - 1); start(); });
    if (next) next.addEventListener('click', () => { show(index + 1); start(); });
    dots.forEach((dot, n) => {
      dot.addEventListener('click', () => { show(n); start(); });
    });

    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);
    carousel.addEventListener('focusin', stop);
    carousel.addEventListener('focusout', start);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else start();
    });
    if (still.addEventListener) still.addEventListener('change', start);

    /* deslizar en pantallas táctiles */
    let startX = null;
    carousel.addEventListener('touchstart', (event) => {
      startX = event.touches[0].clientX;
    }, { passive: true });
    carousel.addEventListener('touchend', (event) => {
      if (startX === null) return;
      const dx = event.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(dx) > 44) {
        show(index + (dx < 0 ? 1 : -1));
        start();
      }
    });

    show(0);
    start();
  }
})();
