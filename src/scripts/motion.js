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

/* ---------- 5. How-it-works scroll conveyor ---------- */
/* Three stations — bottom-right (next, small), centre (current, large),
   top-left (previous, small). Every card travels the whole path, so step 2
   grows out of the bottom-right corner as step 1 shrinks into the top-left.
   A dwell at each end of a segment gives the snap: the card sits still at
   centre for a beat, then moves quickly to the next station.

   The section still ships as a plain stacked list; this only takes over when
   there is room for it and the user has not asked for reduced motion. */
function initStepper() {
  const root = document.querySelector("[data-stepper]");
  if (!root) return;

  const track = root.querySelector("[data-step-track]");
  const frame = root.querySelector("[data-step-frame]");
  const cards = [...root.querySelectorAll("[data-step-card]")];
  const copies = [...root.querySelectorAll("[data-step-copy]")];
  const triggers = [...root.querySelectorAll("[data-step-trigger]")];

  const n = cards.length;
  if (!track || !frame || n < 2) return;

  root.style.setProperty("--hiw-steps", String(n));

  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

  /* --- where the corner stations sit, in px from the frame centre --- */
  const CORNER_SCALE = 0.19;
  let geom = null;

  const measure = () => {
    const fw = frame.clientWidth;
    const fh = frame.clientHeight;
    const cw = cards[0].offsetWidth;
    const ch = cards[0].offsetHeight;
    if (!fw || !fh || !cw || !ch) return (geom = null);
    // A card is centred on the frame, so a station offset is the distance
    // from that centre to where the shrunken card's own centre should land.
    const halfW = (cw * CORNER_SCALE) / 2;
    const halfH = (ch * CORNER_SCALE) / 2;
    geom = {
      tlx: halfW - fw / 2,
      tly: halfH - fh / 2,
      brx: fw / 2 - halfW,
      bry: fh / 2 - halfH,
    };
  };

  let current = -1;
  const select = (i) => {
    if (i === current) return;
    current = i;
    triggers.forEach((t, k) => {
      t.classList.toggle("is-active", k === i);
      if (k === i) t.setAttribute("aria-current", "step");
      else t.removeAttribute("aria-current");
    });
  };

  /* flow is a continuous station index: 0 = card 0 centred, 1 = card 1
     centred, and so on. pos = flow - i is where card i sits right now:
     0 centre, +1 top-left, -1 bottom-right. */
  const render = (flow) => {
    if (!geom) return;

    cards.forEach((card, i) => {
      const pos = flow - i;
      const a = Math.min(Math.abs(pos), 1);
      const scale = 1 + (CORNER_SCALE - 1) * a;
      const dx = a * (pos > 0 ? geom.tlx : geom.brx);
      const dy = a * (pos > 0 ? geom.tly : geom.bry);

      card.style.transform =
        `translate(-50%, -50%) translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${scale.toFixed(4)})`;
      // Cards more than a station away have nowhere to be — fade them out
      // rather than stacking them in a corner.
      card.style.opacity = clamp((1.55 - Math.abs(pos)) / 0.55, 0, 1).toFixed(3);
      card.style.zIndex = String(50 - Math.round(Math.abs(pos) * 10));
    });

    copies.forEach((copy, i) => {
      const pos = flow - i;
      copy.style.opacity = clamp(1 - Math.abs(pos) * 2.4, 0, 1).toFixed(3);
      copy.style.transform = `translateY(${(pos * 18).toFixed(1)}px)`;
    });

    select(clamp(Math.round(flow), 0, n - 1));
  };

  /* --- stacked mode: a gentle scale-up as each card nears the middle --- */
  const renderStacked = () => {
    const vh = window.innerHeight;
    cards.forEach((card) => {
      const r = card.getBoundingClientRect();
      const dist = Math.abs(r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
      card.style.transform = `scale(${(0.93 + 0.07 * clamp(1 - dist, 0, 1)).toFixed(3)})`;
    });
  };

  const runway = () => track.offsetHeight - window.innerHeight;

  // Hold at each station for a beat, then move quickly — that pause is what
  // reads as the snap.
  const DWELL = 0.22;

  const flowFromScroll = () => {
    const total = runway();
    if (total <= 0) return 0;
    const scrolled = clamp(-track.getBoundingClientRect().top, 0, total);
    const raw = (scrolled / total) * (n - 1);
    const seg = Math.min(Math.floor(raw), n - 2);
    const f = raw - seg;
    const t = clamp((f - DWELL) / (1 - 2 * DWELL), 0, 1);
    return seg + t * t * (3 - 2 * t); // smoothstep
  };

  let pinned = false;
  let ticking = false;

  const update = () => {
    ticking = false;
    if (pinned) render(flowFromScroll());
    else renderStacked();
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  const canPin = () =>
    !reduced &&
    window.matchMedia("(min-width: 901px)").matches &&
    window.matchMedia("(min-height: 620px)").matches;

  const clearInline = () => {
    [...cards, ...copies].forEach((el) => {
      el.style.transform = "";
      el.style.opacity = "";
      el.style.zIndex = "";
    });
  };

  const setMode = () => {
    const want = canPin();
    if (want === pinned) return;
    pinned = want;
    clearInline();
    root.classList.toggle("is-pinned", pinned);
    current = -1;
    // Reading layout after the class flip, so the new sizes are in place.
    requestAnimationFrame(() => {
      if (pinned) measure();
      update();
    });
  };

  triggers.forEach((t, i) => {
    t.addEventListener("click", () => {
      if (!pinned) {
        cards[i].scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      const total = runway();
      if (total <= 0) return;
      const top = track.getBoundingClientRect().top + window.scrollY;
      // flow === i sits at raw === i, i.e. the middle of that station's dwell.
      window.scrollTo({ top: top + (i / (n - 1)) * total, behavior: "smooth" });
    });
  });

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener(
    "resize",
    () => {
      setMode();
      if (pinned) measure();
      onScroll();
    },
    { passive: true }
  );
  // Card heights are viewport-derived, so re-measure once images have laid out.
  window.addEventListener("load", () => {
    if (pinned) measure();
    onScroll();
  });

  setMode();
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
