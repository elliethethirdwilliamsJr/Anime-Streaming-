import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot,
  collection, addDoc, serverTimestamp, orderBy, query, deleteDoc
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBKz0iJwhaza7-O4-7b2S2KKo5IwJlR3F4",
  authDomain: "aniverse-e1b73.firebaseapp.com",
  projectId: "aniverse-e1b73",
  storageBucket: "aniverse-e1b73.firebasestorage.app",
  messagingSenderId: "932719703453",
  appId: "1:932719703453:web:dc0c0195d8e9a3738d6b74",
  measurementId: "G-4CTXPVYTNL"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const showLoader = () => document.getElementById("loading").style.display = "flex";
const hideLoader = () => document.getElementById("loading").style.display = "none";
hideLoader()
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("room");
if (!roomId) throw new Error("Missing room ID");

const player = document.getElementById("player");
const chatBox = document.getElementById("chat-box");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
const toast = document.getElementById("toast");
const syncStatus = document.getElementById("syncStatus");

const animeModal = document.getElementById("animeModal");
const animeList = document.getElementById("animeList");
const animeSearch = document.getElementById("animeSearch");
const episodeListWrapper = document.getElementById("episodeListWrapper");
const episodeList = document.getElementById("episodeList");
const backToAnime = document.getElementById("backToAnime");
const selectAnimeBtn = document.getElementById("selectAnimeBtn");
const closeAnimeModal = document.getElementById("closeModalBtn");

const chatToggleBtn = document.getElementById("chatToggleBtn");
const chatModal = document.getElementById("chat-modal");
const closeChatBtn = document.getElementById("closeChatBtn");

const showToast = (msg) => {
  toast.textContent = msg;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 3000);
};

chatToggleBtn.addEventListener("click", () => {
  chatModal.classList.remove("hidden");
  const inner = chatModal.querySelector("div");
  inner.classList.remove("scale-95", "opacity-0");
  inner.classList.add("scale-100", "opacity-100");
});

closeChatBtn.addEventListener("click", () => {
  const inner = chatModal.querySelector("div");
  inner.classList.remove("scale-100", "opacity-100");
  inner.classList.add("scale-95", "opacity-0");
  setTimeout(() => {
    chatModal.classList.add("hidden");
  }, 300);
});

onAuthStateChanged(auth, async (user) => {
  if (!user) return (window.location.href = "../Login/login.html");

  const currentUserId = user.uid;
  const roomRef = doc(db, "rooms", roomId);
  const typingRef = doc(db, "rooms", roomId, "typing", currentUserId);
  const userRef = doc(db, "users", currentUserId);
  const userSnap = await getDoc(userRef);
  const currentUserName = userSnap.exists() ? userSnap.data().name : "Anonymous";

  const roomSnap = await getDoc(roomRef);
  const isHost = roomSnap.data()?.host === currentUserId;

  selectAnimeBtn?.addEventListener("click", () => {
    if (!isHost) return showToast("Only host can do that");
    animeModal.classList.remove("hidden");
  });

  closeAnimeModal?.addEventListener("click", () => {
    animeModal.classList.add("hidden");
  });

  onSnapshot(roomRef, (snapshot) => {
    const data = snapshot.data();
    if (!data) return;
    if (data.videoUrl && player.src !== data.videoUrl) player.src = data.videoUrl;
    if (Math.abs(player.currentTime - data.currentTime) > 1) player.currentTime = data.currentTime;
    if (data.isPlaying && player.paused) player.play().catch(() => {});
    else if (!data.isPlaying && !player.paused) player.pause();
    syncStatus?.classList?.remove("hidden");
  });

  setInterval(async () => {
    const snap = await getDoc(roomRef);
    if (snap.data()?.host === currentUserId) {
      await updateDoc(roomRef, {
        currentTime: player.currentTime,
        isPlaying: !player.paused
      });
    }
  }, 1500);

  document.getElementById("chat-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = chatInput.value.trim();
    if (!msg) return;
    await addDoc(collection(db, "rooms", roomId, "messages"), {
      text: msg,
      sender: currentUserName,
      timestamp: serverTimestamp()
    });
    chatInput.value = "";
    await deleteDoc(typingRef);
  });

  const messagesQuery = query(collection(db, "rooms", roomId, "messages"), orderBy("timestamp", "asc"));

  onSnapshot(messagesQuery, async (snapshot) => {
    const roomData = (await getDoc(roomRef)).data();
    const hostId = roomData?.host;
    const hostSnap = hostId ? await getDoc(doc(db, "users", hostId)) : null;
    const hostName = hostSnap?.exists() ? hostSnap.data().name : "";

    chatBox.innerHTML = "";
    snapshot.forEach((doc) => {
      const msg = doc.data();
      const time = msg.timestamp?.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) || "Now";
      const isSenderHost = msg.sender === hostName;
      const isCurrentUser = msg.sender === currentUserName;

      const wrapper = document.createElement("div");
      wrapper.className = `flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`;

      const name = document.createElement("div");
      name.className = "text-xs text-gray-400 mb-1";
      name.textContent = msg.sender + (isSenderHost ? " (host)" : "");

      const bubble = document.createElement("div");
      bubble.className = `max-w-[75%] px-3 py-2 rounded-lg text-sm ${isCurrentUser ? 'bg-red-600 text-white' : 'bg-gray-700 text-white'}`;
      bubble.innerHTML = `${msg.text} <div class="text-[10px] text-gray-300 mt-1 text-right">${time}</div>`;

      wrapper.appendChild(name);
      wrapper.appendChild(bubble);
      chatBox.appendChild(wrapper);
    });
    chatBox.scrollTop = chatBox.scrollHeight;
  });

  chatInput?.addEventListener("input", async () => {
    const isTyping = chatInput.value.trim().length > 0;
    if (isTyping) {
      await setDoc(typingRef, {
        name: currentUserName,
        typing: true,
        timestamp: serverTimestamp()
      });
    } else {
      await deleteDoc(typingRef);
    }
  });

  chatInput?.addEventListener("blur", async () => {
    await deleteDoc(typingRef);
  });

  onSnapshot(collection(db, "rooms", roomId, "typing"), () => {});

  if (!isHost) return;

  let animeListData = [];
  const renderAnimeList = (filter = "") => {
    episodeListWrapper.classList.add("hidden");
    animeList.classList.remove("hidden");
    animeList.innerHTML = "";

    animeListData
      .filter(a => a.title.toLowerCase().includes(filter.toLowerCase()))
      .forEach(anime => {
        const item = document.createElement("div");
        item.className = "bg-gray-700 rounded p-2 cursor-pointer hover:bg-gray-600";
        item.innerHTML = `<img src="${anime.poster}" class="w-full h-40 rounded mb-2"/><p class="text-sm font-semibold text-center">${anime.title}</p>`;
        item.addEventListener("click", () => loadEpisodes(anime.id));
        animeList.appendChild(item);
      });
  };

  const loadEpisodes = async (animeId) => {
    animeList.classList.add("hidden");
    episodeListWrapper.classList.remove("hidden");
    episodeList.innerHTML = `<p class="text-center text-gray-300">Loading episodes...</p>`;
    try {
      const res = await fetch(`https://animeapiv2.vercel.app/api/episodes/${animeId}`);
      const data = await res.json();
      const episodes = data.results?.episodes || [];
      episodeList.innerHTML = "";
      episodes.forEach((ep) => {
        const btn = document.createElement("button");
        btn.className = "w-full text-left bg-gray-700 hover:bg-gray-600 rounded p-2";
        btn.innerHTML = `<strong>Episode ${ep.episode_no}:</strong> ${ep.title}`;
        btn.addEventListener("click", async () => {
          animeModal.classList.add("hidden");
          try {
            const streamRes = await fetch(`https://animeapiv2.vercel.app/api/stream?id=${ep.id}&server=hd-2&type=sub`);
            const streamData = await streamRes.json();
            const m3u8 = streamData.results?.streamingLink?.link?.file;
            if (!m3u8) throw new Error("No stream found");
            await updateDoc(roomRef, { videoUrl: m3u8, currentTime: 0, isPlaying: false });
            player.src = m3u8;
            player.play();
          } catch (err) {
            console.error("Failed to load episode", err);
            alert("Error loading episode stream.");
          }
        });
        episodeList.appendChild(btn);
      });
    } catch {
      episodeList.innerHTML = `<p class="text-red-400 text-center">Failed to load episodes.</p>`;
    }
  };

  backToAnime.addEventListener("click", () => {
    episodeListWrapper.classList.add("hidden");
    animeList.classList.remove("hidden");
  });

  let searchTimeout = null;

animeSearch.addEventListener("input", (e) => {
  const keyword = e.target.value.trim();

  clearTimeout(searchTimeout);
  if (!keyword) return renderAnimeList(); // fallback to full list

  searchTimeout = setTimeout(async () => {
    try {
      animeList.innerHTML = `<p class="text-gray-400 text-center">Searching...</p>`;
      const res = await fetch(`https://animeapiv2.vercel.app/api/search?keyword=${encodeURIComponent(keyword)}`);
      const data = await res.json();
      const searchResults = data.results?.data || [];

      animeList.innerHTML = "";
      if (searchResults.length === 0) {
        animeList.innerHTML = `<p class="text-red-400 text-center">No results found.</p>`;
        return;
      }

      searchResults.forEach((anime) => {
        const item = document.createElement("div");
        item.className = "bg-gray-700 rounded p-2 cursor-pointer hover:bg-gray-600";
        item.innerHTML = `
          <img src="${anime.poster}" class="w-full h-40 rounded mb-2"/>
          <p class="text-sm font-semibold text-center">${anime.title}</p>
        `;
        item.addEventListener("click", () => loadEpisodes(anime.id));
        animeList.appendChild(item);
      });
    } catch (err) {
      animeList.innerHTML = `<p class="text-red-400 text-center">Search failed.</p>`;
      console.error("Search error:", err);
    }
  }, 500); // debounce for 500ms
});

  try {
    const res = await fetch("https://animeapiv2.vercel.app/api");
    const data = await res.json();
    animeListData = data.results?.spotlights || [];
    renderAnimeList();
  } catch (err) {
    console.error("Failed to load anime list", err);
  }
});
