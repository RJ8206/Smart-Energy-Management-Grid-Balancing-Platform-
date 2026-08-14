# ⚡ SmartGrid AI — Gujarat Smart Energy Management & Grid Balancing Platform

> **Challenge 15** | Domain: Energy & Sustainability  
> Built with **IBM Bob** · **Groq API** · **Llama 3.3 70B** · **Node.js**

---

## 🖥️ Live Demo

![SmartGrid AI UI](https://img.shields.io/badge/Status-Live-brightgreen)
![IBM Bob](https://img.shields.io/badge/Built%20with-IBM%20Bob-blue)
![Groq](https://img.shields.io/badge/Powered%20by-Groq-orange)
![Node.js](https://img.shields.io/badge/Runtime-Node.js%2018%2B-green)

---

## 📌 Problem Statement

Gujarat's growing solar capacity (~10 GW+) and fluctuating electricity demand create challenges in:
- Balancing grid load across zones
- Managing battery storage efficiently
- Predicting outages before they occur
- Delivering reliable power to consumers and industries

**This platform deploys 5 specialised Agentic AI solutions** to address these challenges in real time.

---

## 🤖 AI Agents

| Agent | Role |
|-------|------|
| 🧠 **Master Coordinator** | Holistic grid overview — routes queries to all five sub-agents |
| ⚖️ **Demand-Supply Balancing Agent** | Real-time load vs. supply optimisation per 15-min interval across Gujarat zones |
| ☀️ **Solar Generation Forecasting Agent** | 24–72 h PV output forecasts with confidence intervals and ramp-risk alerts |
| 🔋 **Battery Storage Optimization Agent** | BESS charge/discharge scheduling and State-of-Charge (SoC) management |
| ⚠️ **Outage Prediction Agent** | Equipment risk scoring (LOW/MEDIUM/HIGH/CRITICAL), fault prediction, preventive maintenance |
| 📊 **Grid Performance Dashboard Agent** | KPI synthesis, RAG status reporting, CERC/SERC compliance checks |

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **AI Framework** | IBM Bob (Agentic AI) |
| **LLM** | Llama 3.3 70B via Groq API |
| **Backend** | Node.js 18+ · Express.js |
| **Frontend** | Vanilla JS · Marked.js · Highlight.js |
| **Streaming** | Server-Sent Events (SSE) |
| **Styling** | Custom CSS — Deep Navy Energy Theme |
| **Deployment** | Docker · IBM Cloud ready |

---

## 📁 Project Structure

```
groq-chat/
├── server.js              # Express server + Groq SSE proxy + all agent system prompts
├── package.json           # Dependencies
├── Dockerfile             # Container build
├── docker-compose.yml     # Multi-container orchestration
├── .env.example           # API key template
└── public/
    ├── index.html         # App shell — sidebar, agent cards, chat UI
    ├── app.js             # Frontend logic — agent selector, streaming, localStorage
    └── style.css          # Full visual theme — Inter font, amber accent, glassmorphism
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Groq API key → [console.groq.com/keys](https://console.groq.com/keys)

### Run locally

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/smartgrid-ai.git
cd smartgrid-ai/groq-chat

# 2. Install dependencies
npm install

# 3. Configure API key
cp .env.example .env
# Edit .env and add your GROQ_API_KEY

# 4. Start the server
npm start

# 5. Open browser
# http://localhost:3000
```

### Run with Docker

```bash
docker-compose up --build
```

---

## 🔑 Environment Variables

```env
GROQ_API_KEY=your_groq_api_key_here
PORT=3000
```

---

## 💡 How It Works

```
User Message
     │
     ▼
Frontend (app.js)
  - Reads selected agent from sidebar card
  - Sends { messages, model, agentMode } to /api/chat
     │
     ▼
Server (server.js)
  - Injects agent-specific system prompt
  - Forwards to Groq API with streaming enabled
  - Pipes SSE stream back to browser
     │
     ▼
Browser renders streamed markdown in real time
```

---

## 🧪 Sample Test Prompts

### Master Coordinator
```
What is the current state of Gujarat's power grid? Give me a structured overview
covering demand-supply balance, solar generation status, battery storage health,
outage risks, and key KPIs in one unified report.
```

### Solar Forecasting Agent
```
Forecast solar PV output (MW) for Gujarat's top 5 solar parks for the next 24 hours
in 2-hour intervals. Include confidence intervals and flag any ramp-down risk windows.
```

### Outage Prediction Agent
```
Transformer T-47 at Vadodara North has logged 3 oil temperature alarms in 72 hours,
ambient temp is 43°C, feeder F-12 is at 94% capacity. Assess the outage risk level
and recommend preventive actions.
```

---

## 📊 Features

- ✅ **ChatGPT-like UI** — streaming responses, conversation history, sidebar
- ✅ **6 AI Agents** — switchable via visual sidebar cards
- ✅ **Quick-start prompts** — 4 domain-specific prompts per agent
- ✅ **Markdown rendering** — tables, code blocks, headers, blockquotes
- ✅ **Dark / Light mode** — toggle with memory
- ✅ **Multi-model support** — Llama 3.3 70B, Llama 3.1 8B, Mixtral, Gemma 2
- ✅ **Mobile responsive** — works on phones and tablets
- ✅ **Docker ready** — single command deployment

---

## 🏗️ IBM Cloud Deployment

This project is designed for **IBM Cloud Code Engine** or **IBM Cloud Kubernetes Service**.

```bash
# Build image
docker build -t smartgrid-ai .

# Push to IBM Container Registry
ibmcloud cr push icr.io/YOUR_NAMESPACE/smartgrid-ai:latest

# Deploy to Code Engine
ibmcloud ce application create \
  --name smartgrid-ai \
  --image icr.io/YOUR_NAMESPACE/smartgrid-ai:latest \
  --env GROQ_API_KEY=your_key \
  --port 3000
```

---

## 👥 Team

| Role | Technology |
|------|-----------|
| AI Agent Design | IBM Bob |
| LLM | IBM Granite / Groq Llama 3.3 |
| Platform | IBM Cloud |
| Challenge | #15 — Smart Energy Management & Grid Balancing |

---

## 📄 License

MIT License — See [LICENSE](LICENSE) for details.

---

<div align="center">
  <strong>⚡ SmartGrid AI</strong> · Gujarat Energy Platform · Challenge 15<br/>
  Built with IBM Bob + Groq + Node.js
</div>
