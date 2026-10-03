(() => {
  const root = document.documentElement;
  root.classList.add('js');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Hero: multi-agent network canvas ---------- */
  const canvas = document.getElementById('network');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const palette = ['61,224,255', '139,108,255', '255,92,154'];
    const mouse = { x: -9999, y: -9999 };
    let w = 0, h = 0, dpr = 1, nodes = [], raf;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.round(Math.min(110, Math.max(36, (w * h) / 15000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 1,
        c: palette[Math.floor(Math.random() * palette.length)],
      }));
    };

    const LINK = 150;
    const REACH = 190;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      for (const n of nodes) {
        if (!reduceMotion) {
          n.x += n.vx; n.y += n.vy;
          if (n.x < 0 || n.x > w) n.vx *= -1;
          if (n.y < 0 || n.y > h) n.vy *= -1;

          // gentle pull toward the cursor
          const dx = mouse.x - n.x, dy = mouse.y - n.y;
          const d = Math.hypot(dx, dy);
          if (d < REACH && d > 1) {
            n.x += (dx / d) * 0.6;
            n.y += (dy / d) * 0.6;
          }
        }
      }

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK) {
            ctx.strokeStyle = `rgba(${a.c},${(1 - d / LINK) * 0.32})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        // links to the cursor, like an agent being queried
        const md = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (md < REACH) {
          ctx.strokeStyle = `rgba(255,255,255,${(1 - md / REACH) * 0.5})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }

      for (const n of nodes) {
        ctx.fillStyle = `rgba(${n.c},0.95)`;
        ctx.shadowColor = `rgba(${n.c},0.9)`;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      if (!reduceMotion) raf = requestAnimationFrame(draw);
    };

    const hero = canvas.parentElement;
    hero.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    });
    hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });

    window.addEventListener('resize', () => { resize(); if (reduceMotion) draw(); });
    resize();
    draw();

    // pause when the hero is off-screen
    if (!reduceMotion && 'IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        cancelAnimationFrame(raf);
        if (entry.isIntersecting) raf = requestAnimationFrame(draw);
      }).observe(hero);
    }
  }

  /* ---------- 2. Typing effect ---------- */
  const typedEl = document.getElementById('typed');
  if (typedEl) {
    const words = ['LLMs', 'RAG', 'Agentic Systems', 'Multi-Agent Systems', 'AGI'];
    if (reduceMotion) {
      typedEl.textContent = words[0];
    } else {
      let wi = 0, ci = 0, deleting = false;
      const tick = () => {
        const word = words[wi];
        typedEl.textContent = word.slice(0, ci);
        let delay = deleting ? 45 : 95;

        if (!deleting && ci === word.length) { deleting = true; delay = 1600; }
        else if (deleting && ci === 0) { deleting = false; wi = (wi + 1) % words.length; delay = 350; }
        ci += deleting ? -1 : 1;

        setTimeout(tick, delay);
      };
      tick();
    }
  }

  /* ---------- 3. Scroll reveal ---------- */
  const revealTargets = document.querySelectorAll('.section-title, .card, .paper, .tl-item');
  revealTargets.forEach((el) => el.classList.add('reveal'));

  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('in'));
  }

  /* ---------- 4. Spotlight on cards + global cursor glow ---------- */
  document.querySelectorAll('.spot').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  const glow = document.querySelector('.cursor-glow');
  if (glow && !reduceMotion) {
    let gx = 0, gy = 0, tx = 0, ty = 0;
    window.addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; });
    const follow = () => {
      gx += (tx - gx) * 0.12;
      gy += (ty - gy) * 0.12;
      glow.style.transform = `translate(${gx}px, ${gy}px)`;
      requestAnimationFrame(follow);
    };
    follow();
  }

  /* ---------- 5. Nav state, scroll progress, active link ---------- */
  const nav = document.getElementById('nav');
  const bar = document.querySelector('.progress');
  const links = [...document.querySelectorAll('.nav-links a')];
  const sections = links.map((a) => document.querySelector(a.getAttribute('href')));

  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    nav.classList.toggle('scrolled', y > 40);
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

    let current = -1;
    sections.forEach((s, i) => {
      if (s && s.getBoundingClientRect().top < window.innerHeight * 0.4) current = i;
    });
    links.forEach((a, i) => a.classList.toggle('active', i === current));
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
