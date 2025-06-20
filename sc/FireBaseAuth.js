import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const authBtn = document.getElementById("auth-btn");
const avatarImg = document.getElementById("nav-avatar");
const usernameText = document.querySelector(".group span");

// 🔄 Load avatar & username from localStorage or Firestore
onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  // 🧠 Load cached avatar & name
  const cachedAvatar = localStorage.getItem("avatar");
  const cachedName = localStorage.getItem("username");

  if (cachedAvatar && avatarImg) {
    avatarImg.src = cachedAvatar;
  }

  if (cachedName && usernameText) {
    usernameText.textContent = cachedName;
  }

  // 🔄 Fetch from Firestore to update cache
  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();

      if (data.avatar && avatarImg) {
        avatarImg.src = data.avatar;
        localStorage.setItem("avatar", data.avatar);
      }

      if (data.name && usernameText) {
        usernameText.textContent = data.name;
        localStorage.setItem("username", data.name);
      }
    }
  } catch (err) {
    console.error("Error fetching user data:", err);
  }
});

// 🔓 Auth state listener (login/logout button)
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("✅ Logged in as:", user.email);
    if (authBtn) {
      authBtn.textContent = "Logout";
      authBtn.href = "#";
      authBtn.onclick = async (e) => {
        e.preventDefault();
        try {
          await signOut(auth);
          localStorage.removeItem("avatar");
          localStorage.removeItem("username");
          setTimeout(() => {
            window.location.href = "Login/login.html";
          }, 1000);
        } catch (err) {
          showToast("❌ Logout failed: " + err.message);
        }
      };
    }
  } else {
    console.log("❌ No user logged in");
    showToast("⚠️ You're not logged in. It's recommended to use an account to save your watchlist.");
    if (authBtn) {
      authBtn.textContent = "Login";
      authBtn.href = "Login/login.html";
      authBtn.onclick = null;
    }
  }
});

// 🔔 Toast helper
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
