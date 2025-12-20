const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");

function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = "";

    showTyping();

    // Call the Flask API
    fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
    })
    .then(res => res.json())
    .then(data => {
        removeTyping();
        addMessage(data.reply, "bot");
    })
    .catch(err => {
        removeTyping();
        addMessage("Oops! Something went wrong.", "bot");
        console.error(err);
    });
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
