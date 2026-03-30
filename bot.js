const { Telegraf } = require("telegraf");

// 1. Bot token va admin ID (bunda siznikiki)
const BOT_TOKEN = "8535086929:AAFca0xPqLHHstkPi88qpzdV51re2ozbV6E"; // BotFather dan
const ADMIN_ID = 1999635628; // Sizning Telegram ID

// 2. Tariflar narxlari
const PRICES = {
  "1_month": { label: "1 месяц", price: "75 ₽" },
  "3_months": { label: "3 месяца", price: "200 ₽" },
  "6_months": { label: "6 месяцев", price: "350 ₽" },
};

// 3. Sberbank to'lov havolasi
const SBP_URL =
  "https://www.sberbank.ru/ru/choise_bank?requisiteNumber=79990402614&bankCode=100000000111";

// 4. VPN kalit havolasi (bitta umumiy)
const VPN_KEY_LINK =
  "https://hirbilon.net/open?sub_url=https://g3.hirbilon.net:443/yessub/p5ln8k1qld9nf0sa";

// 5. Botni yaratish
const bot = new Telegraf(BOT_TOKEN);

// 6. /start komandasi
bot.start((ctx) => {
  const welcomeText = `Привет! 🌐 Это VPN-бот.\n\nВыберите тариф:`;

  ctx.reply(welcomeText, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: `1 месяц – 75 ₽`, callback_data: "1_month" },
        ],
        [
          { text: `3 месяца – 200 ₽`, callback_data: "3_months" },
        ],
        [
          { text: `6 месяцев – 350 ₽`, callback_data: "6_months" },
        ],
      ],
    },
  });
});

// 7. Tariflar menyusi
["1_month", "3_months", "6_months"].forEach((key) => {
  const plan = PRICES[key];
  bot.action(key, (ctx) => {
    const text = `Тариф: *${plan.label}*\nК оплате: *${plan.price}*\n\nВыберите способ оплаты:`;

    ctx.editMessageText(text, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Оплатить SBP (Sberbank)", callback_data: `pay_sbp_${key}` },
          ],
          [
            { text: "Оплатить TON (USDT)", callback_data: `pay_ton_${key}` },
          ],
          [{ text: "Назад", callback_data: "back_to_plans" }],
        ],
      },
    });
  });
});

// 8. Orqaga – tarif menyu
bot.action("back_to_plans", (ctx) => {
  const welcomeText = `Выберите тариф:`;

  ctx.editMessageText(welcomeText, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: `1 месяц – 75 ₽`, callback_data: "1_month" },
        ],
        [
          { text: `3 месяца – 200 ₽`, callback_data: "3_months" },
        ],
        [
          { text: `6 месяцев – 350 ₽`, callback_data: "6_months" },
        ],
      ],
    },
  });
});

// 9. SBP / TON tanlash
bot.action(/^pay_(sbp|ton)_(\w+)$/, (ctx) => {
  const data = ctx.callbackQuery.data;
  const isSbp = data.includes("sbp");
  const key = data.split("_").pop(); // 1_month / 3_months / 6_months
  const plan = PRICES[key];

  let text, keyboard;

  if (isSbp) {
    text = `Тариф: *${plan.label}*\nК оплате: *${plan.price}*\n\nОплатите через SBP (Sberbank) по ссылке ниже:`;

    keyboard = {
      inline_keyboard: [
        [
          { text: "Оплатить SBP (Sberbank)", url: SBP_URL },
        ],
        [{ text: "Назад", callback_data: "back_to_plans" }],
      ],
    };
  } else {
    text = `Тариф: *${plan.label}*\nК оплате: *${plan.price}*\n\nОплатите через TON (USDT) и отправьте скриншот чека сюда.`;

    keyboard = {
      inline_keyboard: [
        [{ text: "Назад", callback_data: "back_to_plans" }],
      ],
    };
  }

  ctx.editMessageText(text, {
    parse_mode: "Markdown",
    reply_markup: keyboard,
  });
});

// 10. Skrin va matnni adminga yuborish
bot.on("photo", async (ctx) => {
  const fromId = ctx.from.id;
  const fromName = ctx.from.first_name;

  const photo = ctx.message.photo.pop();
  const caption = ctx.message.caption || "Без подписи";

  await ctx.telegram.sendPhoto(
    ADMIN_ID,
    photo.file_id,
    {
      caption: `VPN тўлов: ${fromName} (${fromId})\n${caption}`,
    }
  );

  ctx.reply("Ваше фото отправлено администрации. Дождитесь подтверждения оплаты.");
});

// 11. Oddiy matn ham adminga
bot.on("text", async (ctx) => {
  const text = ctx.message.text;
  const fromId = ctx.from.id;

  if (fromId === ADMIN_ID) {
    // Admin tasdiqlash: "подтвердить 1999635628"
    const match = text.match(/подтвердить\s+(\d+)/i);
    if (match) {
      const userId = parseInt(match[1]);

      const replyText = `✅ Оплата подтверждена!\n\nВот ваш VPN‑доступ:\n\n${VPN_KEY_LINK}`;

      try {
        await ctx.telegram.sendMessage(userId, replyText, {
          parse_mode: "Markdown",
        });
        ctx.reply("✅ Пользователю отправлена ссылка на VPN.");
      } catch (e) {
        ctx.reply("❌ Не удалось отправить сообщение пользователю.");
      }
    }
    return;
  }

  // Oddiy matn
  ctx.telegram.sendMessage(ADMIN_ID, `Сообщение от ${ctx.from.first_name} (${fromId}):\n${text}`);
  ctx.reply("Сообщение отправлено администрации.");
});

// 12. Botni ishga tushirish
bot.launch();

console.log("VPN‑bot is running...");
