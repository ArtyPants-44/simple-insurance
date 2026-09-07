/* ============================================================
   Motion layer
   - [data-reveal]        : fade/slide in once on entering viewport
   - [data-parallax]      : translateY on scroll (speed = attr value)
   - [data-cursor-parallax]: translate toward cursor (hero arrow)
   All of it no-ops under prefers-reduced-motion.
   ============================================================ */

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- 1. Scroll reveal ---------- */
function initReveal() {
  const items = document.querySelectorAll("[data-reveal]");
  if (!items.length) return;

  if (reduced || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target); // reveal once, then stop watching
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
  );

  items.forEach((el) => io.observe(el));
}

/* ---------- 2. Scroll parallax ---------- */
function initScrollParallax() {
  const items = [...document.querySelectorAll("[data-parallax]")];
  if (!items.length || reduced) return;

  let ticking = false;

  const update = () => {
    const vh = window.innerHeight;
    items.forEach((el) => {
      const speed = parseFloat(el.dataset.parallax) || 0.15;
      const rect = el.getBoundingClientRect();
      // progress: -1 (just below viewport) → 1 (just above)
      const progress = (rect.top + rect.height / 2 - vh / 2) / (vh / 2 + rect.height / 2);
      const shift = -progress * speed * 100;
      el.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0)`;
    });
    ticking = false;
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  update();
}

/* ---------- 3. Cursor parallax (hero arrow) ---------- */
function initCursorParallax() {
  const items = [...document.querySelectorAll("[data-cursor-parallax]")];
  if (!items.length || reduced) return;
  if (window.matchMedia("(pointer: coarse)").matches) return; // skip on touch

  const state = items.map((el) => ({
    el,
    strength: parseFloat(el.dataset.cursorParallax) || 24,
    tx: 0, ty: 0, cx: 0, cy: 0,
  }));

  let targetX = 0, targetY = 0, raf = null;

  const onMove = (e) => {
    // -0.5 → 0.5 across the viewport
    targetX = e.clientX / window.innerWidth - 0.5;
    targetY = e.clientY / window.innerHeight - 0.5;
    if (!raf) raf = requestAnimationFrame(tick);
  };

  const tick = () => {
    let moving = false;
    state.forEach((s) => {
      s.tx = targetX * s.strength;
      s.ty = targetY * s.strength;
      // ease toward target so it drifts rather than snaps
      s.cx += (s.tx - s.cx) * 0.075;
      s.cy += (s.ty - s.cy) * 0.075;
      if (Math.abs(s.tx - s.cx) > 0.05 || Math.abs(s.ty - s.cy) > 0.05) moving = true;
      s.el.style.transform = `translate3d(${s.cx.toFixed(2)}px, ${s.cy.toFixed(2)}px, 0)`;
    });
    raf = moving ? requestAnimationFrame(tick) : null;
  };

  window.addEventListener("mousemove", onMove, { passive: true });
}

/* ---------- 4. Sticky nav state ---------- */
function initNav() {
  const nav = document.querySelector("[data-nav]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const panel = document.querySelector("[data-nav-panel]");

  if (nav) {
    const onScroll = () => nav.classList.toggle("is-stuck", window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  if (toggle && panel && nav) {
    const setOpen = (open) => {
      nav.classList.toggle("is-open", open);
      panel.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.body.style.overflow = open ? "hidden" : "";
    };

    toggle.addEventListener("click", () =>
      setOpen(!panel.classList.contains("is-open"))
    );

    panel.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => setOpen(false))
    );

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && panel.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    // Close if the viewport grows past the mobile breakpoint while open.
    window.matchMedia("(min-width: 1081px)").addEventListener("change", (e) => {
      if (e.matches) setOpen(false);
    });
  }
}

/* ---------- 5. How-it-works scroll carousel ---------- */
/* The section ships as a plain stacked list. Where there is room for it — a
   wide enough, tall enough viewport, and motion is welcome — we pin the stage
   to the viewport and let scroll position pick the step, with the outgoing and
   incoming shots peeking from the corners. */
function initStepper() {
  const root = document.querySelector("[data-stepper]");
  if (!root) return;

  const track = root.querySelector("[data-step-track]");
  const slides = [...root.querySelectorAll("[data-step-slide]")];
  const triggers = [...root.querySelectorAll("[data-step-trigger]")];
  const prevImgs = [...root.querySelectorAll(".hiw__peek--prev .hiw__peek-img")];
  const nextImgs = [...root.querySelectorAll(".hiw__peek--next .hiw__peek-img")];

  const n = slides.length;
  if (!track || !n) return;

  root.style.setProperty("--hiw-steps", String(n));

  let current = -1;

  const select = (i) => {
    if (i === current) return;
    current = i;

    slides.forEach((s, k) => s.classList.toggle("is-active", k === i));
    triggers.forEach((t, k) => {
      t.classList.toggle("is-active", k === i);
      if (k === i) t.setAttribute("aria-current", "step");
      else t.removeAttribute("aria-current");
    });

    // Corner cards wrap around so both are always filled.
    const prev = (i - 1 + n) % n;
    const next = (i + 1) % n;
    prevImgs.forEach((im, k) => im.classList.toggle("is-active", k === prev));
    nextImgs.forEach((im, k) => im.classList.toggle("is-active", k === next));
  };

  const runway = () => track.offsetHeight - window.innerHeight;

  let pinned = false;
  let ticking = false;

  const update = () => {
    ticking = false;
    if (!pinned) return;
    const total = runway();
    if (total <= 0) return;
    const scrolled = Math.min(Math.max(-track.getBoundingClientRect().top, 0), total);
    select(Math.min(n - 1, Math.floor((scrolled / total) * n)));
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  // Pinning a full viewport is only worth it with the room to show it, and
  // never against the user's motion preference.
  const canPin = () =>
    !reduced &&
    window.matchMedia("(min-width: 901px)").matches &&
    window.matchMedia("(min-height: 620px)").matches;

  const setMode = () => {
    const want = canPin();
    if (want === pinned) return;
    pinned = want;
    root.classList.toggle("is-pinned", pinned);

    if (pinned) {
      window.addEventListener("scroll", onScroll, { passive: true });
      current = -1;
      update();
      if (current === -1) select(0);
    } else {
      window.removeEventListener("scroll", onScroll);
      // Stacked again: every step stands on its own, so drop the selection.
      slides.forEach((s) => s.classList.remove("is-active"));
      current = -1;
    }
  };

  triggers.forEach((t, i) => {
    t.addEventListener("click", () => {
      if (!pinned) {
        slides[i].scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      const total = runway();
      if (total <= 0) return;
      const top = track.getBoundingClientRect().top + window.scrollY;
      // Aim for the middle of that step's band so it does not sit on a seam.
      window.scrollTo({ top: top + ((i + 0.5) / n) * total, behavior: "smooth" });
    });
  });

  setMode();
  window.addEventListener(
    "resize",
    () => {
      setMode();
      onScroll();
    },
    { passive: true }
  );
}

/* ---------- 6. Counter roll-up for Our Numbers ---------- */
function initCounters() {
  const counters = [...document.querySelectorAll("[data-count-to]")];
  if (!counters.length) return;

  if (reduced || !("IntersectionObserver" in window)) {
    counters.forEach((el) => (el.textContent = el.dataset.countTo));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.dataset.countTo);
      const suffix = el.dataset.countSuffix || "";
      const prefix = el.dataset.countPrefix || "";
      const dur = 1400;
      const start = performance.now();

      const step = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      io.unobserve(el);
    });
  }, { threshold: 0.4 });

  counters.forEach((el) => io.observe(el));
}

/* ---------- 7. Hero video under reduced motion ---------- */
function initHeroVideo() {
  const video = document.querySelector("[data-hero-video]");
  if (!video || !reduced) return;
  // Freeze on the poster frame rather than looping behind the copy.
  video.removeAttribute("autoplay");
  video.pause();
  video.removeAttribute("loop");
}

function init() {
  initReveal();
  initHeroVideo();
  initScrollParallax();
  initCursorParallax();
  initNav();
  initStepper();
  initCounters();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
