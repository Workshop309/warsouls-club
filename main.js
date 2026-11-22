/* AEGDE — interacciones y animación del circuito */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- barra de progreso ---------- */
  const progressBar = document.getElementById('progressBar');
  const siteHead = document.getElementById('siteHead');
  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (progressBar) progressBar.style.width = (pct * 100).toFixed(2) + '%';
      if (siteHead) siteHead.classList.toggle('is-stuck', window.scrollY > 24);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- menú móvil ---------- */
  const navToggle = document.getElementById('navToggle');
  const primaryNav = document.getElementById('primaryNav');

  if (navToggle && primaryNav && siteHead) {
    navToggle.addEventListener('click', () => {
      const open = siteHead.classList.toggle('nav-open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
    primaryNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        siteHead.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && siteHead.classList.contains('nav-open')) {
        siteHead.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.focus();
      }
    });
  }

  /* ---------- revelado al entrar en pantalla ---------- */
  const revealables = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add('is-in'));
  }

  // Red de seguridad: si el observador no llega a dispararse (pestaña en segundo
  // plano, navegador antiguo), el contenido visible nunca queda oculto.
  window.setTimeout(() => {
    revealables.forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('is-in');
    });
  }, 1200);

  /* ---------- contadores del marcador ---------- */
  const counters = document.querySelectorAll('[data-count]');
  const formatThousands = (n) => n.toLocaleString('es-ES');

  function animateCounter(el) {
    const target = Number(el.dataset.count);
    if (el.dataset.plain === 'true' || reduceMotion || !Number.isFinite(target)) {
      el.textContent = el.dataset.plain === 'true' ? String(target) : formatThousands(target);
      return;
    }
    const duration = 1400;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(target * eased);
      el.textContent = el.dataset.format === 'thousand' ? formatThousands(value) : String(value);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window) {
    const counterIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => counterIO.observe(el));
  } else {
    counters.forEach((el) => {
      const target = Number(el.dataset.count);
      el.textContent = el.dataset.plain === 'true' ? String(target) : formatThousands(target);
    });
  }

  /* ---------- inclinación de las tarjetas ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('[data-tilt]').forEach((card) => {
      const strength = 6;
      card.addEventListener('pointermove', (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        card.style.transform =
          `perspective(900px) rotateX(${((0.5 - py) * strength).toFixed(2)}deg) ` +
          `rotateY(${((px - 0.5) * strength).toFixed(2)}deg) translateZ(0)`;
      });
      card.addEventListener('pointerleave', () => {
        card.style.transform = '';
      });
    });
  }

  /* ---------- año del pie ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- circuito animado del hero ---------- */
  const canvas = document.getElementById('circuit');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let paths = [];
  let pulses = [];
  let rafId = null;
  let visible = true;
  let lastTime = 0;

  const COLORS = ['#2f7ff0', '#2f7ff0', '#2f7ff0', '#2f7ff0', '#12a150', '#e12a30'];
  const STEP = 54;

  function buildCircuit() {
    const cols = Math.max(5, Math.ceil(width / STEP));
    const rows = Math.max(5, Math.ceil(height / STEP));
    const cell = Math.min(width / cols, height / rows);
    const offsetX = (width - cell * cols) / 2;
    const offsetY = (height - cell * rows) / 2;
    const toPoint = (cx, cy) => [offsetX + cx * cell, offsetY + cy * cell];

    paths = [];
    const pathCount = Math.round(Math.min(26, Math.max(12, (cols * rows) / 22)));

    for (let i = 0; i < pathCount; i++) {
      let cx = Math.floor(Math.random() * (cols - 2)) + 1;
      let cy = Math.floor(Math.random() * (rows - 2)) + 1;
      const points = [toPoint(cx, cy)];
      const segments = 3 + Math.floor(Math.random() * 5);
      let horizontal = Math.random() > 0.5;
      let dirH = Math.random() > 0.5 ? 1 : -1;
      let dirV = Math.random() > 0.5 ? 1 : -1;

      for (let s = 0; s < segments; s++) {
        const run = 1 + Math.floor(Math.random() * 3);
        if (horizontal) {
          cx = Math.min(cols - 1, Math.max(0, cx + run * dirH));
          dirH *= -1;
        } else {
          cy = Math.min(rows - 1, Math.max(0, cy + run * dirV));
          dirV *= -1;
        }
        points.push(toPoint(cx, cy));
        horizontal = !horizontal;
      }

      paths.push({
        points,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: 0.16 + Math.random() * 0.3,
        width: 1 + Math.random() * 0.6,
        nodes: points.filter(() => Math.random() > 0.72)
      });
    }

    pulses = [];
    const pulseCount = Math.round(paths.length * 0.85);
    for (let i = 0; i < pulseCount; i++) {
      pulses.push(newPulse(i % paths.length));
    }
  }

  function newPulse(pathIndex) {
    return {
      path: pathIndex,
      segment: Math.floor(Math.random() * (paths[pathIndex].points.length - 1)),
      t: Math.random(),
      speed: 0.16 + Math.random() * 0.34,
      color: Math.random() > 0.82 ? COLORS[4 + Math.floor(Math.random() * 2)] : COLORS[0]
    };
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildCircuit();
    draw(0);
  }

  function draw(dt) {
    ctx.clearRect(0, 0, width, height);

    // trazas
    for (const path of paths) {
      ctx.beginPath();
      ctx.strokeStyle = path.color;
      ctx.globalAlpha = path.alpha;
      ctx.lineWidth = path.width;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      const pts = path.points;
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();

      // nodos
      ctx.globalAlpha = Math.min(0.85, path.alpha + 0.32);
      for (const [nx, ny] of path.nodes) {
        ctx.beginPath();
        ctx.fillStyle = path.color;
        ctx.arc(nx, ny, 2.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.globalAlpha = Math.min(0.4, path.alpha);
        ctx.arc(nx, ny, 5.4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.globalAlpha = 1;

    if (reduceMotion) return;

    // pulsos
    for (const p of pulses) {
      const path = paths[p.path];
      if (!path) continue;
      const pts = path.points;
      const a = pts[p.segment];
      const b = pts[p.segment + 1];
      if (!a || !b) {
        Object.assign(p, newPulse(Math.floor(Math.random() * paths.length)));
        continue;
      }
      const x = a[0] + (b[0] - a[0]) * p.t;
      const y = a[1] + (b[1] - a[1]) * p.t;

      const glow = ctx.createRadialGradient(x, y, 0, x, y, 22);
      glow.addColorStop(0, 'rgba(120, 180, 255, .55)');
      glow.addColorStop(1, 'rgba(47, 127, 240, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = p.color === '#2f7ff0' ? '#cfe2ff' : p.color;
      ctx.beginPath();
      ctx.arc(x, y, 2.4, 0, Math.PI * 2);
      ctx.fill();

      p.t += p.speed * dt;
      if (p.t >= 1) {
        p.segment += 1;
        p.t -= 1;
        if (p.segment >= pts.length - 1) {
          Object.assign(p, newPulse(Math.floor(Math.random() * paths.length)));
          p.t = 0;
        }
      }
    }
  }

  function loop(now) {
    if (!visible || reduceMotion) {
      rafId = null;
      return;
    }
    const dt = Math.min(0.05, (now - lastTime) / 1000 || 0.016);
    lastTime = now;
    draw(dt);
    rafId = requestAnimationFrame(loop);
  }

  function start() {
    if (reduceMotion || rafId !== null) return;
    lastTime = performance.now();
    rafId = requestAnimationFrame(loop);
  }

  if ('IntersectionObserver' in window) {
    const heroIO = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible) start();
    }, { threshold: 0.02 });
    heroIO.observe(canvas);
  }

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      start();
    }, 180);
  });

  resize();
  start();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
    } else if (visible) {
      start();
    }
  });
})();
