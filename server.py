import http.server
import socketserver
import os
import sys
import json
import urllib.parse
import database

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

class AppRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_json(self, data, status=200):
        body = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path == "/api/user":
            uid = safe_int(query.get("user_id", [999999])[0], 999999)
            if uid <= 0:
                uid = 999999
            is_banned, ban_reason = database.is_user_banned(uid)
            if is_banned:
                return self.send_json({"ok": False, "banned": True, "error": f"Sizning hisobingiz bloklangan! Sabab: {ban_reason}"}, status=403)

            first_name = query.get("first_name", ["Pilot"])[0]
            username = query.get("username", [""])[0]
            ref_id_str = query.get("ref", ["0"])[0]
            ref_id = int(ref_id_str) if ref_id_str.isdigit() and int(ref_id_str) != 0 else None

            user = database.get_or_create_user(uid, first_name, username, ref_id)
            tasks = database.get_user_tasks(uid)
            return self.send_json({"ok": True, "user": user, "tasks": tasks})

        elif path == "/api/tasks":
            uid = safe_int(query.get("user_id", [999999])[0], 999999)
            if uid <= 0:
                uid = 999999
            is_banned, ban_reason = database.is_user_banned(uid)
            if is_banned:
                return self.send_json({"ok": False, "banned": True, "error": f"Sizning hisobingiz bloklangan! Sabab: {ban_reason}"}, status=403)

            tasks = database.get_user_tasks(uid)
            return self.send_json({"ok": True, "tasks": tasks})

        elif path == "/api/history":
            uid = safe_int(query.get("user_id", [999999])[0], 999999)
            if uid <= 0:
                uid = 999999
            is_banned, ban_reason = database.is_user_banned(uid)
            if is_banned:
                return self.send_json({"ok": False, "banned": True, "error": f"Sizning hisobingiz bloklangan! Sabab: {ban_reason}"}, status=403)

            rows = database.exec_query("SELECT * FROM game_history WHERE user_id = ? ORDER BY id DESC LIMIT 20", (uid,), fetch_all=True)
            return self.send_json({"ok": True, "history": rows})

        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get('Content-Length', 0))
        raw_body = self.rfile.read(length) if length > 0 else b'{}'
        
        try:
            data = json.loads(raw_body.decode('utf-8'))
        except Exception:
            data = {}

        if path == "/api/promo":
            uid = safe_int(data.get("user_id"), 999999)
            if uid <= 0:
                uid = 999999
            is_banned, ban_reason = database.is_user_banned(uid)
            if is_banned:
                return self.send_json({"ok": False, "banned": True, "error": f"Sizning hisobingiz bloklangan! Sabab: {ban_reason}"}, status=403)

            code = str(data.get("code", ""))
            ok, msg_or_amt = database.use_promocode(uid, code)
            if ok:
                user = database.get_or_create_user(uid)
                return self.send_json({"ok": True, "amount": msg_or_amt, "balance": user["balance"]})
            else:
                return self.send_json({"ok": False, "error": msg_or_amt}, status=400)

        elif path == "/api/claim-task":
            uid = safe_int(data.get("user_id"), 999999)
            if uid <= 0:
                uid = 999999
            is_banned, ban_reason = database.is_user_banned(uid)
            if is_banned:
                return self.send_json({"ok": False, "banned": True, "error": f"Sizning hisobingiz bloklangan! Sabab: {ban_reason}"}, status=403)

            task_key = str(data.get("task_key", ""))
            ok, res = database.claim_task(uid, task_key)
            if ok:
                user = database.get_or_create_user(uid)
                tasks = database.get_user_tasks(uid)
                return self.send_json({"ok": True, "reward": res, "balance": user["balance"], "tasks": tasks})
            else:
                return self.send_json({"ok": False, "error": res}, status=400)

        elif path == "/api/game-result":
            uid = safe_int(data.get("user_id"), 999999)
            if uid <= 0:
                uid = 999999
            is_banned, ban_reason = database.is_user_banned(uid)
            if is_banned:
                return self.send_json({"ok": False, "banned": True, "error": f"Sizning hisobingiz bloklangan! Sabab: {ban_reason}"}, status=403)

            game_name = str(data.get("game_name", "kamikaze"))
            bet = safe_int(data.get("bet"), 0)
            win = safe_int(data.get("win"), 0)
            diff = win - bet
            mult = safe_float(data.get("multiplier"), 0.0)

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
            uid = safe_int(data.get("user_id"), 999999)
            if uid <= 0:
                uid = 999999
            is_banned, ban_reason = database.is_user_banned(uid)
            if is_banned:
                return self.send_json({"ok": False, "banned": True, "error": f"Sizning hisobingiz bloklangan! Sabab: {ban_reason}"}, status=403)

            amt = safe_int(data.get("amount"), 10000)
            new_bal = database.update_user_balance(uid, amt)
            return self.send_json({"ok": True, "balance": new_bal})

        self.send_json({"error": "Not Found"}, status=404)

class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True

def run_server(port=None):
    if port is None:
        port = int(os.getenv("PORT", "8080"))
    database.init_db()
    if os.path.exists(DIRECTORY):
        os.chdir(DIRECTORY)
    server_address = ("0.0.0.0", port)
    with ThreadedTCPServer(server_address, AppRequestHandler) as httpd:
        print("=" * 60)
        print(f"🚀 NVINDIA GAMES Mega Server & REST API ishga tushdi!")
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
