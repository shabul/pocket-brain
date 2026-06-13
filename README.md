# Pocket Server — Android Phone as a 24/7 LLM API

Running a free, public AI API from a Samsung Galaxy phone using Termux. No cloud. No monthly bill.

---

## What this is

A repurposed Samsung Galaxy S20 FE running a full production-style web server stack entirely on-device via Termux. The phone serves a **Gemma 2B language model** over the public internet, accessible to anyone with the URL.

**The phone is the server.**

---

## Architecture

```
Internet
   │
   ▼
localhost.run SSH tunnel  (free public HTTPS URL)
   │
   ▼
Nginx  :8080  (reverse proxy, handles SSE buffering)
   │
   ▼
Node.js LLM Server  :3000  (node-llama-cpp + Gemma 2B GGUF)
   │  streaming SSE tokens
   ▼
Browser / API client

Flask app  :5000  (separate landing page / demo)
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| OS | Android (Samsung Galaxy S20 FE) |
| Runtime environment | Termux (Linux userspace on Android, no root) |
| LLM inference | `node-llama-cpp` v3 (llama.cpp bindings for Node.js) |
| Model | Gemma 2B IT — Q4_K_M quantized, 1.6GB GGUF |
| Web server | Node.js (raw `http` module) |
| Reverse proxy | Nginx |
| Landing page | Python Flask |
| Public tunnel | localhost.run (SSH-based, no binary needed) |
| Remote access | Tailscale (VPN mesh — no open ports required) |
| Arch | ARM64 (aarch64), 6-core CPU, 7.8GB RAM |

---

## What it does

### 1. LLM API with streaming (`/chat`)

A `POST /chat` endpoint that streams model responses token-by-token using **Server-Sent Events (SSE)**. Any client can hit this like an API:

```bash
curl -N -X POST https://XXXX.lhr.life/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Explain recursion simply"}'

# Response streams as:
# data: "Recursion"
# data: " is"
# data: " when..."
# data: [DONE]
```

### 2. Chat web UI (`GET /`)

A full dark-mode chat interface served directly from the phone. No React, no build step — pure HTML/CSS/JS embedded in the Node.js server. Supports:
- Token-streaming with typing cursor animation
- Auto-resizing textarea
- "New chat" button that resets the context (`POST /reset`)
- Mobile-responsive layout

### 3. Flask landing page (`:5000`)

A separate Python Flask app with a glassmorphism landing page showing the server is live.

### 4. Public internet access

The phone has no public IP. Instead, an SSH reverse tunnel via `localhost.run` exposes the Nginx port publicly:

```bash
ssh -R 80:localhost:8080 localhost.run
# → prints https://XXXX.lhr.life
```

No ports opened on the router. No cloudflare. Just SSH.

---

## Performance

- **Model load time**: ~20-30 seconds on first start
- **Inference speed**: ~4-6 tokens/second
- **Context window**: 4096 tokens
- **RAM used by model**: ~1.8GB
- **Threads**: 6 (all CPU cores, hardcoded — Android's `os.cpus()` returns `[]`)

---

## Key Engineering Challenges

### 1. `node-llama-cpp` had to be compiled from source on ARM64
Pre-built binaries don't exist for Android ARM64. The build took ~30 minutes using Termux's clang/cmake. `node_modules` must not be deleted.

### 2. Persistent LLM context — never tear it down per request
The biggest gotcha: creating a new `context.getSequence()` per HTTP request crashes or corrupts the model state on Android. Solution: one context, one sequence, one session — created at startup and reused forever. A serial queue handles concurrent requests.

```js
// Wrong — destroys context per request
app.post('/chat', async (req, res) => {
  const seq = context.getSequence(); // ← CRASH on Android
});

// Right — one persistent session, serial queue
const chatSession = new LlamaChatSession({ contextSequence: sequence });
const queue = []; // one thing at a time
```

### 3. `os.cpus()` returns `[]` on Android
Node.js can't read `/proc/cpuinfo` in Termux's sandbox. Thread count hardcoded to 6.

### 4. DNS broken for Go/Cloudflare binaries
Android intercepts DNS at `[::1]:53` in a way that breaks Go's resolver. Cloudflared and similar tunnel clients fail. `localhost.run` uses pure SSH — no binary, no DNS issues.

### 5. SSE streaming through Nginx
Nginx buffers responses by default, which breaks SSE. Required:
```nginx
proxy_buffering off;
proxy_cache off;
proxy_read_timeout 300s;  # LLM can be slow
```

### 6. Kill by port, never `pkill -f`
`pkill -f node` also kills `sshd` on Android — you lose SSH access. Always kill by port:
```bash
fuser -k 3000/tcp
```

---

## File Structure

```
pocket-server/
├── start.sh            # One-command startup for all services
├── flask/
│   └── app.py          # Landing page (port 5000)
├── llm/
│   ├── server.js       # LLM API + chat UI (port 3000, SSE streaming)
│   ├── chat.js         # CLI chat for terminal testing
│   └── package.json
└── nginx/
    └── nginx.conf      # Reverse proxy: 8080 → 3000, SSE-safe
```

On the phone, everything lives under `~/server/` with a `logs/` directory for each service.

---

## Running it

### On the phone (after every reboot)
```bash
sshd && bash ~/server/start.sh
```

### From Mac (via Tailscale — works from anywhere)
```bash
sshpass -p 'YOUR_PASSWORD' ssh -p 8022 <tailscale-ip>
```

### Get the public URL
```bash
grep -o 'https://.*\.lhr\.life' ~/server/logs/tunnel.log
```

---

## Setup from scratch

```bash
# 1. Install packages
pkg install python nodejs npm nginx openssh clang cmake make

# 2. Install Python deps
pip install flask

# 3. Install Node deps + compile llama.cpp (takes ~30 min)
cd ~/server/llm && npm install

# 4. Download model (Gemma 2B IT Q4_K_M, ~1.6GB)
# Place as ~/server/llm/gemma.gguf

# 5. Generate SSH key for localhost.run tunnel
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N ""

# 6. Start everything
bash ~/server/start.sh
```

---

## What's next

- [ ] `termux-boot` — auto-start on phone reboot
- [ ] Permanent localhost.run subdomain (free with account login)
- [ ] Try Gemma 3 1B (faster, same quality for short tasks)
- [ ] `proot-distro install ubuntu` for a full Linux environment
- [ ] Expose Flask + LLM behind a single Nginx vhost

---

## Built with

This project was architected and debugged with [Claude Fable 5](https://claude.ai) (Max effort mode via Claude Code). The entire server stack — from the node-llama-cpp integration to the SSE streaming pipeline and nginx config — was designed and iterated on through an agentic coding session directly over SSH into the Android device. Fable 5's Max effort mode was key to catching Android-specific gotchas (broken `os.cpus()`, DNS issues, persistent context requirements) that aren't documented anywhere.
