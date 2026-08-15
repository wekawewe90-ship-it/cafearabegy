import { auth, db } from "./firebase.js";

import {
    collection,
    query,
    where,
    onSnapshot,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";


// =====================================
// عناصر الصفحة
// =====================================

const notificationBtn =
    document.getElementById("notificationBtn");

const notificationsMenu =
    document.getElementById("notificationsMenu");

const notificationsList =
    document.getElementById("notificationsList");


// =====================================
// المستخدم الحالي
// =====================================

let currentUid = "";


// =====================================
// تسجيل الدخول
// =====================================

onAuthStateChanged(
    auth,
    (user) => {

        if (!user) {
            return;
        }

        currentUid =
            user.uid;

        loadNotifications();

    }
);


// =====================================
// تحميل الإشعارات
// =====================================

function loadNotifications() {

    if (!currentUid) {
        return;
    }


    const q =
        query(

            collection(
                db,
                "notifications",
                currentUid,
                "items"
            ),

            where(
                "read",
                "==",
                false
            )

        );


    onSnapshot(
        q,
        (snapshot) => {

            if (!notificationsList) {
                return;
            }


            notificationsList.innerHTML =
                "";


            const count =
                snapshot.size;


            // =================================
            // عداد الإشعارات
            // =================================

            if (notificationBtn) {

                notificationBtn.innerHTML =
                    count > 0
                        ? `🔔 <span style="
                            background:red;
                            color:white;
                            border-radius:50%;
                            padding:2px 7px;
                            font-size:12px;
                        ">${count}</span>`
                        : "🔔";

            }


            // =================================
            // لا توجد إشعارات
            // =================================

            if (count === 0) {

                notificationsList.innerHTML =
                    "<div style='padding:12px;text-align:center'>لا توجد إشعارات</div>";

                return;
            }


            // =================================
            // عرض الإشعارات
            // =================================

            snapshot.forEach(
                (docItem) => {

                    const data =
                        docItem.data();


                    const item =
                        document.createElement(
                            "div"
                        );


                    item.className =
                        "card";


                    item.style.marginBottom =
                        "10px";


                    item.style.cursor =
                        "pointer";


                    // =================================
                    // تحديد نوع الإشعار
                    // =================================

                    let title =
                        data.title ||
                        "🔔 إشعار جديد";


                    let message =
                        data.message ||
                        data.text ||
                        data.body ||
                        "لديك إشعار جديد من إدارة Cafe Arab.";


                    // =================================
                    // تنبيه الإدارة
                    // =================================

                    if (
                        data.type ===
                        "admin_warning"
                    ) {

                        title =
                            data.title ||
                            "⚠️ تنبيه من الإدارة";

                        message =
                            data.message ||
                            data.text ||
                            data.body ||
                            "تم إرسال تنبيه لك من إدارة الموقع.";

                    }


                    // =================================
                    // حظر
                    // =================================

                    if (
                        data.type ===
                        "admin_ban"
                    ) {

                        title =
                            data.title ||
                            "🚫 تم حظرك";

                        message =
                            data.message ||
                            data.text ||
                            data.body ||
                            "تم حظرك من إدارة الموقع.";

                    }


                    // =================================
                    // إشعار عادي
                    // =================================

                    item.innerHTML = `
                        <b>${title}</b>
                        <br>
                        ${message}
                    `;


                    // =================================
                    // الضغط على الإشعار
                    // =================================

                    item.onclick =
                        async () => {

                            try {

                                await updateDoc(
                                    docItem.ref,
                                    {
                                        read:
                                            true
                                    }
                                );

                            } catch (error) {

                                console.error(
                                    "Mark Notification Read Error:",
                                    error
                                );

                            }


                            if (
                                notificationsMenu
                            ) {

                                notificationsMenu.style.display =
                                    "none";

                            }


                            // =================================
                            // إشعارات الإدارة
                            // لا نفتح private chat
                            // =================================

                            if (
                                data.type ===
                                "admin_warning" ||
                                data.type ===
                                "admin_ban"
                            ) {

                                return;

                            }


                            // =================================
                            // الإشعارات العادية
                            // =================================

                            if (
                                data.fromUid
                            ) {

                                window.location.href =
                                    `private-chat.html?uid=${data.fromUid}`;

                            }

                        };


                    notificationsList.appendChild(
                        item
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
// زر الإشعارات
// =====================================

if (notificationBtn) {

    notificationBtn.addEventListener(
        "click",
        (e) => {

            e.stopPropagation();


            if (
                !notificationsMenu
            ) {

                return;
            }


            if (
                notificationsMenu.style.display ===
                "block"
            ) {

                notificationsMenu.style.display =
                    "none";

            } else {

                notificationsMenu.style.display =
                    "block";

            }

        }
    );

}


// =====================================
// إغلاق القائمة عند الضغط خارجها
// =====================================

document.addEventListener(
    "click",
    (e) => {

        if (
            !notificationsMenu ||
            !notificationBtn
        ) {

            return;
        }


        if (
            !notificationsMenu.contains(
                e.target
            ) &&
            e.target !==
            notificationBtn
        ) {

            notificationsMenu.style.display =
                "none";

        }

    }
);
