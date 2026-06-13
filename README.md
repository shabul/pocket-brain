<div align="center">

# 🧠 Pocket Brain

### Your old Android phone, reimagined as a 24/7 AI + Market Intelligence server

[![Android](https://img.shields.io/badge/Android-Samsung_Galaxy_S20_FE-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://github.com/shabul/pocket-brain)
[![Termux](https://img.shields.io/badge/Termux-No_Root-000000?style=for-the-badge&logo=gnu-bash&logoColor=white)](https://termux.dev)
[![Node.js](https://img.shields.io/badge/Node.js-LLM_Server-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Python](https://img.shields.io/badge/Python-Flask_Hub-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://flask.palletsprojects.com)
[![Nginx](https://img.shields.io/badge/Nginx-Reverse_Proxy-009639?style=for-the-badge&logo=nginx&logoColor=white)](https://nginx.org)
[![Tailscale](https://img.shields.io/badge/Tailscale-Mesh_VPN-242424?style=for-the-badge&logo=tailscale&logoColor=white)](https://tailscale.com)

<br/>

> **No cloud. No GPU. No monthly bill.**
> Just a phone that was collecting dust — now running Gemma 2B,
> watching Indian markets 24/7, and serving it all over the public internet.

<br/>

![cost](https://img.shields.io/badge/Monthly_Cost-$0-brightgreen?style=flat-square)
![model](https://img.shields.io/badge/Model-Gemma_2B_IT_Q4__K__M-blueviolet?style=flat-square)
![speed](https://img.shields.io/badge/Inference-4--6_tok%2Fs-orange?style=flat-square)
![arch](https://img.shields.io/badge/Arch-ARM64_aarch64-blue?style=flat-square)
![ram](https://img.shields.io/badge/RAM-7.8_GB-informational?style=flat-square)

</div>

---

## What's running on the phone

```
┌─────────────────────────────────────────────────────────┐
│              Samsung Galaxy S20 FE  (Termux)            │
│                                                         │
│  ┌─────────────────┐      ┌──────────────────────────┐  │
│  │  Flask Hub :5000│      │   MarketCruise Bridge    │  │
│  │  Dashboard UI   │      │   hub/market.js  :3001   │  │
│  │  Premarket data │◄─────│   polls Mac via Tailscale│  │
│  │  Stock analysis │      └──────────────────────────┘  │
│  │  LLM link       │                  ▲                 │
│  └────────┬────────┘                  │ Tailscale VPN   │
│           │                           │ 100.94.x.x:8001 │
│  ┌────────▼────────┐      ┌───────────┴──────────────┐  │
│  │  Nginx   :8088  │      │  MarketCruise  (Mac)     │  │
│  │  Reverse Proxy  │      │  LangGraph + Gemini      │  │
│  │  /      → Flask │      │  4 AI agents             │  │
│  │  /llm/  → LLM   │      │  NSE + Portfolio data    │  │
│  │  /market/→ Hub  │      └──────────────────────────┘  │
│  └────────┬────────┘                                    │
│           │                                             │
│  ┌────────▼────────┐                                    │
│  │  Gemma 2B :3000 │                                    │
│  │  node-llama-cpp │                                    │
│  │  SSE streaming  │                                    │
│  │  Chat UI        │                                    │
│  └─────────────────┘                                    │
└─────────────────────────────────────────────────────────┘
         │
         │  localhost.run SSH tunnel
         ▼
   https://XXXX.lhr.life   (public internet)
```

---

## Tech Stack

<table>
<tr>
<td><b>Layer</b></td>
<td><b>Technology</b></td>
<td><b>Why</b></td>
</tr>
<tr>
<td>🤖 LLM Inference</td>
<td><code>node-llama-cpp</code> v3 + Gemma 2B IT Q4_K_M</td>
<td>Compiled from source for ARM64 — no pre-built binaries exist for Android</td>
</tr>
<tr>
<td>📈 Market Intel</td>
<td>MarketCruise (LangGraph + Gemini) via Tailscale</td>
<td>4-agent AI system on Mac; phone bridges the data to the dashboard</td>
</tr>
<tr>
<td>🌐 Web Server</td>
<td>Node.js raw <code>http</code> module</td>
<td>Zero dependencies, SSE streaming, embedded chat UI</td>
</tr>
<tr>
<td>🔀 Proxy</td>
<td>Nginx</td>
<td>Routes all services under one port; <code>proxy_buffering off</code> for SSE</td>
</tr>
<tr>
<td>🖥️ Dashboard</td>
<td>Python Flask</td>
<td>Hub page — premarket ticker, analysis, predictions, service health</td>
</tr>
<tr>
<td>🌍 Public Tunnel</td>
<td>localhost.run (SSH reverse tunnel)</td>
<td>No binary, no DNS issues — just SSH. Cloudflared breaks on Android.</td>
</tr>
<tr>
<td>🔒 Remote Access</td>
<td>Tailscale</td>
<td>Zero-config mesh VPN via Android app — Mac talks to phone from anywhere</td>
</tr>
<tr>
<td>📱 Runtime</td>
<td>Termux (ARM64, 6-core, 7.8GB RAM)</td>
<td>Full Linux userspace on Android, no root required</td>
</tr>
</table>

---

## Features

### 🤖 On-Device LLM — `GET /llm/`

A full streaming chat interface powered by **Gemma 2B** running entirely on the phone's CPU. No API key. No quota. No cost.

```bash
# Hit it like any LLM API
curl -N -X POST https://XXXX.lhr.life/llm/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Explain recursion simply"}'

# Streams token by token:
# data: "Recursion"
# data: " is"
# data: " when a function..."
# data: [DONE]
```

- Token-by-token SSE streaming
- Persistent context (never torn down — key gotcha on Android)
- Serial request queue for concurrent users
- `POST /llm/reset` to clear conversation history
- Dark-mode chat UI, no build step, no React

---

### 📊 Market Intelligence Hub — `GET /`

The phone polls **[MarketCruise](https://github.com/shabul/MarketCruise)** — a multi-agent LangGraph system running on Mac — every hour via Tailscale. Results are cached locally so the dashboard works even if the Mac goes offline.

**What the dashboard shows:**
| Section | Data |
|---------|------|
| 🌅 Premarket Strip | Nifty 50, Bank Nifty, India VIX, USD/INR, Crude, S&P500, Nasdaq, Nikkei |
| 📝 Analysis | Latest MarketCruise run report (morning / midday / evening) |
| 🎯 Today's Calls | Per-stock BUY / SELL / HOLD with confidence % and reasoning |
| 🟢 Service Health | Live badges for LLM, MarketCruise, Flask |

**Trigger a run from the phone:**
```bash
curl -X POST http://phone:8088/market/api/run/morning
# → forwards to MarketCruise on Mac, returns run_id
```

---

## Performance

<table>
<tr>
<td align="center">⚡<br/><b>4–6 tok/s</b><br/><sub>Inference speed</sub></td>
<td align="center">⏱️<br/><b>~25s</b><br/><sub>Model load time</sub></td>
<td align="center">🧠<br/><b>4096</b><br/><sub>Context window</sub></td>
<td align="center">💾<br/><b>1.8 GB</b><br/><sub>RAM for model</sub></td>
<td align="center">🔧<br/><b>6 threads</b><br/><sub>All CPU cores</sub></td>
<td align="center">💰<br/><b>$0 / mo</b><br/><sub>Running cost</sub></td>
</tr>
</table>

---

## Hard-won Android gotchas

These aren't in any tutorial. Took real debugging to find.

<details>
<summary><b>1. node-llama-cpp must be compiled from source on ARM64</b></summary>

No pre-built binaries exist for Android ARM64. The compilation takes ~30 minutes using Termux's `clang` and `cmake`. **Never delete `node_modules/`** — you don't want to wait 30 minutes again.

```bash
pkg install clang cmake make
cd ~/server/llm && npm install  # go get a coffee
```
</details>

<details>
<summary><b>2. One persistent LLM context — never create per request</b></summary>

Creating `context.getSequence()` per HTTP request corrupts model state on Android. The fix: one context, one session, forever — with a serial queue for concurrency.

```js
// WRONG — crashes on Android
req.on('end', async () => {
  const seq = context.getSequence(); // corrupts state
});

// RIGHT — one session at startup, serial queue
const chatSession = new LlamaChatSession({ contextSequence: sequence });
const queue = [];  // drain one request at a time
```
</details>

<details>
<summary><b>3. os.cpus() returns [] on Android</b></summary>

Node.js can't read `/proc/cpuinfo` inside Termux's sandbox. Thread count must be hardcoded (or set via env var):

```js
const THREADS = parseInt(process.env.THREADS ?? "6", 10);
```
</details>

<details>
<summary><b>4. DNS is broken for Go binaries — cloudflared won't work</b></summary>

Android intercepts DNS at `[::1]:53` in a way that breaks Go's net resolver. Cloudflared, frp, and similar Go-based tunnels all fail silently. Solution: `localhost.run` uses pure SSH — no binary, no DNS lookup needed.

```bash
ssh -R 80:localhost:8088 localhost.run  # just works
```
</details>

<details>
<summary><b>5. Nginx buffers SSE by default — streaming breaks</b></summary>

```nginx
location /llm/ {
    proxy_buffering off;   # required for SSE
    proxy_cache off;
    proxy_read_timeout 300s;
}
```
</details>

<details>
<summary><b>6. Never use pkill -f — it kills sshd</b></summary>

`pkill -f node` matches everything with "node" in the process args, including `sshd` on some Android builds. You'll lose SSH access mid-session.

```bash
fuser -k 3000/tcp   # safe — kills only what's on the port
```
</details>

---

## Project Structure

```
pocket-brain/
│
├── 📄 config.json          # Ports, MarketCruise URL, poll interval
├── 🚀 start.sh             # One command — boots all services on the phone
│
├── 🖥️  flask/
│   └── app.py              # Hub dashboard (premarket, analysis, predictions)
│
├── 🤖 llm/
│   ├── server.js           # Gemma 2B HTTP server — SSE streaming + chat UI
│   ├── chat.js             # Terminal CLI chat (for testing)
│   └── package.json
│
├── 📊 hub/
│   └── market.js           # MarketCruise bridge — polls Mac, caches, serves API
│
└── 🔀 nginx/
    └── nginx.conf          # Routes: / → Flask | /llm/ → Gemma | /market/ → Hub
```

---

## Quick Start

### Prerequisites — on the phone

```bash
# Install Termux packages
pkg install python nodejs npm nginx openssh clang cmake make

# Python deps
pip install flask

# Compile LLM bindings (~30 min, do this once)
cd ~/server/llm && npm install

# Download Gemma 2B IT Q4_K_M (~1.6GB)
# Place at: ~/server/llm/gemma.gguf

# SSH key for the public tunnel
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N ""
```

### Boot everything

```bash
# Run after every phone reboot
sshd && bash ~/server/start.sh
```

```
[1/5] Stopping any existing services...
[2/5] Starting Flask hub dashboard (port 5000)...
[3/5] Starting Nginx (port 8088)...
[4/5] Starting LLM server (port 3000)...
  Waiting for model to load (~30s)...
  Server: http://0.0.0.0:3000
[5/5] Starting market watcher (port 3001)...

=== All services running ===
Hub:    http://192.168.0.7:8088
LLM:    http://192.168.0.7:8088/llm/
Market: http://192.168.0.7:8088/market/api/latest
Public: https://XXXX.lhr.life
```

### SSH in from anywhere

```bash
# Via Tailscale (works from any network)
ssh -p 8022 <phone-tailscale-ip>
```

---

## Related

[![MarketCruise](https://img.shields.io/badge/GitHub-MarketCruise-181717?style=for-the-badge&logo=github)](https://github.com/shabul/MarketCruise)

**MarketCruise** — the multi-agent LangGraph system that runs on Mac and powers this phone's market intelligence. 4 AI agents (Orchestrator, News, Technical, Portfolio) + ChromaDB memory + Gemini models + live NSE data.

---

## Roadmap

- [ ] `termux-boot` — auto-start all services on phone reboot
- [ ] Permanent localhost.run subdomain
- [ ] Swap to Gemma 3 4B multimodal for vision capabilities
- [ ] `proot-distro install ubuntu` for Docker-like environment
- [ ] Push market alerts to Telegram when MarketCruise flags a signal

---

<div align="center">

**Built with [Claude Fable 5](https://claude.ai) — Max Effort mode via Claude Code**

*The entire stack was designed, debugged, and iterated through an agentic coding session
directly over SSH into the Android device. Fable 5's Max effort mode surfaced every
Android-specific gotcha listed above — none of them are in any tutorial.*

<br/>

[![Star this repo](https://img.shields.io/github/stars/shabul/pocket-brain?style=social)](https://github.com/shabul/pocket-brain)

</div>
