// =====================================
// Cafe Arab Private Chat
// Cloudinary + Real Name + Notifications
// + Online / Offline
// + Message Read Status
// =====================================

import { auth, db } from "./firebase.js";

import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    getDoc,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

// =====================================
// عناصر الصفحة
// =====================================

const messagesBox =
    document.getElementById("privateMessages");

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

const audioBtn =
    document.getElementById("audioBtn");

const audioInput =
    document.getElementById("audioInput");

const chatUser =
    document.getElementById("chatUser");

const backBtn =
    document.getElementById("backBtn");

// =====================================
// متغيرات
// =====================================

let currentUser = null;

let currentUserName = "مستخدم";

let roomId = "";

let otherUid = "";

let otherName = "مستخدم";

let unsubscribe = null;

let unsubscribeOtherUser = null;

// =====================================
// بيانات المستخدم الآخر من الرابط
// =====================================

const params =
    new URLSearchParams(location.search);

otherUid =
    params.get("uid");

otherName =
    params.get("name") || "مستخدم";

// =====================================
// عرض الاسم
// =====================================

if (chatUser) {

    chatUser.textContent =
        "👤 " + otherName;

}

// =====================================
// إنشاء مكان للحالة تحت الاسم
// =====================================

let statusElement = null;

function createStatusElement() {

    if (!chatUser) return;

    if (statusElement) return;

    statusElement =
        document.createElement("div");

    statusElement.id =
        "privateUserStatus";

    statusElement.style.fontSize =
        "13px";

    statusElement.style.marginTop =
        "4px";

    statusElement.style.fontWeight =
        "normal";

    statusElement.style.opacity =
        "0.85";

    chatUser.parentNode.appendChild(
        statusElement
    );

}

// =====================================
// تنسيق آخر ظهور
// =====================================

function formatLastSeen(timestamp) {

    if (!timestamp) {

        return "آخر ظهور غير معروف";

    }

    try {

        const date =
            timestamp.toDate();

        return (
            "⚪ غير متصل — آخر ظهور " +
            date.toLocaleTimeString(
                "ar-EG",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            )
        );

    } catch (error) {

        return "⚪ غير متصل";

    }

}

// =====================================
// تحديث حالة المستخدم الآخر
// =====================================

function updateOtherUserStatus(data) {

    if (!statusElement) return;

    if (data.online === true) {

        statusElement.textContent =
            "🟢 متصل الآن";

    } else {

        statusElement.textContent =
            formatLastSeen(
                data.lastSeen
            );

    }

}

// =====================================
// مراقبة حالة المستخدم الآخر
// =====================================

function watchOtherUserStatus() {

    if (!otherUid) return;

    const otherUserRef =
        doc(
            db,
            "users",
            otherUid
        );

    if (unsubscribeOtherUser) {

        unsubscribeOtherUser();

    }

    unsubscribeOtherUser =
        onSnapshot(
            otherUserRef,
            (snapshot) => {

                if (!snapshot.exists()) {

                    if (statusElement) {

                        statusElement.textContent =
                            "⚪ غير متصل";

                    }

                    return;

                }

                updateOtherUserStatus(
                    snapshot.data()
                );

            },
            (error) => {

                console.error(
                    "User Status Error:",
                    error
                );

                if (statusElement) {

                    statusElement.textContent =
                        "";

                }

            }
        );

}

// =====================================
// الحصول على الاسم الحقيقي
// =====================================

async function getRealUserName(uid) {

    if (!uid) {

        return "مستخدم";

    }

    try {

        const userRef =
            doc(
                db,
                "users",
                uid
            );

        const userSnap =
            await getDoc(
                userRef
            );

        if (userSnap.exists()) {

            const data =
                userSnap.data();

            return (
                data.name ||
                data.username ||
                "مستخدم"
            );

        }

    } catch (error) {

        console.error(
            "Get User Name Error:",
            error
        );

    }

    return "مستخدم";

}

// =====================================
// زر الرجوع
// =====================================

if (backBtn) {

    backBtn.onclick = () => {

        history.back();

    };

}

// =====================================
// إنشاء Room ID ثابت
// =====================================

function getRoomId(uid1, uid2) {

    return [
        uid1,
        uid2
    ]
        .sort()
        .join("_");

}

// =====================================
// تسجيل الدخول
// =====================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            location.href =
                "login.html";

            return;

        }

        currentUser = user;

        currentUserName =
            await getRealUserName(
                user.uid
            );

        if (!otherUid) {

            alert(
                "لم يتم تحديد المستخدم."
            );

            return;

        }

        roomId =
            getRoomId(
                currentUser.uid,
                otherUid
            );

        createStatusElement();

        watchOtherUserStatus();

        startChat();

    }
);

// =====================================
// تشغيل المحادثة
// =====================================

function startChat() {

    loadMessages();

}

// =====================================
// تحميل الرسائل لحظيًا
// =====================================

function loadMessages() {

    if (!messagesBox) return;

    const messagesRef =
        collection(
            db,
            "privateChats",
            roomId,
            "messages"
        );

    const q =
        query(
            messagesRef,
            orderBy(
                "createdAt",
                "asc"
            )
        );

    if (unsubscribe) {

        unsubscribe();

    }

    unsubscribe =
        onSnapshot(
            q,
            async (snapshot) => {

                messagesBox.innerHTML =
                    "";

                const unreadMessages = [];

                snapshot.forEach(
                    (messageDoc) => {

                        const data =
                            messageDoc.data();

                        drawMessage(
                            data
                        );

                        if (
                            data.senderId ===
                                otherUid &&
                            data.read !== true
                        ) {

                            unreadMessages.push(
                                messageDoc.id
                            );

                        }

                    }
                );

                scrollBottom();

                await markMessagesAsRead(
                    unreadMessages
                );

            },
            (error) => {

                console.error(
                    "Load Private Messages Error:",
                    error
                );

            }
        );

}

// =====================================
// تحويل الرسائل إلى مقروءة
// =====================================

async function markMessagesAsRead(
    messageIds
) {

    if (!messageIds.length) {
        return;
    }

    try {

        for (
            const messageId
            of messageIds
        ) {

            const messageRef =
                doc(
                    db,
                    "privateChats",
                    roomId,
                    "messages",
                    messageId
                );

            await updateDoc(
                messageRef,
                {
                    read: true
                }
            );

        }

    } catch (error) {

        console.error(
            "Mark Messages Read Error:",
            error
        );

    }

}

// =====================================
// النزول لآخر رسالة
// =====================================

function scrollBottom() {

    if (!messagesBox) return;

    setTimeout(
        () => {

            messagesBox.scrollTop =
                messagesBox.scrollHeight;

        },
        100
    );

}

// =====================================
// تنسيق الوقت
// =====================================

function formatTime(timestamp) {

    if (!timestamp) return "";

    try {

        return timestamp
            .toDate()
            .toLocaleTimeString(
                "ar-EG",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );

    } catch (error) {

        return "";

    }

}

// =====================================
// إنشاء علامة القراءة
// =====================================

function createReadStatus(data) {

    if (
        !currentUser ||
        data.senderId !== currentUser.uid
    ) {

        return null;

    }

    const readStatus =
        document.createElement(
            "span"
        );

    readStatus.className =
        "message-read-status";

    readStatus.textContent =
        "✓✓";

    if (data.read === true) {

        readStatus.style.color =
            "#2196f3";

    } else {

        readStatus.style.color =
            "#888";

    }

    readStatus.style.fontSize =
        "12px";

    readStatus.style.marginRight =
        "6px";

    readStatus.style.fontWeight =
        "bold";

    return readStatus;

}

// =====================================
// رسم الرسالة
// =====================================

function drawMessage(data) {

    const wrapper =
        document.createElement("div");

    wrapper.className =
        data.senderId ===
        currentUser.uid
            ? "message me"
            : "message other";

    const bubble =
        document.createElement("div");

    bubble.className =
        "bubble";

    // =================================
    // صورة
    // =================================

    if (
        data.type === "image" &&
        data.imageUrl
    ) {

        const img =
            document.createElement("img");

        img.src =
            data.imageUrl;

        img.className =
            "chat-image";

        img.loading =
            "lazy";

        img.alt =
            "صورة";

        img.addEventListener(
            "click",
            () => {

                window.open(
                    data.imageUrl,
                    "_blank"
                );

            }
        );

        bubble.appendChild(
            img
        );

    }

    // =================================
    // فيديو
    // =================================

    else if (
        data.type === "video" &&
        data.videoUrl
    ) {

        const video =
            document.createElement("video");

        video.src =
            data.videoUrl;

        video.controls =
            true;

        video.preload =
            "metadata";

        video.className =
            "chat-video";

        video.style.maxWidth =
            "100%";

        video.style.borderRadius =
            "12px";

        bubble.appendChild(
            video
        );

    }

    // =================================
    // صوت
    // =================================

    else if (
        data.type === "audio" &&
        data.audioUrl
    ) {

        const audio =
            document.createElement("audio");

        audio.src =
            data.audioUrl;

        audio.controls =
            true;

        audio.preload =
            "metadata";

        audio.style.width =
            "100%";

        bubble.appendChild(
            audio
        );

    }

    // =================================
    // نص
    // =================================

    else {

        bubble.textContent =
            data.text || "";

    }

    wrapper.appendChild(
        bubble
    );

    // =================================
    // أسفل الرسالة
    // =================================

    const meta =
        document.createElement(
            "div"
        );

    meta.style.display =
        "flex";

    meta.style.alignItems =
        "center";

    meta.style.justifyContent =
        "flex-end";

    meta.style.marginTop =
        "3px";

    const time =
        document.createElement(
            "small"
        );

    time.className =
        "message-time";

    time.textContent =
        formatTime(
            data.createdAt
        );

    meta.appendChild(
        time
    );

    const readStatus =
        createReadStatus(
            data
        );

    if (readStatus) {

        meta.appendChild(
            readStatus
        );

    }

    wrapper.appendChild(
        meta
    );

    messagesBox.appendChild(
        wrapper
    );

}

// =====================================
// إنشاء الإشعار
// =====================================

async function createNotification(
    notificationText
) {

    if (!currentUser) return;

    if (!otherUid) return;

    try {

        await addDoc(
            collection(
                db,
                "notifications",
                otherUid,
                "items"
            ),
            {

                fromUid:
                    currentUser.uid,

                fromName:
                    currentUserName,

                text:
                    notificationText,

                read:
                    false,

                createdAt:
                    serverTimestamp()

            }
        );

        console.log(
            "✅ Notification Created"
        );

    } catch (error) {

        console.error(
            "❌ Notification Create Error:",
            error
        );

    }

}

// =====================================
// إرسال رسالة نصية
// =====================================

async function sendMessage() {

    if (!currentUser) return;

    if (!messageInput) return;

    const text =
        messageInput.value.trim();

    if (!text) return;

    try {

        if (sendBtn) {

            sendBtn.disabled =
                true;

        }

        await addDoc(
            collection(
                db,
                "privateChats",
                roomId,
                "messages"
            ),
            {

                senderId:
                    currentUser.uid,

                receiverId:
                    otherUid,

                senderName:
                    currentUserName,

                text:
                    text,

                type:
                    "text",

                read:
                    false,

                createdAt:
                    serverTimestamp()

            }
        );

        await createNotification(
            "💬 " +
            currentUserName +
            ": " +
            text
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
// حالة زر الإرسال
// =====================================

if (
    messageInput &&
    sendBtn
) {

    sendBtn.disabled =
        true;

    messageInput.addEventListener(
        "input",
        () => {

            sendBtn.disabled =
                messageInput.value
                    .trim()
                    .length === 0;

        }
    );

}

// =====================================
// رفع صورة إلى Cloudinary
// =====================================

async function sendImage(file) {

    if (!file) return;

    if (!currentUser) return;

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
                    method: "POST",
                    body: formData
                }
            );

        if (!response.ok) {

            throw new Error(
                "Cloudinary Upload Failed: " +
                response.status
            );

        }

        const data =
            await response.json();

        if (!data.secure_url) {

            throw new Error(
                "لم يتم الحصول على رابط الصورة."
            );

        }

        await addDoc(
            collection(
                db,
                "privateChats",
                roomId,
                "messages"
            ),
            {

                senderId:
                    currentUser.uid,

                receiverId:
                    otherUid,

                senderName:
                    currentUserName,

                type:
                    "image",

                imageUrl:
                    data.secure_url,

                read:
                    false,

                createdAt:
                    serverTimestamp()

            }
        );

        await createNotification(
            "📷 " +
            currentUserName +
            " أرسل لك صورة"
        );

    } catch (error) {

        console.error(
            "Private Image Error:",
            error
        );

        alert(
            "فشل إرسال الصورة:\n" +
            error.message
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
// زر اختيار الصورة
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
// زر اختيار الفيديو
// =====================================

if (videoBtn) {

    videoBtn.addEventListener(
        "click",
        () => {

            if (videoInput) {

                videoInput.click();

            }

        }
    );

}

// =====================================
// زر اختيار الصوت
// =====================================

if (audioBtn) {

    audioBtn.addEventListener(
        "click",
        () => {

            if (audioInput) {

                audioInput.click();

            }

        }
    );

}

// =====================================
// اختيار الصورة
// =====================================

if (imageInput) {

    imageInput.addEventListener(
        "change",
        (event) => {

            const file =
                event.target.files[0];

            if (!file) return;

            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {

                alert(
                    "الرجاء اختيار صورة فقط."
                );

                imageInput.value =
                    "";

                return;

            }

            sendImage(file);

        }
    );

}

// =====================================
// اختيار ورفع الفيديو
// =====================================

if (videoInput) {

    videoInput.addEventListener(
        "change",
        (event) => {

            const file =
                event.target.files[0];

            if (!file) return;

            if (
                !file.type.startsWith("video/")
            ) {

                alert(
                    "الرجاء اختيار فيديو فقط."
                );

                videoInput.value = "";

                return;

            }

            sendVideo(file);

        }
    );

}

// =====================================
// رفع الفيديو إلى Cloudinary
// =====================================

async function sendVideo(file) {

    if (!file) return;

    if (!currentUser) return;

    try {

        if (videoBtn) {

            videoBtn.disabled =
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
                "https://api.cloudinary.com/v1_1/vqwksojr/video/upload",
                {
                    method: "POST",
                    body: formData
                }
            );

        if (!response.ok) {

            throw new Error(
                "Cloudinary Video Upload Failed: " +
                response.status
            );

        }

        const data =
            await response.json();

        if (!data.secure_url) {

            throw new Error(
                "لم يتم الحصول على رابط الفيديو."
            );

        }

        await addDoc(
            collection(
                db,
                "privateChats",
                roomId,
                "messages"
            ),
            {

                senderId:
                    currentUser.uid,

                receiverId:
                    otherUid,

                senderName:
                    currentUserName,

                type:
                    "video",

                videoUrl:
                    data.secure_url,

                read:
                    false,

                createdAt:
                    serverTimestamp()

            }
        );

        await createNotification(
            "🎥 " +
            currentUserName +
            " أرسل لك فيديو"
        );

        alert(
            "تم إرسال الفيديو بنجاح ✅"
        );

    } catch (error) {

        console.error(
            "Private Video Error:",
            error
        );

        alert(
            "فشل إرسال الفيديو:\n" +
            error.message
        );

    } finally {

        if (videoBtn) {

            videoBtn.disabled =
                false;

        }

        if (videoInput) {

            videoInput.value =
                "";

        }

    }

}

// =====================================
// رفع الصوت إلى Cloudinary
// =====================================

async function sendAudio(file) {

    if (!file) return;

    if (!currentUser) return;

    try {

        if (audioBtn) {

            audioBtn.disabled =
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
                "https://api.cloudinary.com/v1_1/vqwksojr/raw/upload",
                {
                    method: "POST",
                    body: formData
                }
            );

        if (!response.ok) {

            throw new Error(
                "Cloudinary Audio Upload Failed: " +
                response.status
            );

        }

        const data =
            await response.json();

        if (!data.secure_url) {

            throw new Error(
                "لم يتم الحصول على رابط الصوت."
            );

        }

        await addDoc(
            collection(
                db,
                "privateChats",
                roomId,
                "messages"
            ),
            {

                senderId:
                    currentUser.uid,

                receiverId:
                    otherUid,

                senderName:
                    currentUserName,

                type:
                    "audio",

                audioUrl:
                    data.secure_url,

                read:
                    false,

                createdAt:
                    serverTimestamp()

            }
        );

        await createNotification(
            "🎤 " +
            currentUserName +
            " أرسل لك مقطع صوتي"
        );

        alert(
            "تم إرسال الصوت بنجاح ✅"
        );

    } catch (error) {

        console.error(
            "Private Audio Error:",
            error
        );

        alert(
            "فشل إرسال الصوت:\n" +
            error.message
        );

    } finally {

        if (audioBtn) {

            audioBtn.disabled =
                false;

        }

        if (audioInput) {

            audioInput.value =
                "";

        }

    }

}

// =====================================
// اختيار ورفع الصوت
// =====================================

if (audioInput) {

    audioInput.addEventListener(
        "change",
        (event) => {

            const file =
                event.target.files[0];

            if (!file) return;

            if (
                !file.type.startsWith("audio/")
            ) {

                alert(
                    "الرجاء اختيار ملف صوت فقط."
                );

                audioInput.value = "";

                return;

            }

            sendAudio(file);

        }
    );

                    }
// =====================================
// تنظيف Listener
// =====================================

window.addEventListener(
    "beforeunload",
    () => {

        if (unsubscribe) {

            unsubscribe();

        }

        if (unsubscribeOtherUser) {

            unsubscribeOtherUser();

        }

    }
);

// =====================================
// التركيز على الكتابة
// =====================================

window.addEventListener(
    "load",
    () => {

        if (messageInput) {

            messageInput.focus();

        }

    }
);

// =====================================
// معالجة الأخطاء العامة
// =====================================

window.addEventListener(
    "error",
    (event) => {

        console.error(
            "Private Chat Error:",
            event.error ||
            event.message
        );

    }
);

// =====================================
// نهاية الملف
// =====================================

console.log(
    "✅ privateChat.js Loaded Successfully"
);
