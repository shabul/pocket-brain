#!/data/data/com.termux/files/usr/bin/bash
set -e

BASE=~/server
PHONE_IP="192.168.0.7"
NGINX_PORT="8088"

mkdir -p "$BASE/logs"

termux-wake-lock 2>/dev/null || true

echo "[1/5] Stopping any existing services..."
fuser -k 5000/tcp 2>/dev/null || true
fuser -k 8088/tcp 2>/dev/null || true
fuser -k 3000/tcp 2>/dev/null || true
fuser -k 3001/tcp 2>/dev/null || true
kill "$(pgrep -f 'localhost.run')" 2>/dev/null || true
sleep 1

echo "[2/5] Starting Flask hub dashboard (port 5000)..."
nohup python3 "$BASE/flask/app.py" > "$BASE/logs/flask.log" 2>&1 &
sleep 2

echo "[3/5] Starting Nginx (port $NGINX_PORT)..."
nginx -c "$BASE/nginx/nginx.conf" -p "$BASE/nginx"

echo "[4/5] Starting LLM server (port 3000)..."
cd "$BASE/llm"
nohup node server.js > "$BASE/logs/llm.log" 2>&1 &
echo "  Waiting for model to load (~30s)..."
until grep -q "Server:\|Error" "$BASE/logs/llm.log" 2>/dev/null; do sleep 2; done
tail -2 "$BASE/logs/llm.log"

echo "[5/5] Starting market watcher (port 3001)..."
cd "$BASE/hub"
nohup node market.js > "$BASE/logs/market.log" 2>&1 &
sleep 2
echo "  Market watcher: $(tail -1 "$BASE/logs/market.log")"

echo ""
echo "[Tunnel] Starting public tunnel..."
nohup ssh -o StrictHostKeyChecking=no \
          -o ServerAliveInterval=30 \
          -o ServerAliveCountMax=3 \
          -i ~/.ssh/id_ed25519 \
          -R 80:localhost:$NGINX_PORT \
          localhost.run > "$BASE/logs/tunnel.log" 2>&1 &
sleep 8

TUNNEL=$(grep -o 'https://[^ ]*\.lhr\.life' "$BASE/logs/tunnel.log" 2>/dev/null || true)

echo ""
echo "=== All services running ==="
echo "Hub:    http://$PHONE_IP:$NGINX_PORT           (dashboard)"
echo "LLM:    http://$PHONE_IP:$NGINX_PORT/llm/      (Gemma chat)"
echo "Market: http://$PHONE_IP:$NGINX_PORT/market/api/latest"
echo "Public: ${TUNNEL:-not ready yet — check $BASE/logs/tunnel.log}"
