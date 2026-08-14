# IBM Cloud Agent Configuration — SmartGrid AI

> Challenge 15: Smart Energy Management & Grid Balancing Platform  
> Technology: IBM Bob + IBM Granite LLM + IBM Cloud

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    IBM Cloud                             │
│                                                         │
│   ┌──────────────┐     ┌─────────────────────────────┐  │
│   │  IBM Bob     │────▶│  SmartGrid AI Web App       │  │
│   │  Agent       │     │  (Code Engine / IKS)        │  │
│   │  Framework   │     └─────────────────────────────┘  │
│   └──────────────┘                  │                   │
│          │                          ▼                   │
│   ┌──────────────┐     ┌─────────────────────────────┐  │
│   │ IBM Granite  │     │  Groq API (Llama 3.3 70B)   │  │
│   │    LLM       │     │  groq.com/openai/v1          │  │
│   └──────────────┘     └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Agent 1: Master Coordinator

**File:** `server.js` → `MASTER_SYSTEM_PROMPT`

**IBM Bob Role:** Orchestrator agent that routes user queries to the appropriate sub-agent based on intent classification.

**System Prompt Summary:**
- Coordinates all five sub-agents
- Provides holistic grid overview
- Enforces CERC/SERC/Indian Grid Code compliance
- Uses SI units (MW, MWh, kV, Hz) and ₹ currency

**Trigger keywords:** grid overview, status, summary, all agents, current state

---

## Agent 2: Demand-Supply Balancing Agent

**File:** `server.js` → `AGENT_PROMPTS.demand`

**IBM Bob Role:** Real-time operations agent for load balancing.

**Capabilities:**
- Analyses demand vs. supply per 15-minute interval
- Recommends load-shedding schedules
- Triggers demand-response activations
- Manages inter-zone power transfers (North, South, East, West, Central, Saurashtra)

**Key outputs:** MW surplus/deficit tables, zone-wise allocation, DR activation triggers

**IBM Cloud Integration:**
```yaml
agent_id: demand_supply_balancer
model: ibm/granite-13b-instruct-v2
tools:
  - grid_zone_api
  - demand_forecast_api
  - dr_activation_api
memory: conversation
```

---

## Agent 3: Solar Generation Forecasting Agent

**File:** `server.js` → `AGENT_PROMPTS.solar`

**IBM Bob Role:** Predictive analytics agent for renewable generation.

**Capabilities:**
- Forecasts PV output for 24–72 hours
- Integrates weather/irradiance data
- Detects ramp-up and ramp-down risk windows
- Flags curtailment opportunities during oversupply

**Key outputs:** Hourly MW forecast tables, confidence intervals, risk window alerts

**IBM Cloud Integration:**
```yaml
agent_id: solar_forecasting
model: ibm/granite-13b-instruct-v2
tools:
  - weather_api
  - solar_irradiance_api
  - charanka_park_api
  - khavda_park_api
memory: session
```

**Gujarat Solar Parks covered:**
| Park | Capacity |
|------|----------|
| Charanka Solar Park | 790 MW |
| Khavda RE Park | 30 GW (planned) |
| Raghanesda Solar Park | 214 MW |
| Dhirubhai Ambani Solar Park | 40 MW |
| Radhanpur Solar Plant | 100 MW |

---

## Agent 4: Battery Storage Optimization Agent

**File:** `server.js` → `AGENT_PROMPTS.battery`

**IBM Bob Role:** Optimization agent for grid-scale BESS management.

**Capabilities:**
- Generates charge/discharge schedules in 30-min slots
- Calculates State of Charge (SoC) targets
- Enforces safety limits (20% min, 90% max SoC)
- Recommends cycling strategies for lifespan maximisation

**Key outputs:** Schedule tables (MW, SoC%, action, rationale), critical alerts

**IBM Cloud Integration:**
```yaml
agent_id: battery_optimizer
model: ibm/granite-13b-instruct-v2
tools:
  - bess_telemetry_api
  - grid_frequency_api
  - peak_demand_forecast
memory: persistent
alerts:
  - soc_low: 20
  - soc_high: 90
```

---

## Agent 5: Outage Prediction Agent

**File:** `server.js` → `AGENT_PROMPTS.outage`

**IBM Bob Role:** Predictive maintenance and risk assessment agent.

**Capabilities:**
- Scores substation/feeder risk: LOW / MEDIUM / HIGH / CRITICAL
- Predicts faults 24–48 hours in advance
- Recommends maintenance windows
- Estimates affected consumers and ₹ economic impact

**Key outputs:** Risk-ranked substation tables, fault probability %, maintenance schedules, impact assessments

**IBM Cloud Integration:**
```yaml
agent_id: outage_predictor
model: ibm/granite-13b-instruct-v2
tools:
  - equipment_health_api
  - fault_history_api
  - weather_alert_api
  - maintenance_scheduler
memory: persistent
risk_thresholds:
  critical: 0.85
  high: 0.65
  medium: 0.40
```

---

## Agent 6: Grid Performance Dashboard Agent

**File:** `server.js` → `AGENT_PROMPTS.dashboard`

**IBM Bob Role:** Reporting and analytics agent for executive visibility.

**Capabilities:**
- Synthesises KPIs from all sub-agents
- Produces RAG (Red/Amber/Green) status per KPI
- Benchmarks against CERC/SERC norms
- Generates plain-language executive summaries

**KPIs monitored:**

| KPI | CERC Norm | RAG Threshold |
|-----|-----------|---------------|
| Grid Frequency | 49.95–50.05 Hz | ±0.2 Hz = Amber, ±0.5 Hz = Red |
| Voltage Stability Index | > 0.95 | < 0.90 = Red |
| Renewable Penetration | Target 50% by 2030 | < 30% = Amber |
| Transmission Losses | < 3.5% | > 5% = Red |
| SAIDI | < 4 hrs/year | > 6 hrs = Red |
| SAIFI | < 4 interruptions | > 6 = Red |
| BESS Utilisation | > 80% | < 60% = Amber |

**IBM Cloud Integration:**
```yaml
agent_id: grid_dashboard
model: ibm/granite-13b-instruct-v2
tools:
  - kpi_aggregator_api
  - cerc_compliance_checker
  - report_generator
  - alert_broadcaster
memory: session
report_formats:
  - executive_summary
  - rag_dashboard
  - trend_analysis
```

---

## IBM Cloud Deployment Steps

### 1. Prerequisites
```bash
ibmcloud login --apikey YOUR_IBM_CLOUD_API_KEY
ibmcloud target -r us-south -g Default
ibmcloud plugin install code-engine
ibmcloud plugin install container-registry
```

### 2. Build & Push Container
```bash
cd groq-chat
ibmcloud cr namespace-add smartgrid-ai
docker build -t icr.io/smartgrid-ai/app:latest .
ibmcloud cr login
docker push icr.io/smartgrid-ai/app:latest
```

### 3. Deploy to Code Engine
```bash
ibmcloud ce project create --name smartgrid-ai-project
ibmcloud ce project select --name smartgrid-ai-project

ibmcloud ce application create \
  --name smartgrid-ai \
  --image icr.io/smartgrid-ai/app:latest \
  --port 3000 \
  --min-scale 1 \
  --max-scale 5 \
  --env GROQ_API_KEY=YOUR_KEY

ibmcloud ce application get --name smartgrid-ai
```

### 4. Verify Deployment
```bash
# Get the public URL
ibmcloud ce application get --name smartgrid-ai --output json | grep url
```

---

## IBM Bob Agent Configuration (YAML)

```yaml
# IBM Bob multi-agent configuration
name: SmartGrid AI
version: 1.0.0
description: Gujarat Smart Energy Management & Grid Balancing Platform

orchestrator:
  agent: master_coordinator
  model: ibm/granite-13b-instruct-v2
  routing_strategy: intent_based

agents:
  - id: master_coordinator
    name: Master Coordinator
    prompt_file: prompts/master.txt
    
  - id: demand_supply
    name: Demand-Supply Balancing Agent
    prompt_file: prompts/demand.txt
    
  - id: solar_forecasting
    name: Solar Generation Forecasting Agent
    prompt_file: prompts/solar.txt
    
  - id: battery_optimizer
    name: Battery Storage Optimization Agent
    prompt_file: prompts/battery.txt
    
  - id: outage_predictor
    name: Outage Prediction Agent
    prompt_file: prompts/outage.txt
    
  - id: grid_dashboard
    name: Grid Performance Dashboard Agent
    prompt_file: prompts/dashboard.txt

compliance:
  - CERC Grid Code
  - SERC Regulations
  - Indian Electricity Act 2003
  - National Electricity Policy
```

---

*SmartGrid AI — Challenge 15 — IBM Bob + IBM Granite LLM + IBM Cloud*
