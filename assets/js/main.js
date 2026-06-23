const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");
const siteHeader = document.getElementById("siteHeader");
const heroMedia = document.querySelector(".hero-media");
const hero = document.querySelector(".hero");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let parallaxFrame = null;

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

const navigationEntry = performance.getEntriesByType("navigation")[0];
const isReload = navigationEntry?.type === "reload";

if (isReload) {
  window.scrollTo(0, 0);
}

function setMenu(open) {
  navLinks.classList.toggle("open", open);
  document.body.classList.toggle("menu-open", open);
  menuBtn.setAttribute("aria-expanded", String(open));
}

function applyParallax() {
  parallaxFrame = null;

  if (!heroMedia || !hero || prefersReducedMotion.matches) {
    return;
  }

  const rect = hero.getBoundingClientRect();
  const maxShift = Math.max(0, hero.offsetHeight * 0.28);
  const rawShift = -rect.top * 0.28;
  const shift = Math.min(maxShift, Math.max(0, rawShift));
  heroMedia.style.transform = `translateY(${shift}px)`;
}

function requestParallaxUpdate() {
  if (parallaxFrame !== null) {
    return;
  }

  parallaxFrame = window.requestAnimationFrame(applyParallax);
}

function syncMotionPreference() {
  document.querySelectorAll("video").forEach((video) => {
    if (prefersReducedMotion.matches) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  });

  if (prefersReducedMotion.matches && heroMedia) {
    heroMedia.style.transform = "";
  } else {
    requestParallaxUpdate();
  }
}

function markMediaLoaded(media, failed = false) {
  const shell = media.closest(".media-shell");
  if (!shell) {
    return;
  }

  shell.classList.remove("is-loading");
  shell.classList.add("is-loaded");

  if (failed) {
    shell.classList.add("is-error");
  }
}

function initMediaLoading() {
  document.querySelectorAll(".media-shell img").forEach((image) => {
    if (image.complete && image.naturalWidth > 0) {
      markMediaLoaded(image);
      return;
    }

    image.addEventListener("load", () => markMediaLoaded(image), { once: true });
    image.addEventListener("error", () => markMediaLoaded(image, true), { once: true });
  });

  document.querySelectorAll(".media-shell video").forEach((video) => {
    if (video.readyState >= 2) {
      markMediaLoaded(video);
      return;
    }

    video.addEventListener("loadeddata", () => markMediaLoaded(video), { once: true });
    video.addEventListener("canplay", () => markMediaLoaded(video), { once: true });
    video.addEventListener("error", () => markMediaLoaded(video, true), { once: true });
  });
}

function initReveal() {
  const revealItems = document.querySelectorAll(".reveal, .reveal-group");

  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  revealItems.forEach((item) => observer.observe(item));
}

function initActiveNav() {
  const sections = document.querySelectorAll("section[id]");
  const links = navLinks.querySelectorAll("a[href^='#']");

  if (!sections.length || !links.length || !("IntersectionObserver" in window)) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        links.forEach((link) => {
          const isActive = link.getAttribute("href") === `#${entry.target.id}`;
          link.classList.toggle("active", isActive);
        });
      });
    },
    { rootMargin: "-40% 0px -40% 0px" }
  );

  sections.forEach((section) => observer.observe(section));
}

menuBtn.addEventListener("click", () => {
  setMenu(!navLinks.classList.contains("open"));
});

navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setMenu(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setMenu(false);
  }
});

window.addEventListener(
  "scroll",
  () => {
    siteHeader.classList.toggle("scrolled", window.scrollY > 12);
    requestParallaxUpdate();
  },
  { passive: true }
);

window.addEventListener("resize", requestParallaxUpdate);

window.addEventListener("pageshow", (event) => {
  if (event.persisted || isReload) {
    window.scrollTo(0, 0);
  }

  requestParallaxUpdate();
});

window.addEventListener("beforeunload", () => {
  window.scrollTo(0, 0);
});

prefersReducedMotion.addEventListener("change", syncMotionPreference);

document.addEventListener("DOMContentLoaded", () => {
  if (isReload) {
    window.scrollTo(0, 0);
  }

  initMediaLoading();
  initReveal();
  initActiveNav();
  syncMotionPreference();
  requestParallaxUpdate();
});
