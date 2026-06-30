/* =====================================================================
   SALMAN TAHIR · PORTFOLIO v3 · main.js
   ===================================================================== */
(function () {
  'use strict';

  /* ---- Nav: scrolled state + mobile toggle ---- */
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.nav-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => menu.classList.toggle('open'));
    menu.addEventListener('click', (e) => {
      if (e.target.classList.contains('nav-link')) menu.classList.remove('open');
    });
  }

  /* ---- Reveal on scroll ---- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('visible'));
  }

  /* ---- Work filtering ---- */
  const filters = document.querySelectorAll('.filter');
  const projects = document.querySelectorAll('.work-grid .proj');
  if (filters.length && projects.length) {
    filters.forEach((btn) => {
      btn.addEventListener('click', () => {
        filters.forEach((f) => f.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.dataset.filter;
        projects.forEach((p) => {
          const match = cat === 'all' || (p.dataset.cat || '').includes(cat);
          p.classList.toggle('hide', !match);
        });
      });
    });
  }

  /* ---- Contact form -> mailto (static-site friendly) ---- */
  const form = document.querySelector('#contact-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = (form.elements.name.value || '').trim();
      const email = (form.elements.email.value || '').trim();
      const message = (form.elements.message.value || '').trim();
      const subject = encodeURIComponent(`Project enquiry from ${name || 'your site'}`);
      const body = encodeURIComponent(
        `${message}\n\n${name}${email ? `\n${email}` : ''}`
      );
      window.location.href = `mailto:salmantahir0831@gmail.com?subject=${subject}&body=${body}`;
    });
  }

  /* ---- Footer year ---- */
  const yr = document.querySelector('#year');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---- Dynamic ambient background ----
     · slow idle drift + colour oscillation over time
     · hue shifts faster the further you scroll
     · orbs follow the mouse with a soft parallax            */
  const ambient = document.querySelector('.ambient');
  const orbs = ambient ? Array.from(ambient.querySelectorAll('.orb')) : [];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (ambient && orbs.length && !reduceMotion) {
    const cfg = [
      { ax: 5, ay: 6, sp: 0.0052, ph: 0, mp: 28 },
      { ax: 6, ay: 5, sp: 0.0043, ph: 2.1, mp: -36 },
      { ax: 7, ay: 7, sp: 0.0061, ph: 4.2, mp: 22 },
    ];
    let mx = 0.5, my = 0.5, tmx = 0.5, tmy = 0.5;
    let t = 0;

    window.addEventListener('mousemove', (e) => {
      tmx = e.clientX / window.innerWidth;
      tmy = e.clientY / window.innerHeight;
    }, { passive: true });

    const frame = () => {
      t += 1;
      // ease the mouse position for smooth parallax
      mx += (tmx - mx) * 0.04;
      my += (tmy - my) * 0.04;

      // colour: livelier idle oscillation (stays in the brand palette), plus a scroll-driven shift
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const scrollNorm = Math.min(1, window.scrollY / maxScroll);
      const hue = Math.sin(t * 0.0044) * 34 + scrollNorm * 110;
      ambient.style.setProperty('--amb-hue', hue.toFixed(2) + 'deg');

      orbs.forEach((o, i) => {
        const c = cfg[i] || cfg[0];
        const dx = Math.sin(t * c.sp + c.ph) * c.ax;        // vw
        const dy = Math.cos(t * c.sp * 0.8 + c.ph) * c.ay;  // vh
        const px = (mx - 0.5) * c.mp;                        // px parallax
        const py = (my - 0.5) * c.mp;
        const s = 1 + Math.sin(t * c.sp * 0.5 + c.ph) * 0.06;
        o.style.transform =
          `translate(calc(${dx.toFixed(2)}vw + ${px.toFixed(1)}px), calc(${dy.toFixed(2)}vh + ${py.toFixed(1)}px)) scale(${s.toFixed(3)})`;
      });

      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
})();
