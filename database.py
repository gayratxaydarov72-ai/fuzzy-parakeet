import os
import sys
import time
import hashlib
import sqlite3
from datetime import date

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

USE_POSTGRES = bool(DATABASE_URL and (DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgres://")))

if USE_POSTGRES:
    try:
        import psycopg2
        import psycopg2.extras
    except ImportError:
        USE_POSTGRES = False

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "1xbet_games.db")

def get_connection():
    if USE_POSTGRES:
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)
        conn.autocommit = True
        return conn
    else:
        conn = sqlite3.connect(DB_PATH, timeout=30.0, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL;")
        return conn

def exec_query(sql, params=(), fetch_one=False, fetch_all=False, commit=False):
    conn = get_connection()
    cur = conn.cursor()
    if USE_POSTGRES:
        sql = sql.replace("?", "%s")
    cur.execute(sql, params)
    if commit and not USE_POSTGRES:
        conn.commit()

    res = None
    if fetch_one:
        row = cur.fetchone()
        res = dict(row) if row else None
    elif fetch_all:
        rows = cur.fetchall()
        res = [dict(r) for r in rows] if rows else []

    conn.close()
    return res

def init_db():
    conn = get_connection()
    cur = conn.cursor()

    if USE_POSTGRES:
        cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            user_id BIGINT PRIMARY KEY,
            first_name TEXT,
            username TEXT,
            balance BIGINT DEFAULT 10000,
            referrer_id BIGINT,
            invited_count INTEGER DEFAULT 0,
            total_earned_ref BIGINT DEFAULT 0,
            is_banned INTEGER DEFAULT 0,
            ban_reason TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        cur.execute("""
        CREATE TABLE IF NOT EXISTS promocodes (
            code TEXT PRIMARY KEY,
            amount INTEGER NOT NULL,
            max_uses INTEGER DEFAULT 100,
            used_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        cur.execute("""
        CREATE TABLE IF NOT EXISTS promo_uses (
            id SERIAL PRIMARY KEY,
            user_id BIGINT,
            code TEXT,
            used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, code)
        );
        """)
        cur.execute("""
        CREATE TABLE IF NOT EXISTS daily_tasks (
            id SERIAL PRIMARY KEY,
            user_id BIGINT,
            task_key TEXT,
            title TEXT,
            reward INTEGER,
            current_val INTEGER DEFAULT 0,
            target_val INTEGER DEFAULT 1,
            completed INTEGER DEFAULT 0,
            claimed INTEGER DEFAULT 0,
            task_date TEXT,
            UNIQUE(user_id, task_key, task_date)
        );
        """)
        cur.execute("""
        CREATE TABLE IF NOT EXISTS game_history (
            id SERIAL PRIMARY KEY,
            user_id BIGINT,
            game_name TEXT,
            bet INTEGER,
            win INTEGER,
            multiplier REAL,
            provably_hash TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        cur.execute("""
        CREATE TABLE IF NOT EXISTS system_settings (
            key TEXT PRIMARY KEY,
            value TEXT
        );
        """)

        promos = [
            ('NVINDIA', 5000, 5000),
            ('NVIDIA', 4000, 5000),
            ('1XBET', 3000, 1000),
            ('KAMIKAZE', 3000, 1000),
            ('MINES', 3000, 1000),
            ('DICE', 2500, 1000),
            ('APPLE', 2000, 1000),
            ('BONUS', 1500, 5000)
        ]
        for c, a, m in promos:
            cur.execute("INSERT INTO promocodes (code, amount, max_uses) VALUES (%s, %s, %s) ON CONFLICT (code) DO NOTHING", (c, a, m))

    else:
        cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY,
            first_name TEXT,
            username TEXT,
            balance INTEGER DEFAULT 10000,
            referrer_id INTEGER,
            invited_count INTEGER DEFAULT 0,
            total_earned_ref INTEGER DEFAULT 0,
            is_banned INTEGER DEFAULT 0,
            ban_reason TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        try:
            cur.execute("ALTER TABLE users ADD COLUMN is_banned INTEGER DEFAULT 0;")
        except Exception:
            pass
        try:
            cur.execute("ALTER TABLE users ADD COLUMN ban_reason TEXT DEFAULT '';")
        except Exception:
            pass

        cur.execute("""
        CREATE TABLE IF NOT EXISTS promocodes (
            code TEXT PRIMARY KEY,
            amount INTEGER NOT NULL,
            max_uses INTEGER DEFAULT 100,
            used_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        cur.execute("""
        CREATE TABLE IF NOT EXISTS promo_uses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            code TEXT,
            used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, code)
        );
        """)
        cur.execute("""
        CREATE TABLE IF NOT EXISTS daily_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            task_key TEXT,
            title TEXT,
            reward INTEGER,
            current_val INTEGER DEFAULT 0,
            target_val INTEGER DEFAULT 1,
            completed INTEGER DEFAULT 0,
            claimed INTEGER DEFAULT 0,
            task_date TEXT,
            UNIQUE(user_id, task_key, task_date)
        );
        """)
        cur.execute("""
        CREATE TABLE IF NOT EXISTS game_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            game_name TEXT,
            bet INTEGER,
            win INTEGER,
            multiplier REAL,
            provably_hash TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        cur.execute("""
        CREATE TABLE IF NOT EXISTS system_settings (
            key TEXT PRIMARY KEY,
            value TEXT
        );
        """)

        promos = [
            ('NVINDIA', 5000, 5000),
            ('NVIDIA', 4000, 5000),
            ('1XBET', 3000, 1000),
            ('KAMIKAZE', 3000, 1000),
            ('MINES', 3000, 1000),
            ('DICE', 2500, 1000),
            ('APPLE', 2000, 1000),
            ('BONUS', 1500, 5000)
        ]
        for c, a, m in promos:
            cur.execute("INSERT OR IGNORE INTO promocodes (code, amount, max_uses) VALUES (?, ?, ?)", (c, a, m))

        conn.commit()

    conn.close()

def get_setting(key: str, default: str = "") -> str:
    row = exec_query("SELECT value FROM system_settings WHERE key = ?", (key,), fetch_one=True)
    if row and row.get("value"):
        return str(row["value"])
    return default

def set_setting(key: str, value: str):
    if USE_POSTGRES:
        exec_query("INSERT INTO system_settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", (key, str(value)), commit=True)
    else:
        exec_query("INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)", (key, str(value)), commit=True)

def get_user(user_id: int):
    return exec_query("SELECT * FROM users WHERE user_id = ?", (user_id,), fetch_one=True)

def is_user_banned(user_id: int):
    user = get_user(user_id)
    if user and user.get("is_banned") == 1:
        return True, user.get("ban_reason") or "Administrator tomonidan bloklangan"
    return False, ""

def ban_user(user_id: int, reason: str = "Qoidabuzarlik"):
    exec_query("UPDATE users SET is_banned = 1, ban_reason = ? WHERE user_id = ?", (reason, user_id), commit=True)
    return True

def unban_user(user_id: int):
    exec_query("UPDATE users SET is_banned = 0, ban_reason = '' WHERE user_id = ?", (user_id,), commit=True)
    return True

def get_all_users_count() -> int:
    row = exec_query("SELECT COUNT(*) as cnt FROM users", fetch_one=True)
    return row["cnt"] if row else 0

def get_banned_users_count() -> int:
    row = exec_query("SELECT COUNT(*) as cnt FROM users WHERE is_banned = 1", fetch_one=True)
    return row["cnt"] if row else 0

def get_banned_users(limit: int = 20):
    return exec_query("SELECT user_id, first_name, username, ban_reason FROM users WHERE is_banned = 1 LIMIT ?", (limit,), fetch_all=True)

def get_total_balance() -> int:
    row = exec_query("SELECT SUM(balance) as total FROM users", fetch_one=True)
    return row["total"] if row and row["total"] is not None else 0

def get_total_games() -> int:
    row = exec_query("SELECT COUNT(*) as cnt FROM game_history", fetch_one=True)
    return row["cnt"] if row else 0

def get_all_user_ids():
    rows = exec_query("SELECT user_id FROM users", fetch_all=True)
    return [r["user_id"] for r in rows] if rows else []

def set_user_balance(user_id: int, balance: int):
    exec_query("UPDATE users SET balance = ? WHERE user_id = ?", (max(0, balance), user_id), commit=True)
    user = get_user(user_id)
    return user["balance"] if user else balance

def add_user_balance(user_id: int, amount: int):
    exec_query("UPDATE users SET balance = MAX(0, balance + ?) WHERE user_id = ?", (amount, user_id), commit=True)
    user = get_user(user_id)
    return user["balance"] if user else amount

def get_or_create_user(user_id: int, first_name: str = "", username: str = "", referrer_id: int = None):
    row = get_user(user_id)
    if not row:
        ref_id = None
        if referrer_id and referrer_id != user_id:
            parent = get_user(referrer_id)
            if parent:
                ref_id = referrer_id

        if USE_POSTGRES:
            exec_query(
                "INSERT INTO users (user_id, first_name, username, balance, referrer_id) VALUES (?, ?, ?, ?, ?) ON CONFLICT (user_id) DO NOTHING",
                (user_id, first_name or "O'yinchi", username or "", 10000, ref_id),
                commit=True
            )
        else:
            exec_query(
                "INSERT OR IGNORE INTO users (user_id, first_name, username, balance, referrer_id) VALUES (?, ?, ?, ?, ?)",
                (user_id, first_name or "O'yinchi", username or "", 10000, ref_id),
                commit=True
            )

        if ref_id:
            exec_query(
                "UPDATE users SET balance = balance + 2000, invited_count = invited_count + 1, total_earned_ref = total_earned_ref + 2000 WHERE user_id = ?",
                (ref_id,),
                commit=True
            )
            update_task_progress(ref_id, "invite_friend", 1)

        row = get_user(user_id)

    ensure_daily_tasks(user_id)
    return row

def ensure_daily_tasks(user_id: int):
    today = date.today().isoformat()
    day_num = date.today().toordinal()

    is_even = (day_num % 2 == 0)

    # 10 ta turli xil kunlik vazifalar (har 24 soatda rotatsiya bilan almashadi)
    tasks_pool = [
        ("login_daily", "🎁 Kunlik kirish bonusi", 1000, 1),
        ("play_games", "🎮 Istalgan o'yinlarda 5 ta raund o'ynash" if is_even else "🎮 Istalgan o'yinlarda 8 ta raund o'ynash", 1500 if is_even else 2000, 5 if is_even else 8),
        ("play_kamikaze", "🛩 Kamikaze: 2 marta xavfsiz qavatga chiqish" if is_even else "🛩 Kamikaze: 3 marta samolyotni boshqarish", 1500 if is_even else 2000, 2 if is_even else 3),
        ("play_mines", "💎 Mines: 3 marta olmos ochish" if is_even else "💎 Mines: 4 marta to'g'ri katakni topish", 1500 if is_even else 2000, 3 if is_even else 4),
        ("play_aviator", "🚀 Aviator: 1.80x dan yuqori yutuq olish" if is_even else "🚀 Aviator: 2.20x koeffitsiyentda naqdlashtirish", 2000 if is_even else 2500, 1),
        ("play_apple", "🍏 Apple: 2 marta xavfsiz olma topish" if is_even else "🍏 Apple: 3 marta qatorlardan o'tish", 1500 if is_even else 2000, 2 if is_even else 3),
        ("play_thimbles", "🪚 Thimbles: 2 marta to'pni topish" if is_even else "🪚 Thimbles: 3 marta to'g'ri stakanni tanlash", 1500 if is_even else 2000, 2 if is_even else 3),
        ("play_dice", "🎲 Under/Over 7: 2 marta to'g'ri topish" if is_even else "🎲 Under/Over 7: 3 marta toshlar yig'indisini topish", 1500 if is_even else 2000, 2 if is_even else 3),
        ("reach_multiplier" if is_even else "win_games", "⚡ Har qanday o'yinda 2.50x dan yuqori yutish" if is_even else "🏆 Istalgan o'yinlarda 3 ta g'alabaga erishish", 2500 if is_even else 2000, 1 if is_even else 3),
        ("high_stake" if is_even else "invite_friend", "💰 Kamida 10 000 UZS stavka qilish" if is_even else "👥 1 ta yangi do'stni taklif qilish (+2000 UZS)", 2000 if is_even else 2500, 1)
    ]

    for key, title, reward, target in tasks_pool:
        if USE_POSTGRES:
            exec_query("""
                INSERT INTO daily_tasks 
                (user_id, task_key, title, reward, current_val, target_val, completed, claimed, task_date)
                VALUES (?, ?, ?, ?, 0, ?, 0, 0, ?)
                ON CONFLICT (user_id, task_key, task_date) DO NOTHING
            """, (user_id, key, title, reward, target, today), commit=True)
        else:
            exec_query("""
                INSERT OR IGNORE INTO daily_tasks 
                (user_id, task_key, title, reward, current_val, target_val, completed, claimed, task_date)
                VALUES (?, ?, ?, ?, 0, ?, 0, 0, ?)
            """, (user_id, key, title, reward, target, today), commit=True)

    exec_query("UPDATE daily_tasks SET current_val = 1, completed = 1 WHERE user_id = ? AND task_key = 'login_daily' AND task_date = ?", (user_id, today), commit=True)

def update_task_progress(user_id: int, task_key: str, increment: int = 1):
    today = date.today().isoformat()
    exec_query("""
        UPDATE daily_tasks 
        SET current_val = CASE WHEN (current_val + ?) > target_val THEN target_val ELSE (current_val + ?) END,
            completed = CASE WHEN (current_val + ?) >= target_val THEN 1 ELSE completed END
        WHERE user_id = ? AND task_key = ? AND task_date = ? AND completed = 0
    """, (increment, increment, increment, user_id, task_key, today), commit=True)

def claim_task(user_id: int, task_key: str):
    today = date.today().isoformat()
    task = exec_query("""
        SELECT * FROM daily_tasks 
        WHERE user_id = ? AND task_key = ? AND task_date = ? AND completed = 1 AND claimed = 0
    """, (user_id, task_key, today), fetch_one=True)

    if not task:
        return False, "Vazifa hali bajarilmagan yoki allaqachon olingan"

    reward = task["reward"]
    exec_query("UPDATE daily_tasks SET claimed = 1 WHERE id = ?", (task["id"],), commit=True)
    exec_query("UPDATE users SET balance = balance + ? WHERE user_id = ?", (reward, user_id), commit=True)
    return True, reward

def claim_all_tasks(user_id: int):
    today = date.today().isoformat()
    tasks = exec_query("""
        SELECT * FROM daily_tasks 
        WHERE user_id = ? AND task_date = ? AND completed = 1 AND claimed = 0
    """, (user_id, today), fetch_all=True)

    if not tasks:
        return False, 0

    total_reward = 0
    for t in tasks:
        total_reward += t["reward"]
        exec_query("UPDATE daily_tasks SET claimed = 1 WHERE id = ?", (t["id"],), commit=True)

    exec_query("UPDATE users SET balance = balance + ? WHERE user_id = ?", (total_reward, user_id), commit=True)
    return True, total_reward

def get_user_tasks(user_id: int):
    today = date.today().isoformat()
    ensure_daily_tasks(user_id)
    return exec_query("SELECT * FROM daily_tasks WHERE user_id = ? AND task_date = ? ORDER BY id ASC", (user_id, today), fetch_all=True)

def use_promocode(user_id: int, code: str):
    code = code.strip().upper()
    promo = exec_query("SELECT * FROM promocodes WHERE code = ?", (code,), fetch_one=True)
    if not promo:
        return False, "Bunday promokod mavjud emas"

    if promo["used_count"] >= promo["max_uses"]:
        return False, "Promokod limiti tugagan"

    used = exec_query("SELECT * FROM promo_uses WHERE user_id = ? AND code = ?", (user_id, code), fetch_one=True)
    if used:
        return False, "Siz bu promokoddan foydalangansiz"

    exec_query("INSERT INTO promo_uses (user_id, code) VALUES (?, ?)", (user_id, code), commit=True)
    exec_query("UPDATE promocodes SET used_count = used_count + 1 WHERE code = ?", (code,), commit=True)
    exec_query("UPDATE users SET balance = balance + ? WHERE user_id = ?", (promo["amount"], user_id), commit=True)
    return True, promo["amount"]

def create_promocode(code: str, amount: int, max_uses: int = 100):
    code = code.strip().upper()
    if USE_POSTGRES:
        exec_query("INSERT INTO promocodes (code, amount, max_uses, used_count) VALUES (?, ?, ?, 0) ON CONFLICT (code) DO UPDATE SET amount = EXCLUDED.amount, max_uses = EXCLUDED.max_uses", (code, amount, max_uses), commit=True)
    else:
        exec_query("INSERT OR REPLACE INTO promocodes (code, amount, max_uses, used_count) VALUES (?, ?, ?, 0)", (code, amount, max_uses), commit=True)
    return True

def get_all_promocodes():
    return exec_query("SELECT * FROM promocodes ORDER BY created_at DESC", fetch_all=True)

def update_user_balance(user_id: int, diff: int):
    exec_query("UPDATE users SET balance = CASE WHEN (balance + ?) < 0 THEN 0 ELSE (balance + ?) END WHERE user_id = ?", (diff, diff, user_id), commit=True)
    user = get_user(user_id)
    if not user:
        get_or_create_user(user_id)
        return update_user_balance(user_id, diff)
    return user["balance"]

def record_game(user_id: int, game_name: str, bet: int, win: int, multiplier: float):
    seed = f"{user_id}-{game_name}-{time.time()}-{bet}-{win}"
    provably_hash = hashlib.sha256(seed.encode("utf-8")).hexdigest()

    exec_query("""
        INSERT INTO game_history (user_id, game_name, bet, win, multiplier, provably_hash)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (user_id, game_name, bet, win, multiplier, provably_hash), commit=True)

    update_task_progress(user_id, "play_games", 1)
    g_name = (game_name or "").lower()
    if bet >= 10000:
        update_task_progress(user_id, "high_stake", 1)
    if multiplier >= 2.5:
        update_task_progress(user_id, "reach_multiplier", 1)
    if win > 0:
        update_task_progress(user_id, "win_games", 1)
    if "kamikaze" in g_name and win > 0:
        update_task_progress(user_id, "play_kamikaze", 1)
    if "mines" in g_name and win > 0:
        update_task_progress(user_id, "play_mines", 1)
    if ("crash" in g_name or "aviator" in g_name) and win > 0 and multiplier >= 1.8:
        update_task_progress(user_id, "play_aviator", 1)
    if "apple" in g_name and win > 0:
        update_task_progress(user_id, "play_apple", 1)
    if "thimbles" in g_name and win > 0:
        update_task_progress(user_id, "play_thimbles", 1)
    if "dice" in g_name and win > 0:
        update_task_progress(user_id, "play_dice", 1)

    return provably_hash

init_db()
