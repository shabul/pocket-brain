import { getLlama, LlamaChatSession } from "node-llama-cpp";
import { fileURLToPath } from "url";
import http from "http";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelPath = process.env.MODEL_PATH ?? path.join(__dirname, "gemma.gguf");
const PORT = parseInt(process.env.PORT ?? "3000", 10);
const THREADS = parseInt(process.env.THREADS ?? "6", 10);

const CTX_OPTS = {
  contextSize: 4096,
  threads: THREADS,
  batchSize: 512,
  flashAttention: true,
};

console.log(`Loading Gemma 2B on ${THREADS} threads...`);
const llama = await getLlama();
const model = await llama.loadModel({ modelPath });

// One persistent context + sequence + session — never torn down per-request
let context = await model.createContext(CTX_OPTS);
let sequence = context.getSequence();
let chatSession = new LlamaChatSession({ contextSequence: sequence });
console.log("Ready.\n");

// Serial queue — LLM does one thing at a time
const queue = [];
let busy = false;
function enqueue(task) {
  return new Promise((resolve, reject) => {
    queue.push({ task, resolve, reject });
    drain();
  });
}
async function drain() {
  if (busy || !queue.length) return;
  busy = true;
  const { task, resolve, reject } = queue.shift();
  try { resolve(await task()); } catch (e) { reject(e); }
  busy = false;
  drain();
}

// Recreate context + session (called on /reset)
async function resetSession() {
  const old = context;
  context = await model.createContext(CTX_OPTS);
  sequence = context.getSequence();
  chatSession = new LlamaChatSession({ contextSequence: sequence });
  await old.dispose().catch(() => {});
}

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shabul AI</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:system-ui,sans-serif;background:#0d0d1a;color:#e8e8f0;height:100vh;display:flex;flex-direction:column;overflow:hidden}
    header{padding:13px 20px;background:#111827;border-bottom:1px solid #1f2937;display:flex;justify-content:space-between;align-items:center;flex-shrink:0}
    header h1{font-size:15px;font-weight:600;color:#a78bfa;letter-spacing:.3px}
    #status{font-size:11px;color:#4ade80;display:flex;align-items:center;gap:5px}
    #status.busy{color:#fbbf24}
    #status::before{content:'';width:6px;height:6px;border-radius:50%;background:currentColor;flex-shrink:0}
    #clear{padding:5px 12px;background:transparent;color:#6b7280;border:1px solid #374151;border-radius:10px;cursor:pointer;font-size:12px;transition:all .2s}
    #clear:hover{color:#a78bfa;border-color:#7c3aed}
    #chat{flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:14px}
    #chat::-webkit-scrollbar{width:4px}
    #chat::-webkit-scrollbar-thumb{background:#374151;border-radius:4px}
    .msg{max-width:80%;padding:12px 16px;border-radius:18px;line-height:1.65;white-space:pre-wrap;font-size:14px;word-break:break-word}
    .user{background:#4f46e5;color:#fff;align-self:flex-end;border-radius:18px 18px 4px 18px}
    .ai{background:#111827;border:1px solid #1f2937;align-self:flex-start;border-radius:4px 18px 18px 18px;min-width:60px}
    .ai.thinking{color:#6b7280;font-style:italic;font-size:13px}
    .cursor{display:inline-block;width:2px;height:14px;background:#a78bfa;animation:blink .8s infinite;vertical-align:middle;margin-left:1px}
    @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
    #form{padding:12px 16px;background:#111827;border-top:1px solid #1f2937;display:flex;gap:10px;align-items:flex-end;flex-shrink:0}
    #input{flex:1;padding:11px 16px;background:#1f2937;color:#e8e8f0;border:1px solid #374151;border-radius:20px;font-size:14px;outline:none;resize:none;max-height:120px;line-height:1.5;font-family:inherit}
    #input:focus{border-color:#7c3aed}
    #input::placeholder{color:#4b5563}
    #send{padding:11px 20px;background:#7c3aed;color:#fff;border:none;border-radius:20px;cursor:pointer;font-size:14px;font-weight:500;transition:all .2s;flex-shrink:0}
    #send:hover{background:#6d28d9}
    #send:disabled{opacity:.35;cursor:default}
    .err{color:#f87171;font-size:13px}
    .queue{color:#fbbf24;font-size:12px;font-style:italic;align-self:flex-start}
  </style>
</head>
<body>
  <header>
    <h1>Shabul AI &mdash; Gemma 2B</h1>
    <div style="display:flex;gap:10px;align-items:center">
      <span id="status">Ready</span>
      <button id="clear">New chat</button>
    </div>
  </header>
  <div id="chat"></div>
  <form id="form">
    <textarea id="input" rows="1" placeholder="Message Gemma... (Enter to send, Shift+Enter for newline)"></textarea>
    <button type="submit" id="send">Send</button>
  </form>

  <script>
    // Works whether served at / (direct :3000) or /llm/ (via nginx)
    const BASE = window.location.pathname.replace(/\/[^\/]*$/, '').replace(/\/$/, '');
    const chat = document.getElementById('chat');
    const input = document.getElementById('input');
    const send = document.getElementById('send');
    const status = document.getElementById('status');
    let busy = false;

    // Auto-resize textarea
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });

    // Enter = send, Shift+Enter = newline
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        document.getElementById('form').requestSubmit();
      }
    });

    document.getElementById('clear').onclick = async () => {
      if (busy) return;
      status.textContent = 'Resetting...';
      status.className = 'busy';
      await fetch(`${BASE}/reset`, { method: 'POST' });
      chat.innerHTML = '';
      status.textContent = 'Ready';
      status.className = '';
    };

    document.getElementById('form').onsubmit = async (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text || busy) return;

      busy = true;
      send.disabled = true;
      input.value = '';
      input.style.height = 'auto';
      status.textContent = 'Thinking...';
      status.className = 'busy';

      // User bubble
      const userDiv = document.createElement('div');
      userDiv.className = 'msg user';
      userDiv.textContent = text;
      chat.appendChild(userDiv);

      // AI bubble with cursor
      const aiDiv = document.createElement('div');
      aiDiv.className = 'msg ai thinking';
      aiDiv.textContent = '●●●';
      chat.appendChild(aiDiv);
      chat.scrollTop = chat.scrollHeight;

      try {
        const res = await fetch(`${BASE}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text })
        });

        if (!res.ok) throw new Error('Server error ' + res.status);

        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = '';
        let content = '';
        let firstChunk = true;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split('\\n');
          buf = lines.pop();

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const d = line.slice(6).trim();
            if (d === '[DONE]') break;
            try {
              const chunk = JSON.parse(d);
              if (firstChunk) {
                aiDiv.className = 'msg ai';
                aiDiv.textContent = '';
                firstChunk = false;
              }
              content += chunk;
              aiDiv.textContent = content;
              chat.scrollTop = chat.scrollHeight;
            } catch {}
          }
        }

        if (firstChunk) { aiDiv.className = 'msg ai err'; aiDiv.textContent = 'No response received.'; }

      } catch (err) {
        aiDiv.className = 'msg ai err';
        aiDiv.textContent = 'Error: ' + err.message;
      }

      busy = false;
      send.disabled = false;
      status.textContent = 'Ready';
      status.className = '';
      input.focus();
    };
  </script>
</body>
</html>`;

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

  // --- GET / → chat UI ---
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    return res.end(HTML);
  }

  // --- POST /chat → SSE stream ---
  if (req.method === "POST" && req.url === "/chat") {
    let body = "";
    req.on("data", d => (body += d));
    req.on("end", async () => {
      let message;
      try { ({ message } = JSON.parse(body)); }
      catch { res.writeHead(400); return res.end("Bad JSON"); }

      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no", // disable proxy buffering (needed for tunnel)
      });

      try {
        await enqueue(() =>
          chatSession.prompt(message, {
            onTextChunk: chunk =>
              res.write(`data: ${JSON.stringify(chunk)}\n\n`),
          })
        );
      } catch (err) {
        console.error("Generation error:", err.message);
        res.write(`data: ${JSON.stringify("\n\n[Error: " + err.message + "]")}\n\n`);
      }

      res.write("data: [DONE]\n\n");
      res.end();
    });
    return;
  }

  // --- POST /reset → new context + session ---
  if (req.method === "POST" && req.url === "/reset") {
    try {
      await enqueue(() => resetSession());
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  res.writeHead(404); res.end("Not found");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server: http://0.0.0.0:${PORT}`);
  console.log(`Threads: ${THREADS} | flash_attn: on | context: 4096`);
});
