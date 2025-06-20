import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

// Firebase configuration
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

// Spinner element
const loader = document.getElementById("loader");

// ✅ Toast message display
function showToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.className = `
    fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] md:w-[400px]
    px-6 py-3 rounded-lg shadow-lg border border-white/20 backdrop-blur-md
    z-50 text-center bg-white/10 text-white text-sm transition-opacity duration-300 opacity-0
  `;
  toast.style.animation = 'fadeInOut 3s ease';
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.style.opacity = '1');
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

// ✅ Handle login form
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = e.target[0].value.trim();
  const password = e.target[1].value;

  if (!email || !password) {
    showToast("⚠️ Please enter both email and password.");
    return;
  }

  loader.classList.remove('hidden');
  loader.classList.add('show');

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    showToast("✅ Login successful!");

    setTimeout(() => {
      loader.classList.remove('show');
      loader.classList.add('hidden');
      window.location.href = "../index.html";
    }, 1000);
  } catch (error) {
    loader.classList.remove('show');
    loader.classList.add('hidden');
    showToast("❌ " + error.message);
  }
});
