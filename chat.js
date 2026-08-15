// =====================================
// Cafe Arab Chat
// Registered Users + Guest Users
// Admin Warning + Ban
// Notifications Receiver
// =====================================

import { auth, db } from "./firebase.js";

import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    doc,
    getDoc,
    getDocs,
    setDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import {
    onAuthStateChanged,
    signOut,
    signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";


// =====================================
// UID المدير
// =====================================

const ADMIN_UIDS = [
    "dokedbcqRSgR4ZAbI50IAgm8St32"
];


// =====================================
// عناصر الصفحة
// =====================================

const messages =
    document.getElementById("messages");

const messageInput =
    document.getElementById("messageInput");

const sendBtn =
    document.getElementById("sendBtn");

const imageBtn =
    document.getElementById("imageBtn");

const imageInput =
    document.getElementById("imageInput");

const videoBtn =
    document.getElementById("videoBtn");

const videoInput =
    document.getElementById("videoInput");

const logoutBtn =
    document.getElementById("logoutBtn");

const userName =
    document.getElementById("userName");

const usersBtn =
    document.getElementById("usersBtn");

const clearChatBtn =
    document.getElementById("clearChatBtn");


// =====================================
// متغيرات المستخدم
// =====================================

let currentUser = null;

let currentUserName = "مستخدم";

let currentUserCountry = "";

let isGuest = false;

let messagesUnsubscribe = null;

let notificationsUnsubscribe = null;


// =====================================
// التحقق هل المستخدم أدمن
// =====================================

function isAdmin() {

    if (!currentUser) {
        return false;
    }

    return ADMIN_UIDS.includes(
        currentUser.uid
    );
}

// =====================================
// إظهار زر مسح الشات للأدمن فقط
// =====================================

function updateAdminControls() {

    if (!clearChatBtn) {
        return;
    }

    clearChatBtn.style.display =
        isAdmin()
            ? "inline-flex"
            : "none";
}

// =====================================
// بيانات الضيف
// =====================================

function getGuestData() {

    try {

        const raw =
            sessionStorage.getItem(
                "cafeArabGuest"
            );

        if (!raw) {
            return null;
        }

        const data =
            JSON.parse(raw);

        if (
            !data ||
            data.isGuest !== true ||
            !data.name
        ) {
            return null;
        }

        return data;

    } catch (error) {

        console.error(
            "Guest Data Error:",
            error
        );

        return null;
    }
}


// =====================================
// عرض اسم المستخدم
// =====================================

function updateUserName() {
updateAdminControls();
    
    if (!userName) {
        return;
    }

    userName.textContent =
        "👤 " + currentUserName;
}


// =====================================
// إخراج المستخدم
// =====================================

async function logoutUser(
    removeGuestData = false
) {

    try {

        if (messagesUnsubscribe) {
            messagesUnsubscribe();
            messagesUnsubscribe = null;
        }

        if (notificationsUnsubscribe) {
            notificationsUnsubscribe();
            notificationsUnsubscribe = null;
        }

        await signOut(auth);

        if (
            removeGuestData
        ) {

            sessionStorage.removeItem(
                "cafeArabGuest"
            );

        }

        window.location.href =
            "login.html";

    } catch (error) {

        console.error(
            "Logout User Error:",
            error
        );

        window.location.href =
            "login.html";
    }
}


// =====================================
// التحقق من حظر العضو / الضيف
// =====================================

async function checkBanStatus(user) {

    if (!user) {
        return false;
    }

    try {

        const userRef =
            doc(
                db,
                "users",
                user.uid
            );

        const userSnapshot =
            await getDoc(
                userRef
            );

        if (
            userSnapshot.exists()
        ) {

            const userData =
                userSnapshot.data();

            if (
                userData.banned === true
            ) {

                alert(
                    "🚫 حسابك محظور.\n\n" +
                    "لا يمكنك استخدام Cafe Arab حاليًا."
                );

                await logoutUser(
                    user.isAnonymous === true
                );

                return true;
            }
        }

    } catch (error) {

        console.error(
            "Ban Check Error:",
            error
        );
    }

    return false;
}


// =====================================
// تسجيل الدخول والتحضير
// =====================================

onAuthStateChanged(
    auth,
    async (user) => {

        // =================================
        // لا يوجد مستخدم Firebase
        // =================================

        if (!user) {

            const guestData =
                getGuestData();

            if (guestData) {

                try {

                    await signInAnonymously(
                        auth
                    );

                    return;

                } catch (error) {

                    console.error(
                        "Anonymous Login Error:",
                        error
                    );

                    alert(
                        "تعذر دخول الضيف.\n\n" +
                        "تأكد أن Anonymous Authentication مفعلة في Firebase."
                    );

                    return;
                }
            }

            window.location.href =
                "login.html";

            return;
        }


        // =================================
        // حفظ المستخدم الحالي
        // =================================

        currentUser =
            user;

        isGuest =
            user.isAnonymous === true;


        // =================================
        // بيانات الضيف
        // =================================

        if (isGuest) {

            const guestData =
                getGuestData();

            if (!guestData) {

                await logoutUser(
                    true
                );

                return;
            }


            // =============================
            // فحص الحظر قبل تحديث بياناته
            // =============================

            const banned =
                await checkBanStatus(
                    user
                );

            if (banned) {
                return;
            }


            currentUserName =
                guestData.name ||
                "ضيف";

            currentUserCountry =
                guestData.country ||
                "";


            // =============================
            // تسجيل الضيف في users
            // =============================

            try {

                await setDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    ),
                    {

                        name:
                            currentUserName,

                        country:
                            currentUserCountry,

                        isGuest:
                            true,

                        online:
                            true,

                        lastSeen:
                            serverTimestamp()

                    },
                    {
                        merge: true
                    }
                );

            } catch (error) {

                console.error(
                    "Guest Profile Save Error:",
                    error
                );
            }


        } else {

            // =================================
            // عضو مسجل
            // =================================

            try {

                const userSnapshot =
                    await getDoc(
                        doc(
                            db,
                            "users",
                            user.uid
                        )
                    );

                if (
                    userSnapshot.exists()
                ) {

                    const userData =
                        userSnapshot.data();


                    // =============================
                    // فحص الحظر
                    // =============================

                    if (
                        userData.banned === true
                    ) {

                        alert(
                            "🚫 حسابك محظور.\n\n" +
                            "لا يمكنك استخدام Cafe Arab حاليًا."
                        );

                        await logoutUser(
                            false
                        );

                        return;
                    }


                    currentUserName =
                        userData.name ||
                        userData.username ||
                        user.displayName ||
                        "مستخدم";

                    currentUserCountry =
                        userData.country ||
                        "";

                } else {

                    currentUserName =
                        user.displayName ||
                        "مستخدم";
                }

            } catch (error) {

                console.error(
                    "Load User Profile Error:",
                    error
                );

                currentUserName =
                    user.displayName ||
                    "مستخدم";
            }
        }


        // =================================
        // عرض الاسم
        // =================================

        updateUserName();


        // =================================
        // تشغيل الشات
        // =================================

        startChat();


        // =================================
        // تشغيل الإشعارات
        // =================================

        startNotifications();

    }
);


// =====================================
// تشغيل الشات
// =====================================

function startChat() {

    loadMessages();

}


// =====================================
// استقبال إشعارات الإدارة
// =====================================

function startNotifications() {

    if (!currentUser) {
        return;
    }


    // =================================
    // إلغاء Listener القديم
    // =================================

    if (
        notificationsUnsubscribe
    ) {

        notificationsUnsubscribe();

        notificationsUnsubscribe =
            null;
    }


    const notificationsRef =
        collection(
            db,
            "notifications",
            currentUser.uid,
            "items"
        );


    const notificationsQuery =
        query(
            notificationsRef,
            orderBy(
                "createdAt",
                "desc"
            )
        );


    notificationsUnsubscribe =
        onSnapshot(
            notificationsQuery,
            (snapshot) => {

                snapshot.docChanges()
                    .forEach(
                        (change) => {

                            if (
                                change.type !==
                                "added"
                            ) {

                                return;
                            }


                            const data =
                                change.doc.data();


                            if (
                                data.read === true
                            ) {

                                return;
                            }


                            showNotification(
                                data
                            );

                        }
                    );

            },
            (error) => {

                console.error(
                    "Notifications Listener Error:",
                    error
                );

            }
        );

}


// =====================================
// عرض الإشعار
// =====================================

function showNotification(
    data
) {

    const title =
        data.title ||
        "🔔 إشعار جديد";


    // =================================
    // منع undefined
    // =================================

    const message =
        data.message ||
        data.text ||
        data.body ||
        "لديك إشعار جديد من إدارة Cafe Arab.";
// =================================
// حظر
// =================================

if (data.type === "admin_ban") {

    const banTitle =
        data.title ||
        "🚫 تم حظرك";

    const banMessage =
        data.message ||
        data.text ||
        data.body ||
        "تم حظرك من إدارة الموقع.";

    alert(
        banTitle +
        "\n\n" +
        banMessage
    );

    setTimeout(
        async () => {

            await logoutUser(
                isGuest
            );

        },
        500
    );

    return;
}


// =================================
// تنبيه
// =================================

if (data.type === "admin_warning") {

    const warningTitle =
        data.title ||
        "⚠️ تنبيه من الإدارة";

    const warningMessage =
        data.message ||
        data.text ||
        data.body ||
        "تم إرسال تنبيه لك من إدارة الموقع.";

    alert(
        warningTitle +
        "\n\n" +
        warningMessage
    );

    return;
}

    
    // =================================
    // أي إشعار آخر
    // =================================

    alert(
        "🔔 " +
        title +
        "\n\n" +
        message
    );

}


// =====================================
// تسجيل الخروج اليدوي
// =====================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            await logoutUser(
                isGuest
            );

        }
    );

}


// =====================================
// زر الصور
// =====================================

if (imageBtn) {

    imageBtn.addEventListener(
        "click",
        () => {

            if (imageInput) {
                imageInput.click();
            }

        }
    );

}


// =====================================
// زر إرسال الرسالة
// =====================================

if (sendBtn) {

    sendBtn.addEventListener(
        "click",
        sendMessage
    );

}


// =====================================
// Enter للإرسال
// =====================================

if (messageInput) {

    messageInput.addEventListener(
        "keydown",
        (e) => {

            if (
                e.key === "Enter" &&
                !e.shiftKey
            ) {

                e.preventDefault();

                sendMessage();

            }

        }
    );

}


// =====================================
// إرسال رسالة نصية
// =====================================

async function sendMessage() {

    if (!currentUser) {

        alert(
            "جارٍ تجهيز الحساب، حاول مرة أخرى."
        );

        return;
    }


    if (!messageInput) {
        return;
    }


    const text =
        messageInput.value.trim();


    if (!text) {
        return;
    }


    try {

        if (sendBtn) {
            sendBtn.disabled =
                true;
        }


        await addDoc(
            collection(
                db,
                "messages"
            ),
            {

                uid:
                    currentUser.uid,

                user:
                    currentUserName,

                country:
                    currentUserCountry,

                isGuest:
                    isGuest,

                type:
                    "text",

                text:
                    text,

                createdAt:
                    serverTimestamp()

            }
        );


        messageInput.value =
            "";

        messageInput.focus();

    } catch (error) {

        console.error(
            "Send Message Error:",
            error
        );

        alert(
            "حدث خطأ أثناء إرسال الرسالة."
        );

    } finally {

        if (sendBtn) {
            sendBtn.disabled =
                false;
        }

    }

}


// =====================================
// رفع الصور
// =====================================

if (imageInput) {

    imageInput.addEventListener(
        "change",
        uploadImage
    );

}


async function uploadImage() {

    if (!currentUser) {

        alert(
            "جارٍ تجهيز الحساب، حاول مرة أخرى."
        );

        return;
    }


    if (
        !imageInput ||
        !imageInput.files.length
    ) {

        return;
    }


    const file =
        imageInput.files[0];


    // =================================
    // التأكد أنها صورة
    // =================================

    if (
        !file.type.startsWith(
            "image/"
        )
    ) {

        alert(
            "من فضلك اختر صورة فقط."
        );

        imageInput.value =
            "";

        return;
    }


    try {

        if (imageBtn) {
            imageBtn.disabled =
                true;
        }


        const formData =
            new FormData();


        formData.append(
            "file",
            file
        );


        formData.append(
            "upload_preset",
            "ml_default"
        );


        const response =
            await fetch(
                "https://api.cloudinary.com/v1_1/vqwksojr/image/upload",
                {
                    method:
                        "POST",

                    body:
                        formData
                }
            );


        if (!response.ok) {

            throw new Error(
                "Cloudinary upload failed"
            );
        }


        const data =
            await response.json();


        if (!data.secure_url) {

            throw new Error(
                "No secure URL returned"
            );
        }


        await addDoc(
            collection(
                db,
                "messages"
            ),
            {

                uid:
                    currentUser.uid,

                user:
                    currentUserName,

                country:
                    currentUserCountry,

                isGuest:
                    isGuest,

                type:
                    "image",

                image:
                    data.secure_url,

                createdAt:
                    serverTimestamp()

            }
        );


        imageInput.value =
            "";

    } catch (error) {

        console.error(
            "Upload Image Error:",
            error
        );

        alert(
            "فشل رفع الصورة."
        );

    } finally {

        if (imageBtn) {
            imageBtn.disabled =
                false;
        }

        if (imageInput) {
            imageInput.value =
                "";
        }

    }

}


// =====================================
// تحميل رسائل العام
// =====================================

function loadMessages() {

    if (!messages) {

        console.error(
            "Element #messages not found."
        );

        return;
    }


    const messagesQuery =
        query(
            collection(
                db,
                "messages"
            ),
            orderBy(
                "createdAt",
                "asc"
            )
        );


    if (
        messagesUnsubscribe
    ) {

        messagesUnsubscribe();

    }


    messagesUnsubscribe =
        onSnapshot(
            messagesQuery,
            (snapshot) => {

                messages.innerHTML =
                    "";


                snapshot.forEach(
                    (messageDoc) => {

                        const data =
                            messageDoc.data();


                        const box =
                            document.createElement(
                                "div"
                            );


                        box.className =
                            "message";


                        // =========================
                        // تحديد رسالتي
                        // =========================

                        if (
                            currentUser &&
                            data.uid ===
                            currentUser.uid
                        ) {

                            box.classList.add(
                                "me"
                            );

                        } else {

                            box.classList.add(
                                "other"
                            );

                        }


                        // =========================
                        // اسم المرسل
                        // =========================

                        const sender =
                            document.createElement(
                                "div"
                            );


                        sender.className =
                            "sender";


                        sender.textContent =
                            data.user ||
                            "مستخدم";


                        // =========================
                        // الضغط على الاسم
                        // =========================

                        if (
                            data.uid &&
                            currentUser &&
                            data.uid !==
                            currentUser.uid
                        ) {

                            sender.style.cursor =
                                "pointer";

                            sender.style.textDecoration =
                                "underline";


                            if (isAdmin()) {

                                sender.title =
                                    "خيارات الإدارة";


                                sender.addEventListener(
                                    "click",
                                    (event) => {

                                        event.stopPropagation();

                                        showAdminMenu(
                                            event,
                                            data.uid,
                                            data.user ||
                                            "مستخدم"
                                        );

                                    }
                                );

                            } else {

                                sender.title =
                                    "فتح محادثة خاصة";


                                sender.addEventListener(
                                    "click",
                                    () => {

                                        openPrivateChat(
                                            data.uid,
                                            data.user ||
                                            "مستخدم"
                                        );

                                    }
                                );

                            }

                        }


                        box.appendChild(
                            sender
                        );


                        // =========================
                        // رسالة نصية
                        // =========================

                        if (
                            data.type ===
                            "text"
                        ) {

                            const text =
                                document.createElement(
                                    "div"
                                );


                            text.className =
                                "text";


                            text.textContent =
                                data.text ||
                                "";


                            box.appendChild(
                                text
                            );

                        }


                        // =========================
                        // صورة
                        // =========================

                        if (
                            data.type ===
                                "image" &&
                            data.image
                        ) {

                            const img =
                                document.createElement(
                                    "img"
                                );


                            img.src =
                                data.image;


                            img.className =
                                "chatImage";


                            img.alt =
                                "صورة";


                            img.loading =
                                "lazy";


                            img.style.cursor =
                                "pointer";


                            img.addEventListener(
                                "click",
                                () => {

                                    window.open(
                                        data.image,
                                        "_blank"
                                    );

                                }
                            );


                            box.appendChild(
                                img
                            );

                        }


                        messages.appendChild(
                            box
                        );

                    }
                );


                scrollBottom();

            },
            (error) => {

                console.error(
                    "Messages Listener Error:",
                    error
                );

                alert(
                    "حدث خطأ أثناء تحميل الرسائل."
                );

            }
        );

}


// =====================================
// قائمة إدارة الأدمن
// =====================================

function showAdminMenu(
    event,
    uid,
    name
) {

    // =================================
    // إزالة أي قائمة قديمة
    // =================================

    const oldMenu =
        document.getElementById(
            "adminUserMenu"
        );

    if (oldMenu) {
        oldMenu.remove();
    }


    const menu =
        document.createElement(
            "div"
        );


    menu.id =
        "adminUserMenu";


    // =================================
    // شكل القائمة
    // =================================

    menu.style.position =
        "fixed";

    menu.style.zIndex =
        "99999";

    menu.style.background =
        "#fff";

    menu.style.border =
        "1px solid #ddd";

    menu.style.borderRadius =
        "12px";

    menu.style.padding =
        "8px";

    menu.style.minWidth =
        "190px";

    menu.style.boxShadow =
        "0 5px 25px rgba(0,0,0,.20)";


    // =================================
    // اسم المستخدم
    // =================================

    const title =
        document.createElement(
            "div"
        );


    title.textContent =
        "👤 " + name;


    title.style.fontWeight =
        "bold";

    title.style.padding =
        "8px";

    title.style.borderBottom =
        "1px solid #eee";

    title.style.marginBottom =
        "5px";


    menu.appendChild(
        title
    );


    // =================================
    // زر التنبيه
    // =================================

    const warningBtn =
        document.createElement(
            "button"
        );


    warningBtn.type =
        "button";


    warningBtn.textContent =
        "⚠️ إرسال تنبيه";


    warningBtn.style.display =
        "block";

    warningBtn.style.width =
        "100%";

    warningBtn.style.background =
        "#fff3cd";

    warningBtn.style.color =
        "#664d03";

    warningBtn.style.border =
        "0";

    warningBtn.style.borderRadius =
        "8px";

    warningBtn.style.padding =
        "10px";

    warningBtn.style.marginBottom =
        "5px";

    warningBtn.style.cursor =
        "pointer";


    warningBtn.addEventListener(
        "click",
        async () => {

            menu.remove();

            await sendAdminWarning(
                uid,
                name
            );

        }
    );


    menu.appendChild(
        warningBtn
    );


    // =================================
    // زر الحظر
    // =================================

    const banBtn =
        document.createElement(
            "button"
        );


    banBtn.type =
        "button";


    banBtn.textContent =
        "🚫 حظر المستخدم";


    banBtn.style.display =
        "block";

    banBtn.style.width =
        "100%";

    banBtn.style.background =
        "#b42318";

    banBtn.style.color =
        "#fff";

    banBtn.style.border =
        "0";

    banBtn.style.borderRadius =
        "8px";

    banBtn.style.padding =
        "10px";

    banBtn.style.cursor =
        "pointer";


    banBtn.addEventListener(
        "click",
        async () => {

            menu.remove();

            await banUser(
                uid,
                name
            );

        }
    );


    menu.appendChild(
        banBtn
    );


    // =================================
    // زر الإلغاء
    // =================================

    const cancelBtn =
        document.createElement(
            "button"
        );


    cancelBtn.type =
        "button";


    cancelBtn.textContent =
        "❌ إلغاء";


    cancelBtn.style.display =
        "block";

    cancelBtn.style.width =
        "100%";

    cancelBtn.style.background =
        "#eee";

    cancelBtn.style.color =
        "#333";

    cancelBtn.style.border =
        "0";

    cancelBtn.style.borderRadius =
        "8px";

    cancelBtn.style.padding =
        "10px";

    cancelBtn.style.marginTop =
        "5px";

    cancelBtn.style.cursor =
        "pointer";


    cancelBtn.addEventListener(
        "click",
        () => {

            menu.remove();

        }
    );


    menu.appendChild(
        cancelBtn
    );


    document.body.appendChild(
        menu
    );


    // =================================
    // تحديد مكان القائمة
    // =================================

    let left =
        event.clientX;

    let top =
        event.clientY;


    const menuWidth =
        190;

    const menuHeight =
        160;


    if (
        left + menuWidth >
        window.innerWidth
    ) {

        left =
            window.innerWidth -
            menuWidth -
            10;

    }


    if (
        top + menuHeight >
        window.innerHeight
    ) {

        top =
            window.innerHeight -
            menuHeight -
            10;

    }


    menu.style.left =
        Math.max(
            10,
            left
        ) + "px";


    menu.style.top =
        Math.max(
            10,
            top
        ) + "px";


    // =================================
    // إغلاق عند الضغط خارجها
    // =================================

    setTimeout(
        () => {

            document.addEventListener(
                "click",
                function closeAdminMenu(e) {

                    if (
                        menu &&
                        !menu.contains(
                            e.target
                        )
                    ) {

                        menu.remove();

                        document.removeEventListener(
                            "click",
                            closeAdminMenu
                        );

                    }

                }
            );

        },
        0
    );

}


// =====================================
// إرسال تنبيه للمستخدم
// =====================================

async function sendAdminWarning(
    uid,
    name
) {

    if (!isAdmin()) {

        return;
    }


    try {

        await addDoc(
            collection(
                db,
                "notifications",
                uid,
                "items"
            ),
            {

                type:
                    "admin_warning",

                title:
                    "تنبيه من الإدارة",

                message:
                    "تم إرسال تنبيه لك من إدارة Cafe Arab.",

                fromAdmin:
                    true,

                read:
                    false,

                createdAt:
                    serverTimestamp()

            }
        );


        alert(
            "⚠️ تم إرسال التنبيه إلى " +
            name
        );

    } catch (error) {

        console.error(
            "Admin Warning Error:",
            error
        );

        alert(
            "❌ تعذر إرسال التنبيه.\n\n" +
            error.message
        );

    }

}


// =====================================
// حظر المستخدم
// =====================================

async function banUser(
    uid,
    name
) {

    if (!isAdmin()) {

        return;
    }


    if (
        uid ===
        currentUser.uid
    ) {

        alert(
            "❌ لا يمكنك حظر نفسك."
        );

        return;
    }


    const confirmed =
        confirm(
            "🚫 هل أنت متأكد من حظر:\n\n" +
            name +
            "\n\nلن يستطيع استخدام الموقع بعد الحظر."
        );


    if (!confirmed) {
        return;
    }


    try {

        // =================================
        // حفظ الحظر
        // =================================
        // مهم:
        // لا نغير isGuest هنا
        // =================================

        await setDoc(
            doc(
                db,
                "users",
                uid
            ),
            {

                banned:
                    true,

                bannedAt:
                    serverTimestamp(),

                bannedBy:
                    currentUser.uid

            },
            {
                merge: true
            }
        );


        // =================================
        // إرسال إشعار الحظر
        // =================================

        await addDoc(
            collection(
                db,
                "notifications",
                uid,
                "items"
            ),
            {

                type:
                    "admin_ban",

                title:
                    "تم حظرك",

                message:
                    "تم حظر حسابك من إدارة Cafe Arab.",

                fromAdmin:
                    true,

                read:
                    false,

                createdAt:
                    serverTimestamp()

            }
        );


        alert(
            "🚫 تم حظر " +
            name +
            " بنجاح."
        );


    } catch (error) {

        console.error(
            "Ban User Error:",
            error
        );

        alert(
            "❌ تعذر حظر المستخدم.\n\n" +
            error.message
        );

    }

}


// =====================================
// فتح المحادثة الخاصة
// =====================================

window.openPrivateChat =
    function(
        uid,
        name
    ) {

        if (!currentUser) {
            return;
        }


        if (
            uid ===
            currentUser.uid
        ) {

            return;
        }


        window.location.href =
            "private-chat.html?uid=" +
            encodeURIComponent(
                uid
            ) +
            "&name=" +
            encodeURIComponent(
                name ||
                "مستخدم"
            );

    };


// =====================================
// قائمة المستخدمين
// =====================================

if (usersBtn) {

    usersBtn.addEventListener(
        "click",
        () => {

            window.location.href =
                "users.html";

        }
    );

}


// =====================================
// النزول لآخر رسالة
// =====================================

function scrollBottom() {

    if (!messages) {
        return;
    }


    messages.scrollTop =
        messages.scrollHeight;

}


// =====================================
// تنظيف Listeners
// =====================================

window.addEventListener(
    "beforeunload",
    () => {

        if (
            messagesUnsubscribe
        ) {

            messagesUnsubscribe();

        }


        if (
            notificationsUnsubscribe
        ) {

            notificationsUnsubscribe();

        }

    }
);

// =====================================
// مسح الشات العام - للأدمن فقط
// =====================================

if (clearChatBtn) {

    clearChatBtn.addEventListener(
        "click",
        async () => {

            // =============================
            // حماية إضافية
            // =============================

            if (!isAdmin()) {

                alert(
                    "❌ ليس لديك صلاحية لمسح الشات."
                );

                return;
            }


            // =============================
            // تأكيد
            // =============================

            const confirmed =
                confirm(
                    "🗑️ هل أنت متأكد؟\n\n" +
                    "سيتم حذف جميع رسائل الشات العام نهائيًا."
                );


            if (!confirmed) {
                return;
            }


            try {

                clearChatBtn.disabled =
                    true;


                clearChatBtn.textContent =
                    "⏳";


                // =============================
                // جلب جميع الرسائل
                // =============================

                const snapshot =
                    await getDocs(
                        collection(
                            db,
                            "messages"
                        )
                    );


                // =============================
                // حذف الرسائل واحدة واحدة
                // =============================

                for (
                    const messageDoc
                    of snapshot.docs
                ) {

                    await deleteDoc(
                        messageDoc.ref
                    );

                }


                alert(
                    "✅ تم مسح الشات العام بنجاح."
                );


            } catch (error) {

                console.error(
                    "Clear Chat Error:",
                    error
                );


                alert(
                    "❌ تعذر مسح الشات.\n\n" +
                    error.message
                );


            } finally {

                clearChatBtn.disabled =
                    false;

                clearChatBtn.textContent =
                    "🗑️";

            }

        }
    );

            }

// =====================================
// نهاية الملف
// =====================================

console.log(
    "✅ Cafe Arab Chat - Clean Version Loaded"
);
