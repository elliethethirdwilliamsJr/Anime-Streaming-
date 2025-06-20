import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  addDoc,
  getDocs,
  serverTimestamp,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBKz0iJwhaza7-O4-7b2S2KKo5IwJlR3F4",
  authDomain: "aniverse-e1b73.firebaseapp.com",
  projectId: "aniverse-e1b73",
  storageBucket: "aniverse-e1b73.appspot.com",
  messagingSenderId: "932719703453",
  appId: "1:932719703453:web:dc0c0195d8e9a3738d6b74",
  measurementId: "G-4CTXPVYTNL"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Get animeId from URL query string
const urlParams = new URLSearchParams(window.location.search);
const animeId = urlParams.get("id");

// DOM Elements
const form = document.getElementById("comment-form");
const input = document.getElementById("comment-input");
const reviewsList = document.getElementById("reviews-list");

if (!animeId || !form || !input || !reviewsList) {
  console.warn("Missing anime ID or required HTML elements.");
}

// Format timestamp to "X time ago"
function formatTimeAgo(date) {
  if (!date) return "some time ago";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds} sec ago`;
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'min', seconds: 60 }
  ];
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count > 0) return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
  }
  return "just now";
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Fetch and display comments from Firestore
async function fetchComments() {
  if (!animeId) return;

  try {
    const q = query(
      collection(db, "animecomment"),
      where("animeId", "==", animeId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);

    // Clear previous comments
    reviewsList.innerHTML = "";

    if (snap.empty) {
      reviewsList.innerHTML = `<p class="text-sm text-gray-400">No comments yet.</p>`;
      return;
    }

    snap.forEach(docSnap => {
      const c = docSnap.data();
      const timeAgo = formatTimeAgo(c.createdAt?.toDate());

      const reviewItem = document.createElement("div");
      reviewItem.className = "anime__review__item";
      reviewItem.innerHTML = `
        <div class="anime__review__item__pic">
          <img src="${c.avatar || "images/user.jpg"}" alt="${c.name || 'User'}">
        </div>
        <div class="anime__review__item__text">
          <h6>${escapeHtml(c.name || "Anonymous")} - <span>${timeAgo}</span></h6>
          <p>${escapeHtml(c.text)}</p>
        </div>
      `;
      reviewsList.appendChild(reviewItem);
    });

  } catch (err) {
    console.error("Failed to load comments:", err);
    reviewsList.innerHTML = `<p class="text-red-500">Failed to load comments.</p>`;
  }
}

// Submit new comment without reloading page
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const text = input.value.trim();
  if (!text) return showToast("Please Enter a comment");

  const user = auth.currentUser;
  if (!user) return showToast("⚠️ You're not logged in. Login to comment");

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
  try {
    // Get user profile info from Firestore
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    const userData = userDocSnap.exists() ? userDocSnap.data() : {};

    // Prepare comment data
    const comment = {
      animeId,
      text,
      uid: user.uid,
      name: userData.name || user.email || "Anonymous",
      avatar: userData.avatar || "images/user.jpg",
      createdAt: serverTimestamp()
    };

    // Add comment to Firestore
    await addDoc(collection(db, "animecomment"), comment);

    input.value = ""; // Clear input
    fetchComments(); // Refresh comments list

  } catch (err) {
    console.error("Failed to add comment:", err);
    alert("❌ Failed to post comment.");
  }
});

// Refresh comments when user logs in or page loads
onAuthStateChanged(auth, (user) => {
  if (user) {
    fetchComments();
  } else {
    reviewsList.innerHTML = `<p class="text-gray-500">Please log in to see comments.</p>`;
  }
});
