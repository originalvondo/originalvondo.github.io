/* ==========================================================================
   CONFIGURATION
   ========================================================================== */
const CONFIG = {
  githubUsername: "originalvondo",
  repoOwner: "originalvondo",
  repoName: "originalvondo.github.io",
  excludeForks: true,
  maxRepos: 15,
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

/* ==========================================================================
   GLOBAL STATE
   ========================================================================== */
let currentSection = null;          // Active section ID (matches hash)
const audio = new Audio();          // Single global audio instance for playback
let playlist = [];                  // Hydrated track objects: { file, title, artist, cover, duration, playlistName }
let currentTrackIndex = -1;         // Index of currently playing track in `playlist`
let isSeeking = false;              // True while user drags seek bar (prevents UI fight)

// Caching & Cleanup
const sectionCache = new Map();     // sectionName -> { nodes: Node[], scrollY: number, initialized: boolean }
let playerControlsBound = false;    // Guards against duplicate global listener attachment
const blobUrlsToRevoke = new Set(); // Tracks blob URLs from ID3 covers for revocation on unload

/* ==========================================================================
   UTILITIES
   ========================================================================== */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/** Formats seconds into M:SS string. */
function fmtTime(sec) {
  if (!isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/** Sanitizes string for safe HTML interpolation. */
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ==========================================================================
   CORE: PAGE LIFECYCLE (Visibility & Cleanup)
   ========================================================================== */
function initGlobalVisibility() {
  // Pause playback when document becomes hidden (tab switch, minimize)
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && !audio.paused) audio.pause();
  });

  // Hard cleanup on page unload/close (bfcache safe)
  window.addEventListener("pagehide", () => {
    audio.pause();
    audio.src = "";
    blobUrlsToRevoke.forEach((url) => URL.revokeObjectURL(url));
    blobUrlsToRevoke.clear();
  });
}

/* ==========================================================================
   CORE: SPA ROUTER WITH DOM CACHING
   ========================================================================== */
/**
 * Loads a section into #content-area.
 * Uses a DOM cache (sectionCache) to preserve state (scroll, inputs, listeners)
 * and enable instant transitions between sections.
 */
async function loadSection(name) {
  const container = $("#content-area");

  // 1. Persist current section to cache before unmounting
  if (currentSection && currentSection !== name) {
    const cache = sectionCache.get(currentSection) || {};
    cache.nodes = Array.from(container.childNodes);
    cache.scrollY = window.scrollY;
    cache.initialized = true;
    sectionCache.set(currentSection, cache);
  }

  // 2. Restore from cache if available
  const cached = sectionCache.get(name);
  if (cached?.initialized) {
    container.replaceChildren(...cached.nodes);
    window.scrollTo({ top: cached.scrollY || 0, behavior: "instant" });
    currentSection = name;
    runShowHooks(name);
    return;
  }

  // 3. Cache miss: Fetch HTML fragment
  container.innerHTML = `<div class="route-loading mono-text">loading ${name}…</div>`;

  try {
    const resp = await fetch(`sections/${name}.html`);
    if (!resp.ok) throw new Error(resp.statusText);
    container.innerHTML = await resp.text();
    currentSection = name;

    await runInitHooks(name); // Initialize section-specific logic

    // Mark as initialized for subsequent visits
    if (!sectionCache.has(name)) sectionCache.set(name, {});
    sectionCache.get(name).initialized = true;

    runShowHooks(name);
  } catch (e) {
    console.error("Section load failed", e);
    container.innerHTML = `<p class="mono-text" style="color:#b00;">Failed to load “${name}”.</p>`;
  }
}

/** Runs one-time initialization logic for a section (async). */
async function runInitHooks(name) {
  switch (name) {
    case "home": initHome(); break;
    case "about": initGallery(); break;
    case "archive": await initArchive(); break;
    case "music": await initMusic(); break;
  }
}

/** Runs every time a section becomes active (sync). */
function runShowHooks(name) {
  // Update nav active state
  $$(".nav-item").forEach((el) => el.classList.toggle("active", el.dataset.target === name));
  // Section-specific restore logic
  if (name === "music") syncPlayerUIOnShow();
}

/* ==========================================================================
   COMPONENT: NAVIGATION
   ========================================================================== */
function initNavigation() {
  $$(".nav-item").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      location.hash = link.dataset.target; // Triggers hashchange -> router
    });
  });

  window.addEventListener("hashchange", () => loadSection(location.hash.slice(1) || "home"));
  loadSection(location.hash.slice(1) || "home"); // Initial load
}

/* ==========================================================================
   COMPONENT: LIGHTBOX (Delegated Globally)
   ========================================================================== */
let lightbox, lbImg, lbCap, lbClose;

function initLightbox() {
  lightbox = $("#lightbox");
  lbImg = $("#lightbox-img");
  lbCap = $("#lightbox-caption");
  lbClose = $(".lightbox-close", lightbox);

  // Delegation handles dynamically added items (cache restores, etc.)
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

/* ==========================================================================
   SECTIONS: HOME, ABOUT, ARCHIVE
   ========================================================================== */
function initHome() { /* Static content, no JS init required */ }

function initGallery() {
  // Lightbox delegated globally. Images cached by browser HTTP cache.
  // DOM preserved by Section Cache. Runs once.
}

/* ==========================================================================
   SECTION: ARCHIVE (GitHub Repos)
   ========================================================================== */
async function initArchive() {
  // No guard needed: Section Cache ensures this runs only once (on first visit).
  // If DOM has children (e.g. skeleton loaders from HTML), we clear them below.

  const loadingEl = $("#github-loading");
  const gridEl = $("#github-projects-grid");
  
  // Config check
  if (!CONFIG.githubUsername || CONFIG.githubUsername === "YOUR_GITHUB_USERNAME") {
    if (loadingEl) loadingEl.style.display = "none";
    if (gridEl) gridEl.innerHTML = `<p class="mono-text">Set CONFIG.githubUsername to enable.</p>`;
    return;
  }

  try {
    const resp = await fetch(`https://api.github.com/users/${CONFIG.githubUsername}/repos?sort=updated&per_page=15`);
    if (!resp.ok) throw new Error(`GitHub API: ${resp.status} ${resp.statusText}`);
    
    let repos = await resp.json();
    if (CONFIG.excludeForks) repos = repos.filter((r) => !r.fork);
    repos = repos.slice(0, CONFIG.maxRepos);

    // Clear loading state & grid (handles placeholders from HTML template)
    if (loadingEl) loadingEl.style.display = "none";
    if (gridEl) gridEl.innerHTML = ""; 
    
    repos.forEach((repo) => gridEl?.appendChild(createProjectCard(repo)));
  } catch (e) {
    console.error("Archive fetch failed:", e);
    if (loadingEl) {
      loadingEl.innerHTML = `⚠️ Offline / fallback mode.`;
      loadingEl.style.color = "#7a7a7a";
    }
    // Optional: Render curated fallback items here if gridEl exists
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

/* ==========================================================================
   SECTION: MUSIC PLAYER (Optimized Instant Start)
   ========================================================================== */

/**
 * Initializes the music library.
 * Strategy:
 * 1. Fetch manifest (tiny JSON).
 * 2. Immediately stream first track via native <audio> (no JS metadata wait).
 * 3. Background: Sequentially hydrate metadata (ID3 tags) + duration (Range requests)
 *    for all tracks, building the playlist array and DOM.
 */
async function initMusic() {
  if (playlist.length > 0) return; // Cache Guard

  // 1. SAFELY GET CONTAINER (Wait one microtask for DOM insertion if needed)
  let container = $("#playlist-container");
  
  if (!container) {
    // Fallback: Wait for paint cycle (handles rare race conditions with innerHTML)
    await new Promise(r => requestAnimationFrame(r));
    container = $("#playlist-container");
  }

  // 2. HARD FAIL WITH CLEAR MESSAGE IF STILL MISSING
  if (!container) {
    const msg = `[Music] FATAL: #playlist-container not found in DOM. 
    Check sections/music.html for <div id="playlist-container">. 
    Current #content-area HTML: ${$("#content-area").innerHTML.slice(0, 200)}...`;
    console.error(msg);
    // Render error visibly in the page so you see it without console
    $("#content-area").innerHTML = `<div style="color:red; padding:2rem; font-family:monospace;">
      <b>Music Init Failed:</b> Missing <code>#playlist-container</code> in section HTML.
      <br>Deploy the latest <code>sections/music.html</code> and hard refresh (Ctrl+Shift+R).
    </div>`;
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


/**
 * Starts playback of a track IMMEDIATELY without waiting for ID3 tags.
 * Updates Player Bar with filename fallback. Resolves when playback starts (or fails).
 */
function loadTrackInstant(item, index) {
  return new Promise((resolve) => {
    currentTrackIndex = index;
    audio.src = item.url;
    audio.load();

    // Fallback UI until metadata hydrates
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
    audio.play().catch(() => { /* Autoplay blocked; user must interact */ });

    // Native metadata (duration) arrives fast via browser Range request
    audio.addEventListener("loadedmetadata", () => {
      const dur = audio.duration;
      $("#dur-time").textContent = fmtTime(dur);
      const li = document.querySelector(`.track-item[data-playlist-index="${index}"]`);
      if (li) li.querySelector(".track-duration").textContent = fmtTime(dur);
    }, { once: true });
  });
}

/**
 * Background worker: Processes queue sequentially to build `playlist` array & DOM.
 * Yields to main thread between tracks to keep UI responsive.
 */
function scheduleBackgroundProcessing(queue) {
  (async () => {
    for (let i = 0; i < queue.length; i++) {
      const track = await processAndRenderTrack(queue[i], i);

      // Reconciliation: If this track is the currently playing one, upgrade Player Bar to real metadata
      if (i === currentTrackIndex && track) {
        $("#player-title").textContent = track.title;
        $("#player-artist").textContent = track.artist;
        $("#player-cover").src = track.cover;
        if (track.duration) $("#dur-time").textContent = fmtTime(track.duration);
      }

      // Yield control (allows painting, interaction, other scripts)
      await new Promise((r) =>
        window.requestIdleCallback ? requestIdleCallback(r, { timeout: 1000 }) : setTimeout(r, 0)
      );
    }
  })();
}

/**
 * Hydrates a single track: Reads ID3 tags -> Probes Duration (Range Request) -> Renders DOM.
 * Runs sequentially inside scheduleBackgroundProcessing.
 */
async function processAndRenderTrack(item, targetIndex) {
  // 1. Read ID3 Tags (Title, Artist, Cover) - No duration probing here
  const meta = await readID3Metadata(item.url);

  const track = {
    file: item.url,
    title: meta.title || item.name.replace(/\.mp3$/i, ""),
    artist: meta.artist || "Unknown Artist",
    cover: meta.cover || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"/%3E',
    duration: 0,
    playlistName: item.playlistName,
  };

  // 2. Push to state & Render DOM immediately (shows "0:00" initially)
  playlist.push(track);
  await renderTrackInDOM(track, targetIndex, item.playlistName);

  // 3. Probe Duration via Range Request (Fast, ~2KB headers)
  try {
    const duration = await probeDuration(item.url);
    track.duration = duration;
    const li = document.querySelector(`.track-item[data-playlist-index="${targetIndex}"]`);
    if (li) li.querySelector(".track-duration").textContent = fmtTime(duration);
  } catch (e) {
    console.warn("Duration probe failed for", item.url, e);
  }

  return track;
}

/** Fetches only MP3 headers (Range Request) to determine duration. */
function probeDuration(url) {
  return new Promise((resolve) => {
    const probe = new Audio();
    probe.preload = "metadata"; // Signals browser to fetch headers only
    probe.src = url;

    const cleanup = () => {
      probe.removeEventListener("loadedmetadata", onMeta);
      probe.removeEventListener("error", onErr);
      probe.src = "";
    };
    const onMeta = () => { cleanup(); resolve(probe.duration || 0); };
    const onErr = () => { cleanup(); resolve(0); }; // Fail soft

    probe.addEventListener("loadedmetadata", onMeta, { once: true });
    probe.addEventListener("error", onErr, { once: true });
    probe.load();
  });
}

/** Reads ID3v2 tags (Title, Artist, Cover) via jsmediatags. Skips duration. */
function readID3Metadata(url) {
  return new Promise(async (resolve) => {
    try {
      const absoluteURL = new URL(url, window.location.href).href;
      // HEAD check prevents jsmediatags hanging on 404s
      const check = await fetch(absoluteURL, { method: "HEAD", cache: "no-store" }).catch(() => ({ ok: false }));
      if (!check.ok) return resolve({});

      window.jsmediatags.read(absoluteURL, {
        onSuccess: (tag) => {
          const { title, artist, picture } = tag.tags || {};
          let coverURL = null;
          if (picture) {
            const blob = new Blob([new Uint8Array(picture.data)], { type: picture.format });
            coverURL = URL.createObjectURL(blob);
            blobUrlsToRevoke.add(coverURL);
          }
          resolve({ title, artist, cover: coverURL });
        },
        onError: () => resolve({}), // Fail silent, fallback to filename
      });
    } catch (e) { resolve({}); }
  });
}

/** Renders a track <li> into the correct playlist <ul>. */
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
  li.dataset.playlistIndex = index; // Critical: Maps DOM node to playlist array index
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

/** Syncs persistent Player Bar when Music tab is shown (cache restore). */
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

/* ==========================================================================
   PLAYER CORE: PLAYBACK CONTROLS
   ========================================================================== */

/** Loads a track by index (User click, Next/Prev, Autoplay). Uses hydrated metadata. */
function loadTrack(index, autoplay = false) {
  if (!playlist.length || index < 0 || index >= playlist.length) return;

  currentTrackIndex = index;
  const track = playlist[index];

  audio.src = track.file;
  audio.load();

  // Player Bar gets real metadata instantly from playlist array
  $("#player-title").textContent = track.title;
  $("#player-artist").textContent = track.artist;
  $("#player-cover").src = track.cover;

  // Native metadata listener updates seek bar max/duration display
  audio.addEventListener("loadedmetadata", () => {
    $("#dur-time").textContent = fmtTime(audio.duration);
    const li = document.querySelector(`.track-item[data-playlist-index="${index}"]`);
    if (li) li.querySelector(".track-duration").textContent = fmtTime(audio.duration);
  }, { once: true });

  // Active state
  document.querySelectorAll(".playlist li").forEach((el, i) => el.classList.toggle("active", i === index));

  if (autoplay) audio.play().catch(() => {});
  updatePlayPauseBtn();
}

/** Binds global player bar controls (Run once). */
function bindPlayerControls() {
  if (playerControlsBound) return;
  playerControlsBound = true;

  $("#btn-play").addEventListener("click", () => (!audio.src && playlist.length ? loadTrack(0, true) : audio.play()));
  $("#btn-pause").addEventListener("click", () => audio.pause());
  $("#btn-prev").addEventListener("click", () => loadTrack((currentTrackIndex - 1 + playlist.length) % playlist.length, true));
  $("#btn-next").addEventListener("click", () => loadTrack((currentTrackIndex + 1) % playlist.length, true));

  $("#seek-bar").addEventListener("input", (e) => { if (audio.duration) audio.currentTime = (e.target.value / 100) * audio.duration; });
  $("#vol-bar").addEventListener("input", (e) => (audio.volume = +e.target.value));

  // Keyboard shortcuts (Only active in Music section)
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

/** Updates seek bar & current time display. */
function onTimeUpdate() {
  if (isSeeking) return;
  const cur = audio.currentTime, dur = audio.duration || 0;
  $("#cur-time").textContent = fmtTime(cur);
  $("#seek-bar").value = dur ? (cur / dur) * 100 : 0;
}

/** Auto-advance to next track. */
function onTrackEnded() { loadTrack((currentTrackIndex + 1) % playlist.length, true); }

/** Toggles Play/Pause button visibility & player "playing" class. */
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

/* ==========================================================================
   BOOTSTRAP
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initLightbox();
  initGlobalVisibility();
});
