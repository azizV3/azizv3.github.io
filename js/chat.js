

(() => {
  const root = document.getElementById("agent-chat");
  if (!root) return;

  const log = root.querySelector(".chat-log");
  const toolsBox = root.querySelector(".tool-log");
  const statusEl = root.querySelector(".chat-status");
  const form = root.querySelector(".chat-form");
  const input = form.querySelector("input");
  const sendBtn = form.querySelector("button");
  const badge = root.querySelector(".chat-mode");
  const presets = root.querySelectorAll(".preset-btn");

  let BACKEND = (root.dataset.backend || "http://localhost:8000").replace(/\/$/, "");
  let busy = false;
  let socket = null;
  let convId = null;
  let token = null;
  let turn = null;
  let toolCount = 0;

  async function loadBackend() {
    if (BACKEND) return BACKEND;
    try {
      const response = await fetch(`tunnel.json?t=${Date.now()}`, { cache: "no-store" });
      if (response.ok) {
        const config = await response.json();
        if (config.apiUrl) {
          BACKEND = config.apiUrl.replace(/\/$/, "");
          return BACKEND;
        }
      }
    } catch (e) {
      /* tunnel file not available */
    }
    BACKEND = "http://localhost:8000";
    return BACKEND;
  }

  function setStatus(t) {
    if (statusEl) statusEl.textContent = t;
  }

  function setBadge(state) {
    if (!badge) return;
    badge.textContent = state;
    badge.classList.toggle("is-live", state === "connected");
  }

  function scrollLog() {
    if (log) log.scrollTop = log.scrollHeight;
  }

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
    out.textContent = " -> " + (typeof result === "object" ? JSON.stringify(result) : result);
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

  async function ensureConversation() {
    if (convId) return;
    const res = await fetch(`${BACKEND}/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Portfolio chat" })
    });
    if (res.status === 429) throw new Error("Rate limit reached: too many new chats, try again later");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    convId = data.id;
    token = data.token;
  }

  function ensureSocket() {
    return new Promise((resolve, reject) => {
      if (socket && socket.readyState === WebSocket.OPEN) return resolve();
      const wsUrl = `${BACKEND.replace(/^http/, "ws")}/ws/agent/${convId}?token=${encodeURIComponent(token || "")}`;
      const ws = new WebSocket(wsUrl);
      socket = ws;

      ws.onopen = () => {
        setBadge("connected");
        resolve();
      };

      ws.onerror = () => reject(new Error("Connection to agent backend failed"));

      ws.onmessage = event => {
        try {
          const payload = JSON.parse(event.data);
          switch (payload.type) {
            case "status":
              setStatus(payload.data);
              break;
            case "token":
              if (!turn) break;
              turn.text += payload.data;
              turn.el.textContent = turn.text;
              scrollLog();
              break;
            case "tool_result":
              addTool(payload.data.tool, payload.data.result);
              break;
            case "turn_complete":
              endTurn("Turn finished.");
              break;
            case "error":
              endTurn(payload.data);
              break;
          }
        } catch (e) {
          console.error("Payload parse error:", e);
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

    addMessage("user", text);
    input.value = "";
    setBusy(true);
    turn = { el: addMessage("agent", "", true), text: "" };
    setStatus("Connecting to backend...");

    try {
      await loadBackend();
      await ensureConversation();
      await ensureSocket();
      socket.send(JSON.stringify({ message: text }));
    } catch (err) {
      socket = null;
      setBadge("disconnected");
      endTurn(`Couldn't connect (${err.message}). The backend server at ${BACKEND} is offline.`);
    }
  }

  // Preset quick chips fill the input
  presets.forEach(btn => {
    btn.addEventListener("click", () => {
      const q = btn.dataset.prompt || btn.textContent.replace(/^\[\?\]\s*/, "");
      input.value = q;
      send(q);
    });
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    send(input.value);
  });

  window.addEventListener("pagehide", () => socket?.close());

  setBadge("disconnected");
  setStatus("Server connection standby (http://localhost:8000).");
  addMessage("agent", "A full-stack desktop application built with React, Electron, FastAPI, asyncio, and Ollama supporting dynamic tool-calling and context management.\n\nLive chat demo: this talks to a stripped-down and highly modified version of my agent running on my own machine, so it only responds while the server is online.");
})();
