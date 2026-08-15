// =====================================
// Cafe Arab Users
// Online / Offline Version
// =====================================

import { auth, db } from "./firebase.js";

import {
    collection,
    getDocs,
    doc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

// =====================================
// عناصر الصفحة
// =====================================

const usersList =
    document.getElementById("usersList");

const search =
    document.getElementById("search");

// =====================================
// متغيرات
// =====================================

let allUsers = [];

let currentUser = null;

// =====================================
// تسجيل الدخول
// =====================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "login.html";

            return;

        }

        currentUser = user;

        // تسجيل المستخدم كـ Online
        await setOnline();

        // تحميل المستخدمين
        await loadUsers(user.uid);

    }
);

// =====================================
// Online
// =====================================

async function setOnline() {

    if (!currentUser) return;

    try {

        await updateDoc(
            doc(
                db,
                "users",
                currentUser.uid
            ),
            {
                online: true,
                lastSeen:
                    serverTimestamp()
            }
        );

    } catch (error) {

        console.error(
            "Set Online Error:",
            error
        );

    }

}

// =====================================
// Offline
// =====================================

async function setOffline() {

    if (!currentUser) return;

    try {

        await updateDoc(
            doc(
                db,
                "users",
                currentUser.uid
            ),
            {
                online: false,
                lastSeen:
                    serverTimestamp()
            }
        );

    } catch (error) {

        console.error(
            "Set Offline Error:",
            error
        );

    }

}

// =====================================
// عند إغلاق الصفحة
// =====================================

window.addEventListener(
    "beforeunload",
    () => {

        setOffline();

    }
);

// =====================================
// عند إخفاء الصفحة
// =====================================

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.visibilityState ===
            "visible"
        ) {

            setOnline();

        } else {

            setOffline();

        }

    }
);

// =====================================
// تحميل المستخدمين
// =====================================

async function loadUsers(currentUid) {

    if (!usersList) return;

    usersList.innerHTML =
        "جاري تحميل المستخدمين...";

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "users"
                )
            );

        allUsers = [];

        snapshot.forEach(
            (userDoc) => {

                if (
                    userDoc.id !==
                    currentUid
                ) {

                    allUsers.push({

                        id:
                            userDoc.id,

                        ...userDoc.data()

                    });

                }

            }
        );

        renderUsers(
            allUsers
        );

    } catch (error) {

        console.error(
            "Load Users Error:",
            error
        );

        usersList.innerHTML =
            "<p>حدث خطأ أثناء تحميل المستخدمين.</p>";

    }

}

// =====================================
// عرض المستخدمين
// =====================================

function renderUsers(users) {

    if (!usersList) return;

    usersList.innerHTML = "";

    if (users.length === 0) {

        usersList.innerHTML =
            "<p>لا يوجد مستخدمون.</p>";

        return;

    }

    users.forEach(
        (user) => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "card";

            card.style.marginBottom =
                "15px";

            // =================================
            // الاسم
            // =================================

            const name =
                document.createElement(
                    "h3"
                );

            name.textContent =
                "👤 " +
                (
                    user.name ||
                    "مستخدم"
                );

            card.appendChild(
                name
            );

            // =================================
            // Username
            // =================================

            const username =
                document.createElement(
                    "p"
                );

            username.textContent =
                "@" +
                (
                    user.username ||
                    ""
                );

            card.appendChild(
                username
            );

            // =================================
            // الحالة
            // =================================

            const status =
                document.createElement(
                    "p"
                );

            if (user.online === true) {

                status.textContent =
                    "🟢 متصل الآن";

            } else {

                status.textContent =
                    "⚪ غير متصل";

            }

            card.appendChild(
                status
            );

            // =================================
            // زر المحادثة
            // =================================

            const chatLink =
                document.createElement(
                    "a"
                );

            chatLink.href =
                "private-chat.html?uid=" +
                encodeURIComponent(
                    user.id
                ) +
                "&name=" +
                encodeURIComponent(
                    user.name ||
                    "مستخدم"
                );

            chatLink.className =
                "btn";

            chatLink.textContent =
                "💬 بدء محادثة";

            card.appendChild(
                chatLink
            );

            usersList.appendChild(
                card
            );

        }
    );

}

// =====================================
// البحث
// =====================================

if (search) {

    search.addEventListener(
        "input",
        () => {

            const value =
                search.value
                    .toLowerCase()
                    .trim();

            const filtered =
                allUsers.filter(
                    (user) => {

                        const name =
                            (
                                user.name ||
                                ""
                            )
                            .toLowerCase();

                        const username =
                            (
                                user.username ||
                                ""
                            )
                            .toLowerCase();

                        return (
                            name.includes(
                                value
                            ) ||
                            username.includes(
                                value
                            )
                        );

                    }
                );

            renderUsers(
                filtered
            );

        }
    );

}

// =====================================
// تحديث الحالة كل دقيقة
// =====================================

setInterval(
    () => {

        if (
            currentUser &&
            document.visibilityState ===
            "visible"
        ) {

            setOnline();

        }

    },
    60000
);

// =====================================
// نهاية الملف
// =====================================
