// =====================================
// Cafe Arab - Login
// Email Verification
// Password Reset
// Account Ban Check
// =====================================

import { auth, db } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    sendEmailVerification,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    doc,
    getDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";


const form =
    document.getElementById("loginForm");


// =====================================
// زر نسيت كلمة المرور
// =====================================

const forgotPasswordBtn =
    document.getElementById(
        "forgotPassword"
    );


// =====================================
// تسجيل الدخول
// =====================================

form.addEventListener(
    "submit",
    async (e) => {

        e.preventDefault();


        const email =
            document
                .getElementById("email")
                .value
                .trim();

        const password =
            document
                .getElementById("password")
                .value
                .trim();


        if (!email || !password) {

            alert(
                "❌ من فضلك اكتب البريد الإلكتروني وكلمة المرور."
            );

            return;

        }


        try {

            // =================================
            // تسجيل الدخول
            // =================================

            const userCredential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user =
                userCredential.user;


            // =================================
            // فحص حظر الحساب
            // =================================

            const userRef =
                doc(
                    db,
                    "users",
                    user.uid
                );

            const userSnap =
                await getDoc(
                    userRef
                );


            if (
                userSnap.exists() &&
                userSnap.data().banned === true
            ) {

                alert(
                    "🚫 حسابك محظور.\n\n" +
                    "لا يمكنك الدخول إلى الموقع حاليًا."
                );

                await signOut(auth);

                return;

            }


            // =================================
            // التأكد من تأكيد الإيميل
            // =================================

            if (!user.emailVerified) {

                alert(
                    "📧 لازم تأكد بريدك الإلكتروني الأول.\n\n" +
                    "افتح رسالة التأكيد اللي وصلتك على الإيميل واضغط على رابط التأكيد."
                );


                // ---------------------------------
                // سؤال المستخدم عن إعادة إرسال الرسالة
                // ---------------------------------

                const resend =
                    confirm(
                        "هل تريد إعادة إرسال رسالة تأكيد الإيميل؟"
                    );


                if (resend) {

                    try {

                        await sendEmailVerification(
                            user
                        );

                        alert(
                            "📧 تم إرسال رسالة تأكيد جديدة إلى بريدك الإلكتروني."
                        );

                    } catch (verificationError) {

                        console.error(
                            verificationError
                        );

                        alert(
                            "❌ لم نتمكن من إرسال رسالة التأكيد.\n" +
                            verificationError.message
                        );

                    }

                }


                await signOut(auth);

                return;

            }


            // =================================
            // تحديث حالة المستخدم
            // =================================

            await updateDoc(
                userRef,
                {

                    online: true,

                    lastSeen:
                        serverTimestamp()

                }
            );


            // =================================
            // الدخول للشات
            // =================================

            window.location.href =
                "chat.html";


        } catch (error) {

            console.error(
                "Login Error:",
                error
            );


            if (
                error.code ===
                "auth/invalid-credential"
            ) {

                alert(
                    "❌ البريد الإلكتروني أو كلمة المرور غير صحيحة."
                );

            }

            else if (
                error.code ===
                "auth/user-not-found"
            ) {

                alert(
                    "❌ لا يوجد حساب بهذا البريد الإلكتروني."
                );

            }

            else if (
                error.code ===
                "auth/wrong-password"
            ) {

                alert(
                    "❌ كلمة المرور غير صحيحة."
                );

            }

            else if (
                error.code ===
                "auth/too-many-requests"
            ) {

                alert(
                    "⚠️ محاولات كثيرة جدًا.\nحاول مرة أخرى بعد قليل."
                );

            }

            else {

                alert(
                    "❌ حدث خطأ أثناء تسجيل الدخول:\n" +
                    error.message
                );

            }

        }

    }
);


// =====================================
// استعادة كلمة المرور
// =====================================

if (forgotPasswordBtn) {

    forgotPasswordBtn.addEventListener(
        "click",
        async (e) => {

            e.preventDefault();


            const emailInput =
                document.getElementById(
                    "email"
                );


            const email =
                emailInput.value.trim();


            // =================================
            // لازم الإيميل يكون مكتوب
            // =================================

            if (!email) {

                alert(
                    "📧 اكتب بريدك الإلكتروني الأول، وبعدها اضغط «نسيت كلمة المرور؟»."
                );

                emailInput.focus();

                return;

            }


            try {

                // =================================
                // إرسال رابط إعادة تعيين الباسورد
                // =================================

                await sendPasswordResetEmail(
                    auth,
                    email
                );


                alert(
                    "📧 تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني.\n\n" +
                    "افتح الإيميل واضغط على الرابط واتبع التعليمات."
                );


            } catch (error) {

                console.error(
                    "Password Reset Error:",
                    error
                );


                if (
                    error.code ===
                    "auth/user-not-found"
                ) {

                    alert(
                        "❌ لا يوجد حساب بهذا البريد الإلكتروني."
                    );

                }

                else if (
                    error.code ===
                    "auth/invalid-email"
                ) {

                    alert(
                        "❌ البريد الإلكتروني غير صحيح."
                    );

                }

                else if (
                    error.code ===
                    "auth/too-many-requests"
                ) {

                    alert(
                        "⚠️ تم إرسال طلبات كثيرة.\nحاول مرة أخرى بعد قليل."
                    );

                }

                else {

                    alert(
                        "❌ تعذر إرسال رابط استعادة كلمة المرور:\n" +
                        error.message
                    );

                }

            }

        }
    );

}
