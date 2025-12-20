const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");
const historyBtn = document.getElementById("history-btn");
const historyList = document.getElementById("history-list");

function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = "";
    showTyping();

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

input.addEventListener("keypress", e => { if (e.key === "Enter") sendMessage(); });
document.getElementById("send-btn").addEventListener("click", sendMessage);

// ------------------- HISTORY -------------------
function loadHistorySidebar() {
    fetch("/history")
    .then(res => res.json())
    .then(data => {
        historyList.innerHTML = "";
        data.forEach(msg => {
            const msgDiv = document.createElement("div");
            msgDiv.className = msg.role; // optional: apply .user/.bot styling
            msgDiv.innerHTML = `${msg.role === "user" ? "🧑" : "🤖"} ${msg.content}`;
            historyList.appendChild(msgDiv);
        });
    });
}

historyBtn.addEventListener("click", loadHistorySidebar);
