// ===========================
// Cafe Arab
// app.js
// ===========================

document.addEventListener("DOMContentLoaded", () => {

    console.log("Cafe Arab Started");

    const buttons = document.querySelectorAll(".btn");

    buttons.forEach(button => {
        button.addEventListener("click", function () {
            this.style.transform = "scale(0.97)";

            setTimeout(() => {
                this.style.transform = "scale(1)";
            }, 150);
        });
    });

});

function sendMessage() {

    const input = document.getElementById("messageInput");
    const box = document.getElementById("messages");

    if (!input || !box) return;

    if (input.value.trim() === "") {
        alert("اكتب رسالة أولاً");
        return;
    }

    box.innerHTML += `
        <div style="margin-top:15px;">
            <b style="color:#d4af37;">أنت</b><br>
            ${input.value}
        </div>
    `;

    input.value = "";
    box.scrollTop = box.scrollHeight;
}
