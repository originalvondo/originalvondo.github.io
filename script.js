const CONFIG = {
  githubUsername: 'originalvondo',          
  repoOwner: 'originalvondo',
  repoName: 'originalvondo.github.io',
  excludeForks: true,
  maxRepos: 10,

  devMusic: {

  },

  languageTags: {
    javascript: 'JS', typescript: 'TS', html: 'HTML', css: 'CSS',
    python: 'Python', rust: 'Rust', go: 'Go', 'c++': 'C++',
    'c#': 'C#', ruby: 'Ruby'
  }
};

// -------------------------------------------------------------------------
// GLOBAL STATE
// -------------------------------------------------------------------------
let currentSection = null;          // name of the section currently in #content-area
let audio = new Audio();            // single <audio> element for the player
let playlist = [];                  // parsed track objects {file, title, artist, cover, duration}
let currentTrackIndex = -1;         // index in `playlist`
let isSeeking = false;              // flag while user drags the seek bar

// -------------------------------------------------------------------------
// UTILITIES
// -------------------------------------------------------------------------
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function fmtTime(sec) {
  if (!isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
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
  const container = $('#content-area');
  container.innerHTML = `<div class="route-loading mono-text">loading ${name}…</div>`;

  try {
    const resp = await fetch(`sections/${name}.html`);
    if (!resp.ok) throw new Error(resp.statusText);
    const html = await resp.text();
    container.innerHTML = html;
    currentSection = name;

    // Run section‑specific init code
    switch (name) {
      case 'home':   initHome();   break;
      case 'about':  initGallery(); break;
      case 'archive': initArchive(); break;
      case 'music':  initMusic();   break;
    }

    // Highlight nav
    $$('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.target === name));
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (e) {
    console.error('Section load failed', e);
    container.innerHTML = `<p class="mono-text" style="color:#b00;">Failed to load “${name}”.</p>`;
  }
}

// -------------------------------------------------------------------------
// NAVIGATION SETUP
// -------------------------------------------------------------------------
function initNavigation() {
  $$('.nav-item').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = link.dataset.target;
      location.hash = target;               // triggers hashchange → router
    });
  });

  window.addEventListener('hashchange', () => {
    const hash = location.hash.slice(1) || 'home';
    loadSection(hash);
  });

  // Initial load (respect existing hash or default to home)
  const initial = location.hash.slice(1) || 'home';
  loadSection(initial);
}

// -------------------------------------------------------------------------
// LIGHTBOX (re‑usable for any section that has .collage-item / .gallery-item)
// -------------------------------------------------------------------------
let lightbox = null, lbImg = null, lbCap = null, lbClose = null;

function initLightbox() {
  lightbox = $('#lightbox');
  lbImg = $('#lightbox-img');
  lbCap = $('#lightbox-caption');
  lbClose = $('.lightbox-close', lightbox);

  // delegate – works for elements added later
  document.body.addEventListener('click', e => {
    const item = e.target.closest('.collage-item, .gallery-item');
    if (!item) return;
    const img = item.querySelector('img');
    const cap = item.querySelector('.item-caption, .gallery-caption');
    if (!img) return;
    lbImg.src = img.src;
    lbImg.alt = img.alt || '';
    lbCap.textContent = cap ? cap.textContent.trim() : '';
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  });

  const close = () => {
    lightbox.style.display = 'none';
    document.body.style.overflow = '';
  };
  lbClose?.addEventListener('click', close);
  lightbox?.addEventListener('click', e => {
    if (e.target === lightbox || e.target.classList.contains('lightbox-content-box')) close();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && lightbox?.style.display === 'flex') close();
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
  const loadingEl = $('#github-loading');
  const gridEl = $('#github-projects-grid');
  if (!CONFIG.githubUsername || CONFIG.githubUsername === 'YOUR_GITHUB_USERNAME') {
    if (loadingEl) loadingEl.style.display = 'none';
    console.log('GitHub API: set CONFIG.githubUsername to enable live repos.');
    return;
  }
  try {
    const resp = await fetch(`https://api.github.com/users/${CONFIG.githubUsername}/repos?sort=updated&per_page=15`);
    if (!resp.ok) throw new Error(resp.status);
    let repos = await resp.json();
    if (CONFIG.excludeForks) repos = repos.filter(r => !r.fork);
    repos = repos.slice(0, CONFIG.maxRepos);

    if (loadingEl) loadingEl.style.display = 'none';
    if (gridEl) gridEl.innerHTML = '';

    repos.forEach(repo => gridEl?.appendChild(createProjectCard(repo)));
  } catch (e) {
    console.error(e);
    if (loadingEl) {
      loadingEl.innerHTML = `⚠️ Offline / fallback mode – showing curated items.`;
      loadingEl.style.color = '#7a7a7a';
    }
  }
}

function createProjectCard(repo) {
  const card = document.createElement('div');
  card.className = 'project-card';
  const langRaw = (repo.language || '').toLowerCase();
  const langTag = CONFIG.languageTags[langRaw] || repo.language || 'Code';
  const year = new Date(repo.updated_at).getFullYear();
  const desc = repo.description || 'No description provided.';
  const demoLink = repo.has_pages
    ? `<a href="https://${CONFIG.githubUsername}.github.io/${repo.name}/" target="_blank" class="project-link">Demo ↗</a>`
    : repo.homepage
      ? `<a href="${repo.homepage}" target="_blank" class="project-link">Demo ↗</a>`
      : '';

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
async function initMusic() {
  const container = $('#playlist-container');
  container.innerHTML = '<div class="mono-text" style="text-align:center; grid-column:1/-1;">Loading music library...</div>';

  const isLocal = window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1' || 
                  window.location.hostname === '';

  // Path to the json file you just created
  const manifestPath = 'media/music/music.json';
  
  // Use raw.githubusercontent for production to avoid API rate limits
  const manifestUrl = isLocal 
    ? manifestPath 
    : `https://raw.githubusercontent.com/${CONFIG.repoOwner}/${CONFIG.repoName}/main/${manifestPath}`;

  try {
    const response = await fetch(manifestUrl);
    if (!response.ok) throw new Error('Could not load music manifest (music.json).');
    
    const musicData = await response.json();
    container.innerHTML = ''; // Clear loading text

    // musicData looks like: { "Playlist Name": ["path/to/song.mp3"], ... }
    for (const [playlistName, songs] of Object.entries(musicData)) {
      
      // Convert the array of paths into the object format your renderPlaylistSection expects
      const files = songs.map(path => {
        return {
          name: path.split('/').pop(),
          // Construct the full URL to the raw mp3 file
          download_url: isLocal 
            ? path 
            : `https://raw.githubusercontent.com/${CONFIG.repoOwner}/${CONFIG.repoName}/main/${path}`
        };
      });

      await renderPlaylistSection(playlistName, files);
    }

    bindPlayerControls();
  } catch (e) {
    console.error(e);
    container.innerHTML = `<p class="mono-text" style="color:red; text-align:center;">Error loading music: ${e.message}</p>`;
  }
}



async function renderPlaylistSection(name, files) {
  const container = $('#playlist-container');
  
  // Create Playlist Header
  const header = document.createElement('h3');
  header.className = 'playlist-header serif-title';
  header.style.cssText = 'font-size: 1.5rem; margin: 2rem 0 1rem 0; border-bottom: 1px solid var(--accent-blue); display: inline-block; text-transform: lowercase;';
  header.textContent = name;
  container.appendChild(header);

  // Create List
  const ul = document.createElement('ul');
  ul.className = 'playlist';
  
  // Process each file to get ID3 tags
  for (const file of files) {
    // We use download_url to get the raw file for jsmediatags
    const track = await readID3(file.download_url); 
    if (track) {
      playlist.push(track);

      const li = document.createElement('li');
      li.className = 'track-item';
      li.innerHTML = `
        <img class="track-art" src="${track.cover}" alt="">
        <div class="track-info">
          <div class="track-title">${escapeHTML(track.title)}</div>
          <div class="track-artist">${escapeHTML(track.artist)}</div>
        </div>
        <span class="track-duration mono-text">--:--</span>
      `;
      
      li.addEventListener('click', () => {
            currentTrackIndex = playlist.indexOf(track);

        loadTrackByObject(track);
        document.querySelectorAll('.playlist li').forEach(el => el.classList.remove('active'));
        li.classList.add('active');
      });
      
      ul.appendChild(li);
    }
  }
  container.appendChild(ul);
}

function readID3(url) {
  return new Promise(async resolve => {
    try {

      // Convert relative paths to absolute URLs
      const absoluteURL = new URL(url, window.location.href).href;

      const check = await fetch(absoluteURL, { method: 'HEAD' });

      if (!check.ok) {
        console.error(`❌ File Not Found: ${absoluteURL}`);
        resolve(null);
        return;
      }

      window.jsmediatags.read(absoluteURL, {
        onSuccess: tag => {
          const { title, artist, picture } = tag.tags || {};

          const blob = picture
            ? new Blob(
                [new Uint8Array(picture.data)],
                { type: picture.format }
              )
            : null;

          const coverURL = blob
            ? URL.createObjectURL(blob)
            : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"/%3E';

          resolve({
            file: absoluteURL,
            title: title || url.split('/').pop().replace(/\.mp3$/i, ''),
            artist: artist || 'Unknown',
            cover: coverURL
          });
        },

        onError: err => {
          console.warn("Tag read failed:", err);

          resolve({
            file: absoluteURL,
            title: url.split('/').pop().replace(/\.mp3$/i, ''),
            artist: 'Unknown Artist',
            cover: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"/%3E'
          });
        }
      });

    } catch(e) {
      console.error("Connection error:", e);
      resolve(null);
    }
  });
}


function loadTrackByObject(track) {
  audio.src = track.file;
  audio.load();
  
  $('#player-title').textContent = track.title;
  $('#player-artist').textContent = track.artist;
  $('#player-cover').src = track.cover;

  const onMeta = () => {
    $('#dur-time').textContent = fmtTime(audio.duration);
    audio.removeEventListener('loadedmetadata', onMeta);
  };
  audio.addEventListener('loadedmetadata', onMeta);
  audio.play().catch(()=>{});
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
    document.querySelectorAll('.playlist li')
        .forEach((el, i) => {
            el.classList.toggle(
                'active',
                i === index
            );
        });

    if (autoplay) {
        audio.play().catch(err => {
            console.log("Autoplay blocked:", err);
        });
    }
}

// -------------------------------------------------------------------------
// 9.5  Player control bindings
// -------------------------------------------------------------------------
function bindPlayerControls() {
  $('#btn-play').addEventListener('click', () => audio.play());
  $('#btn-pause').addEventListener('click', () => audio.pause());
  $('#btn-prev').addEventListener('click', () => loadTrack((currentTrackIndex - 1 + playlist.length) % playlist.length, true));
  $('#btn-next').addEventListener('click', () => loadTrack((currentTrackIndex + 1) % playlist.length, true));

  const seek = $('#seek-bar');
  seek.addEventListener('input', () => { isSeeking = true; });
  seek.addEventListener('change', () => {
    audio.currentTime = (seek.value / 100) * (audio.duration || 0);
    isSeeking = false;
  });

  $('#vol-bar').addEventListener('input', e => { audio.volume = +e.target.value; });

  // Keyboard shortcuts (space = play/pause, arrows = seek, shift+arrow = next/prev)
  document.addEventListener('keydown', e => {
    if (currentSection !== 'music') return;
    if (e.target.tagName === 'INPUT') return;
    if (e.code === 'Space') { e.preventDefault(); audio.paused ? audio.play() : audio.pause(); }
    else if (e.code === 'ArrowRight') { e.preventDefault(); audio.currentTime = Math.min(audio.duration, audio.currentTime + 5); }
    else if (e.code === 'ArrowLeft') { e.preventDefault(); audio.currentTime = Math.max(0, audio.currentTime - 5); }
    else if (e.code === 'ArrowUp') { e.preventDefault(); audio.volume = Math.min(1, audio.volume + 0.05); $('#vol-bar').value = audio.volume; }
    else if (e.code === 'ArrowDown') { e.preventDefault(); audio.volume = Math.max(0, audio.volume - 0.05); $('#vol-bar').value = audio.volume; }
    else if (e.shiftKey && e.code === 'ArrowRight') { loadTrack((currentTrackIndex + 1) % playlist.length, true); }
    else if (e.shiftKey && e.code === 'ArrowLeft') { loadTrack((currentTrackIndex - 1 + playlist.length) % playlist.length, true); }
  });
}

// -------------------------------------------------------------------------
// 9.6  Time‑update / progress bar sync
// -------------------------------------------------------------------------
function onTimeUpdate() {
  if (isSeeking) return;
  const cur = audio.currentTime, dur = audio.duration || 0;
  $('#cur-time').textContent = fmtTime(cur);
  $('#seek-bar').value = dur ? (cur / dur) * 100 : 0;
}
function onTrackEnded() {
  // auto‑advance
  loadTrack((currentTrackIndex + 1) % playlist.length, true);
}
function updatePlayPauseBtn() {
  const playing = !audio.paused;
  $('#btn-play').classList.toggle('hidden', playing);
  $('#btn-pause').classList.toggle('hidden', !playing);
}
audio.addEventListener('play', updatePlayPauseBtn);
audio.addEventListener('pause', updatePlayPauseBtn);

audio.addEventListener('timeupdate', onTimeUpdate);
audio.addEventListener('ended', onTrackEnded);

// -------------------------------------------------------------------------
// 10️⃣  BOOTSTRAP
// -------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();   // sets up hash‑router + nav highlighting
  initLightbox();     // one global lightbox for all sections
});
