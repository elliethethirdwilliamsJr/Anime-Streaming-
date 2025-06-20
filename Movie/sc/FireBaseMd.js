import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBKz0iJwhaza7-O4-7b2S2KKo5IwJlR3F4",
  authDomain: "aniverse-e1b73.firebaseapp.com",
  projectId: "aniverse-e1b73",
  storageBucket: "aniverse-e1b73.firebasestorage.app",
  messagingSenderId: "932719703453",
  appId: "1:932719703453:web:dc0c0195d8e9a3738d6b74",
  measurementId: "G-4CTXPVYTNL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// Wait for DOM to load
document.addEventListener("DOMContentLoaded", () => {
  const watchListBtn = document.getElementById("watchlist-btn");

  if (watchListBtn) {
    watchListBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const loader = document.getElementById("loader-overlay");
      const toast = document.getElementById("toast");
      const toastMsg = "✅ Added to watchlist successfully!";
      const body = document.body;

      loader.classList.remove("hidden");
      body.classList.add("pointer-events-none");

      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          loader.classList.add("hidden");
          body.classList.remove("pointer-events-none");

          showToast("⚠️ Please login to save to your watchlist.", true);
          return;
        }

        const movieTitle = document.querySelector("h1")?.textContent || "Untitled";
        const movieImage = document.querySelector("img")?.src || "";

        const movieData = {
          title: movieTitle,
          image: movieImage,
          addedAt: new Date().toISOString()
        };

        const movieId = movieTitle.toLowerCase().replace(/\s+/g, '-');

        try {
          await setDoc(doc(db, "users", user.uid, "watchlist", movieId), movieData);

          loader.classList.add("hidden");
          body.classList.remove("pointer-events-none");

          showToast(toastMsg);
        } catch (error) {
          console.error("Error saving to watchlist:", error);

          loader.classList.add("hidden");
          body.classList.remove("pointer-events-none");

          showToast("❌ Failed to add to watchlist.", true);
        }
      });
    });
  }

  // Toast handler
  function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.remove("hidden");

  // Optionally re-trigger animation (optional)
  toast.classList.remove("opacity-0");
  toast.classList.add("opacity-100");

  // Hide after 3s
  setTimeout(() => {
    toast.classList.add("hidden");
    toast.classList.remove("opacity-100");
    toast.classList.add("opacity-0");
  }, 3000);
}

});
