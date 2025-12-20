const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const historyBtn = document.getElementById("history-btn");
const historyList = document.getElementById("history-list");

// ---------- Chat functions ----------
function addMessage(text, type) {
    const msg = document.createElement("div");
    msg.className = type; // 'user' or 'bot'
    msg.innerHTML = text.replace(/\n/g, "<br>");
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

function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = "";
    showTyping();

    fetch("/chat", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
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

// ---------- Sidebar history ----------
function loadHistorySidebar() {
    fetch("/history")
    .then(res => res.json())
    .then(data => {
        historyList.innerHTML = "";
        data.forEach(msg => {
            const div = document.createElement("div");
            div.className = "history-item"; // simple styling class
            div.textContent = `🧑 ${msg.content}`; // Only user messages
            historyList.appendChild(div);
        });
    });
}

// ---------- Event listeners ----------
input.addEventListener("keypress", e => {
    if (e.key === "Enter") sendMessage();
});
sendBtn.addEventListener("click", sendMessage);
historyBtn.addEventListener("click", loadHistorySidebar);
