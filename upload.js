const chooseBtn = document.getElementById("chooseBtn");
const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const preview = document.getElementById("preview");
const progress = document.getElementById("progress");

let selectedFile = null;

chooseBtn.addEventListener("click", () => {

    fileInput.click();

});

fileInput.addEventListener("change", () => {

    if (!fileInput.files.length) return;

    selectedFile = fileInput.files[0];

    const reader = new FileReader();

    reader.onload = (e) => {

        preview.innerHTML = `
            <img src="${e.target.result}">
        `;

    };

    reader.readAsDataURL(selectedFile);

});
uploadBtn.addEventListener("click", async () => {

    if (!selectedFile) {

        alert("اختر صورة أولاً");

        return;

    }

    progress.innerHTML = "جارى رفع الصورة...";

    const formData = new FormData();

    formData.append("file", selectedFile);

    formData.append("upload_preset", "ml_default");

    try {

        const response = await fetch(

            "https://api.cloudinary.com/v1_1/vqwksojr/image/upload",

            {

                method: "POST",

                body: formData

            }

        );

        const data = await response.json();

        console.log(data);

        progress.innerHTML = "✅ تم رفع الصورة";

        alert("تم رفع الصورة بنجاح");

    } catch (error) {

        console.error(error);

        progress.innerHTML = "❌ فشل رفع الصورة";

    }

});
