const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const typing = document.getElementById("typing-indicator");

/* Events */
sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();
});

/* Send Message */
function sendMessage() {
    const message = input.value.trim();
    if (!message) return;

    addMessage(message, "user");
    input.value = "";
    showTyping();

    fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
    })
    .then(res => res.json())
    .then(data => {
        hideTyping();
        addMessage(data.reply, "bot");
        MathJax.typeset();
    })
    .catch(() => {
        hideTyping();
        addMessage("⚠️ Chanakya is reflecting. Please try again.", "bot");
    });
}

/* Add Message */
function addMessage(text, type) {
    const msg = document.createElement("div");
    msg.className = type;
    msg.textContent = text;

    chatBox.insertBefore(msg, typing);
    chatBox.scrollTop = chatBox.scrollHeight;
}

/* Typing Indicator */
function showTyping() {
    typing.classList.remove("hidden");
    chatBox.scrollTop = chatBox.scrollHeight;
}

function hideTyping() {
    typing.classList.add("hidden");
}
