import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  addDoc,
  serverTimestamp,
  onSnapshot,
  orderBy
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

// Global Elements
const avatarImg = document.querySelector(".group img");
const usernameSpan = document.querySelector(".group span");
const friendsContainer = document.getElementById("friends-container");
const requestsContainer = document.getElementById("requests-container");
const tabFriends = document.getElementById("tab-friends");
const tabRequests = document.getElementById("tab-requests");
const loader = document.getElementById("loading");

// Loader
function showLoader() {
  loader.style.display = "flex";
  loader.classList.remove("opacity-0");
}
function hideLoader() {
  loader.classList.add("opacity-0");
  setTimeout(() => {
    loader.style.display = "none";
  }, 300);
}

// Modal
function toggleModal(show) {
  const modal = document.getElementById("friend-modal");
  const modalContent = modal?.querySelector("div");
  if (!modal || !modalContent) return;

  if (show) {
    modal.classList.remove("hidden");
    setTimeout(() => {
      modal.classList.add("flex");
      modalContent.classList.remove("scale-95", "opacity-0");
      modalContent.classList.add("scale-100", "opacity-100");
    }, 10);
  } else {
    modalContent.classList.remove("scale-100", "opacity-100");
    modalContent.classList.add("scale-95", "opacity-0");
    setTimeout(() => {
      modal.classList.remove("flex");
      modal.classList.add("hidden");
    }, 300);
  }
}

// Load profile
async function loadUserProfile(user) {
  const uid = user.uid;
  const cachedAvatar = localStorage.getItem("avatar");
  const cachedName = localStorage.getItem("name");

  if (cachedAvatar && avatarImg) avatarImg.src = cachedAvatar;
  if (cachedName && usernameSpan) usernameSpan.textContent = cachedName;

  if (!cachedAvatar || !cachedName) {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      if (data.avatar) {
        avatarImg.src = data.avatar;
        localStorage.setItem("avatar", data.avatar);
      }
      if (data.name) {
        usernameSpan.textContent = data.name;
        localStorage.setItem("name", data.name);
      }
    }
  }
}

// Render Friends
async function renderFriends(uid) {
  showLoader();
  const userSnap = await getDoc(doc(db, "users", uid));
  if (!userSnap.exists()) return;

  const list = userSnap.data().friends || [];
  const lastReadMap = userSnap.data().lastRead || {};

  friendsContainer.innerHTML = "";

  if (list.length === 0) {
    friendsContainer.innerHTML = `<div class="text-center mt-20 text-gray-500 text-lg animate-pulse">🫂 You don't have any friends yet.</div>`;
    hideLoader();
    return;
  }

  for (const fid of list) {
    const fSnap = await getDoc(doc(db, "users", fid));
    if (!fSnap.exists()) continue;
    const fData = fSnap.data();

    // Get chat ID and unread count
    const chatId = getChatId(uid, fid);
    const chatRef = collection(db, "messages", chatId, "messages");

    const q = query(chatRef, orderBy("timestamp", "desc"));
    const snap = await getDocs(q);

    const lastReadTime = lastReadMap[chatId]?.toMillis?.() || 0;
    let unreadCount = 0;

    snap.forEach(doc => {
      const data = doc.data();
      if (
        data.senderId === fid &&
        data.timestamp?.toMillis?.() > lastReadTime
      ) {
        unreadCount++;
      }
    });

    const div = document.createElement("div");
    div.className = "flex items-center justify-between bg-white/10 dark:bg-gray-800 rounded-lg p-3 mb-2";

    div.innerHTML = `
      <div class="flex items-center gap-2 relative">
        <img src="${fData.avatar || 'images/user.jpg'}" class="w-10 h-10 rounded-full mr-3" />
        <span class="font-medium">${fData.name || "Unnamed"}</span>
        ${
          unreadCount > 0
            ? `<span class="ml-2 text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">${unreadCount}</span>`
            : ""
        }
      </div>
      <button class="message-btn text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded transition">💬 Message</button>
    `;

    const messageBtn = div.querySelector(".message-btn");
    messageBtn.onclick = () => openMessageModal(fid, fData.name);

    friendsContainer.appendChild(div);
  }

  hideLoader();
}


// Render Requests
async function renderFriendRequests(uid) {
  showLoader();
  const snap = await getDoc(doc(db, "users", uid));
  const data = snap.data();
  const requests = data.friendRequests || [];

  // Update red indicator bubble
const indicator = document.getElementById("request-count-indicator");
if (requests.length > 0) {
  indicator.textContent = requests.length;
  indicator.classList.remove("hidden");
} else {
  indicator.classList.add("hidden");
}

  requestsContainer.innerHTML = "";
  if (requests.length === 0) {
    requestsContainer.innerHTML = `<div class="text-center text-gray-500 mt-10">No friend requests.</div>`;
    hideLoader();
    return;
  }

  for (const rid of requests) {
    const rSnap = await getDoc(doc(db, "users", rid));
    if (!rSnap.exists()) continue;
    const rData = rSnap.data();
    const card = document.createElement("div");
    card.className = "flex items-center justify-between bg-white/10 dark:bg-gray-800 rounded p-3 mb-2";
    card.innerHTML = `
      <div class="flex items-center gap-3">
        <img src="${rData.avatar || 'images/user.jpg'}" class="w-8 h-8 rounded-full">
        <span>${rData.name}</span>
      </div>
      <div class="flex gap-2">
        <button class="bg-green-500 hover:bg-green-600 px-3 py-1 text-white text-xs rounded">Accept</button>
        <button class="bg-red-500 hover:bg-red-600 px-3 py-1 text-white text-xs rounded">Reject</button>
      </div>
    `;

    const [acceptBtn, rejectBtn] = card.querySelectorAll("button");

    acceptBtn.onclick = async () => {
      showLoader();
      await Promise.all([
        updateDoc(doc(db, "users", uid), {
          friends: arrayUnion(rid),
          friendRequests: requests.filter(r => r !== rid)
        }),
        updateDoc(doc(db, "users", rid), {
          friends: arrayUnion(uid)
        })
      ]);
      showToast("✅ Friend accepted!");
      await renderFriends(uid);
      await renderFriendRequests(uid);
      hideLoader();
    };

    rejectBtn.onclick = async () => {
      showLoader();
      await updateDoc(doc(db, "users", uid), {
        friendRequests: requests.filter(r => r !== rid)
      });
      showToast("❌ Request rejected.");
      await renderFriendRequests(uid);
      hideLoader();
    };

    requestsContainer.appendChild(card);
  }

  hideLoader();
}

// DOM Ready
window.addEventListener("DOMContentLoaded", () => {
  const openModalBtn = document.getElementById("open-modal-btn");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const searchInput = document.getElementById("search-username");
  const searchResults = document.getElementById("search-results");

  if (openModalBtn && closeModalBtn) {
    openModalBtn.onclick = () => toggleModal(true);
    closeModalBtn.onclick = () => toggleModal(false);
  }

  // Tab switching
  tabFriends.onclick = () => {
    friendsContainer.classList.remove("hidden");
    requestsContainer.classList.add("hidden");
    tabFriends.classList.add("bg-red-500", "text-white");
    tabRequests.classList.remove("bg-red-500", "text-white");
  };
  tabRequests.onclick = () => {
    friendsContainer.classList.add("hidden");
    requestsContainer.classList.remove("hidden");
    tabRequests.classList.add("bg-red-500", "text-white");
    tabFriends.classList.remove("bg-red-500", "text-white");
  };

  // Search Users
  if (searchInput) {
    searchInput.oninput = async () => {
      const username = searchInput.value.trim().toLowerCase();
      searchResults.innerHTML = "";
      if (username.length < 3) return;

      showLoader();
      const q = query(collection(db, "users"), where("name_lower", ">=", username));
      const snaps = await getDocs(q);

      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) return;
      const currentUserDoc = await getDoc(doc(db, "users", currentUserId));
      const currentUserData = currentUserDoc.data();
      const currentUserFriends = currentUserData.friends || [];

      let found = false;

      snaps.forEach(snap => {
        const u = snap.data();
        const id = snap.id;

        if (u.name?.toLowerCase() !== username || id === currentUserId) return;

        found = true;
        const isAlreadyFriend = currentUserFriends.includes(id);

        const div = document.createElement("div");
        div.className = "flex items-center justify-between bg-white/10 dark:bg-gray-800 rounded p-3 mb-2";
        div.innerHTML = `
          <div class="flex items-center">
            <img src="${u.avatar || 'images/user.jpg'}" class="w-8 h-8 rounded-full mr-2" />
            <span>${u.name}</span>
          </div>
          <button class="px-3 py-1 text-xs rounded ${
            isAlreadyFriend
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }" ${isAlreadyFriend ? 'disabled' : ''}>
            ${isAlreadyFriend ? '✅ Already Friends' : '➕ Request'}
          </button>
        `;

        const requestBtn = div.querySelector("button");
        if (!isAlreadyFriend) {
          requestBtn.onclick = async () => {
            showLoader();
            const receiverDoc = await getDoc(doc(db, "users", id));
            const receiverData = receiverDoc.data();
            const pending = receiverData.friendRequests || [];

            if (pending.includes(currentUserId)) {
              showToast("⚠️ Friend request already sent.");
              hideLoader();
              return;
            }

            await updateDoc(doc(db, "users", id), {
              friendRequests: arrayUnion(currentUserId)
            });

            showToast("✅ Friend request sent!");
            requestBtn.disabled = true;
            requestBtn.textContent = "Sent";
            requestBtn.classList.add("bg-gray-400", "cursor-not-allowed");
            hideLoader();
          };
        }

        searchResults.appendChild(div);
      });

      if (!found) {
        searchResults.innerHTML = `<p class="text-sm text-gray-500">No user found.</p>`;
      }

      hideLoader();
    };
  }
});

// Auth state
onAuthStateChanged(auth, (user) => {
  if (user) {
    loadUserProfile(user);
    renderFriends(user.uid);
    renderFriendRequests(user.uid);
  } else {
    friendsContainer.innerHTML = `<div class="text-center mt-20 text-red-500 text-lg">⚠️ Log in to view friends.</div>`;
    hideLoader();
  }
});

// Toast
function showToast(msg) {
  const t = document.createElement("div");
  t.textContent = msg;
  t.className = `
    fixed bottom-6 left-1/2 -translate-x-1/2 text-white text-sm px-6 py-3 rounded-lg z-50
    bg-white/10 backdrop-blur-md shadow-md border border-white/20
    max-w-xl w-[90%] text-center animate-fade
  `;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// Message Modal DOM Elements
const messageModal = document.getElementById("message-modal");
const closeMessageModal = document.getElementById("close-message-modal");
const messageInput = document.getElementById("message-input");
const sendMessageBtn = document.getElementById("send-message-btn");
const messageRecipientName = document.getElementById("message-recipient");
const chatBox = document.getElementById("chat-box");

let selectedUserId = null;
let selectedUserName = null;
let unsubscribeMessages = null;

function getChatId(uid1, uid2) {
  return [uid1, uid2].sort().join("_"); // ensure order consistency
}

async function openMessageModal(userId, userName) {
  selectedUserId = userId;
  selectedUserName = userName;
  messageRecipientName.textContent = userName;
  messageInput.value = "";
  chatBox.innerHTML = "";

  const currentUser = auth.currentUser;
  if (!currentUser) return;

  const chatId = getChatId(currentUser.uid, selectedUserId);
  const chatRef = collection(db, "messages", chatId, "messages");
  const q = query(chatRef, orderBy("timestamp", "asc"));

  // Animate modal
  const modalContent = messageModal.querySelector("div");
  messageModal.classList.remove("hidden");
  setTimeout(() => {
    messageModal.classList.add("flex");
    modalContent.classList.remove("scale-95", "opacity-0");
    modalContent.classList.add("scale-100", "opacity-100");
  }, 10);

  unsubscribeMessages?.(); // cleanup old listener

  // 👇 Listen for messages
  unsubscribeMessages = onSnapshot(q, async (snapshot) => {
    chatBox.innerHTML = "";

    snapshot.forEach(doc => {
      const data = doc.data();
      const isMe = data.senderId === currentUser.uid;

      const wrapper = document.createElement("div");
      wrapper.className = `flex flex-col text-xs ${isMe ? 'items-end' : 'items-start'}`;

      const bubble = document.createElement("div");
      bubble.className = `max-w-[60%] px-3 py-2 rounded-md text-sm ${
        isMe ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-gray-700 text-black dark:text-white'
      }`;
      bubble.textContent = data.message;

      const status = document.createElement("div");
      status.className = `mt-1 text-gray-400 text-[10px]`;

      if (data.timestamp?.toDate) {
        const time = data.timestamp.toDate();
        const formattedTime = new Intl.DateTimeFormat('default', {
          hour: 'numeric',
          minute: 'numeric',
          hour12: true
        }).format(time);
        status.textContent = `Sent • ${formattedTime}`;
      } else {
        status.textContent = "Sending...";
      }

      wrapper.appendChild(bubble);
      wrapper.appendChild(status);
      chatBox.appendChild(wrapper);
    });

    // Scroll to the bottom AFTER messages are rendered
setTimeout(() => {
  chatBox.scrollTop = chatBox.scrollHeight;
}, 0);
// ✅ NOW update lastRead after rendering
    const userRef = doc(db, "users", currentUser.uid);
    await updateDoc(userRef, {
      [`lastRead.${chatId}`]: serverTimestamp()
    });
    
  });
}

function closeMessageModalFunc() {
  const modalContent = messageModal.querySelector("div");
  modalContent.classList.remove("scale-100", "opacity-100");
  modalContent.classList.add("scale-95", "opacity-0");
  setTimeout(() => {
    messageModal.classList.remove("flex");
    messageModal.classList.add("hidden");
  }, 300);

  unsubscribeMessages?.(); // stop listening on close
}

closeMessageModal.onclick = closeMessageModalFunc;

sendMessageBtn.onclick = async () => {
  const msg = messageInput.value.trim();
  if (!msg) return;

  const currentUser = auth.currentUser;
  if (!currentUser || !selectedUserId) return;

  const chatId = getChatId(currentUser.uid, selectedUserId);
  const chatRef = collection(db, "messages", chatId, "messages");

  await addDoc(chatRef, {
    senderId: currentUser.uid,
    receiverId: selectedUserId,
    message: msg,
    timestamp: serverTimestamp()
  });

  messageInput.value = "";
};


// Logout handler
const logoutBtn = document.getElementById("auth-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async (e) => {
    e.preventDefault(); // Prevent default anchor behavior
    try {
      await signOut(auth);
      localStorage.removeItem("avatar");
      localStorage.removeItem("name");

      // Redirect after logout
      window.location.href = "../../Login/login.html";
    } catch (error) {
      showToast("⚠️ Failed to logout. Try again.");
      console.error("Logout error:", error);
    }
  });
}

// Redirect to login.html if user is not logged in
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "../Login/login.html";
}
});
