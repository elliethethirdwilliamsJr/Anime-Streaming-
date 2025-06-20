document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('episode-grid');
  const animeId = new URLSearchParams(window.location.search).get('id');

  if (!animeId) {
    container.innerHTML = `<p class="text-center text-red-500">Anime ID is missing.</p>`;
    return;
  }

  // ✅ Fetch episodes
  fetch(`https://animeapiv2.vercel.app/api/episodes/${animeId}`)
    .then(res => res.json())
    .then(data => {
      const episodes = data?.results?.episodes || [];
      if (!episodes.length) {
        container.innerHTML = `<p class="text-center text-red-500">No episodes found.</p>`;
        return;
      }

      episodes.forEach(ep => {
        const btn = document.createElement('button');
        btn.className = `
          block rounded-lg border border-red-500/40
          bg-white/5 dark:bg-black/10
          backdrop-blur-sm text-center text-white
          p-3 transition-all duration-200
          hover:scale-105 hover:border-red-500 hover:bg-white/10
        `;
        btn.textContent = `EP ${ep.episode_no}`;
        btn.onclick = () => {
          // Redirect to watch.html with the episode id
          window.location.href = `watch.html?id=${ep.id}`;
        };
        container.appendChild(btn);
      });
    })
    .catch(err => {
      console.error("Failed to load episodes:", err);
      container.innerHTML = `<p class="text-red-500 text-center">Failed to load episodes.</p>`;
    });
});
