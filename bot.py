import os
import sys
import asyncio
import logging
import threading
from collections import defaultdict
import time
from aiogram import Bot, Dispatcher, types, F, BaseMiddleware
from aiogram.filters import CommandStart, Command, CommandObject
from aiogram.types import (
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    WebAppInfo,
    MenuButtonWebApp,
    TelegramObject
)
import database
import server

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

PORT = int(os.getenv("PORT", "8080"))
BOT_TOKEN = os.getenv("BOT_TOKEN", "").strip()
ADMIN_ID = int(os.getenv("ADMIN_ID", "0"))

def is_admin(user_id: int) -> bool:
    return ADMIN_ID != 0 and user_id == ADMIN_ID

LIVE_URL_CACHE = None

def get_live_url() -> str:
    global LIVE_URL_CACHE
    if LIVE_URL_CACHE:
        return LIVE_URL_CACHE

    render_url = os.getenv("RENDER_EXTERNAL_URL", "").strip().rstrip("/")
    if render_url:
        if not render_url.startswith("http://") and not render_url.startswith("https://"):
            render_url = f"https://{render_url}"
        LIVE_URL_CACHE = render_url
        if database.get_setting("webapp_url") != render_url:
            database.set_setting("webapp_url", render_url)
        return render_url

    render_host = os.getenv("RENDER_EXTERNAL_HOSTNAME", "").strip().rstrip("/")
    if render_host:
        u = f"https://{render_host}"
        LIVE_URL_CACHE = u
        if database.get_setting("webapp_url") != u:
            database.set_setting("webapp_url", u)
        return u

    render_svc = os.getenv("RENDER_SERVICE_NAME", "").strip()
    if render_svc:
        u = f"https://{render_svc}.onrender.com"
        LIVE_URL_CACHE = u
        if database.get_setting("webapp_url") != u:
            database.set_setting("webapp_url", u)
        return u

    db_url = database.get_setting("webapp_url", "").strip().rstrip("/")
    if db_url and not db_url.startswith("http://localhost") and not db_url.startswith("http://127.0.0.1"):
        LIVE_URL_CACHE = db_url
        return db_url

    env_url = os.getenv("WEBAPP_URL", "").strip().rstrip("/")
    if env_url and not env_url.startswith("http://localhost") and not env_url.startswith("http://127.0.0.1"):
        LIVE_URL_CACHE = env_url
        return env_url

    if db_url:
        LIVE_URL_CACHE = db_url
        return db_url
    if env_url:
        LIVE_URL_CACHE = env_url
        return env_url
    return f"http://localhost:{PORT}"

# ============================================================================
# 🛡️ BOT ANTI-FLOOD, ANTI-DOS & RATE LIMITING MIDDLEWARE
# ============================================================================
class AntiFloodMiddleware(BaseMiddleware):
    def __init__(self, limit_seconds: float = 0.5, max_burst: int = 5):
        super().__init__()
        self.limit_seconds = limit_seconds
        self.max_burst = max_burst
        self.user_timestamps = defaultdict(list)
        self.temp_blocked = {}

    async def __call__(self, handler, event: TelegramObject, data: dict):
        user = getattr(event, "from_user", None)
        if not user:
            return await handler(event, data)

        user_id = user.id
        now = time.time()

        # Admin is immune to rate limits
        if is_admin(user_id):
            return await handler(event, data)

        # Check temporary flood block (DoS protection)
        if user_id in self.temp_blocked:
            unblock_time = self.temp_blocked[user_id]
            if now < unblock_time:
                wait_sec = max(1, int(unblock_time - now))
                if isinstance(event, types.CallbackQuery):
                    try:
                        await event.answer(f"🛡️ Spam himoyasi! {wait_sec} soniya kuting.", show_alert=True)
                    except Exception:
                        pass
                return
            else:
                del self.temp_blocked[user_id]

        history = [t for t in self.user_timestamps[user_id] if now - t < 5.0]
        if len(history) >= self.max_burst:
            self.temp_blocked[user_id] = now + 25.0
            self.user_timestamps[user_id] = []
            if isinstance(event, types.Message):
                try:
                    await event.answer(
                        "🛡️ <b>Xavfsizlik tizimi:</b> Juda ko'p tezkor so'rovlar aniqlandi!\n"
                        "Spam va DoS hujumlaridan himoyalanish maqsadida 25 soniyaga vaqtincha cheklov qo'yildi.",
                        parse_mode="HTML"
                    )
                except Exception:
                    pass
            elif isinstance(event, types.CallbackQuery):
                try:
                    await event.answer("🛡️ Juda ko'p so'rovlar! 25 soniya kuting.", show_alert=True)
                except Exception:
                    pass
            return

        # Micro rate limit between clicks (0.5s)
        if history and (now - history[-1] < self.limit_seconds):
            self.user_timestamps[user_id].append(now)
            if isinstance(event, types.CallbackQuery):
                try:
                    await event.answer("Iltimos, biroz kuting...", show_alert=False)
                except Exception:
                    pass
            return

        self.user_timestamps[user_id] = history + [now]
        return await handler(event, data)

dp = Dispatcher()
anti_flood = AntiFloodMiddleware()
dp.message.middleware(anti_flood)
dp.callback_query.middleware(anti_flood)

async def check_ban(user_id: int, bot: Bot, chat_id: int) -> bool:
    banned, reason = database.is_user_banned(user_id)
    if banned:
        try:
            await bot.send_message(
                chat_id=chat_id,
                text=(
                    f"🚫 <b>HISOBINGIZ BLOKLANGAN!</b>\n\n"
                    f"Sabab: <b>{reason}</b>\n\n"
                    f"Platforma qoidalarini buzganingiz sababli profilingiz faoliyati to'xtatildi.\n"
                    f"Murojaat uchun adminga yozing."
                ),
                parse_mode="HTML"
            )
        except Exception:
            pass
        return True
    return False

def get_main_keyboard(user_id: int):
    live_url = get_live_url()
    launch_url = f"{live_url}?uid={user_id}"
    is_https = launch_url.lower().startswith("https://")
    
    if is_https:
        play_btn = InlineKeyboardButton(
            text="🎮 NVINDIA GAMES O'YINLARINI OCHISH",
            web_app=WebAppInfo(url=launch_url)
        )
    else:
        play_btn = InlineKeyboardButton(
            text="🎮 NVINDIA GAMES O'YINLARINI OCHISH",
            url=launch_url
        )

    return InlineKeyboardMarkup(
        inline_keyboard=[
            [play_btn],
            [
                InlineKeyboardButton(text="👥 Do'stlarni taklif qilish (+2 000)", callback_data="ref_info"),
                InlineKeyboardButton(text="🎯 Kunlik vazifalar", callback_data="tasks_info")
            ],
            [
                InlineKeyboardButton(text="🎁 Promokodlar", callback_data="promo_info"),
                InlineKeyboardButton(text="💰 Mening balansim", callback_data="my_balance")
            ],
            [
                InlineKeyboardButton(text="🛡️ Adolatli RNG (SHA-256)", callback_data="provably_info"),
                InlineKeyboardButton(text="📖 Qo'llanma & Qoidalar", callback_data="rules_info")
            ]
        ]
    )

def get_admin_keyboard():
    evil_on = database.get_evil_mode()
    evil_text = "😈 Evil Mode: ON 🔴" if evil_on else "😇 Evil Mode: OFF 🟢"
    rng_on = database.get_aviator_rng_enabled()
    aviator_target = database.get_aviator_target()
    rng_text = f"🎯 Aviator RNG: ON ({aviator_target:.2f}x) 🔴" if rng_on else "🎲 Aviator RNG: OFF 🟢"

    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text=evil_text, callback_data="admin_toggle_evil"),
                InlineKeyboardButton(text=rng_text, callback_data="admin_toggle_aviator_rng")
            ],
            [
                InlineKeyboardButton(text="✏️ RNG Koeffitsiyentni o'zgartirish (Merge)", callback_data="admin_ask_aviator_target")
            ],
            [
                InlineKeyboardButton(text="📊 Yangilash", callback_data="admin_refresh"),
                InlineKeyboardButton(text="🚫 Bloklanganlar", callback_data="admin_banned")
            ],
            [
                InlineKeyboardButton(text="🎁 Promokodlar", callback_data="admin_promos"),
                InlineKeyboardButton(text="📢 Xabar yuborish", callback_data="admin_broadcast_info")
            ],
            [
                InlineKeyboardButton(text="🌐 WebApp Havolasi", callback_data="admin_url_info")
            ]
        ]
    )

def get_aviator_keyboard():
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="💥 0.50x", callback_data="set_crash_0.50"),
                InlineKeyboardButton(text="💥 1.00x", callback_data="set_crash_1.00"),
                InlineKeyboardButton(text="⚡ 1.20x", callback_data="set_crash_1.20")
            ],
            [
                InlineKeyboardButton(text="🎯 1.50x", callback_data="set_crash_1.50"),
                InlineKeyboardButton(text="🎯 2.00x", callback_data="set_crash_2.00"),
                InlineKeyboardButton(text="🚀 3.00x", callback_data="set_crash_3.00")
            ],
            [
                InlineKeyboardButton(text="🎲 Avto 1xBet RNG (O'chirish)", callback_data="set_crash_auto")
            ],
            [
                InlineKeyboardButton(text="⬅️ Admin panelga qaytish", callback_data="admin_refresh")
            ]
        ]
    )

def render_admin_dashboard():
    total_users = database.get_all_users_count()
    banned_users = database.get_banned_users_count()
    total_balance = database.get_total_balance()
    total_games = database.get_total_games()
    live_url = get_live_url()
    evil_on = database.get_evil_mode()
    evil_status = "🔴 YOQILGAN (O'yinchilar ko'pincha yutqazadi)" if evil_on else "🟢 O'CHIRILGAN (Adolatli 1xBet RNG)"
    rng_on = database.get_aviator_rng_enabled()
    aviator_target = database.get_aviator_target()
    aviator_status = f"🔴 YOQILGAN ({aviator_target:.2f}x da uchadi/portlaydi)" if rng_on else "🟢 O'CHIRILGAN (Avto 1xBet server RNG)"

    return (
        f"👑 <b>NVINDIA GAMES — BOSH ADMIN PANELI</b>\n\n"
        f"Assalomu alaykum, Hurmatli Administrator!\n"
        f"Quyida bot va WebApp platformasining jonli statistikasi keltirilgan:\n\n"
        f"📊 <b>Platforma holati:</b>\n"
        f"• Jami o'yinchilar soni: <b>{total_users:,} ta</b>\n"
        f"• Bloklangan o'yinchilar: <b>{banned_users:,} ta</b>\n"
        f"• Jami foydalanuvchilar balansi: <b>{total_balance:,} UZS</b>\n"
        f"• Jami o'ynalgan raundlar: <b>{total_games:,} ta</b>\n"
        f"• Jonli WebApp URL: <code>{live_url}</code>\n\n"
        f"🎛 <b>O'yin algoritmlarini nazorat qilish:</b>\n"
        f"• 😈 <b>Evil Mode:</b> <b>{evil_status}</b>\n"
        f"• 🚀 <b>Aviator RNG Boshqaruvi:</b> <b>{aviator_status}</b>\n\n"
        f"🛠 <b>Mavjud boshqaruv buyruqlari:</b>\n"
        f"• <code>/evil [on/off]</code> — Evil Mode rejimini yoqish/o'chirish\n"
        f"• <code>/rng [on/off]</code> — Aviator RNG nazoratini yoqish/o'chirish\n"
        f"• <code>/setcrash &lt;qiymat&gt;</code> — Portlash koeffitsiyentini belgilash (masalan: <code>/setcrash 1.5</code> yoki <code>/setcrash 0.5</code>)\n"
        f"• <code>/ban &lt;user_id&gt; [sabab]</code> — O'yinchini bloklash\n"
        f"• <code>/unban &lt;user_id&gt;</code> — Blokdan chiqarish\n"
        f"• <code>/user &lt;user_id&gt;</code> — O'yinchi profilini ko'rish\n"
        f"• <code>/setbal &lt;user_id&gt; &lt;summa&gt;</code> — Balansni o'rnatish\n"
        f"• <code>/addbal &lt;user_id&gt; &lt;summa&gt;</code> — Balansga summa qo'shish\n"
        f"• <code>/broadcast &lt;xabar matni&gt;</code> — Barcha o'yinchilarga xabar yuborish\n"
        f"• <code>/newpromo &lt;KOD&gt; &lt;SUMMA&gt; [SONI]</code> — Yangi promokod yaratish\n"
        f"• <code>/seturl &lt;havola&gt;</code> — Jonli domen havolasini o'rnatish"
    ).replace(",", " ")

@dp.message(Command("admin"))
async def admin_cmd(message: types.Message):
    if not is_admin(message.from_user.id):
        if ADMIN_ID == 0:
            await message.answer(
                f"⚠️ <b>ADMIN_ID o'rnatilmagan!</b>\n\n"
                f"Sizning Telegram ID raqamingiz: <code>{message.from_user.id}</code>\n\n"
                f"Ushbu raqamni loyihadagi <code>.env</code> faylining <code>ADMIN_ID</code> qatoriga kiriting va qayta ishga tushiring.",
                parse_mode="HTML"
            )
        else:
            await message.answer("❌ Bu buyruq faqat bot administratori uchun ochiq!")
        return

    text = render_admin_dashboard()
    await message.answer(text, parse_mode="HTML", reply_markup=get_admin_keyboard())

@dp.message(Command("ban"))
async def ban_cmd(message: types.Message, command: CommandObject, bot: Bot):
    if not is_admin(message.from_user.id):
        return
    args = (command.args or "").split(maxsplit=1)
    if not args or not args[0].isdigit():
        await message.answer("Foydalanish: <code>/ban &lt;user_id&gt; [sabab]</code>\nMasalan: <code>/ban 123456789 Qoidabuzarlik</code>", parse_mode="HTML")
        return
    target_id = int(args[0])
    reason = args[1] if len(args) > 1 else "Administrator qarori bilan bloklandi"
    database.ban_user(target_id, reason)
    try:
        await bot.send_message(
            chat_id=target_id,
            text=f"🚫 <b>Hisobingiz administrator tomonidan bloklandi!</b>\n\nSabab: <b>{reason}</b>\nBarcha o'yinlar va amallar to'xtatildi.",
            parse_mode="HTML"
        )
    except Exception:
        pass
    await message.answer(f"✅ <b>Foydalanuvchi {target_id} muvaffaqiyatli bloklandi!</b>\nSabab: <i>{reason}</i>", parse_mode="HTML")

@dp.message(Command("unban"))
async def unban_cmd(message: types.Message, command: CommandObject, bot: Bot):
    if not is_admin(message.from_user.id):
        return
    args = (command.args or "").split()
    if not args or not args[0].isdigit():
        await message.answer("Foydalanish: <code>/unban &lt;user_id&gt;</code>\nMasalan: <code>/unban 123456789</code>", parse_mode="HTML")
        return
    target_id = int(args[0])
    database.unban_user(target_id)
    try:
        await bot.send_message(
            chat_id=target_id,
            text="✅ <b>Hisobingiz administrator tomonidan blokdan chiqarildi!</b>\nEndi bot va o'yinlardan to'liq foydalanishingiz mumkin. Omad!",
            parse_mode="HTML"
        )
    except Exception:
        pass
    await message.answer(f"✅ <b>Foydalanuvchi {target_id} muvaffaqiyatli blokdan chiqarildi!</b>", parse_mode="HTML")

@dp.message(Command("user"))
async def user_info_cmd(message: types.Message, command: CommandObject):
    if not is_admin(message.from_user.id):
        return
    args = (command.args or "").split()
    if not args or not args[0].isdigit():
        await message.answer("Foydalanish: <code>/user &lt;user_id&gt;</code>\nMasalan: <code>/user 123456789</code>", parse_mode="HTML")
        return
    target_id = int(args[0])
    u = database.get_user(target_id)
    if not u:
        await message.answer(f"❌ Foydalanuvchi topilmadi: {target_id}")
        return
    status = "🚫 BLOKLANGAN" if u.get("is_banned") == 1 else "✅ FAOL"
    reason = f"\n• Blok sababi: <i>{u.get('ban_reason')}</i>" if u.get("is_banned") == 1 else ""
    text = (
        f"👤 <b>FOYDALANUVCHI MA'LUMOTLARI:</b>\n\n"
        f"• ID: <code>{u['user_id']}</code>\n"
        f"• Ism: <b>{u['first_name']}</b>\n"
        f"• Username: @{u['username'] if u['username'] else 'mavjud_emas'}\n"
        f"• Balans: <b>{u['balance']:,} UZS</b>\n"
        f"• Taklif qilgan do'stlar: <b>{u['invited_count']} ta</b>\n"
        f"• Referaldan ishlangan: <b>{u['total_earned_ref']:,} UZS</b>\n"
        f"• Holat: <b>{status}</b>{reason}\n"
        f"• Ro'yxatdan o'tgan: <code>{u.get('created_at', '')}</code>"
    ).replace(",", " ")
    await message.answer(text, parse_mode="HTML")

@dp.message(Command("setbal"))
async def setbal_cmd(message: types.Message, command: CommandObject, bot: Bot):
    if not is_admin(message.from_user.id):
        return
    args = (command.args or "").split()
    if len(args) < 2 or not args[0].isdigit() or not args[1].lstrip('-').isdigit():
        await message.answer("Foydalanish: <code>/setbal &lt;user_id&gt; &lt;summa&gt;</code>\nMasalan: <code>/setbal 123456789 25000</code>", parse_mode="HTML")
        return
    target_id = int(args[0])
    amt = int(args[1])
    new_bal = database.set_user_balance(target_id, amt)
    try:
        await bot.send_message(
            chat_id=target_id,
            text=f"💳 <b>Hisob balansingiz yangilandi!</b>\n\nJoriy balans: <b>{new_bal:,} UZS</b>".replace(",", " "),
            parse_mode="HTML"
        )
    except Exception:
        pass
    await message.answer(f"✅ <b>Foydalanuvchi {target_id} balansi o'rnatildi:</b> {new_bal:,} UZS".replace(",", " "), parse_mode="HTML")

@dp.message(Command("addbal"))
async def addbal_cmd(message: types.Message, command: CommandObject, bot: Bot):
    if not is_admin(message.from_user.id):
        return
    args = (command.args or "").split()
    if len(args) < 2 or not args[0].isdigit() or not args[1].lstrip('-').isdigit():
        await message.answer("Foydalanish: <code>/addbal &lt;user_id&gt; &lt;summa&gt;</code>\nMasalan: <code>/addbal 123456789 10000</code>", parse_mode="HTML")
        return
    target_id = int(args[0])
    diff = int(args[1])
    new_bal = database.add_user_balance(target_id, diff)
    prefix = "+" if diff >= 0 else ""
    try:
        await bot.send_message(
            chat_id=target_id,
            text=f"💳 <b>Hisobingizga {prefix}{diff:,} UZS kiritildi!</b>\n\nJoriy balansingiz: <b>{new_bal:,} UZS</b>".replace(",", " "),
            parse_mode="HTML"
        )
    except Exception:
        pass
    await message.answer(f"✅ <b>Foydalanuvchi {target_id} balansiga {prefix}{diff:,} UZS kiritildi!</b>\nYangi balans: {new_bal:,} UZS".replace(",", " "), parse_mode="HTML")

@dp.message(Command("broadcast"))
async def broadcast_cmd(message: types.Message, command: CommandObject, bot: Bot):
    if not is_admin(message.from_user.id):
        return
    text = (command.args or "").strip()
    if not text:
        await message.answer("Foydalanish: <code>/broadcast &lt;xabar matni&gt;</code>", parse_mode="HTML")
        return

    user_ids = database.get_all_user_ids()
    if not user_ids:
        await message.answer("Bazada foydalanuvchilar topilmadi.")
        return

    progress_msg = await message.answer(f"📢 <b>Xabar yuborish boshlandi...</b>\nJami qabul qiluvchilar: {len(user_ids)} ta", parse_mode="HTML")

    success = 0
    failed = 0
    for uid in user_ids:
        try:
            await bot.send_message(chat_id=uid, text=text, parse_mode="HTML")
            success += 1
            await asyncio.sleep(0.04)
        except Exception:
            failed += 1

    await progress_msg.edit_text(
        f"✅ <b>Xabar yuborish yakunlandi!</b>\n\n"
        f"• Muvaffaqiyatli yetkazildi: <b>{success} ta</b>\n"
        f"• Yetkazib bo'lmadi: <b>{failed} ta</b>\n"
        f"• Jami: <b>{len(user_ids)} ta</b>",
        parse_mode="HTML"
    )

@dp.message(Command("newpromo"))
async def newpromo_cmd(message: types.Message, command: CommandObject):
    if not is_admin(message.from_user.id):
        return

    args = (command.args or "").split()
    if len(args) < 2:
        await message.answer("Foydalanish: <code>/newpromo KOD SUMMA [ISHLATISH_SONI]</code>\nMasalan: <code>/newpromo NVVIP 5000 50</code>", parse_mode="HTML")
        return

    code = args[0]
    amount = int(args[1])
    uses = int(args[2]) if len(args) > 2 else 100

    database.create_promocode(code, amount, uses)
    await message.answer(f"✅ Promokod yaratildi:\nKod: <b>{code.upper()}</b>\nSumma: <b>{amount:,} UZS</b>\nSoni: <b>{uses}</b>".replace(",", " "), parse_mode="HTML")

@dp.message(Command("seturl"))
async def seturl_cmd(message: types.Message, command: CommandObject):
    if not is_admin(message.from_user.id):
        return
    if not command.args:
        curr = get_live_url()
        await message.answer(
            f"🌐 <b>Joriy jonli WebApp havola:</b>\n<code>{curr}</code>\n\n"
            f"O'zgartirish uchun:\n"
            f"<code>/seturl https://sizning-servisingiz.onrender.com</code>",
            parse_mode="HTML"
        )
        return
    global LIVE_URL_CACHE
    new_url = command.args.strip().rstrip("/")
    if not new_url.startswith("http://") and not new_url.startswith("https://"):
        new_url = f"https://{new_url}"
    LIVE_URL_CACHE = new_url
    database.set_setting("webapp_url", new_url)
    await message.answer(
        f"✅ <b>Jonli WebApp havolasi muvaffaqiyatli saqlandi!</b>\n\n"
        f"Yangi havola: <code>{new_url}</code>\n"
        f"Endi barcha tugmalar va Mini App ushbu Render havolasi orqali ochiladi!",
        parse_mode="HTML"
    )

@dp.callback_query(F.data == "admin_refresh")
async def admin_refresh_callback(call: types.CallbackQuery):
    if not is_admin(call.from_user.id):
        await call.answer("Ruxsat yo'q!", show_alert=True)
        return
    text = render_admin_dashboard()
    try:
        await call.message.edit_text(text, parse_mode="HTML", reply_markup=get_admin_keyboard())
    except Exception:
        pass
    await call.answer("Statistika yangilandi! 🔄")

@dp.callback_query(F.data == "admin_banned")
async def admin_banned_callback(call: types.CallbackQuery):
    if not is_admin(call.from_user.id):
        await call.answer("Ruxsat yo'q!", show_alert=True)
        return
    banned_list = database.get_banned_users(20)
    if not banned_list:
        await call.message.answer("🎉 Hozirda hech qanday bloklangan foydalanuvchi yo'q.")
        await call.answer()
        return

    text = "🚫 <b>BLOKLANGAN FOYDALANUVCHILAR:</b>\n\n"
    for b in banned_list:
        text += f"• ID: <code>{b['user_id']}</code> | {b['first_name']} (@{b['username'] or 'yoq'})\n  Sabab: <i>{b['ban_reason']}</i>\n"
    text += "\n<i>Blokdan chiqarish uchun: /unban &lt;user_id&gt;</i>"
    await call.message.answer(text, parse_mode="HTML")
    await call.answer()

@dp.callback_query(F.data == "admin_promos")
async def admin_promos_callback(call: types.CallbackQuery):
    if not is_admin(call.from_user.id):
        await call.answer("Ruxsat yo'q!", show_alert=True)
        return
    promos = database.get_all_promocodes()
    if not promos:
        await call.message.answer("Hozirda faol promokodlar yo'q.")
        await call.answer()
        return

    text = "🎁 <b>MAVJUD PROMOKODLAR RO'YXATI:</b>\n\n"
    for p in promos:
        text += f"• <code>{p['code']}</code>: <b>+{p['amount']:,} UZS</b> ({p['used_count']}/{p['max_uses']} ishlatilgan)\n"
    text += "\n<i>Yangi promokod qo'shish uchun: /newpromo KOD SUMMA [SONI]</i>"
    await call.message.answer(text.replace(",", " "), parse_mode="HTML")
    await call.answer()

@dp.callback_query(F.data == "admin_broadcast_info")
async def admin_broadcast_info_callback(call: types.CallbackQuery):
    if not is_admin(call.from_user.id):
        await call.answer("Ruxsat yo'q!", show_alert=True)
        return
    text = (
        "📢 <b>BARCHA O'YINCHILARGA XABAR YUBORISH:</b>\n\n"
        "Xabar yuborish uchun buyruqdan foydalaning:\n"
        "<code>/broadcast Sizning xabaringiz matni</code>\n\n"
        "<i>HTML teglardan foydalanishingiz mumkin: &lt;b&gt;qalin&lt;/b&gt;, &lt;i&gt;kursiv&lt;/i&gt;, &lt;code&gt;kod&lt;/code&gt;</i>"
    )
    await call.message.answer(text, parse_mode="HTML")
    await call.answer()

@dp.callback_query(F.data == "admin_url_info")
async def admin_url_info_callback(call: types.CallbackQuery):
    if not is_admin(call.from_user.id):
        await call.answer("Ruxsat yo'q!", show_alert=True)
        return
    curr = get_live_url()
    text = (
        f"🌐 <b>JONLI WEBAPP HAVOLASI:</b>\n\n"
        f"Hozirgi havola: <code>{curr}</code>\n\n"
        f"Render serveringiz havolasini o'rnatish uchun:\n"
        f"<code>/seturl https://sizning-servisingiz.onrender.com</code>"
    )
    await call.message.answer(text, parse_mode="HTML")
    await call.answer()

ADMIN_AWAITING_INPUT = {}

@dp.message(F.text & ~F.text.startswith("/"))
async def admin_input_handler(message: types.Message):
    if not is_admin(message.from_user.id):
        return
    state = ADMIN_AWAITING_INPUT.get(message.from_user.id)
    if state == "aviator_target":
        raw = message.text.strip().lower().replace("x", "").replace(",", ".")
        try:
            val = float(raw)
            val = max(0.1, round(val, 2))
            database.set_aviator_target(val)
            database.set_aviator_rng_enabled(True)
            ADMIN_AWAITING_INPUT.pop(message.from_user.id, None)
            await message.answer(
                f"✅ <b>Muvaffaqiyatli saqlandi!</b>\n\n"
                f"🎯 <b>Aviator RNG: YOQILDI 🔴</b>\n"
                f"Samolyot endi har safar <b>{val:.2f}x</b> ga yetganda uchib ketadi!\n\n"
                f"<i>O'chirish uchun <code>/rng off</code> yoki admin paneldagi tugmani bosing.</i>",
                parse_mode="HTML",
                reply_markup=get_admin_keyboard()
            )
        except ValueError:
            await message.answer(
                "❌ <b>Noto'g'ri qiymat kiritildi!</b>\nIltimos, son kiriting. Masalan: <code>1.5</code> yoki <code>0.5</code> yoki <code>1.2x</code>",
                parse_mode="HTML"
            )

@dp.message(Command("evil"))
async def evil_cmd(message: types.Message, command: CommandObject):
    if not is_admin(message.from_user.id):
        return
    arg = (command.args or "").strip().lower()
    if arg in ("on", "1", "true", "yoq", "start"):
        database.set_evil_mode(True)
        await message.answer("😈 <b>Evil Mode YOQILDI!</b>\nO'yinchilar ko'pincha yutqazishni boshlaydi.", parse_mode="HTML")
    elif arg in ("off", "0", "false", "ochir", "stop"):
        database.set_evil_mode(False)
        await message.answer("🟢 <b>Evil Mode O'CHIRILDI!</b>\nO'yinlar odatdagi adolatli Provably Fair RNG rejimiga o'tdi.", parse_mode="HTML")
    else:
        current = database.get_evil_mode()
        new_state = not current
        database.set_evil_mode(new_state)
        st = "YOQILDI 🔴" if new_state else "O'CHIRILDI 🟢"
        await message.answer(f"😈 <b>Evil Mode {st}!</b>", parse_mode="HTML")

@dp.message(Command("rng"))
async def rng_cmd(message: types.Message, command: CommandObject):
    if not is_admin(message.from_user.id):
        return
    arg = (command.args or "").strip().lower()
    if arg in ("on", "1", "true", "yoq", "start"):
        database.set_aviator_rng_enabled(True)
        target = database.get_aviator_target()
        await message.answer(f"🎯 <b>Aviator RNG YOQILDI 🔴</b>\nSamolyot {target:.2f}x da uchadi.", parse_mode="HTML")
    elif arg in ("off", "0", "false", "ochir", "stop", "auto", "avto"):
        database.set_aviator_rng_enabled(False)
        await message.answer("🟢 <b>Aviator RNG O'CHIRILDI!</b>\nOdatdagi 1xBet avto RNG faollashdi.", parse_mode="HTML")
    else:
        curr = database.get_aviator_rng_enabled()
        new_state = not curr
        database.set_aviator_rng_enabled(new_state)
        target = database.get_aviator_target()
        st = f"YOQILDI 🔴 ({target:.2f}x)" if new_state else "O'CHIRILDI 🟢 (Avto 1xBet RNG)"
        await message.answer(f"🚀 <b>Aviator RNG {st}!</b>", parse_mode="HTML")

@dp.message(Command("setcrash"))
async def setcrash_cmd(message: types.Message, command: CommandObject):
    if not is_admin(message.from_user.id):
        return
    arg = (command.args or "").strip().lower()
    if not arg:
        ADMIN_AWAITING_INPUT[message.from_user.id] = "aviator_target"
        curr = database.get_aviator_target()
        rng_on = database.get_aviator_rng_enabled()
        curr_str = f"<b>{curr:.2f}x (YOQILGAN 🔴)</b>" if rng_on else f"<b>{curr:.2f}x (O'CHIRILGAN 🟢)</b>"
        await message.answer(
            f"🚀 <b>AVIATOR (CRASH) KOEFFITSIYENTINI BELGILASH:</b>\n\n"
            f"Hozirgi holat: {curr_str}\n\n"
            f"Qaysi koeffitsiyentda (mergeda) uchib ketsin?\n"
            f"Iltimos, sonni chatga yozing (masalan: <code>1.5</code> yoki <code>0.5</code> yoki <code>1.0</code>):\n\n"
            f"Yoki quyidagi tugmalardan birini bosing:",
            parse_mode="HTML",
            reply_markup=get_aviator_keyboard()
        )
        return

    if arg in ("auto", "avto", "reset", "off"):
        database.set_aviator_rng_enabled(False)
        await message.answer("🟢 <b>Aviator: Avto 1xBet RNG yoqildi (Boshqaruv o'chirildi)!</b>", parse_mode="HTML")
        return

    try:
        val = float(arg.replace("x", "").replace(",", "."))
        val = max(0.1, round(val, 2))
        database.set_aviator_target(val)
        database.set_aviator_rng_enabled(True)
        await message.answer(
            f"✅ <b>Aviator RNG YOQILDI 🔴</b>\n\n"
            f"Samolyot endi <b>{val:.2f}x</b> da uchib ketadi!\n"
            f"<i>O'chirish uchun: <code>/rng off</code> yoki <code>/setcrash auto</code></i>",
            parse_mode="HTML"
        )
    except ValueError:
        await message.answer("Foydalanish: <code>/setcrash 1.5</code> yoki <code>/setcrash 0.5</code> yoki <code>/setcrash auto</code>", parse_mode="HTML")

@dp.callback_query(F.data == "admin_toggle_evil")
async def admin_toggle_evil_callback(call: types.CallbackQuery):
    if not is_admin(call.from_user.id):
        await call.answer("Ruxsat yo'q!", show_alert=True)
        return
    current = database.get_evil_mode()
    new_state = not current
    database.set_evil_mode(new_state)
    alert = "😈 Evil Mode YOQILDI! O'yinchilar ko'pincha yutqazadi." if new_state else "🟢 Evil Mode O'CHIRILDI! O'yinlar adolatli RNG rejimiga qaytdi."
    await call.answer(alert, show_alert=True)
    text = render_admin_dashboard()
    try:
        await call.message.edit_text(text, parse_mode="HTML", reply_markup=get_admin_keyboard())
    except Exception:
        pass

@dp.callback_query(F.data == "admin_toggle_aviator_rng")
async def admin_toggle_aviator_rng_callback(call: types.CallbackQuery):
    if not is_admin(call.from_user.id):
        await call.answer("Ruxsat yo'q!", show_alert=True)
        return
    current = database.get_aviator_rng_enabled()
    new_state = not current
    database.set_aviator_rng_enabled(new_state)
    target = database.get_aviator_target()
    msg = f"🎯 Aviator RNG YOQILDI! Samolyot {target:.2f}x da uchadi." if new_state else "🟢 Aviator RNG O'CHIRILDI! Avto 1xBet RNG faol."
    await call.answer(msg, show_alert=True)
    text = render_admin_dashboard()
    try:
        await call.message.edit_text(text, parse_mode="HTML", reply_markup=get_admin_keyboard())
    except Exception:
        pass

@dp.callback_query(F.data == "admin_ask_aviator_target")
async def admin_ask_aviator_target_callback(call: types.CallbackQuery):
    if not is_admin(call.from_user.id):
        await call.answer("Ruxsat yo'q!", show_alert=True)
        return
    ADMIN_AWAITING_INPUT[call.from_user.id] = "aviator_target"
    curr = database.get_aviator_target()
    rng_on = database.get_aviator_rng_enabled()
    curr_str = f"<b>{curr:.2f}x (YOQILGAN 🔴)</b>" if rng_on else f"<b>{curr:.2f}x (O'CHIRILGAN 🟢)</b>"
    text = (
        f"🚀 <b>AVIATOR (CRASH) KOEFFITSIYENTINI BELGILASH:</b>\n\n"
        f"Hozirgi holat: {curr_str}\n\n"
        f"Qaysi koeffitsiyentda (mergeda) uchib ketsin?\n"
        f"Iltimos, sonni chatga yozing:\n"
        f"• Masalan: <code>1.5</code>, <code>1.5x</code>, <code>0.5</code>, <code>1.0</code>, <code>2.0</code> va h.k.\n\n"
        f"Yoki quyidagi tezkor tugmalardan birini tanlang:"
    )
    try:
        await call.message.edit_text(text, parse_mode="HTML", reply_markup=get_aviator_keyboard())
    except Exception:
        pass
    await call.answer()

@dp.callback_query(F.data.startswith("set_crash_"))
async def set_crash_callback(call: types.CallbackQuery):
    if not is_admin(call.from_user.id):
        await call.answer("Ruxsat yo'q!", show_alert=True)
        return
    ADMIN_AWAITING_INPUT.pop(call.from_user.id, None)
    val = call.data.replace("set_crash_", "")
    if val in ("auto", "off"):
        database.set_aviator_rng_enabled(False)
        await call.answer("🟢 Aviator: Avto 1xBet RNG yoqildi!", show_alert=True)
    else:
        try:
            f = float(val)
            database.set_aviator_target(f)
            database.set_aviator_rng_enabled(True)
            await call.answer(f"🎯 Aviator RNG: {f:.2f}x o'rnatildi va YOQILDI!", show_alert=True)
        except ValueError:
            pass

    text = render_admin_dashboard()
    try:
        await call.message.edit_text(text, parse_mode="HTML", reply_markup=get_admin_keyboard())
    except Exception:
        pass

@dp.message(CommandStart())
async def command_start_handler(message: types.Message, command: CommandObject, bot: Bot):
    user_id = message.from_user.id
    if await check_ban(user_id, bot, message.chat.id):
        return

    first_name = message.from_user.first_name or "O'yinchi"
    username = message.from_user.username or ""

    ref_id = None
    if command.args and command.args.startswith("ref_"):
        ref_part = command.args.replace("ref_", "")
        if ref_part.isdigit() and int(ref_part) != user_id:
            ref_id = int(ref_part)

    user, is_new_ref = database.get_or_create_user(user_id, first_name, username, ref_id, return_is_new=True)

    if ref_id and is_new_ref:
        try:
            await bot.send_message(
                chat_id=ref_id,
                text=f"🎉 <b>Yangi do'st qo'shildi!</b>\n\nSizning havolangiz orqali <b>{first_name}</b> birinchi marta botga kirdi. Balansingizga <b>+2 000 UZS</b> bonus qo'shildi! 💰",
                parse_mode="HTML"
            )
        except Exception:
            pass

    live_url = get_live_url()
    launch_url = f"{live_url}?uid={user_id}"
    try:
        if launch_url.lower().startswith("https://"):
            await bot.set_chat_menu_button(
                chat_id=message.chat.id,
                menu_button=MenuButtonWebApp(
                    text="🎮 NVINDIA GAMES",
                    web_app=WebAppInfo(url=launch_url)
                )
            )
    except Exception:
        pass

    bot_info = await bot.get_me()
    ref_link = f"https://t.me/{bot_info.username}?start=ref_{user_id}"

    welcome_text = (
        f"🔥 <b>ASSALOMU ALAYKUM, {first_name.upper()}!</b>\n\n"
        f"🎮 <b>NVINDIA GAMES</b> — Rasmiy Telegram Mini App kazino va o'yinlar portaliga xush kelibsiz!\n\n"
        f"Bizning platformada 1xBet standartidagi 6 ta eng mashhur va ommabop o'yin to'liq real vaqt rejimida mavjud:\n\n"
        f"🕹 <b>TOP 6 TA O'YINLARIMIZ:</b>\n"
        f"• 🛩 <b>Kamikaze</b> — 10 qavatli minora! 1, 2 yoki 3 ta bomba tanlang (x1.23 dan x9346.10 gacha)!\n"
        f"• 🍎 <b>Apple of Fortune</b> — Mashhur olma o'yini! Zaharli va oltin olmalar (x1.23 dan x349.57 gacha)!\n"
        f"• 🚀 <b>Aviator Crash</b> — 5 sekundlik start taymeri va to'liq 1-ga-1 1xBet parvozi!\n"
        f"• 💎 <b>Mines NVINDIA</b> — 5x5 katakli kiber mina maydoni! 1 dan 20 gacha bomba tanlang!\n"
        f"• 🪚 <b>Thimbles</b> — 3 ta oltin stakan va qizil rubin to'p! 1 to'p (x2.80) yoki 2 to'p (x1.40)!\n"
        f"• 🎲 <b>Under / Over 7</b> — 3D suyaklar! 7 dan kam (x2.10), 7 ga teng (x5.20), 7 dan ko'p (x2.10)!\n\n"
        f"💰 <b>Sizning balansingiz:</b> <b>{user['balance']:,} UZS</b>\n"
        f"🎁 <b>Boshlang'ich bonus:</b> Hisobingizga bepul 10 000 UZS berildi!\n\n"
        f"👥 <b>REFERAL DASTURI (+2 000 UZS):</b>\n"
        f"Do'stlaringizni taklif qiling — har bir taklif qilingan do'st uchun hisobingizga naqd <b>+2 000 UZS</b> olasiz!\n"
        f"🔗 <b>Sizning referal havolangiz:</b>\n<code>{ref_link}</code>\n\n"
        f"🎁 <b>BEPUL PROMOKODLAR:</b>\n"
        f"• <code>/promo NVINDIA</code> — <b>+5 000 UZS</b>\n"
        f"• <code>/promo NVIDIA</code> — <b>+4 000 UZS</b>\n"
        f"• <code>/promo 1XBET</code> — <b>+3 000 UZS</b>\n"
        f"• <code>/promo KAMIKAZE</code> — <b>+3 000 UZS</b>\n"
        f"• <code>/promo MINES</code> — <b>+3 000 UZS</b>\n"
        f"• <code>/promo DICE</code> — <b>+2 500 UZS</b>\n"
        f"• <code>/promo APPLE</code> — <b>+2 000 UZS</b>\n"
        f"• <code>/promo BONUS</code> — <b>+1 500 UZS</b>\n\n"
        f"🎯 <b>KUNLIK VAZIFALAR:</b>\n"
        f"Har kuni yangilanib turadigan vazifalarni bajaring va balansingizni muntazam oshiring!\n\n"
        f"🛡 <b>PROVABLY FAIR RNG (SHA-256):</b>\n"
        f"Barcha natijalar kriptografik SHA-256 xeshi asosida chiqariladi va hech kim tomonidan o'zgartirilishi mumkin emas!\n\n"
        f"👇 <b>O'ynash uchun quyidagi 'NVINDIA GAMES O'YINLARINI OCHISH' tugmasini bosing:</b>"
    ).replace(",", " ")

    try:
        await message.answer(
            text=welcome_text,
            parse_mode="HTML",
            reply_markup=get_main_keyboard(user_id)
        )
    except Exception:
        fallback_kb = InlineKeyboardMarkup(
            inline_keyboard=[
                [InlineKeyboardButton(text="🎮 NVINDIA GAMES O'YINLARINI OCHISH", url=launch_url)],
                [
                    InlineKeyboardButton(text="👥 Do'stlarni taklif qilish (+2 000)", callback_data="ref_info"),
                    InlineKeyboardButton(text="🎯 Kunlik vazifalar", callback_data="tasks_info")
                ],
                [
                    InlineKeyboardButton(text="🎁 Promokodlar", callback_data="promo_info"),
                    InlineKeyboardButton(text="💰 Mening balansim", callback_data="my_balance")
                ],
                [
                    InlineKeyboardButton(text="🛡️ Adolatli RNG (SHA-256)", callback_data="provably_info"),
                    InlineKeyboardButton(text="📖 Qo'llanma & Qoidalar", callback_data="rules_info")
                ]
            ]
        )
        await message.answer(
            text=welcome_text,
            parse_mode="HTML",
            reply_markup=fallback_kb
        )

@dp.message(Command("balance"))
async def balance_cmd(message: types.Message, bot: Bot):
    if await check_ban(message.from_user.id, bot, message.chat.id):
        return
    user = database.get_or_create_user(message.from_user.id)
    await message.answer(f"💰 <b>Joriy balansingiz:</b> {user['balance']:,} UZS".replace(",", " "), parse_mode="HTML")

@dp.message(Command("promo"))
async def promo_cmd(message: types.Message, command: CommandObject, bot: Bot):
    if await check_ban(message.from_user.id, bot, message.chat.id):
        return
    if not command.args:
        await message.answer(
            "Iltimos, promokodni yozing. Masalan:\n"
            "• <code>/promo NVINDIA</code> (+5 000 UZS)\n"
            "• <code>/promo NVIDIA</code> (+4 000 UZS)\n"
            "• <code>/promo 1XBET</code> (+3 000 UZS)\n"
            "• <code>/promo KAMIKAZE</code> (+3 000 UZS)\n"
            "• <code>/promo MINES</code> (+3 000 UZS)\n"
            "• <code>/promo DICE</code> (+2 500 UZS)\n"
            "• <code>/promo APPLE</code> (+2 000 UZS)\n"
            "• <code>/promo BONUS</code> (+1 500 UZS)",
            parse_mode="HTML"
        )
        return

    ok, res = database.use_promocode(message.from_user.id, command.args)
    if ok:
        await message.answer(f"🎉 <b>Muvaffaqiyatli!</b>\nPromokod faollashtirildi: +{res:,} UZS balansingizga qo'shildi! 🎁".replace(",", " "), parse_mode="HTML")
    else:
        await message.answer(f"❌ <b>Xatolik:</b> {res}", parse_mode="HTML")

@dp.message(Command("tasks"))
async def tasks_cmd(message: types.Message, bot: Bot):
    if await check_ban(message.from_user.id, bot, message.chat.id):
        return
    tasks = database.get_user_tasks(message.from_user.id)
    text = "🎯 <b>BUGUNGI KUNLIK VAZIFALAR:</b>\n\n"
    for t in tasks:
        icon = "✅" if t["claimed"] else ("🎁" if t["completed"] else "⏳")
        text += f"{icon} <b>{t['title']}</b> (+{t['reward']:,} UZS)\n"
        text += f"   Progress: {t['current_val']}/{t['target_val']}\n\n"
    text += "<i>Mukofotlarni Mini App ichidagi 'Vazifalar' bo'limida bir bosishda yig'ib olishingiz mumkin!</i>"
    await message.answer(text.replace(",", " "), parse_mode="HTML")

@dp.message(Command("ref"))
async def ref_cmd(message: types.Message, bot: Bot):
    if await check_ban(message.from_user.id, bot, message.chat.id):
        return
    bot_info = await bot.get_me()
    ref_link = f"https://t.me/{bot_info.username}?start=ref_{message.from_user.id}"
    user = database.get_or_create_user(message.from_user.id)
    text = (
        f"👥 <b>DO'STLARNI TAKLIF QILISH TIZIMI</b>\n\n"
        f"Har bir taklif qilingan do'stingiz uchun sizga naqd <b>+2 000 UZS</b> beriladi!\n"
        f"Do'stingiz ham ro'yxatdan o'tganda boshlang'ich 10 000 UZS bonus oladi.\n\n"
        f"📊 <b>Statistikangiz:</b>\n"
        f"• Taklif qilingan do'stlar: <b>{user['invited_count']} ta</b>\n"
        f"• Jami ishlangan bonus: <b>{user['total_earned_ref']:,} UZS</b>\n\n"
        f"🔗 <b>Sizning shaxsiy havolangiz:</b>\n<code>{ref_link}</code>"
    ).replace(",", " ")
    await message.answer(text, parse_mode="HTML")

@dp.message(Command("help"))
async def help_cmd(message: types.Message, bot: Bot):
    if await check_ban(message.from_user.id, bot, message.chat.id):
        return
    text = (
        "📖 <b>NVINDIA GAMES QO'LLANMASI:</b>\n\n"
        "🎮 <b>O'yinlar:</b>\n"
        "1. <b>Kamikaze:</b> 10 qavatli minora. 1, 2 yoki 3 ta bomba tanlang. Har to'g'ri katak koeffitsiyentni oshiradi. Istalgan payt 'Yutuqni olish' mumkin!\n"
        "2. <b>Apple of Fortune:</b> 10 qavatli olma terish. Qizil olmalar yutuq keltiradi, zaharli olma portlatadi!\n"
        "3. <b>Aviator / Crash:</b> 5 sekundlik start taymeri, so'ngra samolyot havoga ko'tariladi. Koeffitsiyent o'sib boradi. Samolyot uchib ketishidan oldin yutuqni oling!\n"
        "4. <b>Mines NVINDIA:</b> 5x5 katakli kiber maydon. Bombalar sonini tanlab olmoslarni oching!\n"
        "5. <b>Thimbles:</b> 3 ta stakan va to'plar aralashadi. 1 to'p (x2.80) yoki 2 to'p (x1.40)!\n"
        "6. <b>Under / Over 7:</b> 3D toshlar yig'indisini taxmin qiling (x2.10 dan x5.20 gacha)!\n\n"
        "👥 <b>Do'stlarni taklif qilish:</b>\n"
        "Har bir do'st uchun hisobingizga +2 000 UZS qo'shiladi.\n\n"
        "🛡️ <b>Provably Fair:</b>\n"
        "Har bir o'yin SHA-256 kriptografik xesh orqali himoyalangan, hech kim o'zgartira olmaydi!\n\n"
        "📌 <b>Buyruqlar:</b>\n"
        "• /balance — Balansni tekshirish\n"
        "• /promo KOD — Promokod kiritish\n"
        "• /tasks — Kunlik vazifalar\n"
        "• /ref — Referal havola\n"
        "• /admin — Boshqaruv paneli (faqat admin uchun)"
    )
    await message.answer(text, parse_mode="HTML")

@dp.callback_query(F.data == "ref_info")
async def ref_callback(call: types.CallbackQuery, bot: Bot):
    if await check_ban(call.from_user.id, bot, call.message.chat.id):
        await call.answer("Hisobingiz bloklangan!", show_alert=True)
        return
    bot_info = await bot.get_me()
    ref_link = f"https://t.me/{bot_info.username}?start=ref_{call.from_user.id}"
    user = database.get_or_create_user(call.from_user.id)
    text = (
        f"👥 <b>DO'STLARNI TAKLIF QILISH TIZIMI</b>\n\n"
        f"Har bir taklif qilingan do'stingiz uchun sizga <b>+2 000 UZS</b> beriladi!\n"
        f"Do'stingiz ham ro'yxatdan o'tganda boshlang'ich bonus oladi.\n\n"
        f"📊 <b>Statistikangiz:</b>\n"
        f"• Taklif qilingan do'stlar: <b>{user['invited_count']} ta</b>\n"
        f"• Jami ishlangan bonus: <b>{user['total_earned_ref']:,} UZS</b>\n\n"
        f"🔗 <b>Sizning shaxsiy havolangiz:</b>\n<code>{ref_link}</code>"
    ).replace(",", " ")
    await call.message.answer(text, parse_mode="HTML")
    await call.answer()

@dp.callback_query(F.data == "tasks_info")
async def tasks_callback(call: types.CallbackQuery, bot: Bot):
    if await check_ban(call.from_user.id, bot, call.message.chat.id):
        await call.answer("Hisobingiz bloklangan!", show_alert=True)
        return
    tasks = database.get_user_tasks(call.from_user.id)
    text = "🎯 <b>BUGUNGI KUNLIK VAZIFALAR:</b>\n\n"
    for t in tasks:
        icon = "✅" if t["claimed"] else ("🎁" if t["completed"] else "⏳")
        text += f"{icon} <b>{t['title']}</b> (+{t['reward']:,} UZS)\n"
        text += f"   Progress: {t['current_val']}/{t['target_val']}\n\n"
    text += "<i>Vazifalar mukofotini Mini App ichidagi 'Vazifalar' bo'limida yig'ib olishingiz mumkin!</i>"
    await call.message.answer(text.replace(",", " "), parse_mode="HTML")
    await call.answer()

@dp.callback_query(F.data == "promo_info")
async def promo_callback(call: types.CallbackQuery, bot: Bot):
    if await check_ban(call.from_user.id, bot, call.message.chat.id):
        await call.answer("Hisobingiz bloklangan!", show_alert=True)
        return
    await call.message.answer(
        "🎁 <b>Promokod ishlatish uchun:</b>\n"
        "Shu chatga <code>/promo KOD</code> deb yuboring yoki Mini App ichidagi <b>Promokod</b> bo'limiga kiriting!\n\n"
        "Mavjud promokodlar:\n"
        "• <code>/promo NVINDIA</code> (+5 000 UZS)\n"
        "• <code>/promo NVIDIA</code> (+4 000 UZS)\n"
        "• <code>/promo 1XBET</code> (+3 000 UZS)\n"
        "• <code>/promo KAMIKAZE</code> (+3 000 UZS)\n"
        "• <code>/promo MINES</code> (+3 000 UZS)\n"
        "• <code>/promo DICE</code> (+2 500 UZS)\n"
        "• <code>/promo APPLE</code> (+2 000 UZS)\n"
        "• <code>/promo BONUS</code> (+1 500 UZS)",
        parse_mode="HTML"
    )
    await call.answer()

@dp.callback_query(F.data == "my_balance")
async def balance_callback(call: types.CallbackQuery, bot: Bot):
    if await check_ban(call.from_user.id, bot, call.message.chat.id):
        await call.answer("Hisobingiz bloklangan!", show_alert=True)
        return
    user = database.get_or_create_user(call.from_user.id)
    await call.message.answer(f"💰 <b>Joriy balansingiz:</b> {user['balance']:,} UZS".replace(",", " "), parse_mode="HTML")
    await call.answer()

@dp.callback_query(F.data == "provably_info")
async def provably_callback(call: types.CallbackQuery, bot: Bot):
    if await check_ban(call.from_user.id, bot, call.message.chat.id):
        await call.answer("Hisobingiz bloklangan!", show_alert=True)
        return
    text = (
        "🛡️ <b>PROVABLY FAIR (ADOLATLI RNG):</b>\n\n"
        "NVINDIA GAMES platformasidagi har bir o'yin natijasi kriptografik SHA-256 xeshi orqali oldindan belgilanadi.\n\n"
        "• Server yoki admin o'yin jarayonida natijani o'zgartira olmaydi.\n"
        "• Har bir raund xeshini Mini App ichidagi qalqon 🛡️ tugmasini bosib tekshirishingiz mumkin!"
    )
    await call.message.answer(text, parse_mode="HTML")
    await call.answer()

@dp.callback_query(F.data == "rules_info")
async def rules_callback(call: types.CallbackQuery, bot: Bot):
    if await check_ban(call.from_user.id, bot, call.message.chat.id):
        await call.answer("Hisobingiz bloklangan!", show_alert=True)
        return
    text = (
        "📖 <b>6 TA O'YINNING TO'LIQ QOIDALARI:</b>\n\n"
        "1. 🛩 <b>Kamikaze:</b> 10 qavatdan iborat samolyot minorasi. Bombalar sonini (1, 2, 3) tanlang. Har safar xavfsiz katak koeffitsiyentni oshiradi. Istalgan vaqt 'YUTUQNI OLISH' mumkin.\n\n"
        "2. 🍎 <b>Apple of Fortune:</b> 10 qator, har birida 5 ta bochka. Qizil butun olma yutuq, kemirilgan zaharli olma esa mag'lubiyat keltiradi.\n\n"
        "3. 🚀 <b>Aviator Crash:</b> 5 sekundlik start taymeri. Samolyot havoga ko'tariladi va multiplikator uzluksiz o'sadi. Samolyot uchib ketishidan oldin yutuqni naqdlashtiring!\n\n"
        "4. 💎 <b>Mines NVINDIA:</b> 5x5 katakli (25 ta katak) mina maydoni. 1 dan 20 gacha mina tanlang. Olmoslarni oching va istalgan vaqtda yutuqni oling!\n\n"
        "5. 🪚 <b>Thimbles:</b> 3 ta oltin stakan aralashtiriladi. 1 ta to'p (x2.80) yoki 2 ta to'p (x1.40) rejimi. To'p yashiringan stakanni toping!\n\n"
        "6. 🎲 <b>Under / Over 7:</b> Ikkita 3D suyak tashlanadi. Yig'indini taxmin qiling: 7 dan kam (x2.10), 7 ga teng (x5.20) yoki 7 dan ko'p (x2.10)!"
    )
    await call.message.answer(text, parse_mode="HTML")
    await call.answer()

async def main():
    database.init_db()

    server_thread = threading.Thread(target=server.run_server, args=(PORT,), daemon=True)
    server_thread.start()
    live_url = get_live_url()
    print("=" * 60)
    print(f"🚀 NVINDIA GAMES Yagona Ishga Tushirish Markazi!")
    print(f"🌐 Backend Server porti: {PORT} (0.0.0.0)")
    print(f"🔗 Jonli WebApp URL: {live_url}")
    print(f"👑 Admin ID: {ADMIN_ID}")
    print("=" * 60)

    if not BOT_TOKEN:
        print("\n❌ Xatolik: BOT_TOKEN topilmadi! Web server davom etmoqda...\n")
        while True:
            await asyncio.sleep(3600)
        return

    bot = Bot(token=BOT_TOKEN)
    print(f"🤖 NVINDIA GAMES Telegram Bot ishga tushmoqda...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        pass
