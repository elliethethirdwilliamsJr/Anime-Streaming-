import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

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

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM
const commentInput = document.getElementById("comment-input");
const submitBtn = document.getElementById("submit-comment");
const commentList = document.getElementById("comment-list");

// Get movie ID from URL or fallback
const urlParams = new URLSearchParams(window.location.search);
const movieId = urlParams.get("id") ||
  (document.querySelector("h1")?.textContent || "unknown")
    .toLowerCase()
    .replace(/\s+/g, "-");

// Submit Comment
submitBtn.addEventListener("click", () => {
  const commentText = commentInput.value.trim();
  if (!commentText) return;

  const loader = document.getElementById("loader");
  loader.classList.remove("hidden"); // 👈 Show loader

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      showToast("⚠️ You're not logged in. Login to comment");
  loader.classList.add("hidden"); // 👈 Hide loader on early return
      return;
    }
    
    function showToast(message) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.className = `
    fixed bottom-6 left-1/2 -translate-x-1/2 text-white text-sm px-6 py-3 rounded-lg z-50
    bg-white/10 backdrop-blur-md shadow-md border border-white/20
    max-w-xl w-[90%] text-center
    animate-fade transition-opacity duration-300 opacity-100
  `;
  toast.style.pointerEvents = "none";
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}


    const userSnap = await getDoc(doc(db, "users", user.uid));
    const userData = userSnap.exists() ? userSnap.data() : {};

    const newComment = {
      userId: user.uid,
      username: userData.name || "Anonymous",
      avatar: userData.avatar || "images/user.jpg",
      movieId,
      text: commentText,
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, "comments"), newComment);
      commentInput.value = "";
      renderComment(newComment);
    } catch (err) {
      console.error("Error adding comment:", err);
      alert("❌ Failed to add comment.");
    } finally {
      loader.classList.add("hidden"); // 👈 Always hide loader at end
    }
  });
});


// Load Comments on Page Load
document.addEventListener("DOMContentLoaded", loadComments);

async function loadComments() {
  commentList.innerHTML = `<p class="text-sm text-gray-400">Loading comments...</p>`;

  try {
    const q = query(
      collection(db, "comments"),
      where("movieId", "==", movieId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    commentList.innerHTML = "";

    

    querySnapshot.forEach(docSnap => {
      renderComment(docSnap.data());
    });
  } catch (err) {
    console.error("Failed to load comments:", err);
    commentList.innerHTML = `<p class="text-sm text-red-500">⚠️ Failed to load comments.</p>`;
  }
}

function renderComment(comment) {
  const div = document.createElement("div");
  div.className = "bg-white/5 dark:bg-gray-800 px-4 py-3 rounded-lg text-sm text-white";
  div.innerHTML = `💬 ${comment.text} – <span class="text-gray-400 text-xs">${comment.username}</span>`;
  commentList.prepend(div);
}
