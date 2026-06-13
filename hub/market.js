/**
 * MarketCruise bridge — polls Mac via Tailscale, caches data locally,
 * sends WhatsApp alerts (morning + evening) via CallMeBot,
 * and serves everything to the Flask dashboard.
 */
import http from "http";
import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG = JSON.parse(fs.readFileSync(path.join(__dirname, "../config.json"), "utf8"));

const MC_URL   = CONFIG.marketcruise_url ?? "http://100.94.202.43:8001";
const POLL_MS  = (CONFIG.market_interval_minutes ?? 60) * 60 * 1000;
const PORT     = CONFIG.ports?.market ?? 3001;
const WA       = CONFIG.whatsapp ?? {};
const CACHE    = path.join(__dirname, "../logs/market_cache.json");

fs.mkdirSync(path.dirname(CACHE), { recursive: true });

// ── HTTP helper ──────────────────────────────────────────────────────────────

function request(urlStr, { method = "GET", body } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const lib = u.protocol === "https:" ? https : http;
    const payload = body ? JSON.stringify(body) : null;
    const req = lib.request(
      {
        hostname: u.hostname,
        port: u.port || (u.protocol === "https:" ? 443 : 80),
        path: u.pathname + u.search,
        method,
        headers: {
          "Content-Type": "application/json",
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
        },
        timeout: 12000,
      },
      (res) => {
        let data = "";
        res.on("data", d => (data += d));
        res.on("end", () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
          catch (e) { reject(new Error(`JSON parse: ${e.message}`)); }
        });
      }
    );
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
    if (payload) req.write(payload);
    req.end();
  });
}

// ── Cache ────────────────────────────────────────────────────────────────────

function loadCache() {
  try { return JSON.parse(fs.readFileSync(CACHE, "utf8")); }
  catch { return { latest: null, premarket: [], predictions: [], portfolio: null, lastAlertedRunId: null, online: false }; }
}

function writeCache(patch) {
  fs.writeFileSync(CACHE, JSON.stringify({ ...loadCache(), ...patch, lastUpdated: new Date().toISOString() }, null, 2));
}

// ── WhatsApp via CallMeBot ───────────────────────────────────────────────────

function sendWhatsApp(message) {
  if (!WA.phone || !WA.callmebot_apikey || WA.callmebot_apikey === "YOUR_CALLMEBOT_KEY") {
    console.log("[whatsapp] Not configured — skipping alert");
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const params = new URLSearchParams({ phone: WA.phone, text: message, apikey: WA.callmebot_apikey });
    const req = https.request(
      { hostname: "api.callmebot.com", path: `/whatsapp.php?${params}`, method: "GET", timeout: 15000 },
      (res) => {
        let body = "";
        res.on("data", d => (body += d));
        res.on("end", () => {
          console.log(`[whatsapp] Sent (${res.statusCode}): ${body.slice(0, 80)}`);
          resolve();
        });
      }
    );
    req.on("error", (e) => { console.error(`[whatsapp] Failed: ${e.message}`); resolve(); });
    req.on("timeout", () => { req.destroy(); console.error("[whatsapp] Timeout"); resolve(); });
    req.end();
  });
}

function fmt(n) { return n?.toLocaleString("en-IN") ?? "—"; }
function sign(n) { return n >= 0 ? "+" : ""; }

function formatAlert(runType, data) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });

  const icons = { morning: "🌅", midday: "📊", evening: "🌆", weekly: "📋" };
  const labels = { morning: "Morning Briefing", midday: "Midday Check", evening: "Evening Wrap", weekly: "Weekly Review" };

  let msg = `${icons[runType] ?? "📊"} *${labels[runType] ?? runType} — ${dateStr}*\n`;
  msg += `🕐 ${timeStr} IST\n\n`;

  // Premarket snapshot
  const pm = data.premarket ?? [];
  const get = (label) => pm.find(p => p.label === label);
  const nifty   = get("Nifty 50");
  const bnifty  = get("Bank Nifty");
  const vix     = get("India VIX");
  const usdinr  = get("USD/INR");
  const crude   = get("Crude Oil");

  if (nifty?.value)  msg += `📈 *Nifty 50:*    ${fmt(nifty.value)}  (${sign(nifty.pct_change)}${nifty.pct_change}%)\n`;
  if (bnifty?.value) msg += `🏦 *Bank Nifty:*  ${fmt(bnifty.value)}  (${sign(bnifty.pct_change)}${bnifty.pct_change}%)\n`;
  if (vix?.value)    msg += `⚡ *India VIX:*   ${vix.value}\n`;
  if (usdinr?.value) msg += `💵 *USD/INR:*     ₹${usdinr.value}\n`;
  if (crude?.value)  msg += `🛢 *Crude Oil:*   $${crude.value}  (${sign(crude.pct_change)}${crude.pct_change}%)\n`;
  msg += "\n";

  // Portfolio P&L from Zerodha
  if (data.portfolio?.pnl) {
    msg += `💼 *Portfolio:* ${data.portfolio.pnl}\n\n`;
  }

  // Today's AI calls
  const preds = data.predictions ?? [];
  if (preds.length) {
    msg += `🎯 *Today's Calls:*\n`;
    preds.slice(0, 6).forEach(p => {
      const icon = p.direction === "BUY" ? "✅" : p.direction === "SELL" ? "🔴" : "⚠️";
      const conf = p.confidence ? ` (${Math.round(p.confidence * 100)}%)` : "";
      msg += `${icon} ${p.ticker} → *${p.direction}*${conf}\n`;
    });
    msg += "\n";
  }

  // Analysis snippet
  if (data.latest?.report) {
    const snippet = data.latest.report.replace(/\n{3,}/g, "\n\n").trim().slice(0, 600);
    msg += `📝 *Analysis:*\n${snippet}${data.latest.report.length > 600 ? "..." : ""}\n\n`;
  }

  msg += `_Pocket Brain + MarketCruise_\n_github.com/shabul/pocket-brain_`;
  return msg;
}

// ── Poll MarketCruise ────────────────────────────────────────────────────────

async function poll() {
  console.log(`[market] ${new Date().toISOString()} — polling ${MC_URL}`);
  try {
    const [histRes, premarketRes, predsRes, portfolioRes] = await Promise.all([
      request(`${MC_URL}/api/history`),
      request(`${MC_URL}/api/market/premarket`),
      request(`${MC_URL}/api/predictions/today`),
      request(`${MC_URL}/api/portfolio`).catch(() => ({ body: null })),
    ]);

    const runs = histRes.body ?? [];
    const latestRun = runs.find(r => r.status === "completed" && r.report_text) ?? null;

    const freshData = {
      online: true,
      latest: latestRun ? {
        run_id:     latestRun.run_id,
        run_type:   latestRun.run_type,
        started_at: latestRun.started_at,
        report:     latestRun.report_text,
      } : null,
      premarket:   premarketRes.body ?? [],
      predictions: predsRes.body ?? [],
      portfolio:   portfolioRes.body ?? null,
    };

    writeCache(freshData);
    console.log(`[market] Cached — run: ${latestRun?.run_type ?? "none"} | premarket: ${freshData.premarket.length} | preds: ${freshData.predictions.length}`);

    // WhatsApp alert — fire once per run_id
    await maybeAlert(freshData);

  } catch (err) {
    console.error(`[market] Poll failed: ${err.message}`);
    writeCache({ online: false });
  }
}

async function maybeAlert(data) {
  if (!data.latest) return;

  const runId   = data.latest.run_id ?? data.latest.started_at;
  const runType = data.latest.run_type;
  const cache   = loadCache();

  if (runId === cache.lastAlertedRunId) return; // already sent
  if (runType === "midday") return; // skip midday noise

  const alerts = WA.alerts ?? {};
  const shouldSend = (runType === "morning" && alerts.morning !== false)
                  || (runType === "evening" && alerts.evening !== false)
                  || (runType === "weekly"  && alerts.weekly  === true);

  if (!shouldSend) return;

  console.log(`[whatsapp] New ${runType} run detected — sending alert`);
  const message = formatAlert(runType, data);
  await sendWhatsApp(message);
  writeCache({ lastAlertedRunId: runId });
}

// ── HTTP API ─────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

  if (req.method === "GET" && req.url === "/api/latest") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(loadCache()));
  }

  // Forward run trigger to MarketCruise
  if (req.method === "POST" && req.url?.startsWith("/api/run/")) {
    const runType = req.url.split("/").pop();
    try {
      const result = await request(`${MC_URL}/run/${runType}`, { method: "POST", body: {} });
      res.writeHead(result.status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result.body));
    } catch (err) {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `MarketCruise unreachable: ${err.message}` }));
    }
    return;
  }

  // Manual WhatsApp test
  if (req.method === "POST" && req.url === "/api/test-alert") {
    const data = loadCache();
    if (!data.latest) { res.writeHead(400); return res.end(JSON.stringify({ error: "No cached run" })); }
    const msg = formatAlert(data.latest.run_type, data);
    await sendWhatsApp(msg);
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ ok: true, preview: msg.slice(0, 200) }));
  }

  res.writeHead(404); res.end("Not found");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[market] http://0.0.0.0:${PORT} | ${MC_URL} | every ${CONFIG.market_interval_minutes ?? 60}min`);
  console.log(`[market] WhatsApp: ${WA.phone ? `${WA.phone} via CallMeBot` : "not configured"}`);
});

poll();
setInterval(poll, POLL_MS);
