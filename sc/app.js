document.addEventListener('DOMContentLoaded', () => {
  loadAnimes();
  setupSearchRedirect();
  loadSelectedCategory('top-airing'); // ✅ Load default category on page load

  const categorySelect = document.getElementById('categorySelect');
  if (categorySelect) {
    categorySelect.addEventListener('change', (e) => {
      loadSelectedCategory(e.target.value);
    });
  }
});

// 🔥 Load Spotlight & Trending
async function loadAnimes() {
  const trendingContainer = document.getElementById('trending-movies');
  const latestContainer = document.getElementById('latest-episodes');
  const loader = document.getElementById('loader');

  if (!trendingContainer || !latestContainer || !loader) return;

  loader.classList.add('opacity-100');
  loader.classList.remove('opacity-0', 'pointer-events-none');

  try {
    const res = await fetch('https://animeapiv2.vercel.app/api');
    const data = await res.json();

    const spotlightAnimes = data.results.spotlights;
    const trendingEpisodes = data.results.trending;

    localStorage.setItem('cachedTrendingAnimes', JSON.stringify(spotlightAnimes));

    displayAnimes(spotlightAnimes, trendingContainer);
    displayLatestEpisodes(trendingEpisodes, latestContainer);
  } catch (err) {
    console.error('Failed to load animes:', err);
    trendingContainer.innerHTML = `<p class="text-red-500 text-center mt-4">Failed to load trending animes.</p>`;
    latestContainer.innerHTML = `<p class="text-red-500 text-center mt-4">Failed to load latest episodes.</p>`;
  } finally {
    loader.classList.remove('opacity-100');
    loader.classList.add('opacity-0', 'pointer-events-none');
  }
}

// ✅ Render Animes (for Spotlight)
function displayAnimes(animes, container) {
  container.innerHTML = '';
  animes.forEach((anime) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'relative group';

    const img = document.createElement('img');
    img.src = anime.poster;
    img.alt = anime.title;
    img.title = anime.title;
    img.className = 'w-full h-[160px] object-cover rounded-md hover:scale-105 transition-transform duration-300 shadow';

    const badge = document.createElement('div');
    badge.textContent = anime.tvInfo?.showType || 'TV';
    badge.className = `
      absolute top-1 left-1 bg-red-600 text-white text-xs font-bold
      px-2 py-1 rounded shadow z-10
    `;

    const hdBadge = document.createElement('div');
    hdBadge.textContent = anime.tvInfo?.quality || 'HD';
    hdBadge.className = `
      absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-semibold
      px-1.5 py-0.5 rounded shadow z-10 tracking-wide
    `;

    const link = document.createElement('a');
    link.href = `Movie/movieDetails.html?id=${encodeURIComponent(anime.id)}`;
    link.addEventListener('click', () => {
      localStorage.setItem('cachedMovie', JSON.stringify(anime));
    });

    link.appendChild(img);
    wrapper.appendChild(link);
    wrapper.appendChild(badge);
    wrapper.appendChild(hdBadge);
    container.appendChild(wrapper);
  });
}

// ✅ Render Trending Episodes
function displayLatestEpisodes(episodes, container) {
  container.innerHTML = '';
  episodes.forEach((anime) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'relative group';

    const img = document.createElement('img');
    img.src = anime.poster;
    img.alt = anime.title;
    img.title = anime.title;
    img.className = 'w-full h-[160px] object-cover rounded-md hover:scale-105 transition-transform duration-300 shadow';

    const epBadge = document.createElement('div');
    epBadge.textContent = `# ${anime.number}`;
    epBadge.className = `
      absolute top-1 left-1 bg-blue-600 text-white text-xs font-bold
      px-2 py-1 rounded shadow z-10
    `;

    const link = document.createElement('a');
    link.href = `Movie/movieDetails.html?id=${encodeURIComponent(anime.id)}`;
    link.addEventListener('click', () => {
      localStorage.setItem('cachedMovie', JSON.stringify(anime));
    });

    link.appendChild(img);
    wrapper.appendChild(link);
    wrapper.appendChild(epBadge);
    container.appendChild(wrapper);
  });
}

// 🔍 Search Redirect
function setupSearchRedirect() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const query = searchInput.value.trim();
      if (query !== '') {
        window.location.href = `search.html?q=${encodeURIComponent(query)}`;
      }
    }
  });
}

// 📂 Load and Display Selected Category
async function loadSelectedCategory(categoryKey) {
  const grid = document.getElementById('category-grid');
  if (!grid) return;

  grid.innerHTML = ''; // Only clear the grid, not the dropdown

  try {
    const res = await fetch(`https://animeapiv2.vercel.app/api/${categoryKey}?page=1`);
    const { results } = await res.json();
    const animes = results?.data || [];

    animes.slice(0, 8).forEach((anime) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'relative group';

      const img = document.createElement('img');
      img.src = anime.poster;
      img.alt = anime.title;
      img.title = anime.title;
      img.className = 'w-full h-[160px] object-cover rounded-md hover:scale-105 transition-transform duration-300 shadow';

      // 📺 Show Type badge (top-left)
      const showTypeBadge = document.createElement('div');
      showTypeBadge.textContent = anime.tvInfo?.showType || 'TV';
      showTypeBadge.className = `
        absolute top-1 left-1 bg-blue-600 text-white text-[10px] font-bold
        px-2 py-0.5 rounded shadow z-10 uppercase
      `;

      // 🎞️ Quality badge (bottom-right)
      const qualityBadge = document.createElement('div');
      qualityBadge.textContent = anime.tvInfo?.quality || 'HD';
      qualityBadge.className = `
        absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-semibold
        px-1.5 py-0.5 rounded shadow z-10 tracking-wide
      `;

      const link = document.createElement('a');
      link.href = `Movie/movieDetails.html?id=${encodeURIComponent(anime.id)}`;
      link.addEventListener('click', () => {
        localStorage.setItem('cachedMovie', JSON.stringify(anime));
      });

      link.appendChild(img);
      wrapper.appendChild(link);
      wrapper.appendChild(showTypeBadge);
      wrapper.appendChild(qualityBadge);
      grid.appendChild(wrapper);
    });
  } catch (err) {
    console.error(`Failed to load category: ${categoryKey}`, err);
    grid.innerHTML = `<p class="text-red-500">Failed to load category: ${categoryKey}</p>`;
  }
}
