// Projects page: one project shows at a time. The URL hash selects it (#shelf, #dpay ...).
// The picker, the "Project x of y" count and the "Next project" row come from the section order.
const projects = Array.from(document.querySelectorAll(".pj"));
const picker = document.querySelector("[data-picker]");

projects.forEach((p, i) => {
  const next = projects[(i + 1) % projects.length];
  const isLast = i === projects.length - 1;

  const link = document.createElement("a");
  link.href = `#${p.id}`;
  link.textContent = p.dataset.name;
  picker.append(link);

  p.querySelector("[data-count]").innerHTML = `Project <b>${i + 1}</b> of ${projects.length}`;
  p.querySelector("[data-queue]").innerHTML = `
    <p>${isLast ? "That is the last project. Go back to" : "Up next:"} <b>${next.dataset.name}</b>${isLast ? "." : `, ${next.dataset.tagline}.`}</p>
    <a class="pj-next" href="#${next.id}"><span>${isLast ? "First project" : "Next project"}</span><small>${next.dataset.name}</small></a>`;
});

const showProject = (scroll) => {
  const id = location.hash.slice(1);
  const target = projects.find((p) => p.id === id) || projects[0];

  projects.forEach((p) => {
    p.hidden = p !== target;
    if (p.hidden) p.querySelectorAll("video").forEach((v) => v.pause());
  });

  picker.querySelectorAll("a").forEach((a) => {
    const on = a.getAttribute("href") === `#${target.id}`;
    a.classList.toggle("is-active", on);
    if (on) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  document.title = `${target.dataset.name} - Projects - Ajitha Prasad`;
  target.dispatchEvent(new Event("pj:show"));
  if (scroll) window.scrollTo({ top: 0, behavior: "auto" });
};

window.addEventListener("hashchange", () => showProject(true));
showProject(false);

// A link such as projects.html#shelf makes the browser jump to the section and hide the picker.
// Start at the top of the page instead.
if (location.hash) window.addEventListener("load", () => window.scrollTo(0, 0));

// Media viewer: a big stage that shows the selected thumbnail.
document.querySelectorAll("[data-gallery]").forEach((gallery) => {
  const stage = gallery.querySelector("[data-stage]");
  const capText = gallery.querySelector("[data-cap-text]");
  const capCount = gallery.querySelector("[data-cap-count]");
  const strip = gallery.querySelector(".pj-strip");
  const bar = gallery.querySelector(".pj-track span");
  const thumbs = Array.from(gallery.querySelectorAll(".pj-thumb"));

  const media = document.createElement("div");
  media.className = "pj-stage__media";
  stage.append(media);
  bar.style.width = `${100 / thumbs.length}%`;

  let current = 0;

  const centerThumb = () => {
    const thumb = thumbs[current];
    strip.scrollLeft = thumb.offsetLeft - strip.offsetLeft - (strip.clientWidth - thumb.offsetWidth) / 2;
  };

  const show = (index, play) => {
    current = (index + thumbs.length) % thumbs.length;
    const thumb = thumbs[current];
    let el;

    thumbs.forEach((b) => b.setAttribute("aria-current", b === thumb ? "true" : "false"));

    if (thumb.hasAttribute("data-video")) {
      el = document.createElement("video");
      el.src = thumb.dataset.src;
      el.poster = thumb.dataset.poster || "";
      el.controls = true;
      el.playsInline = true;
      el.preload = "metadata";
      if (play) el.autoplay = true;
    } else {
      el = document.createElement("img");
      el.src = thumb.dataset.src;
      el.alt = thumb.querySelector("img").alt;
      if (thumb.hasAttribute("data-tall")) el.className = "is-tall";
    }

    media.replaceChildren(el);
    capText.textContent = thumb.dataset.cap || "";
    capCount.textContent = `${current + 1} of ${thumbs.length}`;
    bar.style.transform = `translateX(${current * 100}%)`;
    centerThumb();
  };

  gallery.querySelector("[data-prev]").addEventListener("click", () => show(current - 1));
  gallery.querySelector("[data-next]").addEventListener("click", () => show(current + 1));
  thumbs.forEach((b, i) => b.addEventListener("click", () => show(i, true)));

  gallery.addEventListener("keydown", (event) => {
    if (event.target.tagName === "VIDEO") return;
    if (event.key === "ArrowRight") {
      show(current + 1);
      event.preventDefault();
    }
    if (event.key === "ArrowLeft") {
      show(current - 1);
      event.preventDefault();
    }
  });

  // A hidden project has no layout, so center the strip again when it shows.
  gallery.closest(".pj").addEventListener("pj:show", centerThumb);

  show(0, false);
});
