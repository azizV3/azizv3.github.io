
window.PORTFOLIO_CONFIG = {

  /* ① Profile Information */
  profile: {
    name: "Mohamed Aziz Bouajina",
    shortName: "Aziz",
    title: "Software Engineer & AI Developer",
    degree: "Licence en Sciences de l'Informatique (3ème année - L3)",
    university: "Institut Supérieur d'Informatique (ISI) El Manar, Ariana",
    academicGrades: {
      l1_l2: "15.5 / 20",
      bac: "17.34 / 20"
    },
    location: "Ariana / Tunis, Tunisia",
    phone: "+216 29021277",
    email: "mohamedaziz.bouajina@gmail.com",
    github: "https://github.com/azizV3",
    linkedin: "https://www.linkedin.com/in/mohamed-aziz-bouajina-14237b39b",
    objective: "Seeking PFE Internship (Stage PFE) — Software Engineering & AI Integration",
    languages: ["Français (Bilingual/Fluent)", "Anglais (Professional)", "Arabe (Native)"],
    focus: ["Distributed Backend Systems", "Autonomous AI Agents", "Cybersecurity & Sandboxing"],
  },

  /* ② AI Agent Orchestrator Backend Configuration
     Direct connection to local FastAPI backend (scripts/server.py).
     Simulation fallback is DISABLED. */
  backend: {
    apiUrl: "http://localhost:8000",
    wsUrl: "ws://localhost:8000/ws/agent",
    tunnelConfigUrl: "tunnel.json",
    simulationFallback: false,
  },

  /* ③ Direct Contact Channels */
  contactLinks: [
    { name: "Email", value: "mohamedaziz.bouajina@gmail.com", url: "mailto:mohamedaziz.bouajina@gmail.com", action: "EMAIL ↗" },
    { name: "Phone", value: "+216 29 021 277", url: "tel:+21629021277", action: "CALL ↗" },
    { name: "GitHub", value: "github.com/azizV3", url: "https://github.com/azizV3", action: "OPEN ↗" },
    { name: "LinkedIn", value: "Mohamed Aziz Bouajina", url: "https://www.linkedin.com/in/mohamed-aziz-bouajina-14237b39b", action: "CONNECT ↗" },
  ],

  /* ④ Audio Settings */
  audio: {
    enabledByDefault: false,
    volume: 0.35,
  },

  /* ⑤ Share Text */
  shareText: "Mohamed Aziz Bouajina — Software Engineer & AI Developer (ISI El Manar)\n{url} #SoftwareEngineering #FastAPI #AIAgents #Python",

};
