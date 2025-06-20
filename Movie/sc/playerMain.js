document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("player");
  const loader = document.getElementById("preloder");
  const urlParams = new URLSearchParams(window.location.search);
  const episodeId = urlParams.get("id");

  if (!episodeId) {
    alert("❌ Missing episode ID in URL.");
    loader.style.display = "none"; // Hide loader since we won't load video
    return;
  }

  const apiURL = `https://animeapiv2.vercel.app/api/stream?id=${episodeId}&server=hd-2&type=sub`;

  fetch(apiURL)
    .then(res => res.json())
    .then(data => {
      const originalLink = data?.results?.streamingLink?.link?.file;
      const link = `https://m3u8-proxy-cors-azure-two.vercel.app/cors?url=${encodeURIComponent(originalLink)}`;
      const tracks = data?.results?.streamingLink?.tracks || [];

      if (!originalLink) {
        alert("⚠️ Video source not found.");
        loader.style.display = "none";
        return;
      }

      // Clear existing sources and tracks
      video.innerHTML = "";

      // Function to hide loader and play video after setup
      const onVideoReady = () => {
        loader.style.display = "none";
        video.play().catch(() => {});
      };

      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(link);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          onVideoReady();
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = link;
        video.addEventListener("loadedmetadata", () => {
          onVideoReady();
        });
      } else {
        alert("⚠️ Your browser doesn't support HLS streaming.");
        loader.style.display = "none";
        return;
      }

      // Add subtitle tracks if available
      tracks.forEach(track => {
        const trackEl = document.createElement("track");
        trackEl.kind = track.kind || "subtitles";
        trackEl.label = track.label || "English";
        trackEl.src = track.file;
        trackEl.srclang = "en";
        if (track.default) trackEl.default = true;
        video.appendChild(trackEl);
      });

      // Setup Plyr after video source set
      setTimeout(() => {
        new Plyr(video, {
          captions: { active: true, update: true, language: "en" },
        });
      }, 100);

    })
    .catch(err => {
      console.error("Stream fetch error:", err);
      alert("Failed to load episode. Please try again later.");
      loader.style.display = "none";
    });
});
