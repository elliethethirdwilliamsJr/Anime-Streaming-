// sc/ep.js
import { getWatchedEpisodeIds, saveWatchedEpisode } from './FireBaseEpisode.js';
function showLoader() {
  document.getElementById("loading").style.display = "flex";
}

function hideLoader() {
  document.getElementById("loading").style.display = "none";
}

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('episode-grid');
  const animeId = new URLSearchParams(window.location.search).get('id');
  
  showLoader();
  
  if (!animeId) {
    container.innerHTML = `<p class="text-center text-red-500">Anime ID is missing.</p>`;
    return;
  }

  const watchedEpisodeIds = await getWatchedEpisodeIds();

  fetch(`https://animeapiv2.vercel.app/api/episodes/${animeId}`)
    .then(res => res.json())
    .then(data => {
      const episodes = data?.results?.episodes || [];
      if (!episodes.length) {
        container.innerHTML = `<p class="text-center text-red-500">No episodes found.</p>`;
        hideLoader();
        return;
      }

      episodes.forEach(ep => {
        const isWatched = watchedEpisodeIds.includes(ep.id);
        const btn = document.createElement('button');
        btn.className = `
          relative block rounded-lg border border-red-500/40
          bg-white/5 dark:bg-black/10
          backdrop-blur-sm text-center text-white
          p-3 transition-all duration-200
          hover:scale-105 hover:border-red-500 hover:bg-white/10
        `;
        btn.textContent = `EP ${ep.episode_no}`;

        btn.onclick = async () => {
          await saveWatchedEpisode(ep.id); // ✅ Save to Firestore
          window.location.href = `watch.html?id=${ep.id}`;
        };

        if (isWatched) {
          const badge = document.createElement('div');
          badge.className = `
            absolute top-1 right-1 
            text-white text-xs px-2 py-0.5 rounded-full shadow-md
          `;
          badge.textContent = "✓";
          btn.appendChild(badge);
        }

        container.appendChild(btn);
      });
      hideLoader();
    })
    .catch(err => {
      console.error("Failed to load episodes:", err);
      container.innerHTML = `<p class="text-red-500 text-center">Failed to load episodes.</p>`;
      hideLoader();
    });
});
