// PROTOTYPE - throwaway. Do not ship.
// Six variants of the projects page, switchable via ?variant=A..F, on the existing projects.html.
// Without ?variant= in the URL this file does nothing, and the page stays as it is.
(() => {
  const params = new URLSearchParams(location.search);
  const key = (params.get("variant") || "").toUpperCase();
  if (!key) return;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const h = (html) => {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };

  // Read the project data from the sections that are already on the page.
  const projects = $$(".pj").map((s) => {
    const cap = $(".pj-capsule", s);
    return {
      id: s.id,
      name: s.dataset.name,
      tagline: s.dataset.tagline,
      kind: $$(".pj-crumbs > span:not([aria-hidden])", s).pop().textContent.trim(),
      lead: $(".pj-lead", s).innerHTML,
      facts: $$(".pj-facts > div", s).map((d) => ({ k: $("dt", d).textContent, v: $("dd", d).innerHTML })),
      stack: $(".stack-list", s).innerHTML,
      links: $(".pj-links", s) ? $(".pj-links", s).innerHTML : "",
      capsule: cap.getAttribute("src"),
      contain: cap.classList.contains("pj-capsule--contain"),
      media: $$(".pj-thumb", s).map((b) => ({
        src: b.dataset.src,
        thumb: $("img", b).getAttribute("src"),
        alt: $("img", b).alt,
        cap: b.dataset.cap || "",
        video: b.hasAttribute("data-video"),
        poster: b.dataset.poster || "",
        tall: b.hasAttribute("data-tall"),
      })),
      features: $$(".pj-feature", s).map((f) => ({
        img: $(".pj-shot img", f).getAttribute("src"),
        pos: $(".pj-shot", f).style.getPropertyValue("--pos").trim(),
        phone: $(".pj-shot", f).classList.contains("pj-shot--phone"),
        title: $("h3", f).textContent,
        text: $("p", f).innerHTML,
      })),
      note: $(".pj-note", s) ? $(".pj-note", s).innerHTML : "",
    };
  });

  const date = (p) => p.facts[0].v;
  const pad = (n) => String(n).padStart(2, "0");
  const factsHtml = (p, cls = "") =>
    `<dl class="pv-facts ${cls}">${p.facts.map((f) => `<div><dt>${f.k}</dt><dd>${f.v}</dd></div>`).join("")}</dl>`;
  const countHtml = (p) => {
    const v = p.media.filter((m) => m.video).length;
    const s = p.media.length - v;
    return `${s} screens${v ? " + video" : ""}`;
  };

  // Shared media viewer: a stage, a caption and a row of thumbnails.
  // Each variant places these parts with its own CSS.
  const viewer = (p, cls = "") => {
    const el = h(`
      <div class="pv-viewer ${cls}">
        <div class="pv-stage"><div class="pv-media"></div>
          <button class="pv-arrow pv-arrow--prev" type="button" aria-label="Previous screenshot">&#8249;</button>
          <button class="pv-arrow pv-arrow--next" type="button" aria-label="Next screenshot">&#8250;</button>
        </div>
        <p class="pv-cap" aria-live="polite"><span></span><span></span></p>
        <div class="pv-thumbs">${p.media
          .map(
            (m, i) =>
              `<button class="pv-thumb${m.video ? " is-video" : ""}" type="button" data-i="${i}"><img src="${m.thumb}" alt="${m.alt}" loading="lazy"></button>`,
          )
          .join("")}</div>
      </div>`);
    const media = $(".pv-media", el);
    const [capText, capCount] = $$(".pv-cap span", el);
    const thumbs = $$(".pv-thumb", el);
    const strip = $(".pv-thumbs", el);
    let current = 0;

    const show = (i, play) => {
      current = (i + p.media.length) % p.media.length;
      const m = p.media[current];
      let node;
      if (m.video) {
        node = document.createElement("video");
        Object.assign(node, { src: m.src, poster: m.poster, controls: true, playsInline: true, preload: "metadata", autoplay: !!play });
      } else {
        node = document.createElement("img");
        node.src = m.src;
        node.alt = m.alt;
        if (m.tall) node.className = "is-tall";
      }
      media.replaceChildren(node);
      capText.textContent = m.cap;
      capCount.textContent = `${current + 1} / ${p.media.length}`;
      thumbs.forEach((t, j) => t.setAttribute("aria-current", j === current ? "true" : "false"));
      const t = thumbs[current];
      if (strip.scrollWidth > strip.clientWidth) strip.scrollLeft = t.offsetLeft - (strip.clientWidth - t.offsetWidth) / 2;
      if (strip.scrollHeight > strip.clientHeight) strip.scrollTop = t.offsetTop - (strip.clientHeight - t.offsetHeight) / 2;
    };

    thumbs.forEach((t, i) => t.addEventListener("click", () => show(i, true)));
    $(".pv-arrow--prev", el).addEventListener("click", () => show(current - 1));
    $(".pv-arrow--next", el).addEventListener("click", () => show(current + 1));
    show(0, false);
    return el;
  };

  const pauseAll = (root) => $$("video", root).forEach((v) => v.pause());

  // ---------------------------------------------------------------------------
  // Variant A - Long read: all projects on one page, a sticky numbered index.
  // ---------------------------------------------------------------------------
  const VariantA = () => {
    const root = h(`
      <div class="pv-a">
        <header class="pv-a__intro">
          <h1>Projects</h1>
          <p>Five things I built, with screenshots and video. Scroll down, or select one in the list.</p>
        </header>
        <div class="pv-a__body">
          <nav class="pv-a__index" aria-label="Projects">
            <p>Contents</p>
            <ol>${projects.map((p, i) => `<li><a href="#${p.id}" data-id="${p.id}"><span>${pad(i + 1)}</span>${p.name}</a></li>`).join("")}</ol>
          </nav>
          <div class="pv-a__chapters"></div>
        </div>
      </div>`);
    const chapters = $(".pv-a__chapters", root);

    projects.forEach((p, i) => {
      const ch = h(`
        <article class="pv-a__ch" id="pv-${p.id}">
          <p class="pv-a__kicker"><span>${pad(i + 1)}</span>${p.kind} &middot; ${date(p)}</p>
          <h2>${p.name}</h2>
          <p class="pv-a__tagline">${p.tagline}</p>
          <div class="pv-a__media"></div>
          <div class="pv-a__text">
            <div>
              <p class="pv-a__lead">${p.lead}</p>
              <ul class="pv-a__features">${p.features.map((f) => `<li><h3>${f.title}</h3><p>${f.text}</p></li>`).join("")}</ul>
            </div>
            <aside>
              ${factsHtml(p)}
              <div class="stack-list">${p.stack}</div>
              <div class="pv-links">${p.links}</div>
            </aside>
          </div>
          ${p.note ? `<p class="pv-note">${p.note}</p>` : ""}
        </article>`);
      $(".pv-a__media", ch).append(viewer(p, "pv-viewer--row"));
      chapters.append(ch);
    });

    // Index links scroll to the chapter. Scroll position sets the active link.
    const links = $$(".pv-a__index a", root);
    links.forEach((a) =>
      a.addEventListener("click", (e) => {
        e.preventDefault();
        $(`#pv-${a.dataset.id}`).scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", `${location.search}#${a.dataset.id}`);
      }),
    );
    const spy = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const id = en.target.id.slice(3);
          links.forEach((a) => a.classList.toggle("is-active", a.dataset.id === id));
        }),
      { rootMargin: "-40% 0px -55% 0px" },
    );
    requestAnimationFrame(() => $$(".pv-a__ch", root).forEach((c) => spy.observe(c)));
    return root;
  };
  VariantA.label = "Long read";

  // ---------------------------------------------------------------------------
  // Variant B - Shelf: a grid of cover cards. A card opens the project in an overlay.
  // ---------------------------------------------------------------------------
  const VariantB = () => {
    const root = h(`
      <div class="pv-b">
        <header class="pv-b__intro">
          <h1>Projects</h1>
          <p>Select a project to see the screenshots, the video and the notes.</p>
        </header>
        <div class="pv-b__grid">${projects
          .map(
            (p, i) => `
          <button class="pv-b__card${i === 0 ? " is-feature" : ""}" type="button" data-i="${i}">
            <span class="pv-b__cover${p.contain ? " is-contain" : ""}"><img src="${p.capsule}" alt="" loading="lazy"></span>
            <span class="pv-b__meta">
              <span class="pv-b__kind">${p.kind} &middot; ${date(p)}</span>
              <span class="pv-b__name">${p.name}</span>
              <span class="pv-b__tagline">${p.tagline}</span>
              <span class="pv-b__count">${countHtml(p)}</span>
            </span>
          </button>`,
          )
          .join("")}</div>
        <dialog class="pv-b__dialog" aria-label="Project"></dialog>
      </div>`);
    const dialog = $("dialog", root);

    const open = (i) => {
      const n = projects.length;
      i = (i + n) % n;
      const p = projects[i];
      pauseAll(dialog);
      dialog.innerHTML = "";
      const body = h(`
        <div class="pv-b__sheet">
          <div class="pv-b__bar">
            <div>
              <p class="pv-b__kind">${p.kind} &middot; ${date(p)}</p>
              <h2>${p.name}</h2>
            </div>
            <div class="pv-b__nav">
              <button type="button" data-go="-1" aria-label="Previous project">&#8592; ${projects[(i - 1 + n) % n].name}</button>
              <button type="button" data-go="1" aria-label="Next project">${projects[(i + 1) % n].name} &#8594;</button>
              <button type="button" class="pv-b__close" aria-label="Close">&#10005;</button>
            </div>
          </div>
          <div class="pv-b__view"></div>
          <div class="pv-b__info">
            <p class="pv-b__lead">${p.lead}</p>
            <div>
              ${factsHtml(p)}
              <div class="stack-list">${p.stack}</div>
              <div class="pv-links">${p.links}</div>
            </div>
          </div>
          <div class="pv-b__features">${p.features
            .map(
              (f) => `
            <article>
              <div class="pv-shot${f.phone ? " pv-shot--phone" : ""}"${f.pos ? ` style="--pos:${f.pos}"` : ""}><img src="${f.img}" alt="" loading="lazy"></div>
              <h3>${f.title}</h3><p>${f.text}</p>
            </article>`,
            )
            .join("")}</div>
          ${p.note ? `<p class="pv-note">${p.note}</p>` : ""}
        </div>`);
      $(".pv-b__view", body).append(viewer(p, "pv-viewer--side"));
      $$("[data-go]", body).forEach((b) => b.addEventListener("click", () => open(i + Number(b.dataset.go))));
      $(".pv-b__close", body).addEventListener("click", () => dialog.close());
      dialog.append(body);
      if (!dialog.open) dialog.showModal();
      dialog.scrollTop = 0;
      history.replaceState(null, "", `${location.search}#${p.id}`);
    };

    $$(".pv-b__card", root).forEach((c) => c.addEventListener("click", () => open(Number(c.dataset.i))));
    dialog.addEventListener("close", () => {
      pauseAll(dialog);
      history.replaceState(null, "", location.search);
    });
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) dialog.close();
    });
    const start = projects.findIndex((p) => `#${p.id}` === location.hash);
    if (start >= 0) requestAnimationFrame(() => open(start));
    return root;
  };
  VariantB.label = "Shelf + overlay";

  // ---------------------------------------------------------------------------
  // Variant C - Split view: a project list on the left, the selected project on the right.
  // ---------------------------------------------------------------------------
  const VariantC = () => {
    const root = h(`
      <div class="pv-c">
        <nav class="pv-c__list" aria-label="Projects">
          <p>Projects <span>${projects.length}</span></p>
          ${projects
            .map(
              (p) => `
            <button type="button" data-id="${p.id}">
              <span class="pv-c__icon${p.contain ? " is-contain" : ""}"><img src="${p.capsule}" alt="" loading="lazy"></span>
              <span class="pv-c__name">${p.name}</span>
              <span class="pv-c__tag">${p.tagline}</span>
            </button>`,
            )
            .join("")}
        </nav>
        <div class="pv-c__detail" aria-live="polite"></div>
      </div>`);
    const detail = $(".pv-c__detail", root);
    const buttons = $$(".pv-c__list button", root);

    const select = (id, scroll) => {
      const i = Math.max(0, projects.findIndex((p) => p.id === id));
      const p = projects[i];
      const next = projects[(i + 1) % projects.length];
      pauseAll(detail);
      buttons.forEach((b) => b.setAttribute("aria-current", b.dataset.id === p.id ? "true" : "false"));
      detail.replaceChildren(
        h(`
        <article class="pv-c__project">
          <header>
            <p class="pv-c__kind">${p.kind}</p>
            <h1>${p.name}</h1>
            <p class="pv-c__lead">${p.lead}</p>
          </header>
          <div class="pv-c__view"></div>
          ${factsHtml(p, "pv-facts--tiles")}
          <div class="pv-c__row">
            <div class="stack-list">${p.stack}</div>
            <div class="pv-links">${p.links}</div>
          </div>
          <div class="pv-c__features">${p.features
            .map(
              (f) => `
            <article>
              <div class="pv-shot${f.phone ? " pv-shot--phone" : ""}"${f.pos ? ` style="--pos:${f.pos}"` : ""}><img src="${f.img}" alt="" loading="lazy"></div>
              <div><h3>${f.title}</h3><p>${f.text}</p></div>
            </article>`,
            )
            .join("")}</div>
          ${p.note ? `<p class="pv-note">${p.note}</p>` : ""}
          <button class="pv-c__next" type="button" data-id="${next.id}">Next: ${next.name} <span>&#8594;</span></button>
        </article>`),
      );
      $(".pv-c__view", detail).append(viewer(p, "pv-viewer--film"));
      $(".pv-c__next", detail).addEventListener("click", () => select(next.id, true));
      history.replaceState(null, "", `${location.search}#${p.id}`);
      if (scroll) window.scrollTo({ top: 0, behavior: "smooth" });
    };

    buttons.forEach((b) => b.addEventListener("click", () => select(b.dataset.id, window.innerWidth < 820)));
    select(location.hash.slice(1), false);
    return root;
  };
  VariantC.label = "Split view";

  // ===========================================================================
  // Variants D, E, F - a technical showcase.
  // Readers: recruiters, programmers and peers. They want a quick look at how
  // hard each project is, and a way to read more. So each project leads with
  // the architecture, the hard problems and the decisions. Screens come last.
  // Sources: each repo's README, ARCHITECTURE.md, ADRs and the CV.
  // ===========================================================================
  const TECH = {
    "open-transcribe": {
      what: "A Windows desktop app that changes speech into text in any app. It reuses the ChatGPT login of the Codex CLI, so it needs no API key.",
      langs: ["TypeScript", "Rust", "Win32 FFI"],
      hard: "Hotkey-to-recording latency, held to a budget in CI",
      size: "~5.4k lines",
      glance: [
        ["Code", "~5,400 lines of TypeScript (Bun) and Rust (Tauri)"],
        ["Runs as", "A Tauri shell and a Bun sidecar"],
        ["Tests", "A startup-latency budget that runs in Windows CI"],
      ],
      flows: [
        {
          title: "One press of the shortcut",
          nodes: [
            { n: "Global shortcut", t: "Rust, Tauri", d: "Ctrl+Shift+Space, held down" },
            { n: "Sidecar", t: "TypeScript, Bun", d: "Opens a recording for each press" },
            { n: "Microphone capture", t: "WinMM via bun:ffi", d: "24 kHz mono PCM. ffmpeg is the fallback" },
            { n: "Transcribe", t: "HTTPS multipart upload", d: "ChatGPT token, refreshed before it expires" },
            { n: "Paste", t: "Win32 via bun:ffi", d: "Into the window that has focus" },
          ],
          edges: ["key down", "open device", "WAV bytes", "text"],
        },
      ],
      problems: [
        {
          q: "Recording must start when the key goes down",
          a: "Starting ffmpeg and a DirectShow graph for each press adds delay. On 64-bit Windows the app captures audio directly through WinMM with <code>bun:ffi</code>. It reports “recording” only after the first audio buffer arrives.",
          r: "A CI test presses the shortcut 15 times. It fails above 200 ms for the first press, 75 ms median or 150 ms p90. A control run with 250 ms of added delay proves that the test catches slow code.",
        },
        {
          q: "Use a ChatGPT plan, not an API key",
          a: "The app reads the OAuth tokens that <code>codex login</code> writes to disk. It refreshes the access token 60 seconds before it expires, so a token cannot expire in the middle of a recording.",
          r: "No API key, and no charge for each minute.",
        },
        {
          q: "Bad audio must not become bad text",
          a: "WinMM can cut device names at 31 UTF-16 units, so native capture needs a unique, exact name match. Other devices use ffmpeg. If the buffer queue runs dry, the app rejects the recording instead of uploading audio with gaps. It never sends silence, because the model then invents text.",
        },
      ],
      decisions: [
        { c: "Native WinMM capture", o: "ffmpeg for each press", w: "No process start on the hotkey path. ffmpeg stays for long device names and for the CLI." },
        { c: "The upload route", o: "the realtime WebRTC route", w: "The Codex desktop microphone uses the upload route. The realtime route returned 404 for a period. <code>--stream</code> keeps WebRTC as an option." },
        { c: "Paste through the clipboard", o: "typing the keys", w: "The app pastes, waits 500 ms, then puts the old clipboard back." },
      ],
      docs: [
        ["Architecture notes", "https://github.com/kelpikz/open-transcribe/blob/master/ARCHITECTURE.md"],
        ["Startup budget", "https://github.com/kelpikz/open-transcribe/blob/master/docs/startup-performance.md"],
      ],
    },
    shelf: {
      what: "A self-hosted server for static sites. A Rust CLI uploads a folder. A Go server puts it online at a path. It runs live at files.ajitha.fyi.",
      langs: ["Go", "Rust", "SQLite"],
      hard: "Untrusted HTML next to the admin page: an origin boundary",
      size: "~9.4k lines · ~200 tests",
      glance: [
        ["Code", "~9,400 lines: a Go server and a Rust CLI"],
        ["Tests", "~200 (94 Go, 107 Rust). CI also runs lint and a Docker build"],
        ["Runs as", "One Go process, one SQLite file, one Docker image"],
        ["Status", "Live at files.ajitha.fyi"],
      ],
      flows: [
        {
          title: "An upload, from the terminal to the disk",
          nodes: [
            { n: "shelf CLI", t: "Rust", d: "Upload checks, then one archive" },
            { n: "nginx", t: "HTTPS", d: "Two hosts: Sites and Admin" },
            { n: "shelf server", t: "Go", d: "Checks Origin on each admin POST" },
            { n: "Storage", t: "SQLite and files", d: "One data volume" },
          ],
          edges: ["API + key", "proxy", "read / write"],
        },
      ],
      problems: [
        {
          q: "Uploaded HTML must not act as the Owner",
          a: "On one domain, a script in any Site has the same power as the Owner. So the Admin page and the API live on their own domain. The browser sends a real <code>Origin</code> header that scripts cannot change, and the server rejects admin POSTs from other origins. <code>SameSite</code> cookies do not help, because both hosts are the same site.",
          r: "The accepted risk is written down: a script can read Private Sites through the view-only cookie, but it cannot change anything.",
        },
        {
          q: "One Owner, and no sign-up",
          a: "GitHub OAuth checks the configured numeric account ID and the verified email before it makes a session. The CLI logs in through the browser, like <code>gh auth login</code>, and gets one key for each computer. The Owner can cancel each key on the Admin page.",
          r: "Sessions store no GitHub ID. Only the login flow checks it.",
        },
        {
          q: "Catch mistakes before they go live",
          a: "Before an upload, the CLI finds broken links, links that start with <code>/</code>, and secrets such as API keys. The server limits the archive to 10 MiB, and to 50 MiB after it unpacks. An upload to a path in use replaces the Site in one step.",
        },
      ],
      decisions: [
        { c: "Admin on its own domain", o: "one domain, or a subdomain for each Site", w: "One domain is unsafe. A subdomain for each Site needs wildcard DNS and certificates, and the URLs change." },
        { c: "A one-level admin host name", o: "a two-level name", w: "The free Cloudflare certificate does not cover two-level names." },
      ],
      docs: [["How it works (README)", "https://github.com/kelpikz/shelf#how-it-works"]],
    },
    claudemonitor: {
      what: "A Windows tray app that shows how much of the Claude and Codex usage limits is left. It is native Win32 from Python, and ships as two portable .exe files.",
      langs: ["Python", "Win32 ctypes", "SQLite"],
      hard: "Correct cost totals from messy local logs, drawn natively",
      size: "~27k lines · 1,000+ tests",
      glance: [
        ["Code", "~27,000 lines of Python"],
        ["Tests", "1,000+ automated tests"],
        ["Runs as", "Two portable .exe files (PyInstaller). No Python needed"],
      ],
      flows: [
        {
          title: "Limits, every 30 seconds",
          nodes: [
            { n: "Poll loop", t: "Python", d: "Every 30 s, or on Refresh" },
            { n: "Fetchers", t: "Claude and Codex APIs", d: "Use the sign-ins the CLIs made" },
            { n: "Processor", t: "Pydantic models", d: "Finds the provider with least left" },
            { n: "Tray and taskbar", t: "Win32 via ctypes", d: "Icon colour, tooltip, one line each" },
          ],
          edges: ["OAuth", "usage data", "display state"],
        },
        {
          title: "Cost, on demand",
          nodes: [
            { n: "Local logs", t: "JSONL", d: "Claude Code and Codex sessions" },
            { n: "Parser and pricing", t: "Background worker", d: "Removes repeated snapshots" },
            { n: "Cache", t: "SQLite", d: "Token counts only. No prompts" },
            { n: "Usage tab", t: "Pillow", d: "Charts drawn natively" },
          ],
          edges: ["read", "normalised usage", "totals"],
        },
      ],
      problems: [
        {
          q: "Read two providers without API keys",
          a: "The app reads the OAuth sign-ins that Claude Code and the Codex CLI already made. It polls both every 30 seconds. One tray icon takes the colour of the provider with the least 5-hour usage left.",
        },
        {
          q: "Rich charts in a native app",
          a: "A WebView needs a browser runtime inside a portable .exe. So the Usage tab uses native Windows controls, and Pillow draws the charts and the tables.",
          r: "Two portable .exe files, and no Python needed.",
        },
        {
          q: "Correct cost totals from messy logs",
          a: "A background worker reads the JSONL logs. It removes repeated response snapshots and cumulative counters before it adds them up. The results go to a SQLite cache, without prompts. A model with no known price shows “unavailable”, not zero.",
        },
      ],
      decisions: [
        { c: "Native Win32 and Pillow", o: "an embedded WebView", w: "No browser runtime in a portable app. The parser and the cache can serve a WebView later." },
        { c: "Flat modules with Pydantic contracts", o: "a folder for each layer", w: "Fetch, process, display. Each layer can change alone if the model stays the same." },
        { c: "Show gaps as gaps", o: "a line across missing data", w: "A failed fetch keeps the last good reading with its age. Readings are kept for 31 days." },
      ],
      docs: [["Releases", "https://github.com/kelpikz/ClaudeMonitor/releases"]],
    },
    dpay: {
      what: "A cashless payment system for the food stalls at the NIT Trichy fest. Students paid from a phone wallet. Each stall saw its orders live.",
      langs: ["Python", "FastAPI", "PostgreSQL", "Go"],
      hard: "No double spending under fest-rush concurrency",
      size: "Rs. 18 lakh+ in 3 days",
      glance: [
        ["Scale", "Rs. 18,00,000+ in three days, with zero incidents"],
        ["Runs as", "FastAPI and PostgreSQL, a Go relay, a React PWA, in Docker"],
      ],
      flows: [
        {
          title: "A payment at a stall",
          nodes: [
            { n: "Wallet app", t: "React, TypeScript PWA", d: "Scan the QR code, enter the PIN" },
            { n: "Payments API", t: "Python, FastAPI", d: "One transaction for each payment" },
            { n: "Ledger", t: "PostgreSQL", d: "A debit and a credit for each payment" },
          ],
          edges: ["pay request", "SQL transaction"],
        },
        {
          title: "The order reaches the stall",
          nodes: [
            { n: "Payments API", t: "Python, FastAPI", d: "Payment done" },
            { n: "Order relay", t: "Go", d: "Sends each new order" },
            { n: "Stall screen", t: "React", d: "The order shows at once" },
          ],
          edges: ["new order", "WebSocket"],
        },
      ],
      problems: [
        {
          q: "No double spending when the queue is long",
          a: "Each payment runs in one database transaction. It locks the wallet row, checks the balance, and writes a debit and a credit. The payment is fully done, or it is not done.",
          r: "Rs. 18,00,000+ in three days, with zero incidents.",
        },
        {
          q: "Prove it before the fest",
          a: "I wrote a load-testing tool in Go. It sends many payments at the same time, like the peak rush, to check the performance under load before launch.",
        },
        {
          q: "Stalls must see orders at once",
          a: "A Go service sends each new order to the stall screen over a WebSocket.",
        },
      ],
      decisions: [
        { c: "A double-entry ledger", o: "one balance column", w: "Each payment writes two entries, so each rupee can be traced." },
      ],
      docs: [["Project page (Delta Force)", "https://delta.nitt.edu/projects/dpay"]],
    },
    utopia: {
      what: "A 2D pixel-art copy of the NIT Trichy campus. During the lockdown, new students walked it together, chatted and called each other.",
      langs: ["Go", "Redis", "WebSockets", "Phaser"],
      hard: "Live positions for 100+ players at the same time",
      size: "100+ concurrent users",
      glance: [
        ["Scale", "100+ users at the same time"],
        ["Runs as", "A Go WebSocket server with Redis, a Phaser and React client, in Docker"],
      ],
      flows: [
        {
          title: "A player moves",
          nodes: [
            { n: "Game client", t: "Phaser and React", d: "Custom React reconciler" },
            { n: "Realtime server", t: "Go", d: "Goroutines for the connections" },
            { n: "Shared state", t: "Redis", d: "Live positions" },
            { n: "Other players", t: "WebSocket", d: "See the move live" },
          ],
          edges: ["move", "update", "broadcast"],
        },
      ],
      problems: [
        {
          q: "Live positions for 100+ players at once",
          a: "A Go server keeps one WebSocket for each player and uses goroutines for the connections. Redis shares the live positions, and the server sends each move to the other players.",
          r: "100+ users at the same time, during Orientation '21.",
        },
        {
          q: "Phaser and React in one interface",
          a: "Phaser draws the game. React draws the chat and the menus. A custom React reconciler lets React code drive Phaser objects, so the game and the interface use one component model.",
        },
        {
          q: "A campus that people know",
          a: "The map is the real campus: the main gate, Admin, Octa, Orion, LHC, the Library, the Barn and NSO. Four minigames have leaderboards. Chat and video calls are in the game.",
        },
      ],
      decisions: [],
      docs: [["Project page (Delta Force)", "https://delta.nitt.edu/projects/utopia"]],
    },
  };

  const pick = (p) => {
    const shots = p.media.filter((m) => !m.video);
    return { shots, video: p.media.find((m) => m.video) };
  };
  const current = () => Math.max(0, projects.findIndex((p) => `#${p.id}` === location.hash));
  const nextOf = (i) => projects[(i + 1) % projects.length];
  const factRows = (p) => p.facts.filter((f) => /^(Date|Role|Team|Event)$/.test(f.k)).map((f) => [f.k, f.v]);
  const glanceDl = (p, t, cls = "") =>
    `<dl class="tx-dl ${cls}">${[...t.glance, ...factRows(p)].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>`;

  // The code link comes from the project's own links. The docs come from TECH.
  const linksOf = (p, t) => {
    const box = h(`<div>${p.links || ""}</div>`);
    const own = box ? $$("a", box).map((a) => [a.textContent.trim(), a.href]) : [];
    return [...own, ...t.docs];
  };
  const linkList = (p, t, cls = "") =>
    `<ul class="tx-links ${cls}">${linksOf(p, t)
      .map(([label, href]) => `<li><a href="${href}" target="_blank" rel="noopener noreferrer">${label} <span aria-hidden="true">&#8599;</span></a></li>`)
      .join("")}</ul>`;

  // A flow as boxes and labelled arrows. Across on a wide screen, down on a phone.
  const flowHtml = (f) => `
    <figure class="tx-flow">
      <figcaption>${f.title}</figcaption>
      <ol>${f.nodes
        .map(
          (nd, k) =>
            `<li class="tx-node"><b>${nd.n}</b><span>${nd.t}</span><small>${nd.d}</small></li>` +
            (k < f.edges.length ? `<li class="tx-edge" aria-label="then: ${f.edges[k]}"><span>${f.edges[k]}</span></li>` : ""),
        )
        .join("")}</ol>
    </figure>`;

  // The same flow as a text diagram, for the design-doc variant.
  // Plain ASCII only: the web font has no box-drawing characters, so those would come from another font and not line up.
  const wrapText = (s, w) =>
    s.split(" ").reduce((lines, word) => {
      const last = lines[lines.length - 1];
      if (last && (last + " " + word).length <= w) lines[lines.length - 1] = last + " " + word;
      else lines.push(word);
      return lines;
    }, []);
  const asciiFlow = (f) => {
    const W = 32;
    const out = [];
    f.nodes.forEach((nd, k) => {
      out.push("+" + "-".repeat(W + 2) + "+");
      [...wrapText(nd.n.toUpperCase(), W), ...wrapText(nd.t, W), ...wrapText(nd.d, W)].forEach((s) =>
        out.push("| " + s.padEnd(W) + " |"),
      );
      out.push("+" + "-".repeat(W + 2) + "+");
      if (k < f.edges.length) {
        const mid = " ".repeat(Math.floor((W + 4) / 2));
        out.push(mid + "|  " + f.edges[k]);
        out.push(mid + "v");
      }
    });
    return out.join("\n");
  };

  const problemsHtml = (t, cls = "") =>
    `<ol class="tx-probs ${cls}">${t.problems
      .map(
        (pr, k) => `<li>
          <span class="tx-num">${pad(k + 1)}</span>
          <div>
            <h3>${pr.q}</h3>
            <p>${pr.a}</p>
            ${pr.r ? `<p class="tx-result"><span>Result</span>${pr.r}</p>` : ""}
          </div>
        </li>`,
      )
      .join("")}</ol>`;

  const decisionsHtml = (t) =>
    t.decisions.length
      ? `<div class="tx-decs">${t.decisions
          .map((d) => `<div class="tx-dec"><p class="tx-dec__c">${d.c}</p><p class="tx-dec__o">instead of ${d.o}</p><p class="tx-dec__w">${d.w}</p></div>`)
          .join("")}</div>`
      : "";

  // Screens are last and small. A screen opens large in a dialog. The trailer loads only on click.
  const playBtn = (v) =>
    `<button class="tx-play" type="button" data-video="${v.src}" aria-label="Play: ${v.alt}">
      <img src="${v.poster}" alt="" loading="lazy"><span><i aria-hidden="true">&#9654;</i>Trailer</span>
    </button>`;
  const shotBtn = (m) =>
    `<button class="tx-shot${m.tall ? " is-tall" : ""}" type="button" data-src="${m.src}" aria-label="Open: ${m.alt}"><img src="${m.thumb}" alt="${m.alt}" loading="lazy"></button>`;
  const screensHtml = (p, figs = false) => {
    const { shots, video } = pick(p);
    let n = 0;
    const fig = (inner, cap) => (figs ? `<figure>${inner}<figcaption>Fig. ${++n}. ${cap}</figcaption></figure>` : `<div>${inner}</div>`);
    return `<div class="tx-screens${figs ? " tx-screens--figs" : ""}">
      ${video ? fig(playBtn(video), video.cap) : ""}
      ${shots.map((m) => fig(shotBtn(m), m.cap)).join("")}
    </div>`;
  };

  const picker = (i) =>
    `<nav class="tx-picker" aria-label="Projects">${projects
      .map((q, j) => `<button type="button" data-go="${j}"${j === i ? ' aria-current="true"' : ""}>${q.name}</button>`)
      .join("")}</nav>`;

  const lightbox = (root) => {
    const dlg = h(`<dialog class="tx-lightbox" aria-label="Screenshot">
        <button type="button" class="tx-lightbox__close" aria-label="Close">&#10005;</button>
        <img alt="">
      </dialog>`);
    root.append(dlg);
    $(".tx-lightbox__close", dlg).addEventListener("click", () => dlg.close());
    dlg.addEventListener("click", (e) => e.target === dlg && dlg.close());
  };
  // Added once on the root: the trailer, the screens and in-page jumps.
  const rootClicks = (root) =>
    root.addEventListener("click", (e) => {
      const jump = e.target.closest("[data-jump]");
      if (jump) {
        e.preventDefault();
        const to = root.querySelector(jump.getAttribute("href"));
        if (to) to.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      const play = e.target.closest(".tx-play");
      if (play) {
        const v = document.createElement("video");
        Object.assign(v, { src: play.dataset.video, controls: true, playsInline: true, autoplay: true, className: "tx-video" });
        v.setAttribute("aria-label", play.getAttribute("aria-label").replace(/^Play: /, ""));
        play.replaceWith(v);
        return;
      }
      const b = e.target.closest(".tx-shot");
      const dlg = $(".tx-lightbox", root);
      if (!b || !dlg) return;
      const img = $("img", dlg);
      img.src = b.dataset.src;
      img.alt = $("img", b).alt;
      img.classList.toggle("is-tall", b.classList.contains("is-tall"));
      dlg.showModal();
    });

  // One shell for the one-project-at-a-time variants (D and F).
  const oneAtATime = (cls, build) => () => {
    const root = h(`<div class="tx ${cls}"></div>`);
    rootClicks(root);
    const render = (i, scroll) => {
      pauseAll(root);
      root.innerHTML = build(projects[i], TECH[projects[i].id], i, nextOf(i));
      lightbox(root);
      $$("[data-go]", root).forEach((b) =>
        b.addEventListener("click", (e) => {
          e.preventDefault();
          render(Number(b.dataset.go), true);
        }),
      );
      history.replaceState(null, "", `${location.search}#${projects[i].id}`);
      if (scroll) window.scrollTo({ top: 0 });
    };
    render(current(), false);
    return root;
  };

  // ---------------------------------------------------------------------------
  // Variant D - Spec sheet. One project at a time. The top shows what it is
  // and the numbers. Then the architecture, the hard problems, the decisions.
  // ---------------------------------------------------------------------------
  const VariantD = oneAtATime("tx-d", (p, t, i, next) => `
    ${picker(i)}
    <header class="tx-d__head">
      <div class="tx-d__intro">
        <p class="tx-kicker">${pad(i + 1)} / ${pad(projects.length)} &middot; ${p.kind}</p>
        <h1>${p.name}</h1>
        <p class="tx-what">${t.what}</p>
        <div class="stack-list">${p.stack}</div>
        ${linkList(p, t)}
      </div>
      <aside class="tx-glance" aria-label="At a glance">
        <p class="tx-label">At a glance</p>
        ${glanceDl(p, t)}
      </aside>
    </header>
    <section class="tx-sec">
      <h2><span>01</span>How it works</h2>
      <div class="tx-flows">${t.flows.map(flowHtml).join("")}</div>
    </section>
    <section class="tx-sec">
      <h2><span>02</span>Hard problems</h2>
      ${problemsHtml(t)}
    </section>
    ${t.decisions.length ? `<section class="tx-sec"><h2><span>03</span>Decisions</h2>${decisionsHtml(t)}</section>` : ""}
    <section class="tx-sec">
      <h2><span>${t.decisions.length ? "04" : "03"}</span>Screens</h2>
      ${screensHtml(p)}
      ${p.note ? `<p class="tx-note">${p.note}</p>` : ""}
    </section>
    <a class="tx-next" href="#${next.id}" data-go="${projects.indexOf(next)}">
      <span>Next project</span><b>${next.name}</b><small>${TECH[next.id].hard}</small>
    </a>`);
  VariantD.label = "Tech: spec sheet";

  // ---------------------------------------------------------------------------
  // Variant E - Index. All five projects in one table: the stack, the hardest
  // part and the size. Open a row to read the architecture and the problems.
  // ---------------------------------------------------------------------------
  const VariantE = () => {
    const open = location.hash.slice(1);
    const root = h(`
      <div class="tx tx-e">
        <header class="tx-e__head">
          <p class="tx-kicker">Projects &middot; ${projects.length}</p>
          <h1>What I have built, and the hard parts</h1>
          <p class="tx-what">One row for each project: the stack, the hardest problem and the size. Open a row to see the architecture, how I solved each problem, and the screens.</p>
        </header>
        <div class="tx-e__cols" aria-hidden="true"><span>Project</span><span>Stack</span><span>Hardest part</span><span>Size</span></div>
        ${projects
          .map((p) => {
            const t = TECH[p.id];
            return `<details class="tx-e__row" id="${p.id}"${p.id === open ? " open" : ""}>
              <summary>
                <span class="tx-e__name"><b>${p.name}</b><small>${p.kind} &middot; ${p.facts[0].v}</small></span>
                <span class="tx-e__stack">${t.langs.map((l) => `<i>${l}</i>`).join("")}</span>
                <span class="tx-e__hard">${t.hard}</span>
                <span class="tx-e__size">${t.size}</span>
                <span class="tx-e__chev" aria-hidden="true"></span>
              </summary>
              <div class="tx-e__body">
                <div class="tx-e__top">
                  <div>
                    <p class="tx-what">${t.what}</p>
                    ${linkList(p, t)}
                  </div>
                  ${glanceDl(p, t, "tx-dl--compact")}
                </div>
                <h3 class="tx-e__h">How it works</h3>
                <div class="tx-flows">${t.flows.map(flowHtml).join("")}</div>
                <h3 class="tx-e__h">Hard problems</h3>
                ${problemsHtml(t, "tx-probs--compact")}
                ${t.decisions.length ? `<h3 class="tx-e__h">Decisions</h3>${decisionsHtml(t)}` : ""}
                <h3 class="tx-e__h">Screens</h3>
                ${screensHtml(p)}
              </div>
            </details>`;
          })
          .join("")}
      </div>`);
    rootClicks(root);
    lightbox(root);
    $$(".tx-e__row", root).forEach((d) =>
      d.addEventListener("toggle", () => {
        if (!d.open) {
          pauseAll(d);
          return;
        }
        history.replaceState(null, "", `${location.search}#${d.id}`);
      }),
    );
    // projects.js scrolls to the top on load when there is a hash, so scroll to the open row after that.
    const toOpen = () => {
      const row = open && root.querySelector(`#${CSS.escape(open)}`);
      if (row) row.scrollIntoView({ block: "start", behavior: "instant" });
    };
    if (document.readyState === "complete") requestAnimationFrame(toOpen);
    else window.addEventListener("load", () => setTimeout(toOpen, 0));
    return root;
  };
  VariantE.label = "Tech: index table";

  // ---------------------------------------------------------------------------
  // Variant F - Design doc. One project at a time, written like an engineering
  // design doc: numbered sections, text diagrams, figures with captions.
  // ---------------------------------------------------------------------------
  const VariantF = oneAtATime("tx-f", (p, t, i, next) => {
    const secs = [
      ["f-context", "Context"],
      ["f-arch", "Architecture"],
      ["f-problems", "Problems and solutions"],
      ...(t.decisions.length ? [["f-decisions", "Decisions"]] : []),
      ["f-screens", "Screens"],
    ];
    const num = (id) => secs.findIndex((s) => s[0] === id) + 1;
    return `
    <div class="tx-f__grid">
      <aside class="tx-f__side">
        <p class="tx-label">Projects</p>
        <nav class="tx-f__projects" aria-label="Projects">${projects
          .map((q, j) => `<button type="button" data-go="${j}"${j === i ? ' aria-current="true"' : ""}><span>${pad(j + 1)}</span>${q.name}</button>`)
          .join("")}</nav>
        <p class="tx-label">On this page</p>
        <ol class="tx-f__toc">${secs.map(([id, label], k) => `<li><a href="#${id}" data-jump><span>${k + 1}.</span>${label}</a></li>`).join("")}</ol>
      </aside>
      <article class="tx-f__doc">
        <p class="tx-kicker">Design notes &middot; ${p.kind}</p>
        <h1>${p.name}</h1>
        <dl class="tx-f__meta">${[...factRows(p), ...t.glance.filter(([k]) => /Code|Tests|Scale|Status/.test(k))]
          .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`)
          .join("")}</dl>

        <h2 id="f-context"><span>${num("f-context")}.</span>Context</h2>
        <p class="tx-what">${t.what}</p>
        <div class="stack-list">${p.stack}</div>

        <h2 id="f-arch"><span>${num("f-arch")}.</span>Architecture</h2>
        <div class="tx-f__diagrams">${t.flows
          .map((f, k) => `<figure><pre class="tx-ascii" role="img" aria-label="${f.title}: ${f.nodes.map((n) => n.n).join(", then ")}">${asciiFlow(f)}</pre><figcaption>Diagram ${k + 1}. ${f.title}.</figcaption></figure>`)
          .join("")}</div>

        <h2 id="f-problems"><span>${num("f-problems")}.</span>Problems and solutions</h2>
        ${t.problems
          .map(
            (pr, k) => `<section class="tx-f__prob">
              <h3><span>${num("f-problems")}.${k + 1}</span>${pr.q}</h3>
              <p><b>Approach.</b> ${pr.a}</p>
              ${pr.r ? `<p><b>Result.</b> ${pr.r}</p>` : ""}
            </section>`,
          )
          .join("")}

        ${
          t.decisions.length
            ? `<h2 id="f-decisions"><span>${num("f-decisions")}.</span>Decisions</h2>
          <div class="tx-f__table"><table>
            <thead><tr><th>Decision</th><th>Instead of</th><th>Why</th></tr></thead>
            <tbody>${t.decisions.map((d) => `<tr><td>${d.c}</td><td>${d.o}</td><td>${d.w}</td></tr>`).join("")}</tbody>
          </table></div>`
            : ""
        }

        <h2 id="f-screens"><span>${num("f-screens")}.</span>Screens</h2>
        ${screensHtml(p, true)}
        ${p.note ? `<p class="tx-note">${p.note}</p>` : ""}

        <h2 class="tx-f__links-h">Links</h2>
        ${linkList(p, t)}

        <a class="tx-next" href="#${next.id}" data-go="${projects.indexOf(next)}">
          <span>Next project</span><b>${next.name}</b><small>${TECH[next.id].hard}</small>
        </a>
      </article>
    </div>`;
  });
  VariantF.label = "Tech: design doc";

  // ---------------------------------------------------------------------------
  // Switcher
  // ---------------------------------------------------------------------------
  const variants = { A: VariantA, B: VariantB, C: VariantC, D: VariantD, E: VariantE, F: VariantF };
  const keys = Object.keys(variants);
  const active = variants[key] ? key : "A";

  // Take the current page out and put the variant in its place.
  const main = $("main.page");
  $$(".pj, .pj-picker", main).forEach((el) => {
    pauseAll(el);
    el.remove();
  });
  main.prepend(variants[active]());
  document.body.classList.add(`pv-on`, `pv-on--${active}`);
  document.title = `[${active}] Projects - Ajitha Prasad`;

  const go = (step) => {
    const next = keys[(keys.indexOf(active) + step + keys.length) % keys.length];
    const url = new URL(location.href);
    url.searchParams.set("variant", next);
    url.hash = location.hash;
    location.replace(url);
  };

  const bar = h(`
    <div class="proto-switcher" role="toolbar" aria-label="Prototype variant switcher">
      <button type="button" aria-label="Previous variant">&#8592;</button>
      <span>${active} &mdash; ${variants[active].label}</span>
      <button type="button" aria-label="Next variant">&#8594;</button>
    </div>`);
  const [prevBtn, nextBtn] = $$("button", bar);
  prevBtn.addEventListener("click", () => go(-1));
  nextBtn.addEventListener("click", () => go(1));
  document.body.append(bar);

  document.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const t = e.target;
    if (t.closest && t.closest("input, textarea, [contenteditable], video, dialog[open]")) return;
    if ($("dialog[open]")) return;
    go(e.key === "ArrowLeft" ? -1 : 1);
  });
})();
