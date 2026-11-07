'use strict';

const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');
const http = require('http');

// ==================== 1. تشغيل خادم الويب أولاً لاستقرار Render ====================
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Bot is running 24/7!');
}).listen(PORT, () => {
  console.log('Cloud Server listening on port ' + PORT);
});

// ==================== 2. إعدادات البوت والإدارة ====================
const BOT_TOKEN = process.env.BOT_TOKEN || '9132364177:AAEID1FJHBUJPPMEslYbgTZw0o7QTbBlvWw';
const ADMIN_USERNAME = 'AlHaideri11';
const ENV_ADMIN_ID = String(process.env.ADMIN_ID || '');
const CURRENCY = 'USD';

const bot = new Telegraf(BOT_TOKEN);
const DB_FILE = path.join(__dirname, 'store_db.json');

// ==================== 3. قاعدة البيانات والمنتجات الافتراضية ====================
function initialDB() {
  return {
    adminId: ENV_ADMIN_ID || null,
    users: {},
    products: [
      {
        id: 1,
        name: '📱 رقم تفعيل واتساب (WhatsApp)',
        description: 'رقم تفعيل فوري لحساب واتساب مع ضمان وصول الكود.',
        price: 1.5,
        deliveryType: 'manual',
        stock: [],
        active: true
      },
      {
        id: 2,
        name: '✈️ رقم تفعيل تيليجرام (Telegram)',
        description: 'رقم تفعيل نظيف ومضمون لحساب تيليجرام.',
        price: 1.2,
        deliveryType: 'manual',
        stock: [],
        active: true
      },
      {
        id: 3,
        name: '📸 رقم تفعيل انستقرام / فيسبوك / تيك توك',
        description: 'أرقام تفعيل لجميع منصات التواصل الاجتماعي.',
        price: 0.8,
        deliveryType: 'manual',
        stock: [],
        active: true
      },
      {
        id: 4,
        name: '🚀 رشق 1000 متابع أو مشاهدات',
        description: 'دعم حسابات تيليجرام، انستقرام، تيك توك، فيسبوك، ويوتيوب بسرعة عالية.',
        price: 1.5,
        deliveryType: 'manual',
        stock: [],
        active: true
      },
      {
        id: 5,
        name: '🏦 خدمات المصارف وتحويل العملات (USDT / حوالات)',
        description: 'بيع وشراء العملات الرقمية والتحويل بين البنوك الإلكترونية والحوالات.',
        price: 1.0,
        deliveryType: 'manual',
        stock: [],
        active: true
      },
      {
        id: 6,
        name: '💎 المنتجات الرقمية والاشتراكات والتعاقدات',
        description: 'اشتراكات بريميوم، حسابات جاهزة، برمجة، ووساطة تجارية مضمونة.',
        price: 2.0,
        deliveryType: 'manual',
        stock: [],
        active: true
      }
    ],
    orders: [],
    topups: [],
    transactions: [],
    nextProductId: 7,
    nextOrderId: 1001,
    nextTopupId: 101
  };
}

let db = initialDB();

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.error('Save DB error:', e.message);
  }
}

function loadDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      db = initialDB();
      saveDB();
      return;
    }
    const raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    db = { ...initialDB(), ...raw };
  } catch (e) {
    db = initialDB();
  }
}

loadDB();

// ==================== 4. دوال المساعدة والتحقق ====================
function money(val) {
  return Number(val || 0).toFixed(2);
}

function validAmount(val) {
  const n = Number(val);
  return Number.isFinite(n) && n > 0 && n <= 1000000;
}

function getBotName(ctx) {
  return (ctx && ctx.botInfo && ctx.botInfo.first_name) ? ctx.botInfo.first_name : 'متجرنا';
}

function isAdmin(ctx) {
  if (!ctx || !ctx.from) return false;
  const uid = String(ctx.from.id);
  const uname = String(ctx.from.username || '').toLowerCase();
  if (uname === ADMIN_USERNAME.toLowerCase() || (db.adminId && uid === String(db.adminId))) {
    if (db.adminId !== uid) {
      db.adminId = uid;
      saveDB();
    }
    return true;
  }
  return false;
}

function getUser(ctx) {
  const id = String(ctx.from.id);
  isAdmin(ctx);

  if (!db.users[id]) {
    db.users[id] = {
      id,
      name: ctx.from.first_name || 'عميلنا العزيز',
      username: ctx.from.username || '',
      balance: 0,
      createdAt: new Date().toISOString()
    };
    saveDB();
  } else {
    db.users[id].name = ctx.from.first_name || db.users[id].name;
    db.users[id].username = ctx.from.username || db.users[id].username;
  }
  return db.users[id];
}

async function notifyAdmin(text, extra = {}) {
  if (!db.adminId) return;
  try {
    await bot.telegram.sendMessage(db.adminId, text, extra);
  } catch (e) {}
}

async function safeEdit(ctx, text, extra = {}) {
  try {
    await ctx.editMessageText(text, extra);
  } catch (e) {
    if (!String(e.message).includes('message is not modified')) {
      await ctx.reply(text, extra).catch(() => {});
    }
  }
}

// ==================== 5. القوائم والأزرار القياسية ====================
const bottomKeyboard = {
  reply_markup: {
    keyboard: [
      [{ text: '🚀 البدء / القائمة الرئيسية' }, { text: '🛍️ الأقسام والخدمات' }],
      [{ text: '👤 حسابي ورصيدي' }, { text: '💳 شحن الرصيد' }],
      [{ text: '📦 طلباتي' }, { text: '📞 الدعم الفني' }]
    ],
    resize_keyboard: true,
    is_persistent: true
  }
};

function mainKeyboard(ctx) {
  const rows = [
    [Markup.button.callback('🛍️ تصفح الأقسام والخدمات', 'shop')],
    [
      Markup.button.callback('👤 حسابي', 'account'),
      Markup.button.callback('💳 شحن الرصيد', 'topup')
    ],
    [
      Markup.button.callback('📦 طلباتي', 'myorders'),
      Markup.button.callback('ℹ️ التعليمات', 'help')
    ],
    [
      Markup.button.callback('✉️ مراسلة الدعم', 'support'),
      Markup.button.url('👨‍💼 الإدارة (@' + ADMIN_USERNAME + ')', 'https://t.me/' + ADMIN_USERNAME)
    ]
  ];

  if (isAdmin(ctx)) {
    rows.push([Markup.button.callback('🛠️ لوحة تحكم الإدارة (تعديل وإضافة منتجات)', 'admin_home')]);
  }
  return Markup.inlineKeyboard(rows);
}

function adminKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('📦 إدارة وحذف المنتجات', 'admin_products'),
      Markup.button.callback('➕ إضافة منتج أو قسم', 'admin_addproduct')
    ],
    [
      Markup.button.callback('📥 طلبات الشحن المعلقة', 'admin_topups'),
      Markup.button.callback('🧾 سجل الطلبات', 'admin_orders')
    ],
    [
      Markup.button.callback('👥 إحصائيات البوت', 'admin_users'),
      Markup.button.callback('💰 شحن أو خصم رصيد', 'admin_balance')
    ],
    [Markup.button.callback('📢 إرسال إعلان جماعي للكل', 'admin_broadcast')],
    [Markup.button.callback('🔙 العودة للقائمة الرئيسية', 'home')]
  ]);
}

const sessions = new Map();
const setSession = (id, data) => sessions.set(String(id), data);
const getSession = (id) => sessions.get(String(id));
const clearSession = (id) => sessions.delete(String(id));

// ==================== 6. أوامر البداية والقائمة الرئيسية ====================
async function sendHome(ctx) {
  const user = getUser(ctx);
  clearSession(ctx.from.id);
  const botName = getBotName(ctx);

  await ctx.reply('👋 القائمة السريعة جاهزة بالأسفل:', bottomKeyboard).catch(() => {});

  return ctx.reply(
    `🌟 أهلاً بك يا ${user.name} في ${botName}!\n\n` +
    `🆔 رقم حسابك: ${user.id}\n` +
    `💰 رصيدك الحالي: ${money(user.balance)} ${CURRENCY}\n` +
    `👑 بإشراف وإدارة: @${ADMIN_USERNAME}\n\n` +
    '👇 اختر القسم المطلوب من القائمة أدناه:',
    mainKeyboard(ctx)
  );
}

bot.start(sendHome);
bot.hears('🚀 البدء / القائمة الرئيسية', sendHome);

bot.command('admin', (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('⛔ هذا القسم مخصص لإدارة البوت فقط.');
  clearSession(ctx.from.id);
  return ctx.reply('🛠️ لوحة تحكم الإدارة الشاملة:', adminKeyboard());
});

bot.action('admin_home', async (ctx) => {
  await ctx.answerCbQuery();
  if (!isAdmin(ctx)) return;
  clearSession(ctx.from.id);
  return safeEdit(ctx, '🛠️ لوحة تحكم الإدارة الشاملة:', adminKeyboard());
});

bot.action('home', async (ctx) => {
  await ctx.answerCbQuery();
  const user = getUser(ctx);
  clearSession(ctx.from.id);
  const botName = getBotName(ctx);

  await safeEdit(
    ctx,
    `🌟 أهلاً بك في ${botName}\n\n` +
    `🆔 رقم حسابك: ${user.id}\n` +
    `💰 رصيدك الحالي: ${money(user.balance)} ${CURRENCY}\n` +
    `👑 الإدارة: @${ADMIN_USERNAME}\n\n` +
    '👇 اختر القسم المطلوب:',
    mainKeyboard(ctx)
  );
});

// ==================== 7. استجابة الأزرار السفلية والفرعية ====================
async function showShop(ctx, isEdit = false) {
  clearSession(ctx.from.id);
  const products = db.products.filter(p => p.active);

  if (!products.length) {
    const txt = '🛍️ لا توجد خدمات مفعلة حالياً.';
    const kb = Markup.inlineKeyboard([[Markup.button.callback('🔙 رجوع', 'home')]]);
    return isEdit ? safeEdit(ctx, txt, kb) : ctx.reply(txt, kb);
  }

  const buttons = products.map(p => [
    Markup.button.callback(`${p.name} — ${money(p.price)}$`, `product_${p.id}`)
  ]);
  buttons.push([Markup.button.callback('🔙 القائمة الرئيسية', 'home')]);

  const txt = '🛍️ الأقسام والخدمات المتاحة:\n\nاختر الخدمة لعرض التفاصيل أو الشراء:';
  return isEdit ? safeEdit(ctx, txt, Markup.inlineKeyboard(buttons)) : ctx.reply(txt, Markup.inlineKeyboard(buttons));
}

bot.hears('🛍️ الأقسام والخدمات', (ctx) => showShop(ctx, false));
bot.action('shop', async (ctx) => {
  await ctx.answerCbQuery();
  return showShop(ctx, true);
});

bot.hears('👤 حسابي ورصيدي', (ctx) => {
  const user = getUser(ctx);
  return ctx.reply(
    `👤 بيانات حسابك:\n\n🆔 رقم الحساب: ${user.id}\n👤 الاسم: ${user.name}\n💰 الرصيد: ${money(user.balance)} ${CURRENCY}`,
    Markup.inlineKeyboard([[Markup.button.callback('💳 شحن الرصيد', 'topup')]])
  );
});

bot.action('account', async (ctx) => {
  await ctx.answerCbQuery();
  const user = getUser(ctx);
  await safeEdit(
    ctx,
    `👤 بيانات حسابك:\n\n🆔 رقم الحساب: ${user.id}\n👤 الاسم: ${user.name}\n💰 الرصيد: ${money(user.balance)} ${CURRENCY}\n📅 التسجيل: ${user.createdAt.slice(0, 10)}`,
    Markup.inlineKeyboard([
      [Markup.button.callback('💳 شحن الرصيد', 'topup')],
      [Markup.button.callback('🔙 رجوع', 'home')]
    ])
  );
});

bot.hears('💳 شحن الرصيد', (ctx) => {
  return ctx.reply(
    `💳 شحن الرصيد (USDT / حوالات / محافظ)\n\nاضغط على الزر أدناه لتحديد المبلغ، أو تواصل مع الإدارة @${ADMIN_USERNAME}:`,
    Markup.inlineKeyboard([
      [Markup.button.callback('💵 إدخال مبلغ الشحن', 'topup_enter')],
      [Markup.button.url('👨‍💼 مراسلة الإدارة', 'https://t.me/' + ADMIN_USERNAME)]
    ])
  );
});

bot.action('topup', async (ctx) => {
  await ctx.answerCbQuery();
  await safeEdit(
    ctx,
    `💳 شحن المحفظة\n\n1️⃣ اضغط (إدخال مبلغ الشحن) واكتب القيمة بالدولار.\n2️⃣ أرسل الإيصال إلى الإدارة @${ADMIN_USERNAME} لاعتماد الرصيد فوراً.`,
    Markup.inlineKeyboard([
      [Markup.button.callback('💵 إدخال مبلغ الشحن', 'topup_enter')],
      [Markup.button.url('👨‍💼 مراسلة الإدارة', 'https://t.me/' + ADMIN_USERNAME)],
      [Markup.button.callback('🔙 رجوع', 'home')]
    ])
  );
});

bot.action('topup_enter', async (ctx) => {
  await ctx.answerCbQuery();
  setSession(ctx.from.id, { action: 'topup_amount' });
  await ctx.reply('💵 أرسل الآن مبلغ الشحن المطلوب بالأرقام (مثال: 10):');
});

bot.hears('📦 طلباتي', (ctx) => {
  const orders = db.orders.filter(o => o.userId === String(ctx.from.id)).slice(-10).reverse();
  if (!orders.length) return ctx.reply('📦 لا توجد طلبات سابقة في حسابك.');
  const st = { pending: '⏳ قيد التنفيذ', completed: '✅ مكتمل', cancelled: '❌ ملغي' };
  let msg = '📦 آخر طلباتك:\n\n';
  orders.forEach(o => {
    msg += `🧾 #${o.id} | ${o.productName}\n💵 ${money(o.price)}$ | ${st[o.status] || o.status}\n\n`;
  });
  return ctx.reply(msg);
});

bot.action('myorders', async (ctx) => {
  await ctx.answerCbQuery();
  const orders = db.orders.filter(o => o.userId === String(ctx.from.id)).slice(-10).reverse();
  if (!orders.length) {
    return safeEdit(ctx, '📦 لا توجد طلبات سابقة في حسابك.', Markup.inlineKeyboard([[Markup.button.callback('🔙 رجوع', 'home')]]));
  }
  const st = { pending: '⏳ قيد التنفيذ', completed: '✅ مكتمل', cancelled: '❌ ملغي' };
  let msg = '📦 آخر طلباتك:\n\n';
  orders.forEach(o => {
    msg += `🧾 #${o.id} | ${o.productName}\n💵 ${money(o.price)}$ | ${st[o.status] || o.status}\n\n`;
  });
  await safeEdit(ctx, msg, Markup.inlineKeyboard([[Markup.button.callback('🔙 رجوع', 'home')]]));
});

bot.hears('📞 الدعم الفني', (ctx) => {
  return ctx.reply(
    `📞 للتواصل مع الإدارة والدعم الفني: @${ADMIN_USERNAME}`,
    Markup.inlineKeyboard([
      [Markup.button.callback('✉️ إرسال رسالة عبر البوت', 'contact_support')],
      [Markup.button.url('👨‍💼 مراسلة الإدارة مباشرة', 'https://t.me/' + ADMIN_USERNAME)]
    ])
  );
});

bot.action('support', async (ctx) => {
  await ctx.answerCbQuery();
  await safeEdit(
    ctx,
    `📞 الدعم الفني وإدارة البوت (@${ADMIN_USERNAME}):`,
    Markup.inlineKeyboard([
      [Markup.button.callback('✉️ كتابة رسالة للدعم', 'contact_support')],
      [Markup.button.url('👨‍💼 محادثة الإدارة مباشرة', 'https://t.me/' + ADMIN_USERNAME)],
      [Markup.button.callback('🔙 رجوع', 'home')]
    ])
  );
});

bot.action('contact_support', async (ctx) => {
  await ctx.answerCbQuery();
  setSession(ctx.from.id, { action: 'support_message' });
  await ctx.reply('✉️ اكتب رسالتك أو طلبك الآن ليتم إرساله إلى الإدارة:');
});

bot.action('help', async (ctx) => {
  await ctx.answerCbQuery();
  await safeEdit(
    ctx,
    'ℹ️ طريقة استخدام البوت:\n\n' +
    '1️⃣ اشحن رصيدك من قسم (شحن الرصيد).\n' +
    '2️⃣ ادخل إلى (تصفح الأقسام والخدمات) واختر الخدمة المطلوبة.\n' +
    '3️⃣ المنتجات الجاهزة تُسلّم لك تلقائياً، والخدمات اليدوية تُنفذ فوراً بإشراف @' + ADMIN_USERNAME,
    Markup.inlineKeyboard([[Markup.button.callback('🔙 رجوع', 'home')]])
  );
});

// ==================== 8. عرض وشراء الخدمات ====================
bot.action(/^product_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const product = db.products.find(p => p.id === Number(ctx.match[1]) && p.active);
  if (!product) return ctx.reply('هذه الخدمة غير متاحة حالياً.');

  const stockCount = Array.isArray(product.stock) ? product.stock.length : 0;
  const deliveryInfo = product.deliveryType === 'automatic'
    ? `📦 التسليم: فوري تلقائي (المتوفر: ${stockCount})`
    : `⚡ التنفيذ: مباشر عبر الإدارة (@${ADMIN_USERNAME})`;

  await safeEdit(
    ctx,
    `🛍️ ${product.name}\n\n` +
    `📝 التفاصيل: ${product.description}\n\n` +
    `💵 السعر: ${money(product.price)} ${CURRENCY}\n` +
    `${deliveryInfo}\n\n` +
    'اضغط على الزر بالأسفل لتأكيد الشراء:',
    Markup.inlineKeyboard([
      [Markup.button.callback('✅ شراء وتأكيد الطلب', `buy_${product.id}`)],
      [Markup.button.callback('🔙 رجوع للأقسام', 'shop')]
    ])
  );
});

bot.action(/^buy_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const user = getUser(ctx);
  const product = db.products.find(p => p.id === Number(ctx.match[1]) && p.active);

  if (!product) return ctx.reply('عذراً، الخدمة غير متاحة.');
  if (product.deliveryType === 'automatic' && (!Array.isArray(product.stock) || product.stock.length === 0)) {
    return ctx.reply('⚠️ نفدت الكمية الفورية حالياً، يرجى مراسلة الإدارة.');
  }

  if (user.balance < product.price) {
    return ctx.reply(
      `❌ رصيدك غير كافٍ لإتمام الطلب.\n💰 رصيدك: ${money(user.balance)}$ | المطلوب: ${money(product.price)}$`,
      Markup.inlineKeyboard([
        [Markup.button.callback('💳 شحن الرصيد الآن', 'topup')],
        [Markup.button.url('👨‍💼 التواصل مع الإدارة', 'https://t.me/' + ADMIN_USERNAME)]
      ])
    );
  }

  user.balance = Number((user.balance - product.price).toFixed(2));
  let deliveredCode = null;
  const order = {
    id: db.nextOrderId++,
    userId: user.id,
    productId: product.id,
    productName: product.name,
    price: product.price,
    status: product.deliveryType === 'automatic' ? 'completed' : 'pending',
    date: new Date().toISOString()
  };

  if (product.deliveryType === 'automatic') {
    deliveredCode = product.stock.shift();
  }

  db.orders.push(order);
  saveDB();

  if (deliveredCode !== null) {
    await ctx.reply(
      `✅ تم الشراء والتسليم الفوري!\n\n` +
      `📦 المنتج: ${product.name}\n` +
      `🧾 رقم الطلب: #${order.id}\n\n` +
      `🔐 الكود / البيانات:\n${deliveredCode}\n\n` +
      `💰 رصيدك المتبقي: ${money(user.balance)}$`
    );
    await notifyAdmin(`🛒 بيع فوري (#${order.id})\nالمنتج: ${product.name}\nالعميل: ${user.name} (${user.id})`);
  } else {
    await ctx.reply(
      `✅ تم تسجيل طلبك بنجاح!\n\n` +
      `📦 الخدمة: ${product.name}\n` +
      `🧾 رقم الطلب: #${order.id}\n` +
      `💰 الرصيد المتبقي: ${money(user.balance)}$\n\n` +
      `⏳ سيصلك الرد أو الكود هنا فور تنفيذه من الإدارة @${ADMIN_USERNAME}`
    );

    await notifyAdmin(
      `🔔 طلب جديد ينتظر التنفيذ!\n\n` +
      `🧾 رقم الطلب: #${order.id}\n` +
      `📦 الخدمة: ${product.name}\n` +
      `💵 السعر: ${money(product.price)}$\n` +
      `👤 العميل: ${user.name} (@${user.username || 'بدون_معرف'})\n` +
      `🆔 رقم الحساب: ${user.id}\n\n` +
      `👇 لإرسال الكود أو التفاصيل للعميل اكتب:\n/deliver ${order.id} الكود_أو_الرد`,
      Markup.inlineKeyboard([
        [Markup.button.callback('✅ إكمال الطلب', `complete_order_${order.id}`)]
      ])
    );
  }
});

// ==================== 9. لوحة تحكم الإدارة داخل تيليجرام ====================
bot.action('admin_topups', async (ctx) => {
  await ctx.answerCbQuery();
  if (!isAdmin(ctx)) return;
  const pending = db.topups.filter(t => t.status === 'pending');
  if (!pending.length) return safeEdit(ctx, '✅ لا توجد طلبات شحن معلقة.', adminKeyboard());

  for (const t of pending.slice(0, 15)) {
    await ctx.reply(
      `💳 طلب شحن #${t.id}\n🆔 العميل: ${t.userId}\n💵 المبلغ: ${money(t.amount)}$`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ موافقة وشحن', `approve_topup_${t.id}`),
          Markup.button.callback('❌ رفض', `reject_topup_${t.id}`)
        ]
      ])
    );
  }
});

bot.action(/^approve_topup_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  if (!isAdmin(ctx)) return;
  const topup = db.topups.find(t => t.id === Number(ctx.match[1]) && t.status === 'pending');
  if (!topup) return ctx.reply('تمت معالجة الطلب مسبقاً.');

  const user = db.users[topup.userId];
  if (!user) return ctx.reply('المستخدم غير موجود.');

  topup.status = 'approved';
  user.balance = Number((user.balance + topup.amount).toFixed(2));
  saveDB();

  await ctx.reply(`✅ تم شحن ${money(topup.amount)}$ للعميل (${user.id}).`);
  await bot.telegram.sendMessage(
    user.id,
    `🎉 تم اعتماد شحن رصيدك بمبلغ ${money(topup.amount)}$!\n💰 رصيدك الحالي: ${money(user.balance)}$`
  ).catch(() => {});
});

bot.action(/^reject_topup_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  if (!isAdmin(ctx)) return;
  const topup = db.topups.find(t => t.id === Number(ctx.match[1]) && t.status === 'pending');
  if (!topup) return ctx.reply('تمت معالجة الطلب مسبقاً.');

  topup.status = 'rejected';
  saveDB();
  await ctx.reply(`❌ تم رفض طلب الشحن #${topup.id}.`);
  await bot.telegram.sendMessage(topup.userId, `❌ تم رفض طلب الشحن #${topup.id}. للاستفسار راسل @${ADMIN_USERNAME}`).catch(() => {});
});

bot.action('admin_orders', async (ctx) => {
  await ctx.answerCbQuery();
  if (!isAdmin(ctx)) return;
  const orders = db.orders.slice(-15).reverse();
  if (!orders.length) return safeEdit(ctx, 'لا توجد طلبات مسجلة بعد.', adminKeyboard());

  for (const o of orders) {
    await ctx.reply(
      `🧾 طلب #${o.id}\n🆔 العميل: ${o.userId}\n📦 الخدمة: ${o.productName}\n💵 السعر: ${money(o.price)}$\n📌 الحالة: ${o.status}`,
      o.status === 'pending'
        ? Markup.inlineKeyboard([[Markup.button.callback('✅ إكمال الطلب', `complete_order_${o.id}`)]])
        : undefined
    );
  }
});

bot.action(/^complete_order_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  if (!isAdmin(ctx)) return;
  const order = db.orders.find(o => o.id === Number(ctx.match[1]));
  if (!order || order.status !== 'pending') return ctx.reply('الطلب مكتمل مسبقاً.');

  order.status = 'completed';
  saveDB();
  await ctx.reply(`✅ تم إكمال الطلب #${order.id}.`);
  await bot.telegram.sendMessage(order.userId, `✅ تم تنفيذ وإكمال طلبك رقم #${order.id} (${order.productName}).`).catch(() => {});
});

bot.action('admin_products', async (ctx) => {
  await ctx.answerCbQuery();
  if (!isAdmin(ctx)) return;
  if (!db.products.length) return safeEdit(ctx, 'لا توجد منتجات حالياً.', adminKeyboard());

  for (const p of db.products) {
    const stock = Array.isArray(p.stock) ? p.stock.length : 0;
    await ctx.reply(
      `📦 ${p.name}\n💵 السعر: ${money(p.price)}$\n⚙️ النوع: ${p.deliveryType === 'automatic' ? 'تلقائي (المخزون: ' + stock + ')' : 'يدوي'}\n📌 الحالة: ${p.active ? '🟢 مفعل' : '🔴 متوقف'}`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback('➕ إضافة أكواد فورية', `stock_${p.id}`),
          Markup.button.callback(p.active ? '🔴 إيقاف' : '🟢 تفعيل', `toggle_${p.id}`)
        ],
        [Markup.button.callback('🗑️ حذف المنتج نهائياً', `delprod_${p.id}`)]
      ])
    );
  }
});

bot.action(/^delprod_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  if (!isAdmin(ctx)) return;
  const id = Number(ctx.match[1]);
  db.products = db.products.filter(p => p.id !== id);
  saveDB();
  await ctx.reply(`🗑️ تم حذف المنتج رقم ${id} من المتجر.`);
});

bot.action('admin_addproduct', async (ctx) => {
  await ctx.answerCbQuery();
  if (!isAdmin(ctx)) return;
  setSession(ctx.from.id, { action: 'new_product_name' });
  await ctx.reply('➕ إضافة منتج أو خدمة جديدة:\n\nأرسل الآن اسم المنتج (مثال: رقم واتساب أمريكي):');
});

bot.action(/^stock_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  if (!isAdmin(ctx)) return;
  const product = db.products.find(p => p.id === Number(ctx.match[1]));
  if (!product) return ctx.reply('المنتج غير موجود.');

  product.deliveryType = 'automatic';
  saveDB();
  setSession(ctx.from.id, { action: 'add_stock', productId: product.id });
  await ctx.reply(`📥 أرسل الأكواد أو الحسابات الجاهزة للمنتج (${product.name}):\nضع كل كود في سطر مستقل.`);
});

bot.action(/^toggle_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  if (!isAdmin(ctx)) return;
  const product = db.products.find(p => p.id === Number(ctx.match[1]));
  if (!product) return;
  product.active = !product.active;
  saveDB();
  await ctx.reply(`✅ تم ${product.active ? 'تفعيل' : 'إيقاف'} (${product.name}).`);
});

bot.action('admin_users', async (ctx) => {
  await ctx.answerCbQuery();
  if (!isAdmin(ctx)) return;
  await safeEdit(
    ctx,
    `📊 إحصائيات البوت:\n\n👥 المشتركون: ${Object.keys(db.users).length}\n🛍️ الخدمات والمنتجات: ${db.products.length}\n🧾 الطلبات: ${db.orders.length}\n💳 طلبات الشحن: ${db.topups.length}`,
    adminKeyboard()
  );
});

bot.action('admin_balance', async (ctx) => {
  await ctx.answerCbQuery();
  if (!isAdmin(ctx)) return;
  setSession(ctx.from.id, { action: 'balance_user' });
  await ctx.reply('💰 أرسل رقم حساب العميل (ID) الذي تريد تعديل رصيده:');
});

bot.action('admin_broadcast', async (ctx) => {
  await ctx.answerCbQuery();
  if (!isAdmin(ctx)) return;
  setSession(ctx.from.id, { action: 'broadcast' });
  await ctx.reply('📢 أرسل نص الإعلان ليتم إرساله لجميع المشتركين:');
});

// ==================== 10. معالجة الردود وإدخال البيانات ====================
bot.on('text', async (ctx) => {
  const userId = String(ctx.from.id);
  const session = getSession(userId);
  const text = ctx.message.text.trim();

  if (!session) return;

  if (session.action === 'support_message') {
    clearSession(userId);
    await notifyAdmin(`📩 رسالة دعم جديدة\nمن: ${ctx.from.first_name || ''} (@${ctx.from.username || ''})\nID: ${userId}\n\nالرسالة:\n${text}`);
    return ctx.reply('✅ تم إرسال رسالتك إلى الإدارة بنجاح.');
  }

  if (session.action === 'new_product_name') {
    setSession(userId, { action: 'new_product_desc', name: text });
    return ctx.reply('📝 أرسل الآن وصف وتفاصيل المنتج:');
  }

  if (session.action === 'new_product_desc') {
    setSession(userId, { action: 'new_product_price', name: session.name, description: text });
    return ctx.reply('💵 أرسل سعر المنتج بالدولار (أرقام فقط، مثال: 1.5):');
  }

  if (session.action === 'new_product_price') {
    if (!validAmount(text)) return ctx.reply('⚠️ أرسل رقماً صحيحاً أكبر من صفر (مثال: 2):');
    setSession(userId, { action: 'new_product_type', name: session.name, description: session.description, price: Number(text) });
    return ctx.reply('⚙️ اختر طريقة التسليم بكتابة:\n\nmanual = تنفيذ يدوي من الإدارة\nautomatic = تسليم كود تلقائي من المخزون');
  }

  if (session.action === 'new_product_type') {
    const type = text.toLowerCase();
    if (!['automatic', 'manual'].includes(type)) return ctx.reply('⚠️ اكتب manual أو automatic فقط:');

    const product = {
      id: db.nextProductId++,
      name: session.name,
      description: session.description,
      price: session.price,
      deliveryType: type,
      stock: [],
      active: true
    };
    db.products.push(product);
    saveDB();
    clearSession(userId);
    return ctx.reply(`✅ تمت إضافة (${product.name}) بسعر ${money(product.price)}$ بنجاح!`, adminKeyboard());
  }

  if (session.action === 'add_stock') {
    const product = db.products.find(p => p.id === session.productId);
    clearSession(userId);
    if (!product) return ctx.reply('المنتج غير موجود.');
    const codes = text.split('\n').map(x => x.trim()).filter(Boolean);
    product.stock.push(...codes);
    saveDB();
    return ctx.reply(`✅ تمت إضافة ${codes.length} كود. إجمالي المخزون: ${product.stock.length}`);
  }

  if (session.action === 'topup_amount') {
    if (!validAmount(text)) return ctx.reply('⚠️ أرسل مبلغاً صحيحاً بالأرقام (مثال: 10):');
    const topup = { id: db.nextTopupId++, userId, amount: Number(text), status: 'pending' };
    db.topups.push(topup);
    saveDB();
    clearSession(userId);

    await ctx.reply(`✅ تم تسجيل طلب الشحن (#${topup.id}) بمبلغ ${money(topup.amount)}$.\nيرجى مراسلة الإدارة @${ADMIN_USERNAME} لتأكيد الدفع.`);
    return notifyAdmin(
      `💳 طلب شحن جديد #${topup.id}\nالعميل: ${ctx.from.first_name || ''} (${userId})\nالمبلغ: ${money(topup.amount)}$`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ موافقة وشحن', `approve_topup_${topup.id}`),
          Markup.button.callback('❌ رفض', `reject_topup_${topup.id}`)
        ]
      ])
    );
  }

  if (session.action === 'balance_user') {
    if (!db.users[text]) {
      db.users[text] = { id: text, name: 'عميل', username: '', balance: 0, createdAt: new Date().toISOString() };
    }
    setSession(userId, { action: 'balance_amount', targetUser: text });
    return ctx.reply(`💰 الرصيد الحالي للعميل (${text}): ${money(db.users[text].balance)}$\nأرسل المبلغ المراد إضافته (أو بالسالب للخصم مثل -5):`);
  }

  if (session.action === 'balance_amount') {
    const amount = Number(text);
    const target = db.users[session.targetUser];
    if (!target || !Number.isFinite(amount)) return ctx.reply('⚠️ أرسل رقماً صحيحاً:');

    target.balance = Math.max(0, Number((target.balance + amount).toFixed(2)));
    saveDB();
    clearSession(userId);

    await ctx.reply(`✅ تم تحديث الرصيد. الرصيد الجديد: ${money(target.balance)}$`);
    await bot.telegram.sendMessage(target.id, `💰 تم تحديث رصيد محفظتك من الإدارة @${ADMIN_USERNAME}.\nرصيدك الحالي: ${money(target.balance)}$`).catch(() => {});
    return;
  }

  if (session.action === 'broadcast') {
    clearSession(userId);
    let sent = 0;
    for (const id of Object.keys(db.users)) {
      try {
        await bot.telegram.sendMessage(id, `📢 إعلان من الإدارة:\n\n${text}`);
        sent++;
      } catch (_) {}
    }
    return ctx.reply(`✅ تم إرسال الإعلان إلى ${sent} مشترك.`);
  }
});

// أمر التسليم الفوري للطلبات اليدوية
bot.command('deliver', async (ctx) => {
  if (!isAdmin(ctx)) return;
  const parts = ctx.message.text.split(' ');
  const orderId = Number(parts[1]);
  const msg = parts.slice(2).join(' ').trim();
  if (!orderId || !msg) return ctx.reply('استخدم:\n/deliver رقم_الطلب الكود_أو_الرسالة');

  const order = db.orders.find(o => o.id === orderId);
  if (!order) return ctx.reply('الطلب غير موجود.');

  order.status = 'completed';
  saveDB();
  await bot.telegram.sendMessage(order.userId, `✅ تم تنفيذ طلبك #${order.id} (${order.productName}):\n\n${msg}`).catch(() => {});
  return ctx.reply(`✅ تم إرسال الكود وإكمال الطلب #${order.id}.`);
});

bot.catch((err) => console.error('Bot error:', err.message));

// ==================== 11. التشغيل الذكي المقاوم لتعارض الجلسات ====================
function startBotWithRetry() {
  bot.telegram.setMyCommands([
    { command: 'start', description: '🚀 القائمة الرئيسية' },
    { command: 'admin', description: '🛠️ لوحة تحكم الإدارة' }
  ]).catch(() => {});

  bot.launch({ dropPendingUpdates: true })
    .then(() => console.log('✅ Bot launched successfully!'))
    .catch((err) => {
      console.error('⚠️ إعادة محاولة الاتصال بعد 5 ثوانٍ:', err.message);
      setTimeout(startBotWithRetry, 5000);
    });
}

setTimeout(startBotWithRetry, 2000);

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
