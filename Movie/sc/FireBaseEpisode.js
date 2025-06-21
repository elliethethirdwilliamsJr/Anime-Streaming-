// sc/FireBaseEpisode.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// Firebase config
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

// ✅ Get watched episodes for logged-in user
export async function getWatchedEpisodeIds() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) return resolve([]);

      const q = query(
        collection(db, "watchHistory"),
        where("uid", "==", user.uid)
      );

      const querySnapshot = await getDocs(q);
      const watched = [];
      querySnapshot.forEach(doc => {
        watched.push(doc.data().episodeId);
      });

      resolve(watched);
    });
  });
}

// ✅ Save an episode as watched
export async function saveWatchedEpisode(episodeId) {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) return resolve();

      const docId = `${user.uid}_${episodeId}`;
      await setDoc(doc(db, "watchHistory", docId), {
        uid: user.uid,
        episodeId: episodeId,
        watchedAt: new Date()
      });


      resolve();
    });
  });
}
