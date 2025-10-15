import "dotenv/config";
import fetch from "node-fetch";
import { Telegraf, Markup } from "telegraf";
import express from "express";

const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_ID = process.env.ADMIN_ID;
let waitingForReply = {};

// 🟢 Start
bot.start((ctx) => {
  ctx.reply(
    "Assalomu alaykum! 😊\nBu bot orqali o'z fikr va takliflaringizni yozib qoldirishingiz mumkin."
  );
});

// 📨 Xabarlar
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
    const msg = `📬 *Yangi xabar keldi!*\n\n👤 Foydalanuvchi: @${
      user.username || "Anonim"
    }\n🆔 ID: ${user.id}\n💬 Xabar: ${text}`;

    await bot.telegram.sendMessage(ADMIN_ID, msg, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("✉️ Javob yozish", `reply_${user.id}`)],
      ]),
    });

    await ctx.reply(
      "✅ Fikringiz uchun rahmat! Admin sizga tez orada javob beradi."
    );
  }
});

// 💬 Callback
bot.on("callback_query", async (ctx) => {
  const data = ctx.callbackQuery.data;
  if (data.startsWith("reply_")) {
    const userId = data.split("_")[1];
    waitingForReply[ADMIN_ID] = userId;
    await ctx.answerCbQuery();
    await ctx.reply(
      `✍️ Endi foydalanuvchiga yozmoqchi bo‘lgan javobingizni yuboring.\nFoydalanuvchi ID: ${userId}`
    );
  }
});

// 🚀 Botni ishga tushiramiz
bot.launch();
console.log("🤖 Bot ishga tushdi!");

// 🌐 Express server
const app = express();
app.get("/", (req, res) => res.send("Bot ishlayapti ✅"));
app.listen(process.env.PORT || 3000, () => {
  console.log(`✅ Web server ishga tushdi portda: ${process.env.PORT || 3000}`);
});

// 🔄 Auto-ping (Render Free tarif uchun)
if (process.env.WEBHOOK_URL) {
  setInterval(() => {
    fetch(`${process.env.WEBHOOK_URL}/`)
      .then(() =>
        console.log("🔄 Auto-ping yuborildi:", new Date().toLocaleString())
      )
      .catch((err) => console.error("❌ Auto-ping xato:", err));
  }, 10 * 60 * 1000);
}
