import os
import sys
import asyncio
import logging
import threading
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart, Command, CommandObject
from aiogram.types import (
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    WebAppInfo,
    MenuButtonWebApp
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

def get_live_url() -> str:
    render_url = os.getenv("RENDER_EXTERNAL_URL", "").strip().rstrip("/")
    if render_url:
        if not render_url.startswith("http://") and not render_url.startswith("https://"):
            render_url = f"https://{render_url}"
        database.set_setting("webapp_url", render_url)
        return render_url

    render_host = os.getenv("RENDER_EXTERNAL_HOSTNAME", "").strip().rstrip("/")
    if render_host:
        u = f"https://{render_host}"
        database.set_setting("webapp_url", u)
        return u

    render_svc = os.getenv("RENDER_SERVICE_NAME", "").strip()
    if render_svc:
        u = f"https://{render_svc}.onrender.com"
        database.set_setting("webapp_url", u)
        return u

    db_url = database.get_setting("webapp_url", "").strip().rstrip("/")
    if db_url and not db_url.startswith("http://localhost") and not db_url.startswith("http://127.0.0.1"):
        return db_url

    env_url = os.getenv("WEBAPP_URL", "").strip().rstrip("/")
    if env_url and not env_url.startswith("http://localhost") and not env_url.startswith("http://127.0.0.1"):
        return env_url

    if db_url:
        return db_url
    if env_url:
        return env_url
    return f"http://localhost:{PORT}"

dp = Dispatcher()

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
                InlineKeyboardButton(text="👥 Do'stlarni taklif qilish (+5 000)", callback_data="ref_info"),
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

@dp.message(CommandStart())
async def command_start_handler(message: types.Message, command: CommandObject, bot: Bot):
    user_id = message.from_user.id
    first_name = message.from_user.first_name or "O'yinchi"
    username = message.from_user.username or ""

    ref_id = None
    if command.args and command.args.startswith("ref_"):
        ref_part = command.args.replace("ref_", "")
        if ref_part.isdigit() and int(ref_part) != user_id:
            ref_id = int(ref_part)

    user = database.get_or_create_user(user_id, first_name, username, ref_id)

    if ref_id:
        try:
            await bot.send_message(
                chat_id=ref_id,
                text=f"🎉 <b>Yangi do'st qo'shildi!</b>\n\nSizning havolangiz orqali <b>{first_name}</b> botga kirdi. Balansingizga <b>+5 000 UZS</b> bonus qo'shildi! 💰",
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
        f"• 💎 <b>Mines NVINDIA</b> — 5x5 katakli kiber mina maydoni! 1 dan 20 gacha bomba tanlang (x24.0+)!\n"
        f"• 🪚 <b>Thimbles</b> — 3 ta oltin stakan va qizil rubin to'p! 1 to'p (x2.91) yoki 2 to'p (x1.45)!\n"
        f"• 🎲 <b>Under / Over 7</b> — 3D suyaklar! 7 dan kam (x2.30), 7 ga teng (x5.80), 7 dan ko'p (x2.30)!\n\n"
        f"💰 <b>Sizning balansingiz:</b> <b>{user['balance']:,} UZS</b>\n"
        f"🎁 <b>Boshlang'ich bonus:</b> Hisobingizga bepul 50 000 UZS berildi!\n\n"
        f"👥 <b>REFERAL DASTURI (+5 000 UZS):</b>\n"
        f"Pulingiz tugadimi yoki ko'paytirmoqchimisiz? Do'stingizni taklif qiling — har bir taklif qilingan do'st uchun hisobingizga naqd <b>+5 000 UZS</b> olasiz!\n"
        f"🔗 <b>Sizning referal havolangiz:</b>\n<code>{ref_link}</code>\n\n"
        f"🎁 <b>BEPUL PROMOKODLAR:</b>\n"
        f"• <code>/promo NVINDIA</code> — <b>+25 000 UZS</b>\n"
        f"• <code>/promo NVIDIA</code> — <b>+20 000 UZS</b>\n"
        f"• <code>/promo MINES</code> — <b>+20 000 UZS</b>\n"
        f"• <code>/promo KAMIKAZE</code> — <b>+20 000 UZS</b>\n"
        f"• <code>/promo 1XBET</code> — <b>+15 000 UZS</b>\n"
        f"• <code>/promo BONUS5000</code> — <b>+5 000 UZS</b>\n\n"
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
                    InlineKeyboardButton(text="👥 Do'stlarni taklif qilish (+5 000)", callback_data="ref_info"),
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
async def balance_cmd(message: types.Message):
    user = database.get_or_create_user(message.from_user.id)
    await message.answer(f"💰 <b>Joriy balansingiz:</b> {user['balance']:,} UZS".replace(",", " "), parse_mode="HTML")

@dp.message(Command("promo"))
async def promo_cmd(message: types.Message, command: CommandObject):
    if not command.args:
        await message.answer(
            "Iltimos, promokodni yozing. Masalan:\n"
            "• <code>/promo NVINDIA</code> (+25 000 UZS)\n"
            "• <code>/promo NVIDIA</code> (+20 000 UZS)\n"
            "• <code>/promo 1XBET</code> (+15 000 UZS)\n"
            "• <code>/promo KAMIKAZE</code> (+20 000 UZS)\n"
            "• <code>/promo APPLE</code> (+10 000 UZS)\n"
            "• <code>/promo BONUS5000</code> (+5 000 UZS)",
            parse_mode="HTML"
        )
        return

    ok, res = database.use_promocode(message.from_user.id, command.args)
    if ok:
        await message.answer(f"🎉 <b>Muvaffaqiyatli!</b>\nPromokod faollashtirildi: +{res:,} UZS balansingizga qo'shildi! 🎁".replace(",", " "), parse_mode="HTML")
    else:
        await message.answer(f"❌ <b>Xatolik:</b> {res}", parse_mode="HTML")

@dp.message(Command("tasks"))
async def tasks_cmd(message: types.Message):
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
    bot_info = await bot.get_me()
    ref_link = f"https://t.me/{bot_info.username}?start=ref_{message.from_user.id}"
    user = database.get_or_create_user(message.from_user.id)
    text = (
        f"👥 <b>DO'STLARNI TAKLIF QILISH TIZIMI</b>\n\n"
        f"Har bir taklif qilingan do'stingiz uchun sizga naqd <b>+5 000 UZS</b> beriladi!\n"
        f"Do'stingiz ham ro'yxatdan o'tganda boshlang'ich 50 000 UZS bonus oladi.\n\n"
        f"📊 <b>Statistikangiz:</b>\n"
        f"• Taklif qilingan do'stlar: <b>{user['invited_count']} ta</b>\n"
        f"• Jami ishlangan bonus: <b>{user['total_earned_ref']:,} UZS</b>\n\n"
        f"🔗 <b>Sizning shaxsiy havolangiz:</b>\n<code>{ref_link}</code>"
    ).replace(",", " ")
    await message.answer(text, parse_mode="HTML")

@dp.message(Command("help"))
async def help_cmd(message: types.Message):
    text = (
        "📖 <b>NVINDIA GAMES QO'LLANMASI:</b>\n\n"
        "🎮 <b>O'yinlar:</b>\n"
        "1. <b>Kamikaze:</b> 10 qavatli minora. 1, 2 yoki 3 ta bomba tanlang. Har to'g'ri katak koeffitsiyentni oshiradi. Istalgan payt 'Yutuqni olish' mumkin!\n"
        "2. <b>Apple of Fortune:</b> 10 qavatli olma terish. Qizil olmalar yutuq keltiradi, zaharli olma portlatadi!\n"
        "3. <b>Aviator / Crash:</b> 5 sekundlik start taymeri, so'ngra samolyot havoga ko'tariladi. Koeffitsiyent o'sib boradi. Samolyot uchib ketishidan oldin yutuqni oling!\n\n"
        "👥 <b>Do'stlarni taklif qilish:</b>\n"
        "Har bir do'st uchun hisobingizga +5 000 UZS qo'shiladi.\n\n"
        "🛡️ <b>Provably Fair:</b>\n"
        "Har bir o'yin SHA-256 kriptografik xesh orqali himoyalangan, hech kim o'zgartira olmaydi!\n\n"
        "📌 <b>Buyruqlar:</b>\n"
        "• /balance — Balansni tekshirish\n"
        "• /promo KOD — Promokod kiritish\n"
        "• /tasks — Kunlik vazifalar\n"
        "• /ref — Referal havola"
    )
    await message.answer(text, parse_mode="HTML")

@dp.message(Command("newpromo"))
async def newpromo_cmd(message: types.Message, command: CommandObject):
    if ADMIN_ID != 0 and message.from_user.id != ADMIN_ID:
        return

    args = (command.args or "").split()
    if len(args) < 2:
        await message.answer("Foydalanish: <code>/newpromo KOD SUMMA [ISHLATISH_SONI]</code>\nMasalan: <code>/newpromo NVVIP 50000 50</code>", parse_mode="HTML")
        return

    code = args[0]
    amount = int(args[1])
    uses = int(args[2]) if len(args) > 2 else 100

    database.create_promocode(code, amount, uses)
    await message.answer(f"✅ Promokod yaratildi:\nKod: <b>{code.upper()}</b>\nSumma: <b>{amount:,} UZS</b>\nSoni: <b>{uses}</b>".replace(",", " "), parse_mode="HTML")

@dp.message(Command("seturl"))
async def seturl_cmd(message: types.Message, command: CommandObject):
    if ADMIN_ID != 0 and message.from_user.id != ADMIN_ID:
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
    new_url = command.args.strip().rstrip("/")
    if not new_url.startswith("http://") and not new_url.startswith("https://"):
        new_url = f"https://{new_url}"
    database.set_setting("webapp_url", new_url)
    await message.answer(
        f"✅ <b>Jonli WebApp havolasi muvaffaqiyatli saqlandi!</b>\n\n"
        f"Yangi havola: <code>{new_url}</code>\n"
        f"Endi barcha tugmalar va Mini App ushbu Render havolasi orqali ochiladi!",
        parse_mode="HTML"
    )

@dp.callback_query(F.data == "ref_info")
async def ref_callback(call: types.CallbackQuery, bot: Bot):
    bot_info = await bot.get_me()
    ref_link = f"https://t.me/{bot_info.username}?start=ref_{call.from_user.id}"
    user = database.get_or_create_user(call.from_user.id)
    text = (
        f"👥 <b>DO'STLARNI TAKLIF QILISH TIZIMI</b>\n\n"
        f"Har bir taklif qilingan do'stingiz uchun sizga <b>+5 000 UZS</b> beriladi!\n"
        f"Do'stingiz ham ro'yxatdan o'tganda boshlang'ich bonus oladi.\n\n"
        f"📊 <b>Statistikangiz:</b>\n"
        f"• Taklif qilingan do'stlar: <b>{user['invited_count']} ta</b>\n"
        f"• Jami ishlangan bonus: <b>{user['total_earned_ref']:,} UZS</b>\n\n"
        f"🔗 <b>Sizning shaxsiy havolangiz:</b>\n<code>{ref_link}</code>"
    ).replace(",", " ")
    await call.message.answer(text, parse_mode="HTML")
    await call.answer()

@dp.callback_query(F.data == "tasks_info")
async def tasks_callback(call: types.CallbackQuery):
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
async def promo_callback(call: types.CallbackQuery):
    await call.message.answer(
        "🎁 <b>Promokod ishlatish uchun:</b>\n"
        "Shu chatga <code>/promo KOD</code> deb yuboring yoki Mini App ichidagi <b>Promokod</b> bo'limiga kiriting!\n\n"
        "Mavjud promokodlar:\n"
        "• <code>/promo NVINDIA</code> (+25 000 UZS)\n"
        "• <code>/promo NVIDIA</code> (+20 000 UZS)\n"
        "• <code>/promo KAMIKAZE</code> (+20 000 UZS)\n"
        "• <code>/promo 1XBET</code> (+15 000 UZS)\n"
        "• <code>/promo APPLE</code> (+10 000 UZS)\n"
        "• <code>/promo BONUS5000</code> (+5 000 UZS)",
        parse_mode="HTML"
    )
    await call.answer()

@dp.callback_query(F.data == "my_balance")
async def balance_callback(call: types.CallbackQuery):
    user = database.get_or_create_user(call.from_user.id)
    await call.message.answer(f"💰 <b>Joriy balansingiz:</b> {user['balance']:,} UZS".replace(",", " "), parse_mode="HTML")
    await call.answer()

@dp.callback_query(F.data == "provably_info")
async def provably_callback(call: types.CallbackQuery):
    text = (
        "🛡️ <b>PROVABLY FAIR (ADOLATLI RNG):</b>\n\n"
        "NVINDIA GAMES platformasidagi har bir o'yin natijasi kriptografik SHA-256 xeshi orqali oldindan belgilanadi.\n\n"
        "• Server yoki admin o'yin jarayonida natijani o'zgartira olmaydi.\n"
        "• Har bir raund xeshini Mini App ichidagi qalqon 🛡️ tugmasini bosib tekshirishingiz mumkin!"
    )
    await call.message.answer(text, parse_mode="HTML")
    await call.answer()

@dp.callback_query(F.data == "rules_info")
async def rules_callback(call: types.CallbackQuery):
    text = (
        "📖 <b>6 TA O'YINNING TO'LIQ QOIDALARI:</b>\n\n"
        "1. 🛩 <b>Kamikaze:</b> 10 qavatdan iborat samolyot minorasi. Bombalar sonini (1, 2, 3) o'zingiz tanlaysiz. Har safar xavfsiz katak topilganda koeffitsiyent ko'tariladi (x1.23 dan x9346.10 gacha). Istalgan vaqt 'YUTUQNI OLISH' mumkin.\n\n"
        "2. 🍎 <b>Apple of Fortune:</b> 10 qator, har birida 5 ta bochka. Qizil butun olma yutuq (x1.23 dan x349.57 gacha), kemirilgan zaharli olma esa mag'lubiyat keltiradi.\n\n"
        "3. 🚀 <b>Aviator Crash:</b> 5 sekundlik start taymeri. Samolyot havoga ko'tariladi va multiplikator uzluksiz o'sadi. Samolyot uchib ketishidan oldin yutuqni naqdlashtiring!\n\n"
        "4. 💎 <b>Mines NVINDIA:</b> 5x5 katakli (25 ta katak) mina maydoni. 1 dan 20 gacha mina tanlang. Har bir ochilgan olmos ko'paytmani oshiradi. Istalgan vaqtda yutuqni olishingiz mumkin!\n\n"
        "5. 🪚 <b>Thimbles:</b> 3 ta oltin stakan aralashtiriladi. 1 ta to'p (x2.91) yoki 2 ta to'p (x1.45) rejimi. To'p yashiringan stakanni toping!\n\n"
        "6. 🎲 <b>Under / Over 7:</b> Ikkita 3D suyak tashlanadi. Yig'indini taxmin qiling: 7 dan kam (x2.30), 7 ga teng (x5.80) yoki 7 dan ko'p (x2.30)!"
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
