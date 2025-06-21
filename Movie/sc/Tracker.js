// Tracker.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// 🔑 Firebase Config
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

// ⏱️ Track progress every 10 seconds
export function trackWatchProgress(videoEl, episodeId) {
  onAuthStateChanged(auth, (user) => {
    if (!user) return;

    videoEl.addEventListener("timeupdate", async () => {
      const currentTime = Math.floor(videoEl.currentTime);
      if (currentTime % 10 === 0 && currentTime !== 0) {
        const docRef = doc(db, "videoProgress", `${user.uid}_${episodeId}`);
        await setDoc(docRef, {
          uid: user.uid,
          episodeId,
          progress: currentTime,
          updatedAt: new Date()
        }, { merge: true });
      }
    });
  });
}

// 📥 Optional: Load last watched time
export async function getWatchProgress(episodeId) {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) return resolve(0);
      const docRef = doc(db, "videoProgress", `${user.uid}_${episodeId}`);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        resolve(snap.data().progress || 0);
      } else {
        resolve(0);
      }
    });
  });
}
