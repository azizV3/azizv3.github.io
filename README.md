# Mohamed Aziz Bouajina — Portfolio Redesigned

A redesign of Mohamed Aziz Bouajina's personal portfolio website inspired by the futuristic Cyber HUD aesthetic of **Saveweb2 (INNER VOID / Last Labyrinth)**.

Built with clean vanilla HTML5, CSS3, and ES6+ JavaScript. Completely self-contained, responsive, accessible, and fast.

---

## 📁 Project Structure

```
Portfolio-Redesigned/
├── index.html                 # Flagship comprehensive sci-fi redesign of Aziz's portfolio
├── about.html                 # Deep-dive biography, academic journey at ISI El Manar & SecuriNets
├── portfolio.html             # Detailed production systems and live interactive AI orchestrator
├── contact.html               # Contact terminal with interactive Matrix digital rain effect
├── tunnel.json                # Optional remote tunnel configuration for FastAPI agent backend
├── css/
│   ├── style.css              # Cyber HUD design system matching Saveweb2 architecture
│   └── chat.css               # Styling for the interactive AI Agent Terminal
├── js/
│   ├── config.js              # Site configuration (profile, agent endpoints, social links)
│   ├── main.js                # Core Cyber Engine (loader, HUD cursor, rails, canvas bgfx, tilt, reveal)
│   └── chat.js                # AI Agent Terminal (FastAPI WebSocket + intelligent simulation mode)
├── fonts/                     # Chakra Petch & Share Tech Mono woff2 webfonts
├── images/                    # Vector branding, HUD diagrams, textures, favicons
├── sounds/                    # Audio sound effects from the original portfolio (home, about, etc.)
└── videos/                    # Hero background video (TDBG1.mp4)
```

---

## 🚀 Key Visual & Interactive Features

1. **Cyber Loader & Door Sequence**:
   - Spinning SVG emblem, live percentage count (000% → 100%), status diagnostics (`INITIALIZING`, `LOADING NEURAL MODELS`, `ACCESS GRANTED`).
   - SVG circuit door opening transition.

2. **Electronic Circuit Board Canvas (`#bgfx`)**:
   - Dynamic canvas tracing circuit lines with circular vias (`○`).
   - High-speed electrical lightning bolts darting across grid lines with glowing heads and fading tails.

3. **Floating Cyber Particle Snow (`#kvSnow`)**:
   - Gentle floating crimson particle shower drifting across the hero stage.

4. **Interactive HUD Aiming Reticle (`.cur`)**:
   - Active on desktop pointers.
   - Central red target dot, spinning outer 4-corner bracket square, live coordinate telemetry (`X 0000 / Y 0000`), context mode switching (`[ZOOM]`, `[EXECUTE]`, `[OPEN ↗]`, `[JUMP]`), and hexagonal click ripple wave.

5. **Fixed Side Rails**:
   - Left rail: vertical rotated identification string `MAB-001 // MOHAMED AZIZ BOUAJINA // SOFTWARE & AI`.
   - Right rail: dynamic scroll progress indicator bar tracking viewport depth.

6. **Interactive 3D Tilt Card**:
   - 3D tilt tracking the mouse cursor with holographic glare highlight on the operator dossier.
   - Click to zoom modal via native `<dialog class="lb">` lightbox.

7. **Live AI Agent Orchestrator Console (`#agent-chat`)**:
   - Direct WebSocket support connecting to Mohamed Aziz's local FastAPI backend (`python scripts/server.py` on `http://localhost:8000`).
   - **Intelligent Fallback Simulation Mode**: If the local Python server is offline, the chat operates in simulation mode with real-time streaming answers and realistic tool execution logging (`[query_project_database]`, `[inspect_runtime_capabilities]`, `[execute_system_diagnostic]`).

8. **Original Sound Effects Preserved**:
   - Hover audio effects from the original portfolio (`sounds/home-sound.wav`, `about-sound.wav`, etc.).
   - Includes a HUD sound toggle button `AUDIO [ON/OFF]` in the top header, persisting the user's preference in `localStorage`.

9. **Matrix Digital Rain Canvas (`contact.html`)**:
   - Dynamic green digital rain shower behind the contact terminal.

---

## ⚡ How to Run

Because this is built with modern standard web technologies without heavy node dependencies, you can run it using any static HTTP server:

### Option 1: Python HTTP Server (Built-in)
```bash
cd Portfolio-Redesigned
python -m http.server 3000
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Option 2: Node.js `npx serve`
```bash
cd Portfolio-Redesigned
npx serve .
```

### Option 3: VS Code Live Server
Right-click `Portfolio-Redesigned/index.html` and click **"Open with Live Server"**.

---

## 🤖 Connecting the Live AI Agent Backend (Optional)
If you wish to test with the live Python agent orchestrator:
1. Run the FastAPI server in your terminal:
   ```bash
   cd "portfolio website/scripts"
   python server.py
   ```
2. Open `Portfolio-Redesigned/index.html` — the chat status badge will switch to **CONNECTED** and process real queries through your local Ollama LLM and Python tool loops.
