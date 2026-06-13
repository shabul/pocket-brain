from flask import Flask

app = Flask(__name__)

@app.route("/")
def home():
    return """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pocket Hub</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:system-ui,sans-serif;background:#0a0a14;color:#e2e8f0;min-height:100vh}
    header{padding:14px 24px;background:#111827;border-bottom:1px solid #1f2937;display:flex;justify-content:space-between;align-items:center}
    header h1{font-size:16px;font-weight:700;color:#a78bfa;letter-spacing:.5px}
    .dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#4ade80;margin-right:6px;animation:pulse 2s infinite}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
    .time{font-size:12px;color:#6b7280}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:20px;max-width:1200px;margin:0 auto}
    @media(max-width:700px){.grid{grid-template-columns:1fr}}
    .card{background:#111827;border:1px solid #1f2937;border-radius:16px;overflow:hidden}
    .card.wide{grid-column:1/-1}
    .card-header{padding:14px 18px;border-bottom:1px solid #1f2937;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}
    .card-header h2{font-size:13px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.8px}
    .card-body{padding:16px 18px}
    .badge{font-size:11px;padding:2px 10px;border-radius:20px;font-weight:500;white-space:nowrap}
    .online{background:rgba(74,222,128,.1);color:#4ade80}
    .offline{background:rgba(248,113,113,.1);color:#f87171}
    .checking{background:rgba(251,191,36,.1);color:#fbbf24}

    /* Premarket */
    .ticker-strip{display:flex;flex-wrap:wrap;gap:8px}
    .ticker{display:flex;flex-direction:column;align-items:center;padding:8px 12px;background:#0d1117;border-radius:10px;min-width:88px;gap:2px}
    .ticker-label{font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px}
    .ticker-val{font-size:15px;font-weight:700;color:#e2e8f0}
    .ticker-pct{font-size:11px;font-weight:500;padding:1px 7px;border-radius:20px}
    .up{color:#4ade80;background:rgba(74,222,128,.12)}
    .down{color:#f87171;background:rgba(248,113,113,.12)}
    .flat{color:#9ca3af;background:rgba(156,163,175,.1)}

    /* Report */
    .report{font-size:14px;line-height:1.75;color:#d1d5db;white-space:pre-wrap;word-break:break-word}
    .report.empty{color:#4b5563;font-style:italic}
    .run-meta{font-size:11px;color:#4b5563;margin-top:10px}

    /* Predictions */
    .pred-grid{display:flex;flex-direction:column;gap:6px}
    .pred{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#0d1117;border-radius:8px;font-size:13px;gap:8px}
    .pred-ticker{font-weight:600;color:#e2e8f0;min-width:70px}
    .pred-dir{padding:2px 10px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase}
    .BUY{background:rgba(74,222,128,.15);color:#4ade80}
    .SELL{background:rgba(248,113,113,.15);color:#f87171}
    .HOLD{background:rgba(251,191,36,.12);color:#fbbf24}
    .pred-conf{font-size:11px;color:#6b7280;white-space:nowrap}
    .pred-reason{font-size:12px;color:#6b7280;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:220px}

    /* Portfolio */
    .pnl-banner{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:14px}
    .pnl-stat{background:#0d1117;border-radius:10px;padding:12px 16px;flex:1;min-width:140px}
    .pnl-label{font-size:11px;color:#6b7280;margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px}
    .pnl-value{font-size:18px;font-weight:700}
    .pnl-pos{color:#4ade80}
    .pnl-neg{color:#f87171}
    .pnl-neutral{color:#e2e8f0}
    .holdings-table{width:100%;border-collapse:collapse;font-size:13px}
    .holdings-table th{text-align:left;padding:6px 8px;color:#6b7280;font-weight:500;border-bottom:1px solid #1f2937;font-size:11px;text-transform:uppercase}
    .holdings-table td{padding:8px 8px;border-bottom:1px solid #1f293733;color:#d1d5db}
    .holdings-table tr:last-child td{border-bottom:none}
    .kite-link{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;background:rgba(99,179,237,.1);color:#63b3ed;border:1px solid rgba(99,179,237,.3);border-radius:8px;font-size:11px;text-decoration:none;transition:all .2s}
    .kite-link:hover{background:rgba(99,179,237,.2)}

    /* Buttons */
    .btn{padding:5px 13px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:500;border:none;transition:all .15s}
    .btn-primary{background:#7c3aed;color:#fff}
    .btn-primary:hover{background:#6d28d9}
    .btn-primary:disabled{opacity:.4;cursor:default}
    .btn-ghost{background:transparent;color:#6b7280;border:1px solid #374151}
    .btn-ghost:hover{color:#a78bfa;border-color:#7c3aed}
    .btn-wa{background:rgba(37,211,102,.15);color:#25d366;border:1px solid rgba(37,211,102,.3)}
    .btn-wa:hover{background:rgba(37,211,102,.25)}
    .btn-wa:disabled{opacity:.4;cursor:default}

    /* LLM */
    .llm-link{display:block;padding:18px;background:#0d1117;border-radius:10px;text-decoration:none;color:#a78bfa;font-size:15px;font-weight:600;text-align:center;border:1px solid #1f2937;transition:all .2s;margin-bottom:10px}
    .llm-link:hover{background:#140d2b;border-color:#7c3aed}
    .llm-sub{font-size:12px;color:#6b7280;text-align:center;line-height:1.6;margin-top:8px}

    /* Services */
    .svc{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #1f293733;font-size:13px}
    .svc:last-child{border:none}
    .svc-name{color:#9ca3af}
  </style>
</head>
<body>
  <header>
    <h1><span class="dot"></span>Pocket Hub</h1>
    <span class="time" id="clock"></span>
  </header>

  <div class="grid">

    <!-- Premarket -->
    <div class="card wide">
      <div class="card-header">
        <h2>Premarket</h2>
        <span class="badge checking" id="mc-badge">connecting</span>
      </div>
      <div class="card-body">
        <div class="ticker-strip" id="premarket-strip">
          <span style="color:#4b5563;font-size:13px;font-style:italic">Loading...</span>
        </div>
      </div>
    </div>

    <!-- Portfolio (Zerodha) -->
    <div class="card wide">
      <div class="card-header">
        <h2>Portfolio — Zerodha</h2>
        <a class="kite-link" href="http://100.94.202.43:8001/kite/login" target="_blank">Connect Kite</a>
      </div>
      <div class="card-body">
        <div class="pnl-banner" id="pnl-banner">
          <div class="pnl-stat"><div class="pnl-label">Portfolio Value</div><div class="pnl-value pnl-neutral" id="pnl-value">—</div></div>
          <div class="pnl-stat"><div class="pnl-label">Unrealized P&L</div><div class="pnl-value pnl-neutral" id="pnl-pnl">—</div></div>
          <div class="pnl-stat"><div class="pnl-label">Holdings</div><div class="pnl-value pnl-neutral" id="pnl-count">—</div></div>
        </div>
        <table class="holdings-table">
          <thead><tr><th>Stock</th><th>Qty</th><th>Avg Price</th><th>LTP</th><th>P&L</th></tr></thead>
          <tbody id="holdings-body"><tr><td colspan="5" style="color:#4b5563;font-style:italic;padding:12px 8px">Loading portfolio from Zerodha...</td></tr></tbody>
        </table>
      </div>
    </div>

    <!-- Market Analysis -->
    <div class="card wide">
      <div class="card-header">
        <h2>Market Analysis</h2>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-wa" id="wa-btn" onclick="testAlert()">Test WhatsApp</button>
          <button class="btn btn-ghost" id="run-btn" onclick="triggerRun('morning')">Run morning</button>
        </div>
      </div>
      <div class="card-body">
        <div class="report empty" id="report-text">Loading analysis from MarketCruise...</div>
        <div class="run-meta" id="run-meta"></div>
      </div>
    </div>

    <!-- Today's Calls -->
    <div class="card">
      <div class="card-header"><h2>Today's Calls</h2></div>
      <div class="card-body">
        <div class="pred-grid" id="pred-grid">
          <span style="color:#4b5563;font-size:13px;font-style:italic">No predictions yet today.</span>
        </div>
      </div>
    </div>

    <!-- LLM + Services -->
    <div class="card">
      <div class="card-header"><h2>Device</h2></div>
      <div class="card-body">
        <a class="llm-link" href="/llm/">Chat with Gemma 2B</a>
        <p class="llm-sub">On-device LLM — ~4-6 tok/s<br>No cloud, no API key, no cost</p>
        <div style="margin-top:16px">
          <div class="svc"><span class="svc-name">Gemma LLM</span><span class="badge checking" id="svc-llm">checking</span></div>
          <div class="svc"><span class="svc-name">MarketCruise (Mac)</span><span class="badge checking" id="svc-mc">checking</span></div>
          <div class="svc"><span class="svc-name">Zerodha Kite</span><span class="badge checking" id="svc-kite">checking</span></div>
          <div class="svc"><span class="svc-name">WhatsApp Alerts</span><span class="badge checking" id="svc-wa">checking</span></div>
          <div class="svc"><span class="svc-name">Flask (this page)</span><span class="badge online">online</span></div>
        </div>
      </div>
    </div>

  </div>

  <script>
    const tick = () => {
      document.getElementById('clock').textContent =
        new Date().toLocaleTimeString('en-IN', { timeZone:'Asia/Kolkata', hour:'2-digit', minute:'2-digit', second:'2-digit' }) + ' IST';
    };
    tick(); setInterval(tick, 1000);

    function setBadge(id, status, label) {
      const el = document.getElementById(id);
      if (!el) return;
      el.className = 'badge ' + status;
      el.textContent = label ?? status;
    }

    function fmtInr(n) {
      if (n == null) return '—';
      return '₹' + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // ── Premarket ──────────────────────────────────────────────────────────
    function renderPremarket(items) {
      if (!items?.length) return;
      document.getElementById('premarket-strip').innerHTML = items.map(s => {
        if (s.value == null)
          return `<div class="ticker"><span class="ticker-label">${s.label}</span><span class="ticker-val" style="color:#4b5563">—</span></div>`;
        const cls = s.pct_change > 0.3 ? 'up' : s.pct_change < -0.3 ? 'down' : 'flat';
        const sign = s.pct_change >= 0 ? '+' : '';
        return `<div class="ticker">
          <span class="ticker-label">${s.label}</span>
          <span class="ticker-val">${s.value.toLocaleString('en-IN')}</span>
          <span class="ticker-pct ${cls}">${sign}${s.pct_change?.toFixed(2)}%</span>
        </div>`;
      }).join('');
    }

    // ── Portfolio ──────────────────────────────────────────────────────────
    function renderPortfolio(portfolio) {
      if (!portfolio) {
        document.getElementById('holdings-body').innerHTML =
          '<tr><td colspan="5" style="color:#4b5563;font-style:italic;padding:12px 8px">Zerodha not connected — <a href="http://100.94.202.43:8001/kite/login" target="_blank" style="color:#63b3ed">Login to Kite</a></td></tr>';
        setBadge('svc-kite', 'offline', 'disconnected');
        return;
      }

      // Parse P&L string: "Portfolio Value: ₹X | Cost: ₹Y | Unrealized P&L: ₹+Z (W%)"
      const pnlStr = portfolio.pnl ?? '';
      const valMatch  = pnlStr.match(/Value:\s*₹([\d,]+\.?\d*)/);
      const pnlMatch  = pnlStr.match(/P&L:\s*₹([+-]?[\d,]+\.?\d*)\s*\(([+-]?[\d.]+)%\)/);

      if (valMatch) {
        document.getElementById('pnl-value').textContent = '₹' + valMatch[1];
      }
      if (pnlMatch) {
        const pnlVal = parseFloat(pnlMatch[1].replace(/,/g, ''));
        const pnlEl = document.getElementById('pnl-pnl');
        pnlEl.textContent = (pnlVal >= 0 ? '+' : '') + '₹' + Math.abs(pnlVal).toLocaleString('en-IN') + ' (' + pnlMatch[2] + '%)';
        pnlEl.className = 'pnl-value ' + (pnlVal >= 0 ? 'pnl-pos' : 'pnl-neg');
      }

      const holdings = portfolio.holdings ?? [];
      document.getElementById('pnl-count').textContent = holdings.length + ' stocks';

      if (!holdings.length) {
        document.getElementById('holdings-body').innerHTML =
          '<tr><td colspan="5" style="color:#4b5563;font-style:italic;padding:12px 8px">No holdings found</td></tr>';
        setBadge('svc-kite', 'online', 'connected');
        return;
      }

      document.getElementById('holdings-body').innerHTML = holdings.map(h => {
        const pnl = h.last_price && h.avg_price
          ? (h.last_price - h.avg_price) * h.quantity : null;
        const pnlCls = pnl == null ? '' : pnl >= 0 ? 'style="color:#4ade80"' : 'style="color:#f87171"';
        const pnlTxt = pnl == null ? '—' : (pnl >= 0 ? '+' : '') + fmtInr(pnl);
        return `<tr>
          <td style="font-weight:600;color:#e2e8f0">${h.ticker}</td>
          <td>${h.quantity}</td>
          <td>${h.avg_price ? fmtInr(h.avg_price) : '—'}</td>
          <td>${h.last_price ? fmtInr(h.last_price) : '—'}</td>
          <td ${pnlCls}>${pnlTxt}</td>
        </tr>`;
      }).join('');
      setBadge('svc-kite', 'online', 'connected');
    }

    // ── Predictions ────────────────────────────────────────────────────────
    function renderPredictions(preds) {
      const grid = document.getElementById('pred-grid');
      if (!preds?.length) {
        grid.innerHTML = '<span style="color:#4b5563;font-size:13px;font-style:italic">No predictions yet today.</span>';
        return;
      }
      grid.innerHTML = preds.map(p => {
        const dir = (p.direction ?? 'HOLD').toUpperCase();
        const conf = p.confidence ? Math.round(p.confidence * 100) + '%' : '';
        return `<div class="pred">
          <span class="pred-ticker">${p.ticker}</span>
          <span class="pred-dir ${dir}">${dir}</span>
          <span class="pred-conf">${conf}</span>
          <span class="pred-reason">${(p.reasoning ?? '').slice(0, 70)}</span>
        </div>`;
      }).join('');
    }

    // ── Load all data ──────────────────────────────────────────────────────
    async function loadMarket() {
      try {
        const res = await fetch('/market/api/latest');
        if (!res.ok) throw new Error();
        const data = await res.json();

        setBadge('mc-badge',  data.online ? 'online'  : 'offline', data.online ? 'live' : 'cached');
        setBadge('svc-mc',    data.online ? 'online'  : 'offline');
        setBadge('svc-wa',    'online', 'configured');

        renderPremarket(data.premarket);
        renderPredictions(data.predictions);
        renderPortfolio(data.portfolio);

        const report = document.getElementById('report-text');
        if (data.latest?.report) {
          report.className = 'report';
          report.textContent = data.latest.report;
          const ts = data.latest.started_at
            ? new Date(data.latest.started_at).toLocaleString('en-IN', { timeZone:'Asia/Kolkata' }) + ' IST'
            : '';
          document.getElementById('run-meta').textContent =
            `${data.latest.run_type ?? ''} run · ${ts}` +
            (data.lastUpdated ? ` · fetched ${new Date(data.lastUpdated).toLocaleTimeString('en-IN', { timeZone:'Asia/Kolkata' })}` : '');
        } else {
          report.className = 'report empty';
          report.textContent = data.online
            ? 'MarketCruise online — click "Run morning" to start an analysis.'
            : 'MarketCruise offline (Mac not reachable). Showing cached data.';
        }
      } catch {
        setBadge('mc-badge', 'offline');
        setBadge('svc-mc', 'offline');
        document.getElementById('report-text').textContent = 'Market bridge unreachable.';
        document.getElementById('report-text').className = 'report empty';
      }
    }

    async function triggerRun(type) {
      const btn = document.getElementById('run-btn');
      btn.disabled = true; btn.textContent = 'Triggering...';
      try {
        const res = await fetch(`/market/api/run/${type}`, { method: 'POST' });
        const d = await res.json();
        btn.textContent = d.run_id ? `Running (${d.run_id})` : 'Error';
      } catch { btn.textContent = 'Failed'; }
      setTimeout(() => { btn.disabled = false; btn.textContent = 'Run morning'; }, 6000);
    }

    async function testAlert() {
      const btn = document.getElementById('wa-btn');
      btn.disabled = true; btn.textContent = 'Sending...';
      try {
        await fetch('/market/api/test-alert', { method: 'POST' });
        btn.textContent = 'Sent!';
      } catch { btn.textContent = 'Failed'; }
      setTimeout(() => { btn.disabled = false; btn.textContent = 'Test WhatsApp'; }, 4000);
    }

    async function checkLLM() {
      try {
        const r = await fetch('/llm/', { signal: AbortSignal.timeout(5000) });
        setBadge('svc-llm', r.ok ? 'online' : 'offline');
      } catch { setBadge('svc-llm', 'offline'); }
    }

    loadMarket();
    checkLLM();
    setInterval(loadMarket, 60000);
    setInterval(checkLLM, 30000);
  </script>
</body>
</html>"""

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
