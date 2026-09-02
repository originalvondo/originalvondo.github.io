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
const audio = new Audio();
let playlist = [];
let currentTrackIndex = -1;
let isSeeking = false;

const sectionCache = new Map();
let playerControlsBound = false;
const blobUrlsToRevoke = new Set();

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function fmtTime(sec) {
  if (!isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function initGlobalVisibility() {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && !audio.paused) audio.pause();
  });

  window.addEventListener("pagehide", () => {
    audio.pause();
    audio.src = "";
    blobUrlsToRevoke.forEach((url) => URL.revokeObjectURL(url));
    blobUrlsToRevoke.clear();
  });
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
    case "music": await initMusic(); break;
  }
}

function runShowHooks(name) {
  $$(".nav-item").forEach((el) => el.classList.toggle("active", el.dataset.target === name));

  if (name === "music") syncPlayerUIOnShow();
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

async function initMusic() {
  if (playlist.length > 0) return;

  let container = $("#playlist-container");

  if (!container) {
    await new Promise((r) => requestAnimationFrame(r));
    container = $("#playlist-container");
  }

  if (!container) {
    const contentArea = $("#content-area");
    if (contentArea) {
      container = document.createElement("div");
      container.id = "playlist-container";
      container.className = "playlist-container";
      contentArea.appendChild(container);
    }
  }

  if (!container) {
    const contentArea = $("#content-area");
    const msg = `[Music] FATAL: #playlist-container not found in DOM. Check sections/music.html for a playlist container.`;
    console.error(msg);
    if (contentArea) {
      contentArea.innerHTML = `<div style="color:red; padding:2rem; font-family:monospace;">
        <b>Music Init Failed:</b> The playlist container could not be created.
        <br>Please refresh the page or reload the music section.
      </div>`;
    }
    return;
  }

  container.innerHTML = '<div class="mono-text" style="text-align:center; grid-column:1/-1;">Loading library...</div>';

  const isLocal = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
  const baseUrl = isLocal ? "" : `https://${CONFIG.githubUsername}.github.io`;
  const manifestUrl = `${baseUrl}/media/music/music.json`;

  try {
    const musicData = await (await fetch(manifestUrl)).json();

    const allTracksQueue = [];
    for (const [playlistName, songs] of Object.entries(musicData)) {
      songs.forEach((path) =>
        allTracksQueue.push({
          playlistName,
          url: isLocal ? path : `${baseUrl}/${path}`,
          name: path.split("/").pop(),
        }),
      );
    }

    if (!allTracksQueue.length) {
      container.innerHTML = `<p class="mono-text">No tracks found.</p>`;
      return;
    }

    container.innerHTML = "";
    playlist = [];
    currentTrackIndex = -1;

    await loadTrackInstant(allTracksQueue[0], 0);
    scheduleBackgroundProcessing(allTracksQueue);
    bindPlayerControls();
  } catch (e) {
    console.error(e);
    container.innerHTML = `<p class="mono-text" style="color:red;">Error: ${e.message}</p>`;
  }
}

function loadTrackInstant(item, index) {
  return new Promise((resolve) => {
    currentTrackIndex = index;
    audio.src = item.url;
    audio.load();

    const fallbackTitle = item.name.replace(/\.mp3$/i, "");
    $("#player-title").textContent = fallbackTitle;
    $("#player-artist").textContent = "Loading...";
    $("#player-cover").src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"/%3E';
    $("#dur-time").textContent = "0:00";
    $("#seek-bar").value = 0;

    const onPlay = () => { cleanup(); resolve(); };
    const onErr = () => { cleanup(); console.error("Instant play failed:", item.url); resolve(); };
    const cleanup = () => { audio.removeEventListener("play", onPlay); audio.removeEventListener("error", onErr); };

    audio.addEventListener("play", onPlay, { once: true });
    audio.addEventListener("error", onErr, { once: true });
    audio.play().catch(() => {});

    audio.addEventListener("loadedmetadata", () => {
      const dur = audio.duration;
      $("#dur-time").textContent = fmtTime(dur);
      const li = document.querySelector(`.track-item[data-playlist-index="${index}"]`);
      if (li) li.querySelector(".track-duration").textContent = fmtTime(dur);
    }, { once: true });
  });
}

function scheduleBackgroundProcessing(queue) {
  (async () => {
    for (let i = 0; i < queue.length; i++) {
      const track = await processAndRenderTrack(queue[i], i);

      if (i === currentTrackIndex && track) {
        $("#player-title").textContent = track.title;
        $("#player-artist").textContent = track.artist;
        $("#player-cover").src = track.cover;
        if (track.duration) $("#dur-time").textContent = fmtTime(track.duration);
      }

      await new Promise((r) =>
        window.requestIdleCallback ? requestIdleCallback(r, { timeout: 1000 }) : setTimeout(r, 0)
      );
    }
  })();
}

async function processAndRenderTrack(item, targetIndex) {
  const meta = await readID3Metadata(item.url);

  const track = {
    file: item.url,
    title: meta.title || item.name.replace(/\.mp3$/i, ""),
    artist: meta.artist || "Unknown Artist",
    cover: meta.cover || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"/%3E',
    duration: meta.duration,
    playlistName: item.playlistName,
  };

  playlist.push(track);
  await renderTrackInDOM(track, targetIndex, item.playlistName);

  const li = document.querySelector(`.track-item[data-playlist-index="${targetIndex}"]`);
  li.querySelector(".track-duration").textContent = fmtTime(track.duration);

  return track;
}

function probeDuration(url) {
  return new Promise((resolve) => {
    const probe = new Audio();
    probe.preload = "metadata";
    probe.src = url;

    const cleanup = () => {
      probe.removeEventListener("loadedmetadata", onMeta);
      probe.removeEventListener("error", onErr);
      probe.src = "";
    };
    const onMeta = () => { cleanup(); resolve(probe.duration || 0); };
    const onErr = () => { cleanup(); resolve(0); };

    probe.addEventListener("loadedmetadata", onMeta, { once: true });
    probe.addEventListener("error", onErr, { once: true });
    probe.load();
  });
}

function readID3Metadata(url) {
  return new Promise(async (resolve) => {
    try {
      const absoluteURL = new URL(url, window.location.href).href;

      const check = await fetch(absoluteURL, { method: "HEAD", cache: "no-store" }).catch(() => ({ ok: false }));
      if (!check.ok) return resolve({});

      window.jsmediatags.read(absoluteURL, {
        onSuccess: (tag) => {
          const { title, artist, picture, TLEN } = tag.tags || {};
          let coverURL = null;
          if (picture) {
            const blob = new Blob([new Uint8Array(picture.data)], { type: picture.format });
            coverURL = URL.createObjectURL(blob);
            blobUrlsToRevoke.add(coverURL);
          }
          let duration = 0;
          if (TLEN) {
            const ms = parseInt(TLEN.data, 10);
            if (!isNaN(ms)) duration = ms / 1000;
          }
          resolve({ title, artist, cover: coverURL, duration });
        },
        onError: () => resolve({}),
      });
    } catch (e) { resolve({}); }
  });
}

function renderTrackInDOM(track, index, playlistName) {
  const container = $("#playlist-container");
  let header = container.querySelector(`.playlist-header[data-name="${escapeHTML(playlistName)}"]`);
  let ul;

  if (!header) {
    header = document.createElement("h3");
    header.className = "playlist-header serif-title";
    header.dataset.name = escapeHTML(playlistName);
    header.style.cssText = "font-size:1.5rem;margin:2rem 0 1rem;border-bottom:1px solid var(--accent-blue);display:inline-block;text-transform:lowercase;";
    header.textContent = playlistName;
    container.appendChild(header);

    ul = document.createElement("ul");
    ul.className = "playlist";
    ul.dataset.playlistName = escapeHTML(playlistName);
    container.appendChild(ul);
  } else {
    ul = header.nextElementSibling;
  }

  const li = document.createElement("li");
  li.className = "track-item";
  li.dataset.playlistIndex = index;
  li.innerHTML = `
    <img class="track-art" src="${track.cover}" alt="">
    <div class="track-info">
      <div class="track-title">${escapeHTML(track.title)}</div>
      <div class="track-artist">${escapeHTML(track.artist)}</div>
    </div>
    <span class="track-duration mono-text">${fmtTime(track.duration || 0)}</span>
  `;

  li.addEventListener("click", () => {
    const idx = parseInt(li.dataset.playlistIndex, 10);
    if (!isNaN(idx)) loadTrack(idx, true);
  });
  ul.appendChild(li);
}

function syncPlayerUIOnShow() {
  if (currentTrackIndex === -1 || !playlist.length) return;
  const track = playlist[currentTrackIndex];
  $("#player-title").textContent = track.title;
  $("#player-artist").textContent = track.artist;
  $("#player-cover").src = track.cover;
  $("#dur-time").textContent = fmtTime(audio.duration || track.duration || 0);
  $("#cur-time").textContent = fmtTime(audio.currentTime);
  $("#seek-bar").value = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
  updatePlayPauseBtn();
}

function loadTrack(index, autoplay = false) {
  if (!playlist.length || index < 0 || index >= playlist.length) return;

  currentTrackIndex = index;
  const track = playlist[index];

  audio.src = track.file;
  audio.load();

  $("#player-title").textContent = track.title;
  $("#player-artist").textContent = track.artist;
  $("#player-cover").src = track.cover;

  audio.addEventListener("loadedmetadata", () => {
    $("#dur-time").textContent = fmtTime(audio.duration);
    const li = document.querySelector(`.track-item[data-playlist-index="${index}"]`);
    if (li) li.querySelector(".track-duration").textContent = fmtTime(audio.duration);
  }, { once: true });

  document.querySelectorAll(".playlist li").forEach((el, i) => el.classList.toggle("active", i === index));

  if (autoplay) audio.play().catch(() => {});
  updatePlayPauseBtn();
}

function bindPlayerControls() {
  if (playerControlsBound) return;
  playerControlsBound = true;

  $("#btn-play").addEventListener("click", () => (!audio.src && playlist.length ? loadTrack(0, true) : audio.play()));
  $("#btn-pause").addEventListener("click", () => audio.pause());
  $("#btn-prev").addEventListener("click", () => loadTrack((currentTrackIndex - 1 + playlist.length) % playlist.length, true));
  $("#btn-next").addEventListener("click", () => loadTrack((currentTrackIndex + 1) % playlist.length, true));

  $("#seek-bar").addEventListener("input", (e) => { if (audio.duration) audio.currentTime = (e.target.value / 100) * audio.duration; });
  $("#vol-bar").addEventListener("input", (e) => (audio.volume = +e.target.value));

  document.addEventListener("keydown", (e) => {
    if (currentSection !== "music" || e.target.matches("input, textarea")) return;
    if (e.code === "Space") { e.preventDefault(); audio.paused ? audio.play() : audio.pause(); }
    else if (e.code === "ArrowRight") { e.preventDefault(); audio.currentTime = Math.min(audio.duration, audio.currentTime + 5); }
    else if (e.code === "ArrowLeft") { e.preventDefault(); audio.currentTime = Math.max(0, audio.currentTime - 5); }
    else if (e.code === "ArrowUp") { e.preventDefault(); audio.volume = Math.min(1, audio.volume + 0.05); $("#vol-bar").value = audio.volume; }
    else if (e.code === "ArrowDown") { e.preventDefault(); audio.volume = Math.max(0, audio.volume - 0.05); $("#vol-bar").value = audio.volume; }
    else if (e.shiftKey && e.code === "ArrowRight") { loadTrack((currentTrackIndex + 1) % playlist.length, true); }
    else if (e.shiftKey && e.code === "ArrowLeft") { loadTrack((currentTrackIndex - 1 + playlist.length) % playlist.length, true); }
  });
}

function onTimeUpdate() {
  if (isSeeking) return;
  const cur = audio.currentTime, dur = audio.duration || 0;
  $("#cur-time").textContent = fmtTime(cur);
  $("#seek-bar").value = dur ? (cur / dur) * 100 : 0;
}

function onTrackEnded() { loadTrack((currentTrackIndex + 1) % playlist.length, true); }

function updatePlayPauseBtn() {
  const playing = !audio.paused;
  $("#btn-play").classList.toggle("hidden", playing);
  $("#btn-pause").classList.toggle("hidden", !playing);
  $("#music-player").classList.toggle("playing", playing);
}

audio.addEventListener("play", updatePlayPauseBtn);
audio.addEventListener("pause", updatePlayPauseBtn);
audio.addEventListener("timeupdate", onTimeUpdate);
audio.addEventListener("ended", onTrackEnded);

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initLightbox();
  initGlobalVisibility();
});
