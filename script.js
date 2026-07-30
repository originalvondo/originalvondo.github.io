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
let currentSection = null;
const audio = new Audio(); // Single global audio element
let playlist = []; // Parsed track objects
let currentTrackIndex = -1;
let isSeeking = false;

// Caching & Cleanup
const sectionCache = new Map(); // name -> { nodes, scrollY, initialized }
let playerControlsBound = false; // Prevent duplicate listener binding
const blobUrlsToRevoke = new Set(); // Track blob URLs for memory cleanup

/* ==========================================================================
   UTILITIES
   ========================================================================== */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function fmtTime(sec) {
  if (!isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
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

/* ==========================================================================
   CORE: PAGE VISIBILITY & CLEANUP
   ========================================================================== */
function initGlobalVisibility() {
  // Pause when tab hidden / switched away
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && !audio.paused) audio.pause();
  });

  // Hard cleanup on page unload/close
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
async function loadSection(name) {
  const container = $("#content-area");

  // 1. SAVE CURRENT SECTION TO CACHE
  if (currentSection && currentSection !== name) {
    const cache = sectionCache.get(currentSection) || {};
    cache.nodes = Array.from(container.childNodes);
    cache.scrollY = window.scrollY;
    cache.initialized = true;
    sectionCache.set(currentSection, cache);
  }

  // 2. RESTORE FROM CACHE OR FETCH
  const cached = sectionCache.get(name);

  if (cached?.initialized) {
    // CACHE HIT: Instant restore
    container.replaceChildren(...cached.nodes);
    window.scrollTo({ top: cached.scrollY || 0, behavior: "instant" });
    currentSection = name;
    runShowHooks(name);
    return;
  }

  // CACHE MISS: Fetch HTML
  container.innerHTML = `<div class="route-loading mono-text">loading ${name}…</div>`;

  try {
    const resp = await fetch(`sections/${name}.html`);
    if (!resp.ok) throw new Error(resp.statusText);
    container.innerHTML = await resp.text();
    currentSection = name;

    await runInitHooks(name); // Run async init logic

    // Mark initialized for next visit
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
    case "home":
      initHome();
      break;
    case "about":
      initGallery();
      break;
    case "archive":
      await initArchive();
      break;
    case "music":
      await initMusic();
      break;
  }
}

function runShowHooks(name) {
  // Nav Highlight
  $$(".nav-item").forEach((el) =>
    el.classList.toggle("active", el.dataset.target === name),
  );
  // Section Specific
  if (name === "music") syncPlayerUIOnShow();
}

/* ==========================================================================
   COMPONENT: NAVIGATION
   ========================================================================== */
function initNavigation() {
  $$(".nav-item").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      location.hash = link.dataset.target;
    });
  });
  window.addEventListener("hashchange", () =>
    loadSection(location.hash.slice(1) || "home"),
  );
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
    if (
      e.target === lightbox ||
      e.target.classList.contains("lightbox-content-box")
    )
      close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox?.style.display === "flex") close();
  });
}

/* ==========================================================================
   SECTION: HOME
   ========================================================================== */
function initHome() {
  /* Static HTML */
}

/* ==========================================================================
   SECTION: ABOUT / GALLERY
   ========================================================================== */
function initGallery() {
  // Lightbox delegated globally. Images cached by browser.
  // DOM preserved by Section Cache. Runs once.
}

/* ==========================================================================
   SECTION: ARCHIVE (GitHub Repos)
   ========================================================================== */
async function initArchive() {
  // Guard: Router caches DOM, but safety check for manual calls
  if ($("#github-projects-grid")?.children.length > 0) return;

  const loadingEl = $("#github-loading");
  const gridEl = $("#github-projects-grid");
  if (
    !CONFIG.githubUsername ||
    CONFIG.githubUsername === "YOUR_GITHUB_USERNAME"
  ) {
    if (loadingEl) loadingEl.style.display = "none";
    return;
  }

  try {
    const resp = await fetch(
      `https://api.github.com/users/${CONFIG.githubUsername}/repos?sort=updated&per_page=15`,
    );
    if (!resp.ok) throw new Error(resp.status);
    let repos = await resp.json();
    if (CONFIG.excludeForks) repos = repos.filter((r) => !r.fork);
    repos = repos.slice(0, CONFIG.maxRepos);

    if (loadingEl) loadingEl.style.display = "none";
    if (gridEl) gridEl.innerHTML = "";
    repos.forEach((repo) => gridEl?.appendChild(createProjectCard(repo)));
  } catch (e) {
    console.error(e);
    if (loadingEl) {
      loadingEl.innerHTML = `⚠️ Offline / fallback mode.`;
      loadingEl.style.color = "#7a7a7a";
    }
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
   SECTION: MUSIC PLAYER
   ========================================================================== */

// --- Main Entry: Fetch Manifest -> Play First Track IMMEDIATELY
async function initMusic() {
  if (playlist.length > 0) return; // Cache Guard

  const container = $("#playlist-container");
  container.innerHTML =
    '<div class="mono-text" style="text-align:center; grid-column:1/-1;">Loading library...</div>';

  const isLocal = ["localhost", "127.0.0.1", ""].includes(
    window.location.hostname,
  );
  const baseUrl = isLocal ? "" : `https://${CONFIG.githubUsername}.github.io`;
  const manifestUrl = `${baseUrl}/media/music/music.json`;

  try {
    // 1. FETCH MANIFEST (Tiny, fast)
    const musicData = await (await fetch(manifestUrl)).json();

    // 2. BUILD QUEUE (Sync, fast)
    const allTracksQueue = [];
    for (const [playlistName, songs] of Object.entries(musicData)) {
      songs.forEach((path) =>
        allTracksQueue.push({
          playlistName,
          // Store raw path/url for instant access
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

    // 3. INSTANT PLAY FIRST TRACK (The "Spotify" Trick)
    const firstItem = allTracksQueue[0]; // Peek, don't shift yet (keep order)
    await loadTrackInstant(firstItem, 0); // PLAYS AUDIO IMMEDIATELY

    // 4. BACKGROUND: Process Metadata for ALL tracks (including first) to build UI/Playlist
    // We pass the *full* queue. processQueue will fill `playlist` array in order.
    scheduleBackgroundProcessing(allTracksQueue);

    bindPlayerControls();
  } catch (e) {
    console.error(e);
    container.innerHTML = `<p class="mono-text" style="color:red;">Error: ${e.message}</p>`;
  }
}

// --- 3. INSTANT LOAD: Sets src & plays. NO METADATA WAIT. ---
// Updates Player Bar with filename fallback. Returns Promise resolving when play starts.
function loadTrackInstant(item, index) {
  return new Promise((resolve) => {
    currentTrackIndex = index;

    // 1. Set Source & Play IMMEDIATELY
    audio.src = item.url;
    // audio.preload = "metadata"; // Default is "metadata" usually, "auto" might buffer more
    audio.load();

    // 2. Update Persistent Player Bar with Fallback Data (Filename)
    const fallbackTitle = item.name.replace(/\.mp3$/i, "");
    $("#player-title").textContent = fallbackTitle;
    $("#player-artist").textContent = "Loading...";
    $("#player-cover").src =
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"/%3E';
    $("#dur-time").textContent = "0:00";
    $("#seek-bar").value = 0;

    // 3. Handle Playback Start
    const onPlay = () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("error", onErr);
      resolve(); // Signal: "Audio has started"
    };
    const onErr = () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("error", onErr);
      console.error("Instant play failed:", item.url);
      resolve(); // Continue queue even if 1 fails
    };

    audio.addEventListener("play", onPlay, { once: true });
    audio.addEventListener("error", onErr, { once: true });

    // Trigger play (user gesture usually handled by nav click -> hashchange -> initMusic)
    audio.play().catch(() => {
      /* Autoplay blocked, user must click play btn */
    });

    // 4. Listen for Native Metadata (Duration) to update Player Bar & Playlist Item
    // This fires fast (browser reads headers via Range request)
    const onMeta = () => {
      const dur = audio.duration;
      $("#dur-time").textContent = fmtTime(dur);
      // Update the playlist LI if it exists already (index 0 might render fast)
      const li = document.querySelector(
        `.track-item[data-playlist-index="${index}"]`,
      );
      if (li) li.querySelector(".track-duration").textContent = fmtTime(dur);
      audio.removeEventListener("loadedmetadata", onMeta);
    };
    audio.addEventListener("loadedmetadata", onMeta, { once: true });
  });
}

// --- 5. METADATA EXTRACTION: Heavy lifting (jsmediatags) happens HERE ---
// Returns full track object { file, title, artist, cover, duration, playlistName }
// --- 5. METADATA EXTRACTION: Tags + Background Duration Probe ---
async function processAndRenderTrack(item, targetIndex) {
  // 1. Get Tags (Title, Artist, Cover) - Fast, skips duration
  const meta = await readID3Metadata(item.url); 
  
  const track = {
    file: item.url,
    title: meta.title || item.name.replace(/\.mp3$/i, ""),
    artist: meta.artist || "Unknown Artist",
    cover: meta.cover || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"/%3E',
    duration: 0, // Placeholder
    playlistName: item.playlistName
  };

  // 2. Push to State & Render DOM Immediately (Shows "0:00" initially)
  playlist.push(track);
  await renderTrackInDOM(track, targetIndex, item.playlistName);

  // 3. BACKGROUND PROBE: Fetch Duration via Range Request (Non-blocking)
  // We do this AFTER render so UI exists to update.
  // Note: We don't 'await' this here if we want parallel probes, 
  // but since scheduleBackgroundProcessing loops sequentially, 
  // awaiting here ensures we don't open 50 connections at once.
  try {
    const duration = await probeDuration(item.url);
    track.duration = duration;
    // Update the specific LI in the DOM
    const li = document.querySelector(`.track-item[data-playlist-index="${targetIndex}"]`);
    if (li) li.querySelector(".track-duration").textContent = fmtTime(duration);
  } catch (e) {
    console.warn("Duration probe failed for", item.url, e);
  }

  return track;
}

// --- Fast Duration Probe (Range Request) ---
// Creates a temporary Audio element, requests only headers (bytes=0-)
// GitHub Pages / raw.githubusercontent.com support Range requests natively.
function probeDuration(url) {
  return new Promise((resolve, reject) => {
    const probe = new Audio();
    // preload="metadata" tells browser: "Just get headers (duration), don't download file"
    probe.preload = "metadata"; 
    probe.src = url;

    const cleanup = () => {
      probe.removeEventListener("loadedmetadata", onMeta);
      probe.removeEventListener("error", onErr);
      probe.src = ""; // Release network lock
    };

    const onMeta = () => {
      cleanup();
      resolve(probe.duration || 0);
    };
    const onErr = (e) => {
      cleanup();
      // Don't reject hard, just return 0 so UI doesn't break
      resolve(0); 
    };

    probe.addEventListener("loadedmetadata", onMeta, { once: true });
    probe.addEventListener("error", onErr, { once: true });
    
    // Trigger the header fetch
    probe.load();
  });
}


// --- 4. BACKGROUND PROCESSING: Sequential, Yielding, Builds Playlist Array & DOM ---
function scheduleBackgroundProcessing(queue) {
  (async () => {
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      // processAndRenderTrack now returns the FULL track object with metadata
      const track = await processAndRenderTrack(item, i);

      // RECONCILIATION: If this is the currently playing track (index 0),
      // update the Player Bar with REAL metadata (Title, Artist, Cover)
      if (i === currentTrackIndex && track) {
        $("#player-title").textContent = track.title;
        $("#player-artist").textContent = track.artist;
        $("#player-cover").src = track.cover;
        // Duration already handled by native 'loadedmetadata' above, but good to sync
        if (track.duration)
          $("#dur-time").textContent = fmtTime(track.duration);
      }

      // Yield to main thread (keep UI responsive)
      await new Promise((r) =>
        window.requestIdleCallback
          ? requestIdleCallback(r, { timeout: 1000 })
          : setTimeout(r, 0),
      );
    }
  })();
}

// --- Render Track into Playlist DOM ---
// --- RENDER (Unchanged mostly, ensures data-index matches array index) ---
function renderTrackInDOM(track, index, playlistName) {
  const container = $("#playlist-container");
  let header = container.querySelector(
    `.playlist-header[data-name="${escapeHTML(playlistName)}"]`,
  );
  let ul;

  if (!header) {
    header = document.createElement("h3");
    header.className = "playlist-header serif-title";
    header.dataset.name = escapeHTML(playlistName);
    header.style.cssText =
      "font-size:1.5rem;margin:2rem 0 1rem;border-bottom:1px solid var(--accent-blue);display:inline-block;text-transform:lowercase;";
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
  li.dataset.playlistIndex = index; // CRITICAL: Matches playlist array index
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
    if (!isNaN(idx)) loadTrack(idx, true); // Standard load for user clicks
  });
  ul.appendChild(li);
}

// --- Sync Persistent Player Bar when Music Tab Shown ---
function syncPlayerUIOnShow() {
  if (currentTrackIndex === -1 || !playlist.length) return;
  const track = playlist[currentTrackIndex];
  $("#player-title").textContent = track.title;
  $("#player-artist").textContent = track.artist;
  $("#player-cover").src = track.cover;
  $("#dur-time").textContent = fmtTime(audio.duration || track.duration || 0);
  $("#cur-time").textContent = fmtTime(audio.currentTime);
  $("#seek-bar").value = audio.duration
    ? (audio.currentTime / audio.duration) * 100
    : 0;
  updatePlayPauseBtn();
}

/* ==========================================================================
   PLAYER CORE: ID3 & Duration Probing
   ========================================================================== */
function readID3(url) {
  return new Promise(async (resolve) => {
    try {
      const absoluteURL = new URL(url, window.location.href).href;
      const check = await fetch(absoluteURL, { method: "HEAD" }).catch(() => ({
        ok: false,
      }));
      if (!check.ok) return resolve(null);

      window.jsmediatags.read(absoluteURL, {
        onSuccess: (tag) => handleTagSuccess(tag, absoluteURL, url, resolve),
        onError: () =>
          probeDuration(absoluteURL).then((d) =>
            resolve(fallbackTrack(absoluteURL, url, d)),
          ),
      });
    } catch (e) {
      resolve(null);
    }
  });
}

// --- 6. ID3 READER: Metadata Only (No Duration Probing) ---
// Reads tags via jsmediatags. Uses HEAD check to avoid 404 hangs.
function readID3Metadata(url) {
  return new Promise(async (resolve) => {
    try {
      const absoluteURL = new URL(url, window.location.href).href;
      // Quick HEAD check (prevents jsmediatags hanging on 404)
      const check = await fetch(absoluteURL, {
        method: "HEAD",
        cache: "no-store",
      }).catch(() => ({ ok: false }));
      if (!check.ok) return resolve({});

      window.jsmediatags.read(absoluteURL, {
        onSuccess: (tag) => {
          const { title, artist, picture } = tag.tags || {};
          let coverURL = null;
          if (picture) {
            const blob = new Blob([new Uint8Array(picture.data)], {
              type: picture.format,
            });
            coverURL = URL.createObjectURL(blob);
            blobUrlsToRevoke.add(coverURL);
          }
          // We IGNORE duration from tags (often wrong). Browser 'loadedmetadata' is source of truth.
          resolve({ title, artist, cover: coverURL, duration: 0 });
        },
        onError: () => resolve({}), // Fail silently, fallback to filename
      });
    } catch (e) {
      resolve({});
    }
  });
}

function handleTagSuccess(tag, absoluteURL, originalUrl, resolve) {
  const { title, artist, picture } = tag.tags || {};
  let coverURL =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"/%3E';
  if (picture) {
    const blob = new Blob([new Uint8Array(picture.data)], {
      type: picture.format,
    });
    coverURL = URL.createObjectURL(blob);
    blobUrlsToRevoke.add(coverURL);
  }
  probeDuration(absoluteURL).then((duration) =>
    resolve({
      file: absoluteURL,
      title:
        title ||
        originalUrl
          .split("/")
          .pop()
          .replace(/\.mp3$/i, ""),
      artist: artist || "Unknown",
      cover: coverURL,
      duration: duration,
    }),
  );
}

function fallbackTrack(file, url, duration) {
  return {
    file,
    title: url
      .split("/")
      .pop()
      .replace(/\.mp3$/i, ""),
    artist: "Unknown Artist",
    cover:
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"/%3E',
    duration,
  };
}

/* ==========================================================================
   PLAYER CORE: Playback Controls
   ========================================================================== */
/* ==========================================================================
   PLAYER CORE: Standard Load (Used when user clicks playlist items)
   ========================================================================== */
function loadTrack(index, autoplay = false) {
  if (!playlist.length || index < 0 || index >= playlist.length) return;

  currentTrackIndex = index;
  const track = playlist[index];

  audio.src = track.file;
  audio.load();

  // Update Player Bar with REAL metadata (already in playlist array)
  $("#player-title").textContent = track.title;
  $("#player-artist").textContent = track.artist;
  $("#player-cover").src = track.cover;

  // Native Metadata Listener (Updates Seek Bar Max / Duration Display)
  const onMeta = () => {
    $("#dur-time").textContent = fmtTime(audio.duration);
    const li = document.querySelector(
      `.track-item[data-playlist-index="${index}"]`,
    );
    if (li)
      li.querySelector(".track-duration").textContent = fmtTime(audio.duration);
    audio.removeEventListener("loadedmetadata", onMeta);
  };
  audio.addEventListener("loadedmetadata", onMeta, { once: true });

  // Active UI
  document
    .querySelectorAll(".playlist li")
    .forEach((el, i) => el.classList.toggle("active", i === index));

  if (autoplay) audio.play().catch(() => {});
  updatePlayPauseBtn();
}

// Global Control Bindings (Run Once)
function bindPlayerControls() {
  if (playerControlsBound) return;
  playerControlsBound = true;

  $("#btn-play").addEventListener("click", () =>
    !audio.src && playlist.length ? loadTrack(0, true) : audio.play(),
  );
  $("#btn-pause").addEventListener("click", () => audio.pause());
  $("#btn-prev").addEventListener("click", () =>
    loadTrack(
      (currentTrackIndex - 1 + playlist.length) % playlist.length,
      true,
    ),
  );
  $("#btn-next").addEventListener("click", () =>
    loadTrack((currentTrackIndex + 1) % playlist.length, true),
  );

  $("#seek-bar").addEventListener("input", (e) => {
    if (audio.duration)
      audio.currentTime = (e.target.value / 100) * audio.duration;
  });
  $("#vol-bar").addEventListener(
    "input",
    (e) => (audio.volume = +e.target.value),
  );

  // Keyboard Shortcuts (Only active in Music section)
  document.addEventListener("keydown", (e) => {
    if (currentSection !== "music" || e.target.matches("input, textarea"))
      return;
    if (e.code === "Space") {
      e.preventDefault();
      audio.paused ? audio.play() : audio.pause();
    } else if (e.code === "ArrowRight") {
      e.preventDefault();
      audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
    } else if (e.code === "ArrowLeft") {
      e.preventDefault();
      audio.currentTime = Math.max(0, audio.currentTime - 5);
    } else if (e.code === "ArrowUp") {
      e.preventDefault();
      audio.volume = Math.min(1, audio.volume + 0.05);
      $("#vol-bar").value = audio.volume;
    } else if (e.code === "ArrowDown") {
      e.preventDefault();
      audio.volume = Math.max(0, audio.volume - 0.05);
      $("#vol-bar").value = audio.volume;
    } else if (e.shiftKey && e.code === "ArrowRight") {
      loadTrack((currentTrackIndex + 1) % playlist.length, true);
    } else if (e.shiftKey && e.code === "ArrowLeft") {
      loadTrack(
        (currentTrackIndex - 1 + playlist.length) % playlist.length,
        true,
      );
    }
  });
}

// Time Updates & Auto-Advance
function onTimeUpdate() {
  if (isSeeking) return;
  const cur = audio.currentTime,
    dur = audio.duration || 0;
  $("#cur-time").textContent = fmtTime(cur);
  $("#seek-bar").value = dur ? (cur / dur) * 100 : 0;
}
function onTrackEnded() {
  loadTrack((currentTrackIndex + 1) % playlist.length, true);
}

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
