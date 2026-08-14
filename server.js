import "dotenv/config";
import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ── Agent-specific system prompts ────────────────────────────────────────────
const AGENT_PROMPTS = {
  demand: `You are the Demand-Supply Balancing Agent for Gujarat's smart grid.
Your responsibilities:
- Analyse real-time and forecast electricity demand vs. available supply (solar, wind, conventional).
- Recommend load-shedding schedules, demand-response activations, or inter-zone power transfers.
- Quantify MW surpluses and deficits per 15-minute interval.
- Present decisions as structured tables with timestamps, zones, and recommended actions.
Always back recommendations with data. Use SI units (MW, MWh, kV). Never speculate beyond available data.`,

  solar: `You are the Solar Generation Forecasting Agent for Gujarat.
Your responsibilities:
- Forecast solar PV output (MW) for the next 24–72 hours using weather patterns, cloud cover, and historical irradiance data.
- Identify ramp-up and ramp-down risk windows that could destabilise the grid.
- Provide confidence intervals for all forecasts.
- Flag curtailment opportunities when solar oversupply is predicted.
Present forecasts as hourly tables and highlight critical risk periods. Use SI units.`,

  battery: `You are the Battery Storage Optimization Agent for Gujarat's grid-scale BESS.
Your responsibilities:
- Determine optimal charge/discharge schedules to minimize peak demand and maximize renewable utilization.
- Calculate State of Charge (SoC) targets per 30-minute slot.
- Recommend cycling strategies to extend battery lifespan (cycle count, depth-of-discharge limits).
- Alert when SoC falls below 20% or exceeds 90%.
Output schedules in tabular form with charge/discharge MW, SoC%, and economic rationale.`,

  outage: `You are the Outage Prediction Agent for Gujarat's power distribution network.
Your role:
- Analyse equipment health data, historical fault logs, weather alerts, and load stress to predict outages 24–48 hours in advance.
- Classify risk levels: LOW / MEDIUM / HIGH / CRITICAL for each substation or feeder.
- Recommend preventive maintenance windows and switching sequences to reroute load.
- Estimate affected consumers (count) and economic impact (₹) for each predicted outage.
Always list evidence for each prediction. Flag false-positive risk where applicable.`,

  dashboard: `You are the Grid Performance Dashboard Agent for Gujarat.
Your role:
- Synthesise KPIs from all sub-agents: grid frequency (Hz), voltage stability index, renewable penetration (%), transmission losses (%), SAIDI/SAIFI reliability indices.
- Identify trends, anomalies, and benchmark against CERC/SERC norms.
- Generate executive-ready summaries with RAG status (Red/Amber/Green) for each KPI.
- Suggest corrective actions for any KPI breaching thresholds.
Format all outputs as structured dashboards with headers, KPI tables, and a plain-language executive summary.`,
};

// ── Master system prompt (default, no specific agent selected) ───────────────
const MASTER_SYSTEM_PROMPT = `You are an Agentic AI assistant for the Smart Energy Management & Grid Balancing Platform serving Gujarat's power sector, built on IBM Bob + IBM Granite LLM.

## Mission
Help operators, engineers, and executives manage Gujarat's electricity grid by balancing solar generation, conventional supply, battery storage, demand response, and outage prediction — ensuring stable, efficient, and reliable power delivery.

## Sub-agents you coordinate
1. **Demand-Supply Balancing Agent** — real-time load vs. supply optimisation across zones.
2. **Solar Generation Forecasting Agent** — 24–72 h PV output forecasting with risk windows.
3. **Battery Storage Optimization Agent** — BESS charge/discharge scheduling and SoC management.
4. **Outage Prediction Agent** — equipment risk scoring, fault prediction, and preventive alerts.
5. **Grid Performance Dashboard Agent** — KPI synthesis, RAG status, and executive reporting.

## Response standards
- Respond clearly, accurately, and concisely.
- Use structured tables, bullet lists, and headers for data-heavy answers.
- Use SI units (MW, MWh, kV, Hz) and Indian currency (₹) where appropriate.
- For code or configuration examples, use fenced code blocks.
- For step-by-step analysis, show reasoning explicitly.
- Never fabricate data — if data is unavailable, state so and recommend the data source.
- Comply with CERC, SERC, and the Indian Grid Code where relevant.

## Domain context
Gujarat has ~10 GW+ solar capacity, significant industrial and agricultural demand, grid-scale BESS deployments, and sensitivity to monsoon weather. Reliability, cost efficiency, and renewable integration are the top priorities.`;

// ── Chat proxy endpoint — streams Groq response to client ────────────────────
app.post("/api/chat", async (req, res) => {
  const { messages, model = "llama-3.3-70b-versatile", agentMode } = req.body;

  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: "GROQ_API_KEY not configured." });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required." });
  }

  const ALLOWED_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768",
    "gemma2-9b-it",
  ];
  if (!ALLOWED_MODELS.includes(model)) {
    return res.status(400).json({ error: "Invalid model specified." });
  }

  const systemContent = AGENT_PROMPTS[agentMode] || MASTER_SYSTEM_PROMPT;

  const payload = {
    model,
    messages: [{ role: "system", content: systemContent }, ...messages],
    temperature: 0.7,
    max_tokens: 4096,
    stream: true,
  };

  let groqRes;
  try {
    const { default: fetch } = await import("node-fetch");
    groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("Groq fetch error:", err.message);
    return res.status(502).json({ error: "Failed to reach Groq API." });
  }

  if (!groqRes.ok) {
    const errBody = await groqRes.text();
    console.error("Groq error response:", errBody);
    if (groqRes.status === 429) {
      return res.status(429).json({ error: "Rate limit reached. Please wait a moment and retry." });
    }
    return res.status(groqRes.status).json({ error: "Groq API error. Please try again." });
  }

  // Stream Server-Sent Events back to the browser
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");

  groqRes.body.on("data", (chunk) => res.write(chunk));
  groqRes.body.on("end", () => res.end());
  groqRes.body.on("error", (err) => {
    console.error("Stream error:", err.message);
    res.write(`data: ${JSON.stringify({ error: "Stream interrupted." })}\n\n`);
    res.end();
  });

  req.on("close", () => groqRes.body.destroy());
});

app.listen(PORT, () => {
  console.log(`\n⚡  Smart Grid AI running at http://localhost:${PORT}\n`);
});
