<div align="center">

# 🧠 Pocket Brain

### Your old Android phone — now a 24/7 AI server, market analyst, and WhatsApp alert bot

[![Android](https://img.shields.io/badge/Android-Samsung_Galaxy_S20_FE-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://github.com/shabul/pocket-brain)
[![Termux](https://img.shields.io/badge/Termux-No_Root-000000?style=for-the-badge&logo=gnu-bash&logoColor=white)](https://termux.dev)
[![Node.js](https://img.shields.io/badge/Node.js-LLM_Server-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Python](https://img.shields.io/badge/Python-Flask_Hub-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://flask.palletsprojects.com)
[![Nginx](https://img.shields.io/badge/Nginx-Reverse_Proxy-009639?style=for-the-badge&logo=nginx&logoColor=white)](https://nginx.org)
[![Tailscale](https://img.shields.io/badge/Tailscale-Mesh_VPN-242424?style=for-the-badge&logo=tailscale&logoColor=white)](https://tailscale.com)

<br/>

> **No cloud. No GPU. No monthly bill.**
>
> A phone that was collecting dust — now running Gemma 2B on-device,
> pulling live Zerodha portfolio data, watching Indian markets 24/7 via
> [MarketCruise](https://github.com/shabul/MarketCruise),
> and sending you a WhatsApp brief every morning and evening.

<br/>

![cost](https://img.shields.io/badge/Monthly_Cost-$0-brightgreen?style=flat-square)
![model](https://img.shields.io/badge/LLM-Gemma_2B_IT_Q4__K__M-blueviolet?style=flat-square)
![speed](https://img.shields.io/badge/Inference-4--6_tok%2Fs-orange?style=flat-square)
![arch](https://img.shields.io/badge/Arch-ARM64_aarch64-blue?style=flat-square)
![alerts](https://img.shields.io/badge/WhatsApp-Morning_%26_Evening_Alerts-25D366?style=flat-square&logo=whatsapp&logoColor=white)
![zerodha](https://img.shields.io/badge/Zerodha-Live_Portfolio_P%26L-387ED1?style=flat-square)

</div>

---

## What this phone does now

```
┌──────────────────────────────────────────────────────────────────────┐
│                  Samsung Galaxy S20 FE  (Termux, no root)           │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                     Nginx  :8088                             │    │
│  │   /        → Flask Dashboard    /llm/   → Gemma 2B          │    │
│  │   /market/ → MarketCruise Bridge                            │    │
│  └──────────┬────────────────────────────────────┬─────────────┘    │
│             │                                    │                  │
│  ┌──────────▼──────────┐             ┌──────────▼──────────────┐   │
│  │  Flask Hub  :5000   │             │  Gemma 2B LLM   :3000   │   │
│  │  • Premarket strip  │             │  node-llama-cpp          │   │
│  │  • Market analysis  │             │  SSE streaming           │   │
│  │  • Zerodha P&L      │             │  Chat UI                 │   │
│  │  • Today's calls    │             │  POST /chat API          │   │
│  │  • Service health   │             └─────────────────────────┘   │
│  └──────────┬──────────┘                                            │
│             │                                                        │
│  ┌──────────▼────────────────────────────────────────────────────┐  │
│  │  MarketCruise Bridge  :3001   (hub/market.js)                 │  │
│  │  • Polls Mac every hour via Tailscale                         │  │
│  │  • Caches: analysis report, premarket, predictions, portfolio │  │
│  │  • Detects new morning/evening runs → fires WhatsApp alert    │  │
│  │  • Forwards run triggers to MarketCruise on Mac               │  │
│  └──────────────────────┬─────────────────────────────────────--─┘  │
└─────────────────────────┼───────────────────────────────────────────┘
                          │  Tailscale VPN (100.94.x.x)
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│             MacBook — MarketCruise  :8001                           │
│   4 LangGraph agents: Orchestrator · News · Technical · Portfolio   │
│   ChromaDB memory · Gemini 2.0 Flash · NSE/yfinance data           │
│   Zerodha Kite API → live holdings, positions, P&L                 │
│   Cron: morning 09:00 · midday 14:00 · evening 22:00 IST           │
└─────────────────────────────────────────────────────────────────────┘
         │
         │  localhost.run SSH tunnel (free public HTTPS)
         ▼
   https://XXXX.lhr.life
```

---

## Features

### 📲 WhatsApp Alerts — Morning & Evening

Every time [MarketCruise](https://github.com/shabul/MarketCruise) finishes a morning or evening run, the phone detects it and fires a WhatsApp message automatically via **CallMeBot** (free, no Twilio account needed).

```
🌅 Morning Briefing — 14 Jun 2026
🕐 09:15 IST

📈 Nifty 50:    24,350  (+0.4%)
🏦 Bank Nifty:  52,180  (-0.1%)
⚡ India VIX:   13.2
💵 USD/INR:     ₹83.4
🛢 Crude Oil:   $78.2  (+0.8%)

💼 Portfolio: ₹4,82,100 | Unrealized P&L: +₹18,450 (+3.97%)

🎯 Today's Calls:
✅ TCS → BUY (82%)
⚠️ RELIANCE → HOLD (67%)
🔴 HDFC Bank → SELL (74%)
✅ INFY → BUY (79%)

📝 Analysis:
Nifty gapped up on strong FII inflows. IT sector leading — TCS and Infosys
both showing technical breakout above 200 DMA. Keep an eye on Bank Nifty
resistance at 52,500. Crude softening supports broader market mood...

_Pocket Brain + MarketCruise_
_github.com/shabul/pocket-brain_
```

Setup: add CallMeBot to WhatsApp, get your API key in 30 seconds, drop it in `config.json`.

---

### 💼 Live Zerodha Portfolio

The phone bridges [MarketCruise's](https://github.com/shabul/MarketCruise) Zerodha Kite integration — your live holdings, positions, and unrealized P&L land on the hub dashboard and in your WhatsApp alerts.

| Field | Source |
|-------|--------|
| Holdings (qty, avg price, LTP, P&L) | Zerodha Kite via MarketCruise |
| Unrealized P&L | Calculated live from Kite data |
| Intraday positions | Kite positions API |
| Today's trades | Kite orders API |

Falls back to cached data gracefully if Kite token expires.

---

### 🤖 On-Device LLM — `GET /llm/`

Gemma 2B running entirely on the phone's CPU. No API key, no quota, no cost.

```bash
curl -N -X POST https://XXXX.lhr.life/llm/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the outlook for IT stocks?"}'

# Streams token by token:
# data: "IT stocks are showing..."
# data: [DONE]
```

- Token-by-token SSE streaming
- Persistent context (one session, serial queue — the only way it works on Android)
- Dark-mode chat UI embedded in the server, no build step

---

### 📊 Hub Dashboard — `GET /`

<table>
<tr><td><b>Section</b></td><td><b>Data</b></td></tr>
<tr><td>🌅 Premarket</td><td>Nifty 50, Bank Nifty, India VIX, USD/INR, Crude, S&P500, Nasdaq, Nikkei</td></tr>
<tr><td>💼 Portfolio</td><td>Live Zerodha holdings table with per-stock P&L</td></tr>
<tr><td>📝 Analysis</td><td>Latest MarketCruise report (morning / midday / evening)</td></tr>
<tr><td>🎯 Calls</td><td>Per-stock BUY / SELL / HOLD with confidence % and reasoning</td></tr>
<tr><td>🟢 Health</td><td>Live badges: Gemma, MarketCruise, Zerodha Kite, WhatsApp</td></tr>
</table>

---

## Tech Stack

<table>
<tr><td><b>Layer</b></td><td><b>Technology</b></td><td><b>Why</b></td></tr>
<tr><td>🤖 LLM</td><td>node-llama-cpp v3 + Gemma 2B IT Q4_K_M (1.6 GB)</td><td>Compiled from source — no ARM64 Android binaries exist</td></tr>
<tr><td>📈 Market Intel</td><td>MarketCruise → LangGraph + Gemini 2.0 Flash + NSE</td><td>Multi-agent AI system on Mac; phone bridges and alerts</td></tr>
<tr><td>💼 Portfolio</td><td>Zerodha Kite API (via MarketCruise)</td><td>Live holdings, positions, P&L — falls back to cache</td></tr>
<tr><td>📲 Alerts</td><td>WhatsApp via CallMeBot (free)</td><td>No Twilio, no Business API — one-time setup, instant messages</td></tr>
<tr><td>🌐 Web Server</td><td>Node.js raw http module</td><td>Zero deps, SSE streaming, embedded UI</td></tr>
<tr><td>🔀 Proxy</td><td>Nginx :8088</td><td>Single public port; proxy_buffering off for SSE</td></tr>
<tr><td>🖥️ Dashboard</td><td>Python Flask</td><td>Hub page served at /; pure JS frontend</td></tr>
<tr><td>🌍 Tunnel</td><td>localhost.run SSH reverse tunnel</td><td>No binary, no DNS issues — cloudflared breaks on Android</td></tr>
<tr><td>🔒 VPN</td><td>Tailscale (Android app)</td><td>Phone ↔ Mac connection without opening any ports</td></tr>
<tr><td>📱 Runtime</td><td>Termux, ARM64, 6-core, 7.8 GB RAM</td><td>Linux userspace on Android, no root required</td></tr>
</table>

---

## Performance

<table>
<tr>
<td align="center">⚡<br/><b>4–6 tok/s</b><br/><sub>LLM inference</sub></td>
<td align="center">⏱️<br/><b>~25s</b><br/><sub>Model load</sub></td>
<td align="center">🧠<br/><b>4096 tokens</b><br/><sub>Context window</sub></td>
<td align="center">💾<br/><b>1.8 GB</b><br/><sub>Model RAM</sub></td>
<td align="center">🔔<br/><b>2x/day</b><br/><sub>WhatsApp alerts</sub></td>
<td align="center">💰<br/><b>$0 / mo</b><br/><sub>Running cost</sub></td>
</tr>
</table>

---

## WhatsApp Setup (2 minutes)

1. Save **+34 644 55 40 87** in your phone as "CallMeBot"
2. Send it this WhatsApp message: `I allow callmebot to send me messages`
3. You'll receive your API key back in seconds
4. Add it to `config.json`:

```json
"whatsapp": {
  "phone": "+91XXXXXXXXXX",
  "callmebot_apikey": "YOUR_KEY_HERE",
  "alerts": { "morning": true, "evening": true }
}
```

Test it from the dashboard ("Test WhatsApp" button) or via the API:
```bash
curl -X POST http://phone:8088/market/api/test-alert
```

---

## Hard-won Android gotchas

<details>
<summary><b>1. node-llama-cpp must be compiled from source on ARM64 (~30 min)</b></summary>

No pre-built binaries exist for Android ARM64. Never delete `node_modules/`.

```bash
pkg install clang cmake make
cd ~/server/llm && npm install
```
</details>

<details>
<summary><b>2. One persistent LLM context — never create per request</b></summary>

Creating `context.getSequence()` per HTTP request corrupts model state on Android. One context, one session, serial queue at startup — forever.

```js
// WRONG — crashes on Android
const seq = context.getSequence(); // inside request handler

// RIGHT
const chatSession = new LlamaChatSession({ contextSequence: sequence });
// one at startup, drained by a serial queue
```
</details>

<details>
<summary><b>3. os.cpus() returns [] on Android — hardcode threads</b></summary>

```js
const THREADS = parseInt(process.env.THREADS ?? "6", 10);
```
</details>

<details>
<summary><b>4. DNS broken for Go binaries — cloudflared fails silently</b></summary>

Android intercepts DNS at `[::1]:53`, breaking Go's net resolver. `localhost.run` uses pure SSH — no binary, no DNS issue.

```bash
ssh -R 80:localhost:8088 localhost.run
```
</details>

<details>
<summary><b>5. Nginx buffers SSE — streaming silently breaks</b></summary>

```nginx
proxy_buffering off;
proxy_cache off;
proxy_read_timeout 300s;
```
</details>

<details>
<summary><b>6. Never pkill -f — it kills sshd and locks you out</b></summary>

```bash
fuser -k 3000/tcp   # safe
```
</details>

---

## Project Structure

```
pocket-brain/
│
├── 📄 config.json          # Ports, MarketCruise URL, WhatsApp config
├── 🚀 start.sh             # One command — boots all 4 services
│
├── 🖥️  flask/
│   └── app.py              # Hub dashboard — premarket, portfolio, analysis, predictions
│
├── 🤖 llm/
│   ├── server.js           # Gemma 2B HTTP server — SSE streaming + chat UI
│   ├── chat.js             # Terminal CLI chat
│   └── package.json
│
├── 📊 hub/
│   └── market.js           # MarketCruise bridge + WhatsApp alert engine
│
└── 🔀 nginx/
    └── nginx.conf          # / → Flask  |  /llm/ → Gemma  |  /market/ → Bridge
```

---

## Quick Start

```bash
# 1. Install Termux packages (one time)
pkg install python nodejs npm nginx openssh clang cmake make
pip install flask

# 2. Compile LLM bindings — takes ~30 min, do once
cd ~/server/llm && npm install

# 3. Download model: Gemma 2B IT Q4_K_M (~1.6 GB)
#    Place at: ~/server/llm/gemma.gguf

# 4. Edit config.json — set your WhatsApp number + CallMeBot key

# 5. Boot everything (run after every phone reboot)
sshd && bash ~/server/start.sh
```

```
[1/5] Stopping existing services...
[2/5] Starting Flask dashboard    (port 5000)
[3/5] Starting Nginx              (port 8088)
[4/5] Starting Gemma 2B LLM      (port 3000) — loading model...
[5/5] Starting MarketCruise hub  (port 3001)

=== All services running ===
Hub:    http://192.168.0.7:8088
LLM:    http://192.168.0.7:8088/llm/
Public: https://XXXX.lhr.life
```

---

## Related

[![MarketCruise](https://img.shields.io/badge/GitHub-MarketCruise-181717?style=for-the-badge&logo=github)](https://github.com/shabul/MarketCruise)

**[MarketCruise](https://github.com/shabul/MarketCruise)** — the multi-agent AI system this phone bridges.
LangGraph + Gemini 2.0 Flash + ChromaDB + Zerodha Kite. Runs morning, midday, and evening analysis of Indian markets. Pocket Brain pulls from it, caches it, and alerts you on WhatsApp.

---

## Roadmap

- [ ] `termux-boot` — auto-start all services on phone reboot
- [ ] Permanent localhost.run subdomain (free with account)
- [ ] Weekly P&L summary alert every Sunday evening
- [ ] Swap Gemma 2B → Gemma 3 4B for vision capabilities
- [ ] Telegram fallback if WhatsApp alert fails

---

<div align="center">

**Built with [Claude Fable 5](https://claude.ai) — Max Effort mode via Claude Code**

*The entire stack — from the node-llama-cpp ARM64 compilation to the MarketCruise bridge,
Zerodha portfolio sync, and WhatsApp alert engine — was designed and debugged through an
agentic coding session live over SSH into the Android device.*

<br/>

[![Star this repo](https://img.shields.io/github/stars/shabul/pocket-brain?style=social)](https://github.com/shabul/pocket-brain)

</div>
