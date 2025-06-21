import { getWatchProgress, trackWatchProgress } from "./Tracker.js";

document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("player");
  const loader = document.getElementById("preloder");
  const urlParams = new URLSearchParams(window.location.search);
  const episodeId = urlParams.get("id");

  if (!episodeId) {
    alert("❌ Missing episode ID in URL.");
    loader.style.display = "none";
    return;
  }

  const apiURL = `https://animeapiv2.vercel.app/api/stream?id=${episodeId}&server=hd-2&type=sub`;

  fetch(apiURL)
    .then(res => res.json())
    .then(async data => {
      const originalLink = data?.results?.streamingLink?.link?.file;
      const link = `https://m3u8-proxy-cors-azure-two.vercel.app/cors?url=${encodeURIComponent(originalLink)}`;
      const tracks = data?.results?.streamingLink?.tracks || [];

      if (!originalLink) {
        alert("⚠️ Video source not found.");
        loader.style.display = "none";
        return;
      }

      video.innerHTML = "";

      const onVideoReady = async () => {
        const resumeModal = document.getElementById("resume-modal");
        const resumeTimeEl = document.getElementById("resume-time");
        const startOverBtn = document.getElementById("start-over-btn");
        const continueBtn = document.getElementById("continue-btn");

        const savedTime = await getWatchProgress(episodeId);

        loader.style.display = "none";

        if (savedTime >= 60) {
          const minutes = Math.floor(savedTime / 60);
          const seconds = savedTime % 60;
          resumeTimeEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

          resumeModal.classList.remove("hidden");

          startOverBtn.onclick = () => {
            resumeModal.classList.add("hidden");
            video.currentTime = 0;
            video.play();
          };

          continueBtn.onclick = () => {
            resumeModal.classList.add("hidden");
            video.currentTime = savedTime;
            video.play();
          };
        } else {
          video.play();
        }

        // Start tracking progress
        trackWatchProgress(video, episodeId);
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

      // Add subtitles
      tracks.forEach(track => {
        const trackEl = document.createElement("track");
        trackEl.kind = track.kind || "subtitles";
        trackEl.label = track.label || "English";
        trackEl.src = track.file;
        trackEl.srclang = "en";
        if (track.default) trackEl.default = true;
        video.appendChild(trackEl);
      });

      // Setup Plyr
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