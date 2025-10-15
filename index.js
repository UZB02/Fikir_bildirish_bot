import "dotenv/config";
import express from "express";
import fetch from "node-fetch";
import { Telegraf, Markup } from "telegraf";

const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_ID = process.env.ADMIN_ID;
const app = express();

let waitingForReply = {};

// 🟢 Start
bot.start((ctx) => {
  ctx.reply(
    "Assalomu alaykum! 😊\nBu bot orqali o'z fikr va takliflaringizni yozib qoldirishingiz mumkin."
  );
});

// 🟡 Xabarlar
bot.on("message", async (ctx) => {
  const user = ctx.from;
  const text = ctx.message.text;

  if (String(user.id) === ADMIN_ID && waitingForReply[ADMIN_ID]) {
    const targetUserId = waitingForReply[ADMIN_ID];
    try {
      await bot.telegram.sendMessage(targetUserId, `📩 Admin javobi:\n${text}`);
      await ctx.reply("✅ Javob foydalanuvchiga yuborildi!");
      delete waitingForReply[ADMIN_ID];
    } catch {
      await ctx.reply("❌ Xatolik: foydalanuvchiga xabar yuborib bo‘lmadi.");
    }
    return;
  }

  if (String(user.id) !== ADMIN_ID) {
    const msg = `📬 Yangi xabar!\n\n👤 @${user.username || "Anonim"}\n🆔 ${
      user.id
    }\n💬 ${text}`;
    await bot.telegram.sendMessage(
      ADMIN_ID,
      msg,
      Markup.inlineKeyboard([
        [Markup.button.callback("✉️ Javob yozish", `reply_${user.id}`)],
      ])
    );
    await ctx.reply("✅ Fikringiz uchun rahmat!");
  }
});

// 💬 Callback
bot.on("callback_query", async (ctx) => {
  ctx.answerCbQuery().catch(() => {});
  const data = ctx.callbackQuery.data;
  if (data.startsWith("reply_")) {
    const userId = data.split("_")[1];
    waitingForReply[ADMIN_ID] = userId;
    await ctx.reply(
      `✍️ Endi foydalanuvchiga yozmoqchi bo‘lgan javobingizni yuboring.\nFoydalanuvchi ID: ${userId}`
    );
  }
});

// 🌐 Express server
app.get("/", (req, res) => res.send("Bot ishlayapti ✅"));
app.use(express.json());
app.use(bot.webhookCallback(`/secret-path`)); // ⚡ secret path

const PORT = process.env.PORT || 10000;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

// 🧩 Webhook o‘rnatish
bot.telegram.setWebhook(`${WEBHOOK_URL}/secret-path`);

app.listen(PORT, () => {
  console.log(`✅ Server ishlayapti: ${PORT}`);
});

// === Auto-ping (Render Free tarifida uxlab qolmasligi uchun) ===
if (WEBHOOK_URL) {
  setInterval(() => {
    fetch(`${WEBHOOK_URL}/`)
      .then(() =>
        console.log("🔄 Auto-ping yuborildi:", new Date().toLocaleString())
      )
      .catch((err) => console.error("❌ Auto-ping xato:", err));
  }, 10 * 60 * 1000);
}
