
(() => {
    
let BACKEND = "";

async function loadBackend() {
    if (BACKEND) return BACKEND;

    const configUrl =
    "https://raw.githubusercontent.com/azizV3/azizv3.github.io/main/tunnel.json";

    const response = await fetch(
        `${configUrl}?t=${Date.now()}`,
        { cache: "no-store" }
    );

    if (!response.ok) {
        throw new Error("Could not load backend URL configuration");
    }

    const config = await response.json();

    if (!config.apiUrl) {
        throw new Error("Backend URL is not configured yet");
    }

    BACKEND = config.apiUrl.replace(/\/$/, "");
    return BACKEND;
}   

    
    const root = document.getElementById("agent-chat");
    if (!root) return;

    const log = root.querySelector(".chat-log");
    const toolsBox = root.querySelector(".tool-log");
    const statusEl = root.querySelector(".chat-status");
    const form = root.querySelector(".chat-form");
    const input = form.querySelector("input");
    const sendBtn = form.querySelector("button");
    const badge = root.querySelector(".chat-mode");
    const BACKEND = (root.dataset.backend || "").replace(/\/$/, "");

    let busy = false;
    let socket = null;
    let convId = null;
    let token = null; 
    let turn = null; 
    let toolCount = 0;



    function setStatus(t) { statusEl.textContent = t; }
    function setBadge(state) {
        badge.textContent = state;
        badge.classList.toggle("is-live", state === "connected");
    }
    function scrollLog() { log.scrollTop = log.scrollHeight; }

    function addMessage(role, text, streaming = false) {
        const row = document.createElement("div");
        row.className = `msg ${role}${streaming ? " streaming" : ""}`;
        const who = document.createElement("span");
        who.className = "who";
        who.textContent = role === "user" ? "USER:" : "AGENT:";
        const body = document.createElement("span");
        body.className = "body";
        body.textContent = text;
        row.append(who, body);
        log.appendChild(row);
        scrollLog();
        return body;


    }

    function addTool(tool, result) {
        if (toolCount++ === 0) toolsBox.querySelector(".tool-empty")?.remove();
        const row = document.createElement("div");
        row.className = "tool-entry";
        const name = document.createElement("span");
        name.className = "tool-name";
        name.textContent = `[${tool}]`;
        const out = document.createElement("span");
        out.className = "tool-out";
        out.textContent = " -> " + JSON.stringify(result);
        row.append(name, out);
        toolsBox.appendChild(row);
        toolsBox.scrollTop = toolsBox.scrollHeight;
    }



    function setBusy(b) {
        busy = b;
        input.disabled = b;
        sendBtn.disabled = b;
        sendBtn.textContent = b ? "Thinking..." : "Execute";
    }


    function endTurn(statusText = "Turn finished.") {
    if (turn) {
        turn.el.parentElement.classList.remove("streaming");
        if (!turn.text) turn.el.parentElement.remove(); 
    }
        turn = null;
        setBusy(false);
        setStatus(statusText);
        input.focus({ preventScroll: true });
    }

async function makeconv() {
    if (convId) return;
    const res = await fetch(`${BACKEND}/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Portfolio chat" })
    });
    if (res.status === 429) throw new Error("too many new chats, try again later");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    convId = data.id;
    token = data.token;
}

function ensureSocket() {
    return new Promise((resolve, reject) => {
        if (socket && socket.readyState === WebSocket.OPEN) return resolve();
        const ws = new WebSocket(`${BACKEND.replace(/^http/, "ws")}/ws/agent/${convId}?token=${encodeURIComponent(token || "")}`);
        socket = ws;
        ws.onopen = () => { setBadge("connected"); resolve(); };
        ws.onerror = () => reject(new Error("connection failed"));
        ws.onmessage = event => {
            const payload = JSON.parse(event.data);
            switch (payload.type) {
                case "status": setStatus(payload.data); break;
                case "token":
                    if (!turn) break;
                    turn.text += payload.data;
                    turn.el.textContent = turn.text;
                    scrollLog();
                    break;
                case "tool_result": addTool(payload.data.tool, payload.data.result); break;
                case "turn_complete": endTurn(); break;
                case "error": endTurn(payload.data); break;
            }
        };
        ws.onclose = () => {
            socket = null;
            setBadge("disconnected");
            if (busy) endTurn("Socket disconnected.");
        };
    });
}



async function send(text) {
        text = text.trim();

        if (busy || !text) return;
        if (!BACKEND) {
            setStatus("No server configured (set data-backend on the chat).");
            return;
        }
        addMessage("user", text);
        input.value = "";
        setBusy(true);
        turn = { el: addMessage("agent", "", true), text: "" };
        setStatus("Connecting...");

        
        try {
            await loadBackend();
            await ensureConversation();
            await ensureSocket();
            socket.send(JSON.stringify({ message: text }));
        } catch (err) {
            socket = null;
            setBadge("disconnected");
            endTurn(`Couldn't connect (${err.message}). The server may be offline.`);
        }
    }window.send = send;
    
    form.addEventListener("submit", e => { 
    e.preventDefault(); 
    send(input.value); 
    });

    window.addEventListener("pagehide", () => socket?.close());

    setBadge("disconnected");
    setStatus(BACKEND ? "Ready." : "No server configured.");
    addMessage("agent", "Agent ready. Type a prompt to start.");
})();
