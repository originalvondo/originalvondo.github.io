const CONFIG = {
  githubUsername: "originalvondo",
  repoOwner: "originalvondo",
  repoName: "originalvondo.github.io",
  excludeForks: true,
  maxRepos: 30,
  archiveCacheTTL: 3 * 24 * 60 * 60 * 1000,
  languageTags: {
    javascript: "JS",
    typescript: "TS",
    html: "HTML",
    css: "CSS",
    python: "Python",
    rust: "Rust",
    go: "Go",
    "c++": "C++",
    "c#": "C#",
    ruby: "Ruby",
  },
};

let currentSection = null;
const sectionCache = new Map();

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function loadSection(name) {
  const container = $("#content-area");

  if (currentSection && currentSection !== name) {
    const cache = sectionCache.get(currentSection) || {};
    cache.nodes = Array.from(container.childNodes);
    cache.scrollY = window.scrollY;
    cache.initialized = true;
    sectionCache.set(currentSection, cache);
  }

  const cached = sectionCache.get(name);
  if (cached?.initialized) {
    container.replaceChildren(...cached.nodes);
    window.scrollTo({ top: cached.scrollY || 0, behavior: "instant" });
    currentSection = name;
    runShowHooks(name);
    return;
  }

  container.innerHTML = `<div class="route-loading mono-text">loading ${name}…</div>`;

  try {
    const resp = await fetch(`sections/${name}.html`);
    if (!resp.ok) throw new Error(resp.statusText);
    container.innerHTML = await resp.text();
    currentSection = name;

    await runInitHooks(name);

    if (!sectionCache.has(name)) sectionCache.set(name, {});
    sectionCache.get(name).initialized = true;

    runShowHooks(name);
  } catch (e) {
    console.error("Section load failed", e);
    container.innerHTML = `<p class="mono-text" style="color:#b00;">Failed to load “${name}”.</p>`;
  }
}

async function runInitHooks(name) {
  switch (name) {
    case "home": initHome(); break;
    case "about": initGallery(); break;
    case "archive": await initArchive(); break;
  }
}

function runShowHooks(name) {
  $$(".nav-item").forEach((el) => el.classList.toggle("active", el.dataset.target === name));
}

function initNavigation() {
  $$(".nav-item").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      location.hash = link.dataset.target;
    });
  });

  window.addEventListener("hashchange", () => loadSection(location.hash.slice(1) || "home"));
  loadSection(location.hash.slice(1) || "home");
}

let lightbox, lbImg, lbCap, lbClose;

function initLightbox() {
  lightbox = $("#lightbox");
  lbImg = $("#lightbox-img");
  lbCap = $("#lightbox-caption");
  lbClose = $(".lightbox-close", lightbox);

  document.body.addEventListener("click", (e) => {
    const item = e.target.closest(".collage-item, .gallery-item");
    if (!item) return;
    const img = item.querySelector("img");
    const cap = item.querySelector(".item-caption, .gallery-caption");
    if (!img) return;
    lbImg.src = img.src;
    lbImg.alt = img.alt || "";
    lbCap.textContent = cap ? cap.textContent.trim() : "";
    lightbox.style.display = "flex";
    document.body.style.overflow = "hidden";
  });

  const close = () => {
    lightbox.style.display = "none";
    document.body.style.overflow = "";
  };
  lbClose?.addEventListener("click", close);
  lightbox?.addEventListener("click", (e) => {
    if (e.target === lightbox || e.target.classList.contains("lightbox-content-box")) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox?.style.display === "flex") close();
  });
}

function initHome() {}

function initGallery() {}

async function initArchive() {
  const loadingEl = $("#github-loading");
  const gridEl = $("#github-projects-grid");

  if (!CONFIG.githubUsername || CONFIG.githubUsername === "YOUR_GITHUB_USERNAME") {
    if (loadingEl) loadingEl.style.display = "none";
    if (gridEl) gridEl.innerHTML = `<p class="mono-text">Set CONFIG.githubUsername to enable.</p>`;
    return;
  }

  const cacheKey = `gh_repos_${CONFIG.githubUsername}`;
  let cached = null;
  try {
    const raw = localStorage.getItem(cacheKey);
    if (raw) cached = JSON.parse(raw);
  } catch (e) {}

  const isCacheValid = cached && cached.timestamp && (Date.now() - cached.timestamp < CONFIG.archiveCacheTTL);

  if (isCacheValid && Array.isArray(cached.data) && cached.data.length > 0) {
    if (loadingEl) loadingEl.style.display = "none";
    if (gridEl) {
      gridEl.innerHTML = "";
      cached.data.forEach((repo) => gridEl.appendChild(createProjectCard(repo)));
    }
    return;
  }

  try {
    const resp = await fetch(`https://api.github.com/users/${CONFIG.githubUsername}/repos?sort=updated&per_page=100`);
    if (!resp.ok) throw new Error(`GitHub API: ${resp.status} ${resp.statusText}`);

    let repos = await resp.json();
    if (CONFIG.excludeForks) repos = repos.filter((r) => !r.fork);
    repos = repos.slice(0, CONFIG.maxRepos);

    try {
      localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: repos }));
    } catch (e) {}

    if (loadingEl) loadingEl.style.display = "none";
    if (gridEl) {
      gridEl.innerHTML = "";
      repos.forEach((repo) => gridEl.appendChild(createProjectCard(repo)));
    }
  } catch (e) {
    console.error("Archive fetch failed:", e);

    if (cached && Array.isArray(cached.data) && cached.data.length > 0) {
      if (loadingEl) loadingEl.style.display = "none";
      if (gridEl) {
        gridEl.innerHTML = "";
        cached.data.forEach((repo) => gridEl.appendChild(createProjectCard(repo)));
      }
      return;
    }

    if (loadingEl) {
      loadingEl.innerHTML = `⚠️ Offline / fallback mode.`;
      loadingEl.style.color = "#7a7a7a";
    }

    if (gridEl) gridEl.innerHTML = `<p class="mono-text" style="color:#777;">Could not load repositories.</p>`;
  }
}

function createProjectCard(repo) {
  const card = document.createElement("div");
  card.className = "project-card";
  const langRaw = (repo.language || "").toLowerCase();
  const langTag = CONFIG.languageTags[langRaw] || repo.language || "Code";
  const year = new Date(repo.updated_at).getFullYear();
  const desc = repo.description || "No description provided.";
  const demoLink = repo.has_pages
    ? `<a href="https://${CONFIG.githubUsername}.github.io/${repo.name}/" target="_blank" class="project-link">Demo ↗</a>`
    : repo.homepage
      ? `<a href="${repo.homepage}" target="_blank" class="project-link">Demo ↗</a>`
      : "";

  card.innerHTML = `
    <div class="project-card-header"><span class="project-tag">${langTag}</span><span class="project-date">${year}</span></div>
    <h3 class="project-title">${repo.name}</h3>
    <p class="project-desc">${desc}</p>
    <div class="project-links"><a href="${repo.html_url}" target="_blank" class="project-link">Repo ↗</a>${demoLink}</div>`;
  return card;
}

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initLightbox();
});
