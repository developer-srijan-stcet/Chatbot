const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const historyBtn = document.getElementById("history-btn");
const historyList = document.getElementById("history-list");
const historySidebar = document.getElementById("history-sidebar");
const mainContainer = document.querySelector(".main-container");
const clearChatBtn = document.getElementById("clear-chat-btn");
const clearHistoryBtn = document.getElementById("clear-history-btn");

// Persistent user ID
let userId = localStorage.getItem("user_id") || crypto.randomUUID();
localStorage.setItem("user_id", userId);

// ---------- Chat functions ----------
function addMessage(text, type){
    const msg = document.createElement("div");
    msg.className = type;

    // Parse Markdown
    msg.innerHTML = marked.parse(text);

    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;

    // Render Math if present
    if (window.MathJax) {
        MathJax.typesetPromise([msg]);
    }
}


function showTyping(){
    const t = document.createElement("div");
    t.className="bot typing"; t.id="typing";
    t.innerHTML="<span></span><span></span><span></span>";
    chatBox.appendChild(t);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function removeTyping(){
    const t = document.getElementById("typing"); if(t) t.remove();
}

async function sendMessage(){
    const text = input.value.trim(); if(!text) return;
    addMessage(text,"user"); input.value="";
    showTyping();
    try{
        const res = await fetch("/chat",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify({message:text, user_id:userId})
        });
        const data = await res.json();
        removeTyping();
        addMessage(data.reply,"bot");
    }catch(err){
        removeTyping();
        addMessage("Oops! Something went wrong.","bot");
        console.error(err);
    }
}

// ---------- Sidebar history ----------
async function loadHistorySidebar(){
    try{
        const res = await fetch("/history",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify({user_id:userId})
        });
        const data = await res.json();
        historyList.innerHTML="";
        data.forEach(msg=>{
            const div = document.createElement("div");
            div.className = msg.msg_type==="user"?"history-item user":"history-item bot";
            div.textContent = (msg.msg_type==="user"?"🧑 ":"🤖 ") + msg.content;
            historyList.appendChild(div);
        });
    }catch(err){console.error(err);}
}

// ---------- Clear chat ----------
clearChatBtn.addEventListener("click", ()=> {
    chatBox.innerHTML = `<div class="bot">🧹 Chat cleared. Ask me something new.</div>`;
});

// ---------- Clear history ----------
clearHistoryBtn.addEventListener("click", async ()=>{
    if(!confirm("Delete entire chat history?")) return;
    try{
        await fetch("/clear-history",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify({user_id:userId})
        });
        historyList.innerHTML="";
        chatBox.innerHTML = `<div class="bot">🗑 History deleted. Fresh start!</div>`;
    }catch(err){console.error(err);}
});

// ---------- Event listeners ----------
input.addEventListener("keypress", e=>{if(e.key==="Enter") sendMessage();});
sendBtn.addEventListener("click", sendMessage);
historyBtn.addEventListener("click", ()=>{
    const isVisible = historySidebar.classList.contains("visible");
    if(isVisible){
        historySidebar.classList.remove("visible");
        mainContainer.classList.remove("sidebar-open");
    }else{
        historySidebar.classList.add("visible");
        mainContainer.classList.add("sidebar-open");
        loadHistorySidebar();
    }
});

// ---------- Custom cursor ----------
const cursor = document.createElement("div"); cursor.className="cursor"; document.body.appendChild(cursor);
document.addEventListener("mousemove",(e)=>{
    cursor.style.left=`${e.clientX}px`; cursor.style.top=`${e.clientY}px`;
});

// ---------- Initialize chat box ----------
chatBox.innerHTML = `<div class="bot">👋 Welcome! I am <strong>Chanakya</strong>. Ask me anything.</div>`;

// ---------- Typing title animation ----------
const titleText="CHANAKYA"; const titleEl=document.getElementById("typing-title");
let i=0;
function typeTitle(){ 
    if(i<titleText.length){ 
        titleEl.textContent+=titleText.charAt(i); 
        i++; 
        setTimeout(typeTitle,150);
    } 
}
typeTitle();
