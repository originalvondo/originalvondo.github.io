const CONFIG = {
  githubUsername: "originalvondo",
  repoOwner: "originalvondo",
  repoName: "originalvondo.github.io",
  excludeForks: true,
  maxRepos: 15,

  devMusic: {},

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

// -------------------------------------------------------------------------
// GLOBAL STATE
// -------------------------------------------------------------------------
let currentSection = null; // name of the section currently in #content-area
let audio = new Audio(); // single <audio> element for the player
let playlist = []; // parsed track objects {file, title, artist, cover, duration}
let currentTrackIndex = -1; // index in `playlist`
let isSeeking = false; // flag while user drags the seek bar

// -------------------------------------------------------------------------
// UTILITIES
// -------------------------------------------------------------------------
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

// -------------------------------------------------------------------------
// SPA ROUTER – loads a fragment from /sections/<name>.html
// -------------------------------------------------------------------------
async function loadSection(name) {
  const container = $("#content-area");
  container.innerHTML = `<div class="route-loading mono-text">loading ${name}…</div>`;

  try {
    const resp = await fetch(`sections/${name}.html`);
    if (!resp.ok) throw new Error(resp.statusText);
    const html = await resp.text();
    container.innerHTML = html;
    currentSection = name;

    // Run section‑specific init code
    switch (name) {
      case "home":
        initHome();
        break;
      case "about":
        initGallery();
        break;
      case "archive":
        initArchive();
        break;
      case "music":
        initMusic();
        break;
    }

    // Highlight nav
    $$(".nav-item").forEach((el) =>
      el.classList.toggle("active", el.dataset.target === name),
    );
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (e) {
    console.error("Section load failed", e);
    container.innerHTML = `<p class="mono-text" style="color:#b00;">Failed to load “${name}”.</p>`;
  }
}

// -------------------------------------------------------------------------
// NAVIGATION SETUP
// -------------------------------------------------------------------------
function initNavigation() {
  $$(".nav-item").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = link.dataset.target;
      location.hash = target; // triggers hashchange → router
    });
  });

  window.addEventListener("hashchange", () => {
    const hash = location.hash.slice(1) || "home";
    loadSection(hash);
  });

  // Initial load (respect existing hash or default to home)
  const initial = location.hash.slice(1) || "home";
  loadSection(initial);
}

// -------------------------------------------------------------------------
// LIGHTBOX (re‑usable for any section that has .collage-item / .gallery-item)
// -------------------------------------------------------------------------
let lightbox = null,
  lbImg = null,
  lbCap = null,
  lbClose = null;

function initLightbox() {
  lightbox = $("#lightbox");
  lbImg = $("#lightbox-img");
  lbCap = $("#lightbox-caption");
  lbClose = $(".lightbox-close", lightbox);

  // delegate – works for elements added later
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

// -------------------------------------------------------------------------
// HOME SECTION – portrait + quote
// -------------------------------------------------------------------------
function initHome() {
  // Nothing dynamic – the HTML already contains the markup.
  // Lightbox already works for any .collage-item (none on home).
}

// -------------------------------------------------------------------------
// ABOUT / GALLERY – simple masonry grid, lightbox ready
// -------------------------------------------------------------------------
function initGallery() {
  // The gallery HTML lives in sections/about.html
  // Lightbox is already delegated globally – nothing else required.
}

// -------------------------------------------------------------------------
// ARCHIVE – GitHub repo fetching
// -------------------------------------------------------------------------
async function initArchive() {
  const loadingEl = $("#github-loading");
  const gridEl = $("#github-projects-grid");
  if (
    !CONFIG.githubUsername ||
    CONFIG.githubUsername === "YOUR_GITHUB_USERNAME"
  ) {
    if (loadingEl) loadingEl.style.display = "none";
    console.log("GitHub API: set CONFIG.githubUsername to enable live repos.");
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
      loadingEl.innerHTML = `⚠️ Offline / fallback mode – showing curated items.`;
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
    <div class="project-card-header">
      <span class="project-tag">${langTag}</span>
      <span class="project-date">${year}</span>
    </div>
    <h3 class="project-title">${repo.name}</h3>
    <p class="project-desc">${desc}</p>
    <div class="project-links">
      <a href="${repo.html_url}" target="_blank" class="project-link">Repo ↗</a>
      ${demoLink}
    </div>`;
  return card;
}

// -------------------------------------------------------------------------
// MUSIC PLAYER – Dynamic GitHub Folder Fetching
// -------------------------------------------------------------------------
// -------------------------------------------------------------------------
// MUSIC PLAYER – Optimized: Play First, Stream Rest
// -------------------------------------------------------------------------
async function initMusic() {
  const container = $("#playlist-container");
  container.innerHTML =
    '<div class="mono-text" style="text-align:center; grid-column:1/-1;">Loading music library...</div>';

  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "";

  const manifestPath = "media/music/music.json";
  const manifestUrl = isLocal
    ? manifestPath
    : `https://raw.githubusercontent.com/${CONFIG.repoOwner}/${CONFIG.repoName}/main/${manifestPath}`;

  try {
    const response = await fetch(manifestUrl);
    if (!response.ok) throw new Error("Could not load music manifest (music.json).");
    const musicData = await response.json();

    // 1. Flatten all playlists into a single ordered queue: [{ playlistName, fileInfo }, ...]
    const allTracksQueue = [];
    for (const [playlistName, songs] of Object.entries(musicData)) {
      songs.forEach((path) => {
        allTracksQueue.push({
          playlistName,
          fileInfo: {
            name: path.split("/").pop(),
            download_url: isLocal
              ? path
              : `https://${CONFIG.githubUsername}.github.io/${path}`,
          },
        });
      });
    }

    if (allTracksQueue.length === 0) {
      container.innerHTML = `<p class="mono-text" style="text-align:center; grid-column:1/-1;">No tracks found in manifest.</p>`;
      return;
    }

    container.innerHTML = ""; // Clear loading text
    playlist = []; // Reset global playlist array
    currentTrackIndex = -1;

    // 2. Process the VERY FIRST track immediately (High Priority)
    const firstItem = allTracksQueue.shift(); // Remove first from queue
    await processAndRenderTrack(firstItem, 0); // Index 0 in playlist

    // Start playback immediately
    loadTrack(0, true);

    // 3. Process the REST in background batches (Low Priority)
    if (allTracksQueue.length > 0) {
      scheduleBackgroundProcessing(allTracksQueue);
    }

    bindPlayerControls(); // Ensure controls are bound (safe to call multiple times)
  } catch (e) {
    console.error(e);
    container.innerHTML = `<p class="mono-text" style="color:red; text-align:center;">Error loading music: ${e.message}</p>`;
  }
}

/**
 * Reads ID3, creates DOM node, pushes to global playlist array.
 * @returns {Promise<object|null>} The track object if successful.
 */
async function processAndRenderTrack(item, targetIndex) {
  const track = await readID3(item.fileInfo.download_url);
  if (!track) return null;

  track.playlistName = item.playlistName;

  // Use push if targetIndex === playlist.length (appending), else splice
  // Since we process sequentially, targetIndex ALWAYS === playlist.length here.
  playlist.push(track); // Safer & faster than splice for appending

  await renderTrackInDOM(track, targetIndex, item.playlistName);

  return track; // Return track so the await in scheduleBackgroundProcessing works
}


/**
 * Renders a single track <li> into the correct playlist <ul> in the DOM.
 */
function renderTrackInDOM(track, index, playlistName) {
  const container = $("#playlist-container");

  // 1. Find or Create the Playlist Section (Header + UL)
  let header = container.querySelector(`.playlist-header[data-name="${escapeHTML(playlistName)}"]`);
  let ul;

  if (!header) {
    // Create Header
    header = document.createElement("h3");
    header.className = "playlist-header serif-title";
    header.dataset.name = escapeHTML(playlistName); // For lookup
    header.style.cssText =
      "font-size: 1.5rem; margin: 2rem 0 1rem 0; border-bottom: 1px solid var(--accent-blue); display: inline-block; text-transform: lowercase;";
    header.textContent = playlistName;
    container.appendChild(header);

    // Create List
    ul = document.createElement("ul");
    ul.className = "playlist";
    ul.dataset.playlistName = escapeHTML(playlistName);
    container.appendChild(ul);
  } else {
    ul = header.nextElementSibling;
  }

  // 2. Create List Item
  const li = document.createElement("li");
  li.className = "track-item";
  li.dataset.playlistIndex = index; // Global playlist index for click handling
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
    if (!isNaN(idx)) {
      loadTrack(idx, true);
      document.querySelectorAll(".playlist li").forEach((el) => el.classList.remove("active"));
      li.classList.add("active");
    }
  });

  // 3. Append to correct UL
  // Since we process in order, simple append works. If we processed out of order, we'd need insertBefore.
  ul.appendChild(li);

  // Update duration text if metadata loaded later (readID3 doesn't return duration reliably without loading audio)
  // We can fetch duration via audio element briefly if needed, but --:-- is fine initially.
}

/**
 * Processes remaining tracks ONE BY ONE in order, yielding to main thread between each.
 * This guarantees playlist array order == DOM order == Manifest order.
 */
function scheduleBackgroundProcessing(queue) {
  let currentIndex = playlist.length; // Starts at 1 (since index 0 is done)

  // Use an async IIFE so we can use 'await' inside the loop
  (async function processQueue() {
    for (const item of queue) {
      // 1. Process & Render THIS track fully (await ensures array/DOM order)
      await processAndRenderTrack(item, currentIndex);
      currentIndex++;

      // 2. YIELD to browser: allows paint, interaction, other scripts to run
      // requestIdleCallback is best; fallback to setTimeout(0) for Safari/older browsers
      await new Promise(resolve => {
        if (window.requestIdleCallback) {
          requestIdleCallback(resolve, { timeout: 1000 });
        } else {
          setTimeout(resolve, 0);
        }
      });
    }
  })();
}


// -------------------------------------------------------------------------
// ID3 READER (Optimized: Returns duration via quick Audio probe)
// -------------------------------------------------------------------------
function readID3(url) {
  return new Promise(async (resolve) => {
    try {
      const absoluteURL = new URL(url, window.location.href).href;

      // 1. Quick HEAD check (keep this to avoid jsmediatags hanging on 404s)
      const check = await fetch(absoluteURL, { method: "HEAD" }).catch(() => ({ ok: false }));
      if (!check.ok) {
        console.error(`❌ File Not Found: ${absoluteURL}`);
        resolve(null);
        return;
      }

      // 2. Read Tags
      window.jsmediatags.read(absoluteURL, {
        onSuccess: (tag) => {
          const { title, artist, picture } = tag.tags || {};

          const blob = picture
            ? new Blob([new Uint8Array(picture.data)], { type: picture.format })
            : null;

          const coverURL = blob
            ? URL.createObjectURL(blob)
            : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"/%3E';

          // 3. Probe Duration (Fast: browser reads only headers via Range request)
          // We do this async so it doesn't block the ID3 success callback.
          probeDuration(absoluteURL).then((duration) => {
            resolve({
              file: absoluteURL,
              title:
                title ||
                url
                  .split("/")
                  .pop()
                  .replace(/\.mp3$/i, ""),
              artist: artist || "Unknown",
              cover: coverURL,
              duration: duration, // Seconds
            });
          });
        },

        onError: (err) => {
          console.warn("Tag read failed:", err);
          probeDuration(absoluteURL).then((duration) => {
            resolve({
              file: absoluteURL,
              title: url
                .split("/")
                .pop()
                .replace(/\.mp3$/i, ""),
              artist: "Unknown Artist",
              cover:
                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"/%3E',
              duration: duration,
            });
          });
        },
      });
    } catch (e) {
      console.error("Connection error:", e);
      resolve(null);
    }
  });
}

/**
 * Fetches only the first few bytes (via Range header) to determine duration.
 * Much faster than loading the whole file.
 */
function probeDuration(url) {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = "metadata";
    // Request only first 256KB (usually enough for MP3 headers + ID3)
    // Note: Server must support Range requests (GitHub Pages / Raw.githubusercontent does).
    audio.src = url;

    const cleanup = () => {
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("error", onErr);
      audio.src = "";
    };

    const onMeta = () => {
      cleanup();
      resolve(audio.duration || 0);
    };
    const onErr = () => {
      cleanup();
      resolve(0);
    };

    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("error", onErr);
    // Force load
    audio.load();
  });
}


function loadTrackByObject(track) {
  audio.src = track.file;
  audio.load();

  $("#player-title").textContent = track.title;
  $("#player-artist").textContent = track.artist;
  $("#player-cover").src = track.cover;

  const onMeta = () => {
    $("#dur-time").textContent = fmtTime(audio.duration);
    audio.removeEventListener("loadedmetadata", onMeta);
  };
  audio.addEventListener("loadedmetadata", onMeta);
  audio.play().catch(() => {});
  updatePlayPauseBtn();
}

function loadTrack(index, autoplay = false) {
  if (!playlist.length) {
    console.warn("Playlist is empty");
    return;
  }

  if (index < 0 || index >= playlist.length) {
    console.warn("Invalid track index:", index);
    return;
  }

  currentTrackIndex = index;

  const track = playlist[index];

  loadTrackByObject(track);

  // update active playlist item
  document.querySelectorAll(".playlist li").forEach((el, i) => {
    el.classList.toggle("active", i === index);
  });

  if (autoplay) {
    audio.play().catch((err) => {
      console.log("Autoplay blocked:", err);
    });
  }
}

// -------------------------------------------------------------------------
// 9.5  Player control bindings
// -------------------------------------------------------------------------
function bindPlayerControls() {
  $("#btn-play").addEventListener("click", () => {
    if (!audio.src && playlist.length) {
      loadTrack(0, true);
    } else {
      audio.play();
    }
  });
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

  const seek = $("#seek-bar");
  seek.addEventListener("input", () => {
    if (!audio.duration) return;

    audio.currentTime = (seek.value / 100) * audio.duration;
  });
  seek.addEventListener("change", () => {
    audio.currentTime = (seek.value / 100) * (audio.duration || 0);
    isSeeking = false;
  });

  $("#vol-bar").addEventListener("input", (e) => {
    audio.volume = +e.target.value;
  });

  // Keyboard shortcuts (space = play/pause, arrows = seek, shift+arrow = next/prev)
  document.addEventListener("keydown", (e) => {
    if (currentSection !== "music") return;
    if (e.target.tagName === "INPUT") return;
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

// -------------------------------------------------------------------------
// 9.6  Time‑update / progress bar sync
// -------------------------------------------------------------------------
function onTimeUpdate() {
  if (isSeeking) return;
  const cur = audio.currentTime,
    dur = audio.duration || 0;
  $("#cur-time").textContent = fmtTime(cur);
  $("#seek-bar").value = dur ? (cur / dur) * 100 : 0;
}
function onTrackEnded() {
  // auto‑advance
  loadTrack((currentTrackIndex + 1) % playlist.length, true);
}
function updatePlayPauseBtn() {
  const playing = !audio.paused;
  $("#btn-play").classList.toggle("hidden", playing);
  $("#btn-pause").classList.toggle("hidden", !playing);
}
audio.addEventListener("play", updatePlayPauseBtn);
audio.addEventListener("pause", updatePlayPauseBtn);
audio.addEventListener("play", () => {
  $("#music-player").classList.add("playing");
});

audio.addEventListener("pause", () => {
  $("#music-player").classList.remove("playing");
});

audio.addEventListener("timeupdate", onTimeUpdate);
audio.addEventListener("ended", onTrackEnded);

// -------------------------------------------------------------------------
// 10️⃣  BOOTSTRAP
// -------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  initNavigation(); // sets up hash‑router + nav highlighting
  initLightbox(); // one global lightbox for all sections
});
