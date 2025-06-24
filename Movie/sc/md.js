document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const animeId = params.get('id');
  const loader = document.getElementById('loader');

  if (animeId) fetchAnimeById(animeId);

  // Handle browser back/forward nav
  window.onpopstate = () => {
    const newParams = new URLSearchParams(window.location.search);
    const newAnimeId = newParams.get('id');
    if (newAnimeId) fetchAnimeById(newAnimeId);
  };
});

// 🧼 Reset Ad Link Trigger on close
window.addEventListener("beforeunload", () => {
  localStorage.removeItem("ad_redirected");
});

// 🔁 Fetch Anime by ID
async function fetchAnimeById(animeId) {
  const loader = document.getElementById('loader');
  if (loader) loader.classList.remove('hidden');

  try {
    const res = await fetch(`https://animeapiv2.vercel.app/api/info?id=${animeId}`, {
      cache: 'no-store'
    });
    const data = await res.json();

    if (data.success && data.results?.data) {
      populateAnimeDetails(data.results.data);
    } else {
      throw new Error("Invalid API response");
    }

  } catch (error) {
    console.error('Failed to fetch anime details:', error);
    const errorDiv = document.getElementById('movie-details');
    if (errorDiv) {
      errorDiv.innerHTML = '<p class="text-red-500">Failed to load anime details.</p>';
    }
  } finally {
    if (loader) loader.classList.add('hidden');
  }
}

// 🎨 Update DOM
function populateAnimeDetails(animeData) {
  const info = animeData;
  const tv = animeData.animeInfo?.tvInfo || {};

  // ✅ Poster
  const poster = document.getElementById('movie-poster');
  if (poster) {
    poster.src = info.poster;
    poster.alt = info.title;
  }

  // ✅ Title
  const titleEl = document.getElementById('movie-title');
  if (titleEl) {
    titleEl.textContent = info.title || 'No title available';
  }

  // ✅ Meta Info
  const metaContainer = document.getElementById('movie-meta');
  if (metaContainer) {
    metaContainer.innerHTML = '';
    const metaItems = [
      tv.showType || 'TV',
      tv.duration || '24m',
      tv.quality || 'HD'
    ];
    metaItems.forEach(item => {
      const tag = document.createElement('span');
      tag.className = 'inline-block px-3 py-1 mr-2 mb-2 bg-white/10 dark:bg-white/10 text-white text-xs rounded-full border border-white/20';
      tag.textContent = item;
      metaContainer.appendChild(tag);
    });
  }

  // ✅ Description
  const desc = document.getElementById('movie-description');
  if (desc) {
    desc.textContent = animeData.animeInfo?.Overview?.replace(/\\n/g, '\n').trim() || 'No description available.';
  }

  // ✅ Genre Tags
  const tagsContainer = document.getElementById('genre-tags');
  if (tagsContainer) {
    tagsContainer.innerHTML = '';
    if (animeData.animeInfo?.Genres?.length > 0) {
      animeData.animeInfo.Genres.forEach(genre => {
        const tag = document.createElement('span');
        tag.className = 'px-3 py-1 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 text-xs rounded-full';
        tag.textContent = genre;
        tagsContainer.appendChild(tag);
      });
    }
  }

  // ✅ Watch Button
  const watchBtn = document.getElementById('watch-btn');
  if (watchBtn) {
    watchBtn.href = `ep.html?id=${info.id}`;
    watchBtn.textContent = '🎬 Watch Episodes';

    watchBtn.addEventListener('click', () => {
      triggerAdRedirect();
    });
  }

  // ✅ Watchlist Button
  const watchlistBtn = document.querySelector('.add-to-watchlist');
  if (watchlistBtn) {
    watchlistBtn.addEventListener('click', () => {
      triggerAdRedirect();
    });
  }

  // ✅ Recommended Animes
  const recList = document.getElementById('recommendation-list');
  if (recList) {
    recList.innerHTML = '';
    const recs = animeData.recommended_data || [];

    if (recs.length > 0) {
      recs.forEach(anime => {
        const recItem = document.createElement('a');
        recItem.href = `movieDetails.html?id=${anime.id}`;
        recItem.className = 'block group relative bg-white/5 dark:bg-gray-800 rounded-xl overflow-hidden shadow hover:scale-[1.02] hover:shadow-lg transition-all duration-300';

        const img = document.createElement('img');
        img.src = anime.poster;
        img.alt = anime.title;
        img.className = 'w-full h-48 object-cover';

        const infoDiv = document.createElement('div');
        infoDiv.className = 'p-3';

        const title = document.createElement('h3');
        title.className = 'text-sm font-semibold text-white truncate';
        title.textContent = anime.title;

        const subtitle = document.createElement('p');
        subtitle.className = 'text-xs text-gray-400';
        subtitle.textContent = `${anime.tvInfo?.showType || 'TV'} • ${anime.tvInfo?.eps || '?'} EPs`;

        infoDiv.appendChild(title);
        infoDiv.appendChild(subtitle);
        recItem.appendChild(img);
        recItem.appendChild(infoDiv);
        recList.appendChild(recItem);

        recItem.addEventListener('click', (e) => {
          e.preventDefault();
          const newId = anime.id;
          if (newId) {
            history.pushState(null, '', `?id=${newId}`);
            fetchAnimeById(newId);
          }
        });
      });
    } else {
      recList.innerHTML = `
        <p class="text-gray-400 col-span-full text-sm text-center">
          No recommended animes available.
        </p>
      `;
    }
  }
}

// 📣 Ad Redirect Logic
function triggerAdRedirect() {
  const adUrl = "https://viiqkzqv.com/dc/?blockID=378730&tb=https%3A%2F%2Faniverse-animestreaming.netlify.app%2F";

  if (!localStorage.getItem("ad_redirected")) {
    window.open(adUrl, "_blank");
    localStorage.setItem("ad_redirected", "yes");
  }
                      }
    
