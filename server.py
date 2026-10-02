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
import random
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

    def is_ip_allowed(self, ip: str, max_requests: int = 300, window_secs: int = 10) -> bool:
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

    def is_user_allowed(self, user_id: int, max_actions: int = 25, window_secs: int = 2) -> bool:
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
# 🪙 REAL-TIME SYNCHRONIZED MULTIPLAYER COIN FLIP LIVE ROOM
# ============================================================================
class CoinFlipLiveRoom:
    def __init__(self):
        self.lock = threading.Lock()
        self.round_id = 1001
        self.phase = "betting"  # "betting" (10s) -> "flipping" (3s) -> "result" (4s)
        self.total_phase_duration = 10.0
        self.phase_end_time = time.time() + 10.0
        self.result = None  # "heads" or "tails"
        self.history = ["heads", "tails", "heads", "heads", "tails"]
        self.bets = {}  # uid -> dict
        self.simulated_users = [
            {"user_id": 8801, "name": "Jasur Crypto", "username": "jasur_crypto"},
            {"user_id": 8802, "name": "Azamat UZ", "username": "azamat_uz"},
            {"user_id": 8803, "name": "Farrux Bek", "username": "farrux_77"},
            {"user_id": 8804, "name": "Bekzod", "username": "bekzod_01"},
            {"user_id": 8805, "name": "Malika", "username": "malika_star"},
            {"user_id": 8806, "name": "Islom Trader", "username": "islom_trader"},
            {"user_id": 8807, "name": "Otabek", "username": "otabek_uzb"},
            {"user_id": 8808, "name": "Sardor WIN", "username": "sardor_winner"}
        ]
        self.populate_simulated_bets()
        self.running = True
        self.thread = threading.Thread(target=self._loop, daemon=True)
        self.thread.start()

    def populate_simulated_bets(self):
        count = random.randint(3, 5)
        picked = random.sample(self.simulated_users, count)
        amounts = [2000, 5000, 10000, 25000, 50000]
        for u in picked:
            choice = "heads" if random.random() < 0.5 else "tails"
            amt = random.choice(amounts)
            self.bets[u["user_id"]] = {
                "user_id": u["user_id"],
                "name": u["name"],
                "username": u["username"],
                "choice": choice,
                "bet": amt,
                "win": 0,
                "status": "pending",
                "is_real": False
            }

    def _loop(self):
        while self.running:
            time.sleep(0.25)
            now = time.time()
            with self.lock:
                if self.phase == "betting":
                    if now >= self.phase_end_time:
                        self.phase = "flipping"
                        self.total_phase_duration = 3.2
                        self.phase_end_time = now + 3.2
                        
                        evil = database.get_evil_mode()
                        real_user_bets = [b for b in self.bets.values() if b.get("is_real")]
                        if real_user_bets:
                            h_bets = sum(b["bet"] for b in real_user_bets if b["choice"] == "heads")
                            t_bets = sum(b["bet"] for b in real_user_bets if b["choice"] == "tails")
                            bias_prob = 0.85 if evil else 0.58
                            if random.random() < bias_prob and h_bets != t_bets:
                                self.result = "tails" if h_bets > t_bets else "heads"
                            else:
                                self.result = "heads" if random.random() < 0.5 else "tails"
                        else:
                            self.result = "heads" if random.random() < 0.5 else "tails"

                elif self.phase == "flipping":
                    if now >= self.phase_end_time:
                        self.phase = "result"
                        self.total_phase_duration = 4.0
                        self.phase_end_time = now + 4.0
                        self.history.insert(0, self.result)
                        self.history = self.history[:10]

                        for uid, b in self.bets.items():
                            if b["choice"] == self.result:
                                b["status"] = "won"
                                b["win"] = int(b["bet"] * 1.96)
                                if b.get("is_real"):
                                    try:
                                        database.update_user_balance(uid, b["win"])
                                        database.record_game(uid, "coinflip_online", b["bet"], b["win"], 1.96)
                                    except Exception:
                                        pass
                            else:
                                b["status"] = "lost"
                                b["win"] = 0
                                if b.get("is_real"):
                                    try:
                                        database.record_game(uid, "coinflip_online", b["bet"], 0, 0.0)
                                    except Exception:
                                        pass

                elif self.phase == "result":
                    if now >= self.phase_end_time:
                        self.round_id += 1
                        self.phase = "betting"
                        self.total_phase_duration = 10.0
                        self.phase_end_time = now + 10.0
                        self.result = None
                        self.bets.clear()
                        self.populate_simulated_bets()

    def place_bet(self, user_id: int, name: str, username: str, choice: str, bet: int):
        with self.lock:
            if self.phase != "betting":
                return False, "Stavka qabul qilish vaqti tugadi!"
            if user_id in self.bets and self.bets[user_id].get("is_real"):
                return False, "Siz bu raundda allaqachon stavka qildingiz!"
            user = database.get_or_create_user(user_id)
            if user["balance"] < bet:
                return False, "Hisobingizda mablag' yetarli emas!"
            
            new_bal = database.update_user_balance(user_id, -bet)
            self.bets[user_id] = {
                "user_id": user_id,
                "name": name or "O'yinchi",
                "username": username or "",
                "choice": choice,
                "bet": bet,
                "win": 0,
                "status": "pending",
                "is_real": True
            }
            return True, new_bal

    def get_status(self, current_user_id: int = 0):
        with self.lock:
            now = time.time()
            time_left = max(0.0, round(self.phase_end_time - now, 1))
            bets_list = list(self.bets.values())
            bets_list.sort(key=lambda b: (
                0 if b["user_id"] == current_user_id else (1 if b.get("is_real") else 2),
                -b["bet"]
            ))
            return {
                "round_id": self.round_id,
                "phase": self.phase,
                "time_left": time_left,
                "total_time": self.total_phase_duration,
                "result": self.result,
                "history": self.history,
                "bets": bets_list,
                "user_bet": self.bets.get(current_user_id)
            }

coinflip_room = CoinFlipLiveRoom()

# ============================================================================
# 🚀 REAL-TIME SYNCHRONIZED MULTIPLAYER AVIATOR / CRASH LIVE ROOM
# ============================================================================
class AviatorLiveRoom:
    def __init__(self):
        self.lock = threading.Lock()
        self.round_id = 2001
        self.phase = "waiting"  # "waiting" (5s) -> "flying" (up to crash) -> "crashed" (3.5s)
        self.total_phase_duration = 5.0
        self.phase_end_time = time.time() + 5.0
        self.flight_start_time = 0.0
        self.current_mult = 1.00
        self.crash_point = 1.00
        self.history = [1.85, 2.40, 1.20, 5.12, 1.05, 3.10]
        self.bets = {}
        self.simulated_users = [
            {"user_id": 9901, "name": "Jasur Crypto", "username": "jasur_crypto"},
            {"user_id": 9902, "name": "Azamat UZ", "username": "azamat_uz"},
            {"user_id": 9903, "name": "Farrux Bek", "username": "farrux_77"},
            {"user_id": 9904, "name": "Bekzod", "username": "bekzod_01"},
            {"user_id": 9905, "name": "Malika", "username": "malika_star"},
            {"user_id": 9906, "name": "Islom Trader", "username": "islom_trader"},
            {"user_id": 9907, "name": "Otabek", "username": "otabek_uzb"},
            {"user_id": 9908, "name": "Sardor WIN", "username": "sardor_winner"}
        ]
        self.populate_simulated_bets()
        self.running = True
        self.thread = threading.Thread(target=self._loop, daemon=True)
        self.thread.start()

    def populate_simulated_bets(self):
        count = random.randint(4, 7)
        picked = random.sample(self.simulated_users, count)
        amounts = [2000, 5000, 10000, 25000, 50000, 100000]
        for u in picked:
            target = round(random.uniform(1.25, 3.50), 2)
            amt = random.choice(amounts)
            self.bets[u["user_id"]] = {
                "user_id": u["user_id"],
                "name": u["name"],
                "username": u["username"],
                "bet": amt,
                "target_mult": target,
                "cashed_out": False,
                "cashout_mult": 0.0,
                "win": 0,
                "status": "in_flight",
                "is_real": False
            }

    def _determine_crash_point(self) -> float:
        if database.get_aviator_rng_enabled():
            target = database.get_aviator_target()
            return max(1.00, target)
        
        evil = database.get_evil_mode()
        if evil:
            r = random.random()
            if r < 0.45:
                return 1.00
            elif r < 0.88:
                return round(1.01 + random.random() * 0.22, 2)
            else:
                return round(1.23 + random.random() * 0.40, 2)

        rand = random.random()
        if rand < 0.03:
            return 1.00
        elif rand < 0.22:
            return round(1.05 + random.random() * 0.45, 2)
        else:
            cp = round(0.96 / (1.0 - ((rand - 0.22) / 0.78) * 0.95), 2)
            return max(1.30, min(250.0, cp))

    def _loop(self):
        while self.running:
            time.sleep(0.1)
            now = time.time()
            with self.lock:
                if self.phase == "waiting":
                    if now >= self.phase_end_time:
                        self.phase = "flying"
                        self.flight_start_time = now
                        self.current_mult = 1.00
                        self.crash_point = self._determine_crash_point()
                        for b in self.bets.values():
                            b["status"] = "in_flight"
                            b["cashed_out"] = False
                            b["cashout_mult"] = 0.0
                            b["win"] = 0

                elif self.phase == "flying":
                    dt = now - self.flight_start_time
                    mult = round(1.0 + 0.08 * (dt ** 1.65), 2)
                    self.current_mult = mult

                    for b in self.bets.values():
                        if not b.get("is_real") and not b["cashed_out"]:
                            if mult >= b.get("target_mult", 2.0):
                                b["cashed_out"] = True
                                b["cashout_mult"] = mult
                                b["win"] = int(b["bet"] * mult)
                                b["status"] = "won"

                    if mult >= self.crash_point:
                        self.phase = "crashed"
                        self.current_mult = self.crash_point
                        self.total_phase_duration = 3.5
                        self.phase_end_time = now + 3.5
                        self.history.insert(0, round(self.crash_point, 2))
                        self.history = self.history[:10]

                        for uid, b in self.bets.items():
                            if not b["cashed_out"]:
                                b["status"] = "lost"
                                b["win"] = 0
                                if b.get("is_real"):
                                    try:
                                        database.record_game(uid, "aviator_online", b["bet"], 0, 0.0)
                                    except Exception:
                                        pass

                elif self.phase == "crashed":
                    if now >= self.phase_end_time:
                        self.round_id += 1
                        self.phase = "waiting"
                        self.total_phase_duration = 5.0
                        self.phase_end_time = now + 5.0
                        self.current_mult = 1.00
                        self.crash_point = 1.00
                        self.bets.clear()
                        self.populate_simulated_bets()

    def place_bet(self, user_id: int, bet: int, name: str, username: str):
        with self.lock:
            if self.phase != "waiting":
                return False, "Stavka qabul qilish vaqti tugadi! Samolyot uchmoqda."
            if user_id in self.bets and self.bets[user_id].get("is_real"):
                return False, "Siz bu raundda allaqachon stavka qildingiz!"
            user = database.get_or_create_user(user_id)
            if user["balance"] < bet:
                return False, "Hisobingizda mablag' yetarli emas!"
            
            new_bal = database.update_user_balance(user_id, -bet)
            self.bets[user_id] = {
                "user_id": user_id,
                "name": name or "O'yinchi",
                "username": username or "",
                "bet": bet,
                "target_mult": 0.0,
                "cashed_out": False,
                "cashout_mult": 0.0,
                "win": 0,
                "status": "in_flight",
                "is_real": True
            }
            return True, new_bal

    def cancel_bet(self, user_id: int):
        with self.lock:
            if self.phase != "waiting":
                return False, "Samolyot havoga ko'tarilgan, stavkani bekor qilib bo'lmaydi!"
            if user_id not in self.bets or not self.bets[user_id].get("is_real"):
                return False, "Stavka topilmadi!"
            bet = self.bets[user_id]["bet"]
            del self.bets[user_id]
            new_bal = database.update_user_balance(user_id, bet)
            return True, new_bal

    def cashout(self, user_id: int):
        with self.lock:
            if self.phase != "flying":
                return False, "Samolyot parvozda emas!"
            if user_id not in self.bets or not self.bets[user_id].get("is_real"):
                return False, "Faol stavka topilmadi!"
            b = self.bets[user_id]
            if b["cashed_out"]:
                return False, "Siz allaqachon yutuqni olgansiz!"
            
            mult = self.current_mult
            win = int(b["bet"] * mult)
            b["cashed_out"] = True
            b["cashout_mult"] = mult
            b["win"] = win
            b["status"] = "won"
            
            new_bal = database.update_user_balance(user_id, win)
            try:
                database.record_game(user_id, "aviator_online", b["bet"], win, mult)
            except Exception:
                pass
            return True, {"balance": new_bal, "win": win, "multiplier": mult}

    def get_status(self, current_user_id: int = 0):
        with self.lock:
            now = time.time()
            time_left = max(0.0, round(self.phase_end_time - now, 1)) if self.phase != "flying" else 0.0
            bets_list = list(self.bets.values())
            bets_list.sort(key=lambda b: (
                0 if b["user_id"] == current_user_id else (1 if b.get("is_real") else 2),
                -b["bet"]
            ))
            return {
                "round_id": self.round_id,
                "phase": self.phase,
                "time_left": time_left,
                "total_time": self.total_phase_duration,
                "multiplier": self.current_mult,
                "crash_point": self.crash_point if self.phase == "crashed" else None,
                "history": self.history,
                "bets": bets_list,
                "user_bet": self.bets.get(current_user_id)
            }

aviator_room = AviatorLiveRoom()

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
    protocol_version = "HTTP/1.1"

    def address_string(self):
        # Ultra-fast client IP resolution without blocking 2-second getfqdn reverse DNS
        return str(self.client_address[0]) if self.client_address else "127.0.0.1"

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
        if path in ("/", "/index.html") or path.endswith(".css") or path.endswith(".js"):
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
        elif path == "/api/coinflip/status":
            uid = safe_int(query.get("user_id", [999999])[0], 999999)
            res = coinflip_room.get_status(uid)
            return self.send_json({"ok": True, **res})

        elif path == "/api/aviator/status":
            uid = safe_int(query.get("user_id", [999999])[0], 999999)
            res = aviator_room.get_status(uid)
            return self.send_json({"ok": True, **res})

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
            game_name = str(data.get("game_name") or data.get("game") or "kamikaze")[:32]
            bet = max(0, min(10_000_000, safe_int(data.get("bet"), 0)))
            mult = max(0.0, min(10_000.0, safe_float(data.get("multiplier"), 0.0)))
            raw_win = safe_int(data.get("win") if data.get("win") is not None else data.get("payout"), 0)
            if mult <= 0.0 and bet > 0 and raw_win > 0:
                mult = round(raw_win / bet, 2)

            # Anti-Cheat: calculate expected max payout
            if bet > 0:
                max_allowed_win = int(bet * max(mult, 1.0) + 50)
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
        elif path == "/api/coinflip/bet":
            choice = str(data.get("choice") or "heads").lower()
            if choice not in ("heads", "tails"):
                return self.send_json({"ok": False, "error": "Noto'g'ri tanlov! (heads yoki tails)"}, status=400)
            bet = max(1000, min(10_000_000, safe_int(data.get("bet"), 1000)))
            name = str(data.get("first_name") or data.get("name") or "O'yinchi")[:40]
            uname = str(data.get("username") or "")[:40]
            ok, res_bal_or_err = coinflip_room.place_bet(uid, name, uname, choice, bet)
            if ok:
                return self.send_json({"ok": True, "balance": res_bal_or_err})
            else:
                return self.send_json({"ok": False, "error": res_bal_or_err}, status=400)

        elif path == "/api/aviator/bet":
            bet = max(1000, min(10_000_000, safe_int(data.get("bet"), 1000)))
            name = str(data.get("first_name") or data.get("name") or "O'yinchi")[:40]
            uname = str(data.get("username") or "")[:40]
            ok, res_or_err = aviator_room.place_bet(uid, bet, name, uname)
            if ok:
                return self.send_json({"ok": True, "balance": res_or_err})
            else:
                return self.send_json({"ok": False, "error": res_or_err}, status=400)

        elif path == "/api/aviator/cashout":
            ok, res_or_err = aviator_room.cashout(uid)
            if ok:
                return self.send_json({"ok": True, **res_or_err})
            else:
                return self.send_json({"ok": False, "error": res_or_err}, status=400)

        elif path == "/api/aviator/cancel":
            ok, res_or_err = aviator_room.cancel_bet(uid)
            if ok:
                return self.send_json({"ok": True, "balance": res_or_err})
            else:
                return self.send_json({"ok": False, "error": res_or_err}, status=400)

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
