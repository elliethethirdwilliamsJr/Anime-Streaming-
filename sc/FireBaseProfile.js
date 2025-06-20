 import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  collection,
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const usernameDisplay = document.querySelector('h2');
const emailDisplay = document.querySelector('p.text-gray-400');
const logoutBtn = document.getElementById('logout-btn');
const watchlistContainer = document.querySelector('#watchlist-container');
const profileImage = document.getElementById('profile-image');
const mainContent = document.getElementById('main-content');
const loading = document.getElementById('loading');

// Avatar styles from DiceBear
const styles = [
  "adventurer", "adventurer-neutral", "avataaars", "big-ears", "big-ears-neutral",
  "bottts", "croodles", "croodles-neutral", "fun-emoji", "icons", "identicon",
  "initials", "lorelei", "micah", "miniavs", "open-peeps", "personas",
  "pixel-art", "pixel-art-neutral"
];

// 👥 Friend count container
let friendCountEl = document.createElement("p");
friendCountEl.className = "text-sm text-gray-400 mt-1";
usernameDisplay.insertAdjacentElement("afterend", friendCountEl);

// Handle user
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        usernameDisplay.textContent = userData.name || "No Name";
        emailDisplay.textContent = user.email;
        profileImage.src = userData.avatar || "images/user.jpg";

        // Friend count
        const friends = userData.friends || [];
        friendCountEl.textContent = `👥 ${friends.length} friend${friends.length === 1 ? "" : "s"}`;
      }

      // Watchlist
      const watchlistSnap = await getDocs(collection(db, "users", user.uid, "watchlist"));
      watchlistContainer.innerHTML = "";

      if (watchlistSnap.empty) {
        watchlistContainer.innerHTML = `<p class="text-gray-500 col-span-full">Your watchlist is empty.</p>`;
      }

      watchlistSnap.forEach(doc => {
        const data = doc.data();
        const card = document.createElement('a');
        card.href = "#";
        card.className = "group relative block rounded-lg overflow-hidden shadow-md hover:scale-105 transition";
        card.innerHTML = `
          <img src="${data.image}" alt="${data.title}" class="w-full h-auto" />
          <div class="absolute bottom-0 left-0 right-0 bg-black/70 p-1 text-xs text-center text-white truncate">${data.title}</div>
        `;
        watchlistContainer.appendChild(card);
      });

      loading.style.display = 'none';
      mainContent.style.display = 'block';

    } catch (err) {
      console.error("Failed to load profile:", err);
    }
  } else {
    window.location.href = "Login/login.html";
  }
});

// Logout
logoutBtn.addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "Login/login.html";
  }).catch((error) => {
    console.error("Logout failed:", error);
  });
});

// Avatar Change Modal with Save Button and Loading
profileImage.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return;

  let selectedUrl = ""; // Hold selected avatar

  const modal = document.createElement("div");
  modal.className = "fixed inset-0 bg-black/70 z-50 flex items-center justify-center";
  modal.innerHTML = `
    <div class="bg-gray-900 rounded-lg p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto relative">
      <h2 class="text-xl font-bold mb-4 text-white text-center">Choose Your Avatar</h2>
      <div class="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-6" id="avatar-grid">
        ${styles.map(style => {
          const url = `https://api.dicebear.com/7.x/${style}/svg?seed=${user.uid}`;
          return `<img src="${url}" data-url="${url}" class="rounded-full w-20 h-20 cursor-pointer border-2 border-transparent hover:scale-110 transition" />`;
        }).join("")}
      </div>

      <!-- Loading Spinner -->
      <div id="avatar-loader" class="hidden absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
        <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-red-500 border-opacity-50"></div>
      </div>

      <div class="flex justify-between mt-2">
        <button class="text-sm text-red-400 hover:underline" id="close-avatar-modal">Cancel</button>
        <button class="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg" id="save-avatar-btn" disabled>Save Avatar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const avatarGrid = modal.querySelector("#avatar-grid");
  const saveBtn = modal.querySelector("#save-avatar-btn");
  const loader = modal.querySelector("#avatar-loader");

  // Cancel
  modal.querySelector("#close-avatar-modal").onclick = () => modal.remove();

  // Select Avatar
  avatarGrid.querySelectorAll("img").forEach(img => {
    img.addEventListener("click", () => {
      avatarGrid.querySelectorAll("img").forEach(i => i.classList.remove("border-red-500"));
      img.classList.add("border-red-500");
      selectedUrl = img.dataset.url;
      saveBtn.disabled = false;
    });
  });

  // Save Avatar
  saveBtn.addEventListener("click", async () => {
    if (!selectedUrl) return;
    loader.classList.remove("hidden");
    saveBtn.disabled = true;

    try {
      await updateDoc(doc(db, "users", user.uid), { avatar: selectedUrl });
      profileImage.src = selectedUrl;
      modal.remove();
    } catch (err) {
      con
sole.error("Failed to save avatar:", err);
      alert("❌ Failed to update avatar.");
      loader.classList.add("hidden");
      saveBtn.disabled = false;
    }
  });
});