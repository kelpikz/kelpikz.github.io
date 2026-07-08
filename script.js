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

  const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

  if (isTouchDevice && !prefersReducedMotion && window.DeviceOrientationEvent) {
    const maxTiltDeg = 22;
    let centerX = window.innerWidth / 2;
    let centerY = window.innerHeight / 2;
    let targetX = centerX;
    let targetY = centerY;
    let lightX = centerX;
    let lightY = centerY;
    let frameId = 0;
    let baseBeta = null;
    let baseGamma = null;

    const updateSpotlight = () => {
      lightX += (targetX - lightX) * 0.12;
      lightY += (targetY - lightY) * 0.12;

      root.style.setProperty("--spotlight-x", `${lightX.toFixed(1)}px`);
      root.style.setProperty("--spotlight-y", `${lightY.toFixed(1)}px`);

      frameId = requestAnimationFrame(updateSpotlight);
    };

    const handleOrientation = (event) => {
      const { beta, gamma } = event;
      if (beta === null || gamma === null) return;

      if (baseBeta === null) {
        baseBeta = beta;
        baseGamma = gamma;
      }

      const tiltX = Math.max(-maxTiltDeg, Math.min(maxTiltDeg, gamma - baseGamma));
      const tiltY = Math.max(-maxTiltDeg, Math.min(maxTiltDeg, beta - baseBeta));

      targetX = centerX + (tiltX / maxTiltDeg) * (window.innerWidth * 0.4);
      targetY = centerY + (tiltY / maxTiltDeg) * (window.innerHeight * 0.4);

      if (!frameId) {
        frameId = requestAnimationFrame(updateSpotlight);
      }
    };

    const startTiltTracking = () => {
      window.addEventListener("deviceorientation", handleOrientation, { passive: true });
    };

    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      const requestTiltPermission = () => {
        document.removeEventListener("touchend", requestTiltPermission);
        DeviceOrientationEvent.requestPermission()
          .then((state) => {
            if (state === "granted") startTiltTracking();
          })
          .catch(() => {});
      };

      document.addEventListener("touchend", requestTiltPermission, { passive: true });
    } else {
      startTiltTracking();
    }

    window.addEventListener(
      "resize",
      () => {
        centerX = window.innerWidth / 2;
        centerY = window.innerHeight / 2;
      },
      { passive: true }
    );
  }

  if (isTouchDevice && !prefersReducedMotion) {
    const spawnRipple = (x, y) => {
      const ripple = document.createElement("span");
      ripple.className = "tap-ripple";
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      root.appendChild(ripple);

      requestAnimationFrame(() => {
        ripple.classList.add("is-active");
      });

      ripple.addEventListener("transitionend", () => ripple.remove(), { once: true });
    };

    document.addEventListener(
      "touchstart",
      (event) => {
        const touch = event.touches[0];
        if (!touch) return;
        spawnRipple(touch.clientX, touch.clientY);
      },
      { passive: true }
    );
  }

  if (isTouchDevice && !prefersReducedMotion) {
    const maxCardTiltDeg = 5;
    const tiltCards = Array.from(document.querySelectorAll(".project-item"));

    const updateCardTilt = (card, touch) => {
      const rect = card.getBoundingClientRect();
      const px = (touch.clientX - rect.left) / rect.width;
      const py = (touch.clientY - rect.top) / rect.height;

      const rx = (0.5 - py) * maxCardTiltDeg;
      const ry = (px - 0.5) * maxCardTiltDeg;

      card.style.setProperty("--card-rx", `${rx.toFixed(2)}deg`);
      card.style.setProperty("--card-ry", `${ry.toFixed(2)}deg`);
      card.style.setProperty("--card-glow-x", `${(px * 100).toFixed(1)}%`);
      card.style.setProperty("--card-glow-y", `${(py * 100).toFixed(1)}%`);
    };

    const resetCardTilt = (card) => {
      card.classList.remove("is-tilting");
      card.style.setProperty("--card-rx", "0deg");
      card.style.setProperty("--card-ry", "0deg");
    };

    tiltCards.forEach((card) => {
      card.addEventListener(
        "touchstart",
        (event) => {
          const touch = event.touches[0];
          if (!touch) return;
          card.classList.add("is-tilting");
          updateCardTilt(card, touch);
        },
        { passive: true }
      );

      card.addEventListener(
        "touchmove",
        (event) => {
          const touch = event.touches[0];
          if (!touch) return;
          updateCardTilt(card, touch);
        },
        { passive: true }
      );

      card.addEventListener("touchend", () => resetCardTilt(card), { passive: true });
      card.addEventListener("touchcancel", () => resetCardTilt(card), { passive: true });
    });
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
