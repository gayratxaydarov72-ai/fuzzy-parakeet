import http.server
import socketserver
import socket
import os
import sys
import json
import time
import threading
from collections import defaultdict
import urllib.parse
from datetime import datetime, timedelta, time as dt_time
import database

def get_seconds_until_midnight():
    now = datetime.now()
    tomorrow = now.date() + timedelta(days=1)
    midnight = datetime.combine(tomorrow, dt_time.min)
    return max(0, int((midnight - now).total_seconds()))

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

PORT = int(os.getenv("PORT", "8080"))
DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)), "webapp")

def safe_int(val, default=0):
    if val is None:
        return default
    try:
        return int(val)
    except (ValueError, TypeError):
        return default

def safe_float(val, default=0.0):
    if val is None:
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default

# ============================================================================
# 🛡️ ANTI-DDOS, BRUTE-FORCE & FLOOD PROTECTION SYSTEM
# ============================================================================
class SecurityLimiter:
    def __init__(self):
        self.lock = threading.Lock()
        self.ip_hits = defaultdict(list)
        self.user_hits = defaultdict(list)
        self.user_topups = {}
        self.blocked_ips = {}

    def is_ip_allowed(self, ip: str, max_requests: int = 150, window_secs: int = 10) -> bool:
        now = time.time()
        with self.lock:
            if ip in self.blocked_ips:
                if now < self.blocked_ips[ip]:
                    return False
                del self.blocked_ips[ip]

            hits = self.ip_hits[ip]
            self.ip_hits[ip] = [t for t in hits if now - t < window_secs]
            if len(self.ip_hits[ip]) >= max_requests:
                self.blocked_ips[ip] = now + 60
                return False

            self.ip_hits[ip].append(now)
            return True

    def is_user_allowed(self, user_id: int, max_actions: int = 10, window_secs: int = 2) -> bool:
        if user_id <= 0:
            return True
        now = time.time()
        with self.lock:
            hits = self.user_hits[user_id]
            self.user_hits[user_id] = [t for t in hits if now - t < window_secs]
            if len(self.user_hits[user_id]) >= max_actions:
                return False
            self.user_hits[user_id].append(now)
            return True

    def is_user_topup_allowed(self, user_id: int, cooldown_secs: int = 10) -> bool:
        if user_id <= 0:
            return True
        now = time.time()
        with self.lock:
            last = self.user_topups.get(user_id, 0)
            if now - last < cooldown_secs:
                return False
            self.user_topups[user_id] = now
            return True

security_limiter = SecurityLimiter()

# ============================================================================
# ⚡ IN-MEMORY ULTRA-FAST STATIC ASSET CACHE (0.05ms serving directly from RAM)
# ============================================================================
STATIC_CACHE = {}
MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".ico": "image/x-icon"
}

def preload_static_assets():
    if not os.path.exists(DIRECTORY):
        return
    for root, _, files in os.walk(DIRECTORY):
        for fname in files:
            fpath = os.path.join(root, fname)
            rel = "/" + os.path.relpath(fpath, DIRECTORY).replace("\\", "/")
            ext = os.path.splitext(fname)[1].lower()
            mime = MIME_TYPES.get(ext, "application/octet-stream")
            try:
                with open(fpath, "rb") as f:
                    content = f.read()
                STATIC_CACHE[rel] = (content, mime)
                if rel == "/index.html":
                    STATIC_CACHE["/"] = (content, mime)
            except Exception:
                pass

preload_static_assets()

class AppRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        # Reduce log clutter and CPU usage for normal 200/204/304 asset requests
        if args and len(args) > 1 and str(args[1]) in ("200", "204", "304"):
            return
        super().log_message(format, *args)

    def get_client_ip(self):
        forwarded = self.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return self.client_address[0] if self.client_address else "127.0.0.1"

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-XSS-Protection', '1; mode=block')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_json(self, data, status=200):
        def json_serial(obj):
            if hasattr(obj, 'isoformat'):
                return obj.isoformat()
            return str(obj)

        body = json.dumps(data, default=json_serial).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.end_headers()
        self.wfile.write(body)

    def serve_cached(self, path):
        cached = STATIC_CACHE.get(path)
        if not cached:
            return False
        content, mime = cached
        self.send_response(200)
        self.send_header('Content-Type', mime)
        self.send_header('Content-Length', str(len(content)))
        if path in ("/", "/index.html"):
            self.send_header('Cache-Control', 'no-cache, must-revalidate')
        else:
            self.send_header('Cache-Control', 'public, max-age=300')
        self.end_headers()
        self.wfile.write(content)
        return True

    def do_GET(self):
        client_ip = self.get_client_ip()
        if not security_limiter.is_ip_allowed(client_ip):
            return self.send_json({"ok": False, "error": "Juda ko'p so'rovlar! Iltimos, 1 daqiqa kuting."}, status=429)

        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path == "/favicon.ico":
            self.send_response(204)
            self.end_headers()
            return

        if path == "/api/user":
            uid = safe_int(query.get("user_id", [999999])[0], 999999)
            if uid <= 0:
                uid = 999999
            is_banned, ban_reason = database.is_user_banned(uid)
            if is_banned:
                return self.send_json({"ok": False, "banned": True, "error": f"Sizning hisobingiz bloklangan! Sabab: {ban_reason}"}, status=403)

            first_name = query.get("first_name", ["Pilot"])[0][:64]
            username = query.get("username", [""])[0][:64]
            ref_id_str = query.get("ref", ["0"])[0]
            ref_id = int(ref_id_str) if ref_id_str.isdigit() and int(ref_id_str) != 0 else None

            user = database.get_or_create_user(uid, first_name, username, ref_id)
            tasks = database.get_user_tasks(uid)
            evil_mode = database.get_evil_mode()
            aviator_rng_enabled = database.get_aviator_rng_enabled()
            aviator_target = database.get_aviator_target()
            return self.send_json({
                "ok": True,
                "user": user,
                "tasks": tasks,
                "seconds_left": get_seconds_until_midnight(),
                "evil_mode": evil_mode,
                "aviator_rng_enabled": aviator_rng_enabled,
                "aviator_target": aviator_target
            })

        elif path == "/api/game-settings":
            return self.send_json({
                "ok": True,
                "evil_mode": database.get_evil_mode(),
                "aviator_rng_enabled": database.get_aviator_rng_enabled(),
                "aviator_target": database.get_aviator_target()
            })

        elif path == "/api/tasks":
            uid = safe_int(query.get("user_id", [999999])[0], 999999)
            if uid <= 0:
                uid = 999999
            is_banned, ban_reason = database.is_user_banned(uid)
            if is_banned:
                return self.send_json({"ok": False, "banned": True, "error": f"Sizning hisobingiz bloklangan! Sabab: {ban_reason}"}, status=403)

            tasks = database.get_user_tasks(uid)
            return self.send_json({"ok": True, "tasks": tasks, "seconds_left": get_seconds_until_midnight()})

        elif path == "/api/history":
            uid = safe_int(query.get("user_id", [999999])[0], 999999)
            if uid <= 0:
                uid = 999999
            is_banned, ban_reason = database.is_user_banned(uid)
            if is_banned:
                return self.send_json({"ok": False, "banned": True, "error": f"Sizning hisobingiz bloklangan! Sabab: {ban_reason}"}, status=403)

            rows = database.exec_query("SELECT * FROM game_history WHERE user_id = ? ORDER BY id DESC LIMIT 20", (uid,), fetch_all=True)
            return self.send_json({"ok": True, "history": rows})

        # Instant serving from RAM memory (0.05ms)
        if self.serve_cached(path):
            return

        super().do_GET()

    def do_POST(self):
        client_ip = self.get_client_ip()
        if not security_limiter.is_ip_allowed(client_ip):
            return self.send_json({"ok": False, "error": "Juda ko'p so'rovlar! Iltimos, 1 daqiqa kuting."}, status=429)

        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get('Content-Length', 0))

        # Anti-DoS: reject oversized request bodies
        if length > 65536:
            return self.send_json({"ok": False, "error": "Payload Too Large"}, status=413)

        raw_body = self.rfile.read(length) if length > 0 else b'{}'
        try:
            data = json.loads(raw_body.decode('utf-8'))
        except Exception:
            data = {}

        uid = safe_int(data.get("user_id"), 999999)
        if uid <= 0:
            uid = 999999

        # User-level action throttling
        if not security_limiter.is_user_allowed(uid):
            return self.send_json({"ok": False, "error": "Harakatlar juda tez! Iltimos, biroz kuting."}, status=429)

        is_banned, ban_reason = database.is_user_banned(uid)
        if is_banned:
            return self.send_json({"ok": False, "banned": True, "error": f"Sizning hisobingiz bloklangan! Sabab: {ban_reason}"}, status=403)

        if path == "/api/promo":
            code = str(data.get("code", ""))[:32].strip().upper()
            ok, msg_or_amt = database.use_promocode(uid, code)
            if ok:
                user = database.get_or_create_user(uid)
                return self.send_json({"ok": True, "amount": msg_or_amt, "balance": user["balance"]})
            else:
                return self.send_json({"ok": False, "error": msg_or_amt}, status=400)

        elif path == "/api/claim-task":
            task_key = str(data.get("task_key", ""))[:64].strip()
            ok, res = database.claim_task(uid, task_key)
            if ok:
                user = database.get_or_create_user(uid)
                tasks = database.get_user_tasks(uid)
                return self.send_json({"ok": True, "reward": res, "balance": user["balance"], "tasks": tasks, "seconds_left": get_seconds_until_midnight()})
            else:
                return self.send_json({"ok": False, "error": res}, status=400)

        elif path == "/api/claim-all-tasks":
            ok, total_reward = database.claim_all_tasks(uid)
            user = database.get_or_create_user(uid)
            tasks = database.get_user_tasks(uid)
            return self.send_json({"ok": True, "reward": total_reward, "balance": user["balance"], "tasks": tasks, "seconds_left": get_seconds_until_midnight()})

        elif path == "/api/game-result":
            game_name = str(data.get("game_name", "kamikaze"))[:32]
            bet = max(0, min(10_000_000, safe_int(data.get("bet"), 0)))
            mult = max(0.0, min(10_000.0, safe_float(data.get("multiplier"), 0.0)))
            raw_win = safe_int(data.get("win"), 0)

            # Anti-Cheat: calculate expected max payout
            if bet > 0:
                max_allowed_win = int(bet * mult + 10)
                win = max(0, min(max_allowed_win, raw_win))
            else:
                win = 0

            diff = win - bet
            new_bal = database.update_user_balance(uid, diff)
            phash = database.record_game(uid, game_name, bet, win, mult)
            tasks = database.get_user_tasks(uid)

            return self.send_json({
                "ok": True,
                "balance": new_bal,
                "provably_hash": phash,
                "tasks": tasks
            })

        elif path == "/api/topup":
            if not security_limiter.is_user_topup_allowed(uid, cooldown_secs=10):
                return self.send_json({"ok": False, "error": "Hisobni to'ldirish uchun 10 soniya kuting!"}, status=429)
            amt = max(1000, min(10000, safe_int(data.get("amount"), 10000)))
            new_bal = database.update_user_balance(uid, amt)
            return self.send_json({"ok": True, "balance": new_bal})

        self.send_json({"error": "Not Found"}, status=404)

class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True

    def server_bind(self):
        super().server_bind()
        try:
            self.socket.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
        except Exception:
            pass

def run_server(port=None):
    if port is None:
        port = int(os.getenv("PORT", "8080"))
    database.init_db()
    preload_static_assets()
    if os.path.exists(DIRECTORY):
        os.chdir(DIRECTORY)
    server_address = ("0.0.0.0", port)
    with ThreadedTCPServer(server_address, AppRequestHandler) as httpd:
        print("=" * 60)
        print(f"🚀 NVINDIA GAMES Mega Server & REST API ishga tushdi!")
        print(f"🛡️ Anti-DDoS, Rate Limiter & Static Memory Preloader faol!")
        print(f"👉 Port: {port} (0.0.0.0)")
        print(f"👉 WebApp: http://localhost:{port}")
        print("=" * 60)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass

def run():
    run_server()

if __name__ == "__main__":
    run()
