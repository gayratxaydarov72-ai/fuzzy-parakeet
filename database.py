import sqlite3
import hashlib
import os
import time
from datetime import date

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "1xbet_games.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH, timeout=30.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    return conn

def init_db():
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY,
        first_name TEXT,
        username TEXT,
        balance INTEGER DEFAULT 50000,
        referrer_id INTEGER,
        invited_count INTEGER DEFAULT 0,
        total_earned_ref INTEGER DEFAULT 0,
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

    cur.execute("INSERT OR IGNORE INTO promocodes (code, amount, max_uses) VALUES ('NVINDIA', 25000, 5000);")
    cur.execute("INSERT OR IGNORE INTO promocodes (code, amount, max_uses) VALUES ('NVIDIA', 20000, 5000);")
    cur.execute("INSERT OR IGNORE INTO promocodes (code, amount, max_uses) VALUES ('1XBET', 15000, 1000);")
    cur.execute("INSERT OR IGNORE INTO promocodes (code, amount, max_uses) VALUES ('KAMIKAZE', 20000, 1000);")
    cur.execute("INSERT OR IGNORE INTO promocodes (code, amount, max_uses) VALUES ('APPLE', 10000, 1000);")
    cur.execute("INSERT OR IGNORE INTO promocodes (code, amount, max_uses) VALUES ('MINES', 20000, 1000);")
    cur.execute("INSERT OR IGNORE INTO promocodes (code, amount, max_uses) VALUES ('DICE', 15000, 1000);")
    cur.execute("INSERT OR IGNORE INTO promocodes (code, amount, max_uses) VALUES ('BONUS5000', 5000, 5000);")

    conn.commit()
    conn.close()

def get_setting(key: str, default: str = "") -> str:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT value FROM system_settings WHERE key = ?", (key,))
    row = cur.fetchone()
    conn.close()
    if row and row["value"]:
        return str(row["value"])
    return default

def set_setting(key: str, value: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)", (key, str(value)))
    conn.commit()
    conn.close()

def get_or_create_user(user_id: int, first_name: str = "", username: str = "", referrer_id: int = None):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
    row = cur.fetchone()

    if not row:
        ref_id = None
        if referrer_id and referrer_id != user_id:
            cur.execute("SELECT user_id FROM users WHERE user_id = ?", (referrer_id,))
            if cur.fetchone():
                ref_id = referrer_id

        cur.execute(
            "INSERT INTO users (user_id, first_name, username, balance, referrer_id) VALUES (?, ?, ?, ?, ?)",
            (user_id, first_name or "O'yinchi", username or "", 50000, ref_id)
        )
        if ref_id:
            cur.execute(
                "UPDATE users SET balance = balance + 5000, invited_count = invited_count + 1, total_earned_ref = total_earned_ref + 5000 WHERE user_id = ?",
                (ref_id,)
            )
        conn.commit()

        cur.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
        row = cur.fetchone()

    result = dict(row)
    conn.close()

    if not row and ref_id:
        update_task_progress(ref_id, "invite_friend", 1)

    ensure_daily_tasks(user_id)
    return result

def ensure_daily_tasks(user_id: int):
    today = date.today().isoformat()
    conn = get_connection()
    cur = conn.cursor()

    default_tasks = [
        ("login_daily", "Kunlik kirish bonusi", 3000, 1),
        ("play_games", "5 ta istalgan o'yin o'ynash", 7000, 5),
        ("reach_multiplier", "2.00x dan yuqori yutuq olish", 10000, 1),
        ("invite_friend", "1 ta do'stni taklif qilish (+5000 UZS)", 5000, 1),
        ("high_stake", "Kamida 10 000 UZS stavka qilish", 8000, 1)
    ]

    for key, title, reward, target in default_tasks:
        cur.execute("""
            INSERT OR IGNORE INTO daily_tasks 
            (user_id, task_key, title, reward, current_val, target_val, completed, claimed, task_date)
            VALUES (?, ?, ?, ?, 0, ?, 0, 0, ?)
        """, (user_id, key, title, reward, target, today))
        
    cur.execute("UPDATE daily_tasks SET current_val = 1, completed = 1 WHERE user_id = ? AND task_key = 'login_daily' AND task_date = ?", (user_id, today))
    conn.commit()
    conn.close()

def update_task_progress(user_id: int, task_key: str, increment: int = 1):
    today = date.today().isoformat()
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        UPDATE daily_tasks 
        SET current_val = MIN(target_val, current_val + ?),
            completed = CASE WHEN (current_val + ?) >= target_val THEN 1 ELSE completed END
        WHERE user_id = ? AND task_key = ? AND task_date = ? AND completed = 0
    """, (increment, increment, user_id, task_key, today))
    conn.commit()
    conn.close()

def claim_task(user_id: int, task_key: str):
    today = date.today().isoformat()
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT * FROM daily_tasks 
        WHERE user_id = ? AND task_key = ? AND task_date = ? AND completed = 1 AND claimed = 0
    """, (user_id, task_key, today))
    task = cur.fetchone()

    if not task:
        conn.close()
        return False, "Vazifa hali bajarilmagan yoki allaqachon olingan"

    reward = task["reward"]
    cur.execute("UPDATE daily_tasks SET claimed = 1 WHERE id = ?", (task["id"],))
    cur.execute("UPDATE users SET balance = balance + ? WHERE user_id = ?", (reward, user_id))
    conn.commit()
    conn.close()
    return True, reward

def get_user_tasks(user_id: int):
    today = date.today().isoformat()
    ensure_daily_tasks(user_id)
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM daily_tasks WHERE user_id = ? AND task_date = ?", (user_id, today))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows

def use_promocode(user_id: int, code: str):
    code = code.strip().upper()
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM promocodes WHERE code = ?", (code,))
    promo = cur.fetchone()
    if not promo:
        conn.close()
        return False, "Bunday promokod mavjud emas"

    if promo["used_count"] >= promo["max_uses"]:
        conn.close()
        return False, "Promokod limiti tugagan"

    cur.execute("SELECT * FROM promo_uses WHERE user_id = ? AND code = ?", (user_id, code))
    if cur.fetchone():
        conn.close()
        return False, "Siz bu promokoddan foydalangansiz"

    cur.execute("INSERT INTO promo_uses (user_id, code) VALUES (?, ?)", (user_id, code))
    cur.execute("UPDATE promocodes SET used_count = used_count + 1 WHERE code = ?", (code,))
    cur.execute("UPDATE users SET balance = balance + ? WHERE user_id = ?", (promo["amount"], user_id))
    conn.commit()
    conn.close()
    return True, promo["amount"]

def create_promocode(code: str, amount: int, max_uses: int = 100):
    code = code.strip().upper()
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("INSERT OR REPLACE INTO promocodes (code, amount, max_uses, used_count) VALUES (?, ?, ?, 0)", (code, amount, max_uses))
    conn.commit()
    conn.close()
    return True

def update_user_balance(user_id: int, diff: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE users SET balance = MAX(0, balance + ?) WHERE user_id = ?", (diff, user_id))
    cur.execute("SELECT balance FROM users WHERE user_id = ?", (user_id,))
    res = cur.fetchone()
    conn.commit()
    conn.close()
    if not res:
        get_or_create_user(user_id)
        return update_user_balance(user_id, diff)
    return res["balance"]

def record_game(user_id: int, game_name: str, bet: int, win: int, multiplier: float):
    seed = f"{user_id}-{game_name}-{time.time()}-{bet}-{win}"
    provably_hash = hashlib.sha256(seed.encode("utf-8")).hexdigest()
    
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO game_history (user_id, game_name, bet, win, multiplier, provably_hash)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (user_id, game_name, bet, win, multiplier, provably_hash))
    conn.commit()
    conn.close()

    update_task_progress(user_id, "play_games", 1)
    if bet >= 10000:
        update_task_progress(user_id, "high_stake", 1)
    if multiplier >= 2.0:
        update_task_progress(user_id, "reach_multiplier", 1)

    return provably_hash

init_db()
