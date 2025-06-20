import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const loader = document.getElementById("loader");

// ✅ Toast
function showToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.className = `
    fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] md:w-[400px] px-6 py-3 rounded-lg shadow-lg border border-white/20 backdrop-blur-md z-50 text-center
    bg-white/10 text-white text-sm transition-opacity duration-300 opacity-0
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity = '1'; });
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

// ✅ Register
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const fullNameRaw = e.target[0].value.trim();
  const email = e.target[1].value.trim();
  const password = e.target[2].value;
  const confirmPassword = e.target[3].value;

  if (!fullNameRaw || !email || !password || !confirmPassword) {
    showToast("⚠️ Please fill in all fields.");
    return;
  }

  if (password !== confirmPassword) {
    showToast("❌ Passwords do not match.");
    return;
  }

  if (password.length < 8) {
    showToast("⚠️ Password must be at least 8 characters.");
    return;
  }

  // Enforce only first letter uppercase
  const fullName = fullNameRaw.charAt(0).toUpperCase() + fullNameRaw.slice(1).toLowerCase();
  const nameLowercase = fullName.toLowerCase(); // For case-insensitive search

  try {
    loader.classList.add('show');

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name: fullName,       // For display
      name_lower: nameLowercase, // For search
      email: email,
      createdAt: new Date()
    });

    loader.classList.remove('show');
    showToast("✅ Registration successful!");
    document.getElementById('toggle-btn').click();

  } catch (error) {
    loader.classList.remove('show');
    showToast("❌ " + error.message);
  }
});
                                                          
