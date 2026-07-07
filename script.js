(function () {
  const root = document.body;
  const canTrackPointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (canTrackPointer && !prefersReducedMotion) {
    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let lightX = pointerX;
    let lightY = pointerY;
    let frameId = 0;

    const updateSpotlight = () => {
      lightX += (pointerX - lightX) * 0.18;
      lightY += (pointerY - lightY) * 0.18;

      root.style.setProperty("--spotlight-x", `${lightX.toFixed(1)}px`);
      root.style.setProperty("--spotlight-y", `${lightY.toFixed(1)}px`);

      frameId = requestAnimationFrame(updateSpotlight);
    };

    window.addEventListener(
      "pointermove",
      (event) => {
        pointerX = event.clientX;
        pointerY = event.clientY;

        if (!frameId) {
          frameId = requestAnimationFrame(updateSpotlight);
        }
      },
      { passive: true }
    );
  }

  const heroStage = document.querySelector(".hero-stage");

  if (heroStage) {
    const updateHeroState = () => {
      const rect = heroStage.getBoundingClientRect();
      const header = document.querySelector(".site-header");
      const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
      const scrollableDistance = Math.max(1, rect.height - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / scrollableDistance));
      const heroHasExited = rect.bottom <= headerBottom + 1;

      heroStage.classList.toggle("is-stack-visible", progress > 0.36 && !heroHasExited);
    };

    updateHeroState();
    window.addEventListener("scroll", updateHeroState, { passive: true });
    window.addEventListener("resize", updateHeroState);
  }

  const navLinks = Array.from(document.querySelectorAll(".nav a"));
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  const observer = new IntersectionObserver(
    (entries) => {
      const current = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!current) return;

      navLinks.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${current.target.id}`);
      });
    },
    { rootMargin: "-25% 0px -60% 0px", threshold: [0.1, 0.35, 0.6] }
  );

  sections.forEach((section) => observer.observe(section));
})();
