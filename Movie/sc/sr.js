document.addEventListener('DOMContentLoaded', () => {
  handleSearch();
  setupSearchInput();
});

let currentPage = 1;
let currentQuery = "";

function setupSearchInput() {
  const input = document.getElementById('search-input');
  if (!input) return;

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const query = input.value.trim();
      if (query) {
        window.location.href = `search.html?q=${encodeURIComponent(query)}&page=1`;
      }
    }
  });
}

async function handleSearch() {
  const container = document.getElementById('trending-movies');
  const loader = document.getElementById('loader');

  if (!container || !loader) return;

  const queryParams = new URLSearchParams(window.location.search);
  const query = queryParams.get('q');
  const page = parseInt(queryParams.get('page')) || 1;

  currentPage = page;
  currentQuery = query;

  if (!query) {
    container.innerHTML = `<p class="text-red-500 text-center">No search query provided.</p>`;
    return;
  }

  loader.classList.remove('hide');
  loader.classList.add('show');

  try {
    const res = await fetch(`https://animeapiv2.vercel.app/api/search?keyword=${encodeURIComponent(query)}&page=${page}`);
    const data = await res.json();
    const results = data.results?.data || [];

    container.innerHTML = ''; // Clear previous results

    if (!results.length) {
      container.innerHTML = `<p class="text-gray-500 text-center mt-4">No results found for <strong>${query}</strong>.</p>`;
      return;
    }

    // ✅ Result Count
    const resultCountElem = document.createElement('p');
    resultCountElem.className = "col-span-full text-sm text-center text-gray-400 mb-2";
    resultCountElem.textContent = `Showing ${results.length} results for "${query}"`;
    container.appendChild(resultCountElem);

    // ✅ Show Anime Cards
    results.forEach(anime => {
      const wrapper = document.createElement('div');
      wrapper.className = 'relative group';

      const img = document.createElement('img');
      img.src = anime.poster;
      img.alt = anime.title;
      img.title = anime.title;
      img.className = 'w-[110px] h-auto mx-auto rounded-lg hover:scale-105 transition-transform duration-300 shadow';

      // 🔗 Link wrapper
      const link = document.createElement('a');
      link.href = `Movie/movieDetails.html?id=${encodeURIComponent(anime.id)}`;
      link.appendChild(img);

      // 📺 Type badge (top-left)
      const typeBadge = document.createElement('div');
      typeBadge.textContent = anime.tvInfo?.showType || 'TV';
      typeBadge.className = `
        absolute top-1 left-1 bg-blue-600 text-white text-[10px] font-bold
        px-2 py-0.5 rounded shadow z-10 uppercase
      `;

      // 🔤 Sub/Dub badge (bottom-right)
      const sub = anime.tvInfo?.sub;
      const dub = anime.tvInfo?.dub;
      let subDubText = '';
      if (sub && dub) subDubText = 'SUB/DUB';
      else if (sub) subDubText = 'SUB';
      else if (dub) subDubText = 'DUB';

      const langBadge = document.createElement('div');
      langBadge.textContent = subDubText;
      langBadge.className = `
        absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-semibold
        px-1.5 py-0.5 rounded shadow z-10 tracking-wide
      `;

      wrapper.appendChild(link);
      wrapper.appendChild(typeBadge);
      if (subDubText) wrapper.appendChild(langBadge);
      container.appendChild(wrapper);
    });

    // ✅ Pagination
    const nav = document.createElement('div');
    nav.className = "col-span-full flex justify-center gap-4 mt-6";

    const prev = document.createElement('button');
    prev.textContent = "⬅ Previous";
    prev.disabled = page <= 1;
    prev.className = "px-4 py-2 rounded bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-40";
    prev.onclick = () => changePage(page - 1);

    const next = document.createElement('button');
    next.textContent = "Next ➡";
    next.className = "px-4 py-2 rounded bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700";
    next.onclick = () => changePage(page + 1);

    nav.appendChild(prev);
    nav.appendChild(next);
    container.appendChild(nav);

  } catch (err) {
    console.error('Search failed:', err);
    container.innerHTML = `<p class="text-red-500 text-center mt-4">Error fetching search results.</p>`;
  } finally {
    loader.classList.remove('show');
    loader.classList.add('hide');
  }
}

function changePage(page) {
  window.location.href = `search.html?q=${encodeURIComponent(currentQuery)}&page=${page}`;
      }
    
