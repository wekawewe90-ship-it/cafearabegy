// =====================================
// Cafe Arab - Register
// Email Verification
// =====================================

import { auth, db } from "./firebase.js";

import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";


const form =
    document.getElementById("registerForm");


form.addEventListener("submit", async (e) => {

    e.preventDefault();


    const email =
        document.getElementById("email")
            .value
            .trim();

    const name =
        document.getElementById("name")
            .value
            .trim();

    const username =
        document.getElementById("username")
            .value
            .trim();

    const password =
        document.getElementById("password")
            .value
            .trim();

    const confirmPassword =
        document.getElementById("confirmPassword")
            .value
            .trim();


    // =====================================
    // التأكد من تطابق الباسورد
    // =====================================

    if (password !== confirmPassword) {

        alert(
            "❌ كلمتا المرور غير متطابقتين"
        );

        return;

    }


    // =====================================
    // التأكد من طول الباسورد
    // =====================================

    if (password.length < 6) {

        alert(
            "❌ كلمة المرور يجب أن تكون 6 أحرف على الأقل"
        );

        return;

    }


    try {

        // =================================
        // إنشاء الحساب
        // =================================

        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user =
            userCredential.user;


        // =================================
        // حفظ بيانات المستخدم
        // =================================

        await setDoc(
            doc(
                db,
                "users",
                user.uid
            ),
            {

                name: name,

                username: username,

                email: email,

                photo: "",

                bio: "",

                online: false,

                lastSeen:
                    serverTimestamp(),

                createdAt:
                    serverTimestamp()

            }
        );


        // =================================
        // إرسال رسالة تأكيد الإيميل
        // =================================

        await sendEmailVerification(
            user
        );


        // =================================
        // تسجيل الخروج بعد التسجيل
        // =================================

        await signOut(auth);


        alert(
            "✅ تم إنشاء الحساب بنجاح\n\n" +
            "📧 تم إرسال رسالة تأكيد إلى بريدك الإلكتروني.\n\n" +
            "افتح الإيميل واضغط على رابط التأكيد، وبعدها ارجع وسجل الدخول."
        );


        window.location.href =
            "login.html";


    } catch (error) {

        console.error(
            "Register Error:",
            error
        );


        // =================================
        // رسائل أخطاء واضحة
        // =================================

        if (
            error.code ===
            "auth/email-already-in-use"
        ) {

            alert(
                "❌ هذا البريد الإلكتروني مستخدم بالفعل."
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
            "auth/weak-password"
        ) {

            alert(
                "❌ كلمة المرور ضعيفة. استخدم كلمة مرور أقوى."
            );

        }

        else {

            alert(
                "❌ حدث خطأ أثناء إنشاء الحساب:\n" +
                error.message
            );

        }

    }

});
