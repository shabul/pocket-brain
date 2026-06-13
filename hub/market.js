/**
 * Bridge between the phone dashboard and MarketCruise (running on Mac via Tailscale).
 * Polls /api/history + /api/market/premarket on a schedule, caches locally,
 * and serves the cached data to the Flask dashboard.
 */
import http from "http";
import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG = JSON.parse(fs.readFileSync(path.join(__dirname, "../config.json"), "utf8"));

const MC_URL = CONFIG.marketcruise_url ?? "http://100.94.202.43:8001";
const POLL_MS = (CONFIG.market_interval_minutes ?? 60) * 60 * 1000;
const PORT = CONFIG.ports?.market ?? 3001;
const CACHE_FILE = path.join(__dirname, "../logs/market_cache.json");

fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });

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

function loadCache() {
  try { return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8")); }
  catch { return { latest: null, premarket: [], lastUpdated: null, online: false }; }
}

function writeCache(patch) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify({ ...loadCache(), ...patch, lastUpdated: new Date().toISOString() }, null, 2));
}

async function poll() {
  console.log(`[market] Polling MarketCruise at ${MC_URL}`);
  try {
    const [histRes, premarketRes, predsRes] = await Promise.all([
      request(`${MC_URL}/api/history`),
      request(`${MC_URL}/api/market/premarket`),
      request(`${MC_URL}/api/predictions/today`),
    ]);

    const runs = histRes.body ?? [];
    const latestRun = runs.find(r => r.status === "completed" && r.report_text) ?? null;

    writeCache({
      online: true,
      latest: latestRun ? {
        run_type: latestRun.run_type,
        started_at: latestRun.started_at,
        report: latestRun.report_text,
      } : null,
      premarket: premarketRes.body ?? [],
      predictions: predsRes.body ?? [],
    });
    console.log(`[market] Cached — run: ${latestRun?.run_type ?? "none"}, premarket: ${(premarketRes.body ?? []).length} symbols`);
  } catch (err) {
    console.error(`[market] Poll failed: ${err.message} (MarketCruise offline?)`);
    writeCache({ online: false });
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

  if (req.method === "GET" && req.url === "/api/latest") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(loadCache()));
  }

  // Forward a run trigger to MarketCruise — POST /api/run/morning etc.
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

  res.writeHead(404); res.end("Not found");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[market] http://0.0.0.0:${PORT} | polling every ${CONFIG.market_interval_minutes ?? 60}min`);
  console.log(`[market] MarketCruise → ${MC_URL}`);
});

poll();
setInterval(poll, POLL_MS);
