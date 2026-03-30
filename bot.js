const { Telegraf } = require("telegraf");

// 1. Bot token va admin ID (sizniki)
const BOT_TOKEN = "8535086929:AAFca0xPqLHHstkPi88qpzdV51re2ozbV6E";
const ADMIN_ID = 1999635628;

// 2. Tariflar narxlari
const PLANS = {
  "1_month":  {
    label: "1 месяц",
    price: "75 ₽"
  },
  "3_months": {
    label: "3 месяца",
    price: "200 ₽"
  },
  "6_months": {
    label: "6 месяцев",
    price: "350 ₽"
  }
};

// 3. Sberbank to'lov havolasi
const SBP_URL =
  "https://www.sberbank.ru/ru/choise_bank?requisiteNumber=79990402614&bankCode=100000000111";

// 4. Umumiy VPN kalit havolasi
const VPN_KEY_LINK =
  "https://hirbilon.net/open?sub_url=https://g3.hirbilon.net:443/yessub/p5ln8k1qld9nf0sa";

// 5. Botni yaratish
const bot = new Telegraf(BOT_TOKEN);

// 6. /start komandasi
bot.start((ctx) => {
  const welcomeText = `Привет! 🌐 Это VPN‑бот.\n\nВыберите тариф ниже 👇`;

  ctx.reply(welcomeText, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: `1 месяц – 75 ₽`, callback_ "plan_1_month" },
        ],
        [
          { text: `3 месяца – 200 ₽`, callback_ "plan_3_months" },
        ],
        [
          { text: `6 месяцев – 350 ₽`, callback_ "plan_6_months" },
        ],
      ],
    },
  });
});

// 7. Tariflar menyusi
["1_month", "3_months", "6_months"].forEach((key) => {
  const plan = PLANS[key];
  bot.action(`plan_${key}`, (ctx) => {
    const text = `📘 Тариф: *${plan.label}*\n💳 К оплате: *${plan.price}*\n\nВыберите способ оплаты:`;

    ctx.editMessageText(text, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "💳 Оплатить SBP (Sberbank)", callback_ `pay_sbp_${key}` },
          ],
          [
            { text: "💰 Оплатить TON (USDT)", callback_ `pay_ton_${key}` },
          ],
          [
            { text: "↩️ Назад", callback_ "back_to_main" },
          ],
        ],
      },
    });
  });
});

// 8. Orqaga – asosiy menyu
bot.action("back_to_main", (ctx) => {
  const text = `Выберите тариф:`;

  ctx.editMessageText(text, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: `1 месяц – 75 ₽`, callback_ "plan_1_month" },
        ],
        [
          { text: `3 месяца – 200 ₽`, callback_ "plan_3_months" },
        ],
        [
          { text: `6 месяцев – 350 ₽`, callback_ "plan_6_months" },
        ],
      ],
    },
  });
});

// 9. SBP / TON tugmalari
bot.action(/^pay_(sbp|ton)_\w+$/, (ctx) => {
  const data = ctx.callbackQuery.data;
  const isSbp = data.includes("sbp");
  const key = data.split("_").pop(); // 1_month / 3_months / 6_months
  const plan = PLANS[key];

  let text, keyboard;

  if (isSbp) {
    text = `📘 Тариф: *${plan.label}*\n💳 Сумма: *${plan.price}*\n\nНажмите кнопку ниже, чтобы оплатить через SBP (Sberbank):`;

    keyboard = {
      inline_keyboard: [
        [
          { text: "💳 Перейти к оплате", url: SBP_URL },
        ],
        [
          { text: "↩️ Назад", callback_ "back_to_main" },
        ],
      ],
    };
  } else {
    text = `📘 Тариф: *${plan.label}*\n💳 Сумма: *${plan.price}*\n\nОплатите через TON (USDT) и затем отправьте *скриншот чека* в этот чат.`;

    keyboard = {
      inline_keyboard: [
        [
          { text: "↩️ Назад", callback_ "back_to_main" },
        ],
      ],
    };
  }

  ctx.editMessageText(text, {
    parse_mode: "Markdown",
    reply_markup: keyboard,
  });
});

// 10. Skrin yoki matn – adminga yuboriladi
bot.on("photo", async (ctx) => {
  const fromId = ctx.from.id;
  const fromName = ctx.from.first_name;

  const photo = ctx.message.photo.pop();
  const caption = ctx.message.caption || "Без подписи";

  const msg = `📸 VPN тўлов: ${fromName} (${fromId})\n` +
              `Тариф: ${Caption или файлы могут быть добавлены позже}\n` +
              `Комментарий: ${caption}`;

  await ctx.telegram.sendPhoto(
    ADMIN_ID,
    photo.file_id,
    {
      caption: msg,
    }
  );

  ctx.reply("🖼 Скрин вашего чека отправлен администрации. Дождитесь подтверждения оплаты.");
});

// 11. Barcha matnlar ham adminka ketadi
bot.on("message", async (ctx) => {
  const text = ctx.message.text;
  const fromId = ctx.from.id;
  const fromName = ctx.from.first_name;

  if (!text) return;

  if (fromId === ADMIN_ID) {
    // Admin tasdiqlash: "подтвердить 1999635628"
    const match = text.match(/подтвердить\s+(\d+)/i);
    if (match) {
      const userId = parseInt(match[1]);

      const msg = `✅ Оплата подтверждена!\n\nВот ваш VPN‑доступ:\n\n${VPN_KEY_LINK}`;

      try {
        await ctx.telegram.sendMessage(userId, msg, {
          parse_mode: "Markdown",
        });
        ctx.reply("✅ Пользователю отправлен доступ к VPN.");
      } catch (e) {
        ctx.reply("❌ Ошибка: не удалось отправить сообщение пользователю.");
      }

      return;
    }
  }

  // Oddiy matn – adminka yuboriladi
  const userMsg = `👤 Сообщение от пользователя: ${fromName} (${fromId})\n` +
                  `💬 Текст: ${text}`;

  await ctx.telegram.sendMessage(ADMIN_ID, userMsg);
  ctx.reply("💭 Ваши сообщение отправлено администрации.");
});

// 12. Botni ishga tushirish
bot.launch();

console.log("🟢 VPN‑bot запущен...");
