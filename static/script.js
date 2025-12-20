const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");

function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = "";

    showTyping();

    setTimeout(() => {
        removeTyping();
        addMessage("This is a premium demo reply ✨", "bot");
    }, 1200);
}

function addMessage(text, type) {
    const msg = document.createElement("div");
    msg.className = type;
    msg.textContent = text;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function showTyping() {
    const typing = document.createElement("div");
    typing.className = "bot typing";
    typing.id = "typing";
    typing.innerHTML = "<span></span><span></span><span></span>";
    chatBox.appendChild(typing);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function removeTyping() {
    const t = document.getElementById("typing");
    if (t) t.remove();
}

input.addEventListener("keypress", e => {
    if (e.key === "Enter") sendMessage();
});
