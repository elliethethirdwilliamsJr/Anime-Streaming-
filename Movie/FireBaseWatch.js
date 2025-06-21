// SHOW LOADER
const showLoader = () => document.getElementById("loading").style.display = "flex";
const hideLoader = () => document.getElementById("loading").style.display = "none";

// GLOBALS
let inviteWatcher = null;
let countdownToast = null;

// TOAST MESSAGE WITH TIMER
const showToast = (friendName) => {
  if (countdownToast) countdownToast.remove();
  const toast = document.createElement("div");
  toast.className = "fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur text-white px-6 py-3 rounded-lg text-sm z-50 w-80 text-center";
  toast.innerHTML = `Waiting for <span class="font-semibold">${friendName}</span> to accept... (<span id="toast-timer">60</span>s)`;
  document.body.appendChild(toast);
  countdownToast = toast;

  let timeLeft = 60;
  const timer = setInterval(() => {
    if (!toast.parentNode) return clearInterval(timer);
    timeLeft--;
    const span = toast.querySelector("#toast-timer");
    if (span) span.textContent = `${timeLeft}`;
    if (timeLeft <= 0) {
      clearInterval(timer);
      toast.remove();
      countdownToast = null;
      if (inviteWatcher) inviteWatcher(); // stop listener
    }
  }, 1000);
};

// Wide toast
const showWideToast = (message) => {
  const toast = document.createElement("div");
  toast.className = "fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-xl text-sm z-50 w-[24rem] text-center shadow-xl";
  toast.innerHTML = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
};

// FIREBASE IMPORTS
import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  arrayUnion,
  arrayRemove,
  collection,
  getDocs,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

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

onAuthStateChanged(auth, async (user) => {
  if (!user) return (window.location.href = "../Login/login.html");

  const currentUserId = user.uid;
  const userRef = doc(db, "users", currentUserId);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.data();

  const friends = userData.friends || [];
  const invitedBy = userData.invitedBy || [];
  const container = document.getElementById("friends-list");

  for (const friendId of friends) {
    const friendSnap = await getDoc(doc(db, "users", friendId));
    if (!friendSnap.exists()) continue;

    const friendData = friendSnap.data();
    const { name, avatar } = friendData;

    const isInvited = (friendData.invitedBy || []).includes(currentUserId);
    const youWereInvited = invitedBy.includes(friendId);
    const label = youWereInvited ? "Accept Invite" : isInvited ? "Invited ✅" : "Invite";
    const disabled = isInvited;

    const card = document.createElement("div");
    card.className = "bg-gray-800 p-4 rounded-lg flex justify-between items-center shadow";
    const img = avatar || `https://api.dicebear.com/7.x/lorelei/svg?seed=${name}`;
    card.innerHTML = `
      <div class="flex items-center gap-4">
        <img src="${img}" class="w-12 h-12 rounded-full border-2 border-red-500 object-cover"/>
        <span class="font-semibold text-lg">${name}</span>
      </div>
      <button class="btn-action bg-${youWereInvited ? 'green' : 'red'}-600 hover:bg-${youWereInvited ? 'green' : 'red'}-700 text-white px-4 py-2 rounded-lg"
        data-id="${friendId}" data-name="${name}" ${disabled ? 'disabled' : ''}>${label}</button>
    `;
    container.appendChild(card);
  }

  hideLoader();

  document.querySelectorAll(".btn-action").forEach(btn => {
    btn.addEventListener("click", async () => {
      const friendId = btn.dataset.id;
      const friendName = btn.dataset.name || "Friend";
      const btnEl = btn;
      showLoader();

      if (btn.textContent === "Accept Invite") {
        await updateDoc(userRef, {
          invitedBy: arrayRemove(friendId),
          [`inviteStatus.${friendId}`]: "accepted"
        });
        window.location.href = `watchRoom.html?room=${friendId}`;
      } else {
        // Invite
        await updateDoc(doc(db, "users", friendId), {
          invitedBy: arrayUnion(currentUserId),
          [`inviteStatus.${currentUserId}`]: "pending"
        });

        await setDoc(doc(db, "rooms", currentUserId), {
          host: currentUserId,
          videoUrl: "",
          currentTime: 0,
          isPlaying: false
        });

        const messagesRef = collection(db, "rooms", currentUserId, "messages");
        const msgsSnap = await getDocs(messagesRef);
        for (const msg of msgsSnap.docs) {
          await deleteDoc(msg.ref);
        }

        showToast(friendName);
        btnEl.textContent = "Invited ✅";
        btnEl.disabled = true;

        inviteWatcher = onSnapshot(doc(db, "users", friendId), async (snap) => {
          const data = snap.data();
          const status = data?.inviteStatus?.[currentUserId];

          if (status === "accepted") {
            inviteWatcher();
            if (countdownToast) countdownToast.remove();
            showLoader();
            showWideToast("Accepted: Creating room, pls wait...");
            setTimeout(() => {
              window.location.href = `watchRoom.html?room=${currentUserId}`;
            }, 1200);
          }

          if (status === "declined") {
            inviteWatcher();
            if (countdownToast) countdownToast.remove();
            showWideToast(`${friendName} declined your invite`);
            btnEl.textContent = "Invite";
            btnEl.disabled = false;
            await updateDoc(doc(db, "users", friendId), {
              [`inviteStatus.${currentUserId}`]: deleteField()
            });
          }
        });
      }

      hideLoader();
    });
  });

// 🔁 Realtime Invite Popup (Slim & Aesthetic)
onSnapshot(userRef, (docSnap) => {
  const data = docSnap.data();
  const invitedByList = data?.invitedBy || [];

  if (invitedByList.length > 0) {
    const inviterId = invitedByList[0];

    getDoc(doc(db, "users", inviterId)).then((inviterSnap) => {
      if (!inviterSnap.exists()) return;
      const inviterName = inviterSnap.data().name || "Someone";

      if (!document.querySelector("#invite-popup")) {
        const popup = document.createElement("div");
        popup.id = "invite-popup";
        popup.className = `
          fixed bottom-24 left-1/2 transform -translate-x-1/2
          bg-gray-800 text-white px-4 py-2 rounded-md z-50 w-64
          shadow-md text-sm text-center
        `.replace(/\s+/g, ' ').trim();

        popup.innerHTML = `
          <p class="mb-1 text-xs"><span class="text-green-400 font-semibold">${inviterName}</span> invited you</p>
          <div class="flex gap-1">
            <button class="accept-invite bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded w-full">Accept</button>
            <button class="decline-invite bg-gray-700 hover:bg-gray-800 text-white text-xs px-2 py-1 rounded w-full">Decline</button>
          </div>
        `;

        document.body.appendChild(popup);

        popup.querySelector(".accept-invite").addEventListener("click", async () => {
          await updateDoc(userRef, {
            invitedBy: arrayRemove(inviterId),
            [`inviteStatus.${inviterId}`]: "accepted"
          });
          window.location.href = `watchRoom.html?room=${inviterId}`;
        });

        popup.querySelector(".decline-invite").addEventListener("click", async () => {
          await updateDoc(userRef, {
            invitedBy: arrayRemove(inviterId),
            [`inviteStatus.${inviterId}`]: "declined"
          });
          popup.remove();
        });
      }
    });
  }
});
});