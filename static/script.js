const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const historyBtn = document.getElementById("history-btn");
const historyList = document.getElementById("history-list");
const historySidebar = document.getElementById("history-sidebar");
const mainContainer = document.querySelector(".main-container");

// ---------- Generate persistent user_id ----------
let userId = localStorage.getItem("user_id");
if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem("user_id", userId);
}

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

async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = "";
    showTyping();

    try {
        const res = await fetch("/chat", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ message: text, user_id: userId })
        });
        const data = await res.json();
        removeTyping();
        addMessage(data.reply, "bot");
    } catch (err) {
        removeTyping();
        addMessage("Oops! Something went wrong.", "bot");
        console.error(err);
    }
}

// ---------- Sidebar history ----------
async function loadHistorySidebar() {
    try {
        const res = await fetch("/history", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ user_id: userId })
        });
        const data = await res.json();
        historyList.innerHTML = "";
        data.forEach(msg => {
            const div = document.createElement("div");
            div.className = "history-item";
            div.textContent = `🧑 ${msg.content}`;
            historyList.appendChild(div);
        });
    } catch (err) {
        console.error(err);
    }
}

// ---------- Event listeners ----------
input.addEventListener("keypress", e => {
    if (e.key === "Enter") sendMessage();
});
sendBtn.addEventListener("click", sendMessage);
historyBtn.addEventListener("click", () => {
    const isVisible = historySidebar.classList.contains("visible");
    if (isVisible) {
        historySidebar.classList.remove("visible");
        mainContainer.classList.remove("sidebar-open");
    } else {
        historySidebar.classList.add("visible");
        mainContainer.classList.add("sidebar-open");
        loadHistorySidebar();
    }
});

// Custom Cursor
const cursor = document.createElement('div');
cursor.className = 'cursor';
document.body.appendChild(cursor);
document.addEventListener('mousemove', (e) => {
    cursor.style.left = `${e.clientX}px`;
    cursor.style.top = `${e.clientY}px`;
});

// ---------- Load chat history on page load ----------
async function loadChatHistory() {
    try {
        const res = await fetch("/history", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ user_id: userId })
        });
        const data = await res.json();
        data.forEach(msg => addMessage(msg.content, "bot"));
    } catch (err) {
        console.error(err);
    }
}

loadChatHistory();
