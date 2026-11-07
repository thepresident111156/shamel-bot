'use strict';

const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');
const http = require('http');

// ==================== الإعدادات الذكية ====================

const BOT_TOKEN = process.env.BOT_TOKEN || '9132364177:AAEID1FJHBUJPPMEslYbgTZw0o7QTbBlvWw';
const ADMIN_USERNAME = 'AlHaideri11';
const ENV_ADMIN_ID = String(process.env.ADMIN_ID || '');

const bot = new Telegraf(BOT_TOKEN);
const DB_FILE = path.join(__dirname, 'store_db.json');

const CURRENCY = 'USD';
const SHOP_NAME = 'منصة شامل للخدمات الرقمية';

// ==================== قاعدة البيانات المحمية ====================

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
        active: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        name: '✈️ رقم تفعيل تيليجرام (Telegram)',
        description: 'رقم تفعيل نظيف ومضمون لحساب تيليجرام.',
        price: 1.2,
        deliveryType: 'manual',
        stock: [],
        active: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 3,
        name: '🚀 رشق 1000 متابع / مشاهدات',
        description: 'زيادة متابعين أو مشاهدات عالية الجودة (تيليجرام / انستقرام / تيك توك).',
        price: 1.5,
        deliveryType: 'manual',
        stock: [],
        active: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 4,
        name: '🏦 تحويل عملات وخدمات مصرفية (USDT / محافظ)',
        description: 'مصارفة وتحويل آمن وسريع بإشراف مباشر من الإدارة.',
        price: 1.0,
        deliveryType: 'manual',
        stock: [],
        active: true,
        createdAt: new Date().toISOString()
      }
    ],
    orders: [],
    topups: [],
    transactions: [],
    nextProductId: 5,
    nextOrderId: 1001,
    nextTopupId: 101
  };
}

let db = initialDB();

function saveDB(dataToSave = db) {
  try {
    const tempFile = DB_FILE + '.tmp';
    fs.writeFileSync(tempFile, JSON.stringify(dataToSave, null, 2), 'utf8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('خطأ في حفظ قاعدة البيانات:', err.message);
  }
}

function loadDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const init = initialDB();
      saveDB(init);
      return init;
    }
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    const defaults = initialDB();
    return { ...defaults, ...data };
  } catch (error) {
    console.error('تم إنشاء قاعدة بيانات جديدة:', error.message);
    return initialDB();
  }
}

db = loadDB();

// ==================== دوال المساعدة والتحقق ====================

function money(value) {
  return Number(value || 0).toFixed(2);
}

function validAmount(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 && n <= 1000000;
}

// التعرف الذكي على المدير سواء عبر اليوزر @AlHaideri11 أو الرقم
function isAdmin(ctx) {
  if (!ctx.from) return false;
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
  isAdmin(ctx); // تحديث معرف المدير تلقائياً إن كان هو المتصل

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

function addTransaction(userId, type, amount, description) {
  db.transactions.push({
    id: db.transactions.length + 1,
    userId: String(userId),
    type,
    amount: Number(amount),
    description,
    date: new Date().toISOString()
  });
}

function addOrder(userId, product, status) {
  const order = {
    id: db.nextOrderId++,
    userId: String(userId),
    productId: product.id,
    productName: product.name,
    price: product.price,
    status,
    date: new Date().toISOString()
  };
  db.orders.push(order);
  return order;
}

// ==================== لوحات الأزرار والواجهة ====================

// أزرار سفلية ثابتة تلغي شاشة الملصقات وتسهل الوصول
const bottomReplyKeyboard = Markup.keyboard([
  ['🚀 القائمة الرئيسية', '🛍️ المتجر والخدمات'],
  ['👤 حسابي ورصيدي', '💳 شحن الرصيد'],
  ['📦 طلباتي', '📞 الدعم الفني']
]).resize().persistent();

function mainKeyboard(ctx) {
  const rows = [
    [
      Markup.button.callback('🛍️ تصفح المتجر والخدمات', 'shop')
    ],
    [
      Markup.button.callback('👤 حسابي', 'account'),
      Markup.button.callback('💳 شحن الرصيد', 'topup')
    ],
    [
      Markup.button.callback('📦 طلباتي', 'myorders'),
      Markup.button.callback('ℹ️ التعليمات', 'help')
    ],
    [
      Markup.button.callback('✉️ مراسلة الدعم بالبوت', ' support'),
      Markup.button.url('👨‍💼 الإدارة (@' + ADMIN_USERNAME + ')', `https://t.me/${ADMIN_USERNAME}`)
    ]
  ];

  if (ctx && isAdmin(ctx)) {
    rows.push([Markup.button.callback('🛠️ لوحة إدارة المتجر (للمدير)', 'admin_home')]);
  }

  return Markup.inlineKeyboard(rows);
}

function adminKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('📦 إدارة المنتجات', 'admin_products'),
      Markup.button.callback('➕ إضافة منتج جديد', 'admin_addproduct')
    ],
    [
      Markup.button.callback('📥 طلبات الشحن', 'admin_topups'),
      Markup.button.callback('🧾 سجل الطلبات', 'admin_orders')
    ],
    [
      Markup.button.callback('👥 الإحصائيات', 'admin_users'),
      Markup.button.callback('💰 تعديل رصيد عميل', 'admin_balance')
    ],
    [
      Markup.button.callback('📢 إذاعة جماعية للكل', 'admin_broadcast')
    ],
    [
      Markup.button.callback('🔙 العودة لواجهة المتجر', 'home')
    ]
  ]);
}

// ==================== الجلسات والإشعارات ====================

const sessions = new Map();
const setSession = (userId, data) => sessions.set(String(userId), data);
const getSession = (userId) => sessions.get(String(userId));
const clearSession = (userId) => sessions.delete(String(userId));

async function safeEdit(ctx, text, extra = {}) {
  try {
    await ctx.editMessageText(text, extra);
  } catch (error) {
    if (!String(error.message).includes('message is not modified')) {
      await ctx.reply(text, extra).catch(() => {});
    }
  }
}

async function notifyAdmin(text, extra = {}) {
  if (!db.adminId) return;
  try {
    await bot.telegram.sendMessage(db.adminId, text, extra);
  } catch (error) {
    console.error('تعذر إشعار المدير:', error.message);
  }
}

// ==================== البداية والأوامر السريعة ====================

async function renderStart(ctx) {
  const user = getUser(ctx);
  clearSession(ctx.from.id);

  await ctx.reply('👋 مرحباً بك في ' + SHOP_NAME, bottomReplyKeyboard);

  return ctx.reply(
    `🌟 أهلاً بك يا ${user.name} في ${SHOP_NAME}!\n\n` +
    `🆔 رقم حسابك: ${user.id}\n` +
    `💰 رصيدك الحالي: ${money(user.balance)} ${CURRENCY}\n` +
    `👑 بإشراف وإدارة: @${ADMIN_USERNAME}\n\n` +
    '👇 اختر القسم المطلوب من القائمة أدناه:',
    mainKeyboard(ctx)
  );
}

bot.start(renderStart);
bot.hears('🚀 القائمة الرئيسية', renderStart);

bot.command('admin', async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('⛔ ليس لديك صلاحية دخول لوحة الإدارة.');
  clearSession(ctx.from.id);
  return ctx.reply('🛠️ لوحة إدارة المتجر الشاملة:', adminKeyboard());
});

bot.action('admin_home', async (ctx) => {
  await ctx.answerCbQuery();
  if (!isAdmin(ctx)) return ctx.reply('⛔ غير مصرح.');
  clearSession(ctx.from.id);
  return safeEdit(ctx, '🛠️ لوحة إدارة المتجر الشاملة:', adminKeyboard());
});

bot.command('id', (ctx) => ctx.reply(`🆔 رقم حسابك في تيليجرام:\n${ctx.from.id}`));

// ربط الأزرار السفلية الثابتة
bot.hears('🛍️ المتجر والخدمات', async (ctx) => {
  clearSession(ctx.from.id);
  const products = db.products.filter(p => p.active);
  if (!products.length) return ctx.reply('🛍️ لا توجد منتجات متاحة حالياً.');
  const buttons = products.map(p => [Markup.button.callback(`${p.name} — ${money(p.price)} ${CURRENCY}`, `product_${p.id}`)]);
  buttons.push([Markup.button.callback('🔙 القائمة الرئيسية', 'home')]);
  return ctx.reply('🛍️ المنتجات والخدمات المتاحة:\n\nاختر الخدمة لعرض التفاصيل والشراء:', Markup.inlineKeyboard(buttons));
});

bot.hears('👤 حسابي ورصيدي', (ctx) => {
  const user = getUser(ctx);
  return ctx.reply(
    `👤 معلومات حسابك:\n\n🆔 الرقم: ${user.id}\n👤 الاسم: ${user.name}\n💰 الرصيد: ${money(user.balance)} ${CURRENCY}`,
    Markup.inlineKeyboard([[Markup.button.callback('💳 شحن الرصيد', 'topup')]])
  );
});

bot.hears('💳 شحن الرصيد', (ctx) => {
  return ctx.reply(
    `💳 شحن المحفظة\n\nاضغط على الزر أدناه لإدخال المبلغ المطلوب شحنه، أو تواصل مع الإدارة @${ADMIN_USERNAME}:`,
    Markup.inlineKeyboard([
      [Markup.button.callback('💵 إدخال مبلغ الشحن', 'topup_enter')],
      [Markup.button.url('👨‍💼 مراسلة الإدارة', `https://t.me/${ADMIN_USERNAME}`)]
    ])
  );
});

bot.hears('📦 طلباتي', (ctx) => {
  const orders = db.orders.filter(o => o.userId === String(ctx.from.id)).slice(-10).reverse();
  if (!orders.length) return ctx.reply('📦 لا توجد طلبات مسجلة في حسابك حتى الآن.');
  const statusNames = { pending: '⏳ قيد المراجعة', completed: '✅ مكتمل', cancelled: '❌ ملغي' };
  let msg = '📦 آخر طلباتك:\n\n';
  for (const o of orders) {
    msg += `🧾 الطلب: #${o.id}\n📦 الخدمة: ${o.productName}\n💵 السعر: ${money(o.price)} ${CURRENCY}\n📌 الحالة: ${statusNames[o.status] || o.status}\n\n`;
  }
  return ctx.reply(msg);
});

bot.hears('📞 الدعم الفني', (ctx) => {
  return ctx.reply(
    `📞 الدعم الفني المباشر\n\nيمكنك مراسلة الإدارة مباشرة عبر @${ADMIN_USERNAME} أو إرسال تذكرة عبر الزر أدناه:`,
    Markup.inlineKeyboard([
      [Markup.button.callback('✉️ كتابة رسالة للدعم', 'contact_support')],
      [Markup.button.url('👨‍💼 محادثة الإدارة مباشرة', `https://t.me/${ADMIN_USERNAME}`)]
    ])
  );
});

// ==================== القائمة الرئيسية الشفافة ====================

bot.action('home', async (ctx) => {
  await ctx.answerCbQuery();
  const user = getUser(ctx);
  clearSession(ctx.from.id);

  await safeEdit(
    ctx,
    `🌟 ${SHOP_NAME}\n\n` +
    `🆔 رقم حسابك: ${user.id}\n` +
    `💰 رصيدك: ${money(user.balance)} ${CURRENCY}\n\n` +
    'اختر الخدمة المطلوبة من القائمة:',
    mainKeyboard(ctx)
  );
});

bot.action('account', async (ctx) => {
  await ctx.answerCbQuery();
  const user = getUser(ctx);

  await safeEdit(
    ctx,
    `👤 معلومات حسابك\n\n` +
    `🆔 الرقم: ${user.id}\n` +
    `👤 الاسم: ${user.name}\n` +
    `💰 الرصيد: ${money(user.balance)} ${CURRENCY}\n` +
    `📅 تاريخ التسجيل: ${user.createdAt.slice(0, 10)}`,
    Markup.inlineKeyboard([
      [Markup.button.callback('💳 شحن الرصيد', 'topup')],
      [Markup.button.callback('🔙 رجوع', 'home')]
    ])
  );
});

bot.action('help', async (ctx) => {
  await ctx.answerCbQuery();
  await safeEdit(
    ctx,
    'ℹ️ تعليمات الاستخدام\n\n' +
    '1️⃣ افتح المتجر واختر الخدمة أو المنتج.\n' +
    '2️⃣ تأكد من السعر والتفاصيل ثم اضغط شراء.\n' +
    '3️⃣ المنتجات الفورية (الأكواد) تُسلّم لك تلقائياً في نفس اللحظة.\n' +
    '4️⃣ الخدمات اليدوية (الأرقام/الرشق/التحويلات) تنفذها الإدارة فوراً وتصلك رسالة بالتنفيذ.\n\n' +
    `👑 الإدارة الرسمية: @${ADMIN_USERNAME}`,
    Markup.inlineKeyboard([[Markup.button.callback('🔙 القائمة الرئيسية', 'home')]])
  );
});

bot.action(['support', ' support'], async (ctx) => {
  await ctx.answerCbQuery();
  await safeEdit(
    ctx,
    '📞 الدعم الفني\n\nاختر طريقة التواصل المفضلة لديك:',
    Markup.inlineKeyboard([
      [Markup.button.callback('✉️ إرسال رسالة عبر البوت', 'contact_support')],
      [Markup.button.url('👨‍💼 مراسلة @' + ADMIN_USERNAME, `https://t.me/${ADMIN_USERNAME}`)],
      [Markup.button.callback('🔙 رجوع', 'home')]
    ])
  );
});

bot.action('contact_support', async (ctx) => {
  await ctx.answerCbQuery();
  setSession(ctx.from.id, { action: 'support_message' });
  await ctx.reply('✉️ اكتب رسالتك أو استفسارك الآن ليتم تحويله مباشرة إلى الإدارة:');
});

// ==================== المتجر وشراء المنتجات ====================

bot.action('shop', async (ctx) => {
  await ctx.answerCbQuery();
  const products = db.products.filter(p => p.active);

  if (!products.length) {
    return safeEdit(
      ctx,
      '🛍️ المتجر\n\nلا توجد منتجات متاحة حالياً. يرجى العودة لاحقاً.',
      Markup.inlineKeyboard([[Markup.button.callback('🔙 القائمة الرئيسية', 'home')]])
    );
  }

  const buttons = products.map(product => [
    Markup.button.callback(
      `${product.name} — ${money(product.price)} ${CURRENCY}`,
      `product_${product.id}`
    )
  ]);

  buttons.push([Markup.button.callback('🔙 القائمة الرئيسية', 'home')]);
  await safeEdit(ctx, '🛍️ أقسام المتجر والخدمات المتاحة:\n\nاختر المنتج أو الخدمة لعرض التفاصيل:', Markup.inlineKeyboard(buttons));
});

bot.action(/^product_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const product = db.products.find(p => p.id === Number(ctx.match[1]) && p.active);

  if (!product) return ctx.reply('هذا المنتج غير متاح حالياً.');

  const stockCount = Array.isArray(product.stock) ? product.stock.length : 0;
  const availability = product.deliveryType === 'automatic'
    ? `📦 التسليم: فوري تلقائي (المتوفر: ${stockCount})`
    : '⚡ التسليم: تنفيذ سريع ومباشر عبر الإدارة';

  await safeEdit(
    ctx,
    `🛍️ ${product.name}\n\n` +
    `📝 التفاصيل: ${product.description}\n\n` +
    `💵 السعر: ${money(product.price)} ${CURRENCY}\n` +
    `${availability}\n\n` +
    'هل ترغب في تأكيد الشراء؟',
    Markup.inlineKeyboard([
      [Markup.button.callback('✅ تأكيد الشراء الآن', `buy_${product.id}`)],
      [Markup.button.callback('🔙 العودة للمتجر', 'shop')]
    ])
  );
});

bot.action(/^buy_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const user = getUser(ctx);
  const product = db.products.find(p => p.id === Number(ctx.match[1]) && p.active);

  if (!product) return ctx.reply('عذراً، المنتج غير متاح.');
  if (!validAmount(product.price)) return ctx.reply('تعذر إتمام الطلب بسبب خطأ في السعر.');

  if (product.deliveryType === 'automatic' && (!Array.isArray(product.stock) || product.stock.length === 0)) {
    return ctx.reply('⚠️ نفدت الكمية الفورية حالياً. يرجى المحاولة لاحقاً أو مراسلة الإدارة.');
  }

  if (user.balance < product.price) {
    return ctx.reply(
      `❌ رصيدك غير كافٍ لإتمام الشراء.\n\n` +
      `💰 رصيدك الحالي: ${money(user.balance)} ${CURRENCY}\n` +
      `💵 سعر الخدمة: ${money(product.price)} ${CURRENCY}`,
      Markup.inlineKeyboard([
        [Markup.button.callback('💳 شحن الرصيد الآن', 'topup')],
        [Markup.button.url('👨‍💼 شحن سريع عبر الإدارة', `https://t.me/${ADMIN_USERNAME}`)]
      ])
    );
  }

  user.balance = Number((user.balance - product.price).toFixed(2));
  let order;
  let deliveredCode = null;

  if (product.deliveryType === 'automatic') {
    deliveredCode = product.stock.shift();
    order = addOrder(user.id, product, 'completed');
  } else {
    order = addOrder(user.id, product, 'pending');
  }

  addTransaction(user.id, 'purchase', -product.price, `شراء: ${product.name} (#${order.id})`);
  saveDB();

  if (deliveredCode !== null) {
    await ctx.reply(
      `✅ تم الشراء والتسليم الفوري بنجاح!\n\n` +
      `📦 المنتج: ${product.name}\n` +
      `🧾 رقم الطلب: #${order.id}\n\n` +
      `🔐 الكود / البيانات:\n${deliveredCode}\n\n` +
      `💰 رصيدك المتبقي: ${money(user.balance)} ${CURRENCY}`
    );

    await notifyAdmin(
      `🛒 بيع تلقائي جديد (#${order.id})\n` +
      `📦 المنتج: ${product.name}\n` +
      `👤 العميل: ${user.name} (${user.id})\n` +
      `💵 المبلغ: ${money(product.price)} ${CURRENCY}`
    );
  } else {
    await ctx.reply(
      `✅ تم تسجيل طلبك بنجاح!\n\n` +
      `📦 الخدمة: ${product.name}\n` +
      `🧾 رقم الطلب: #${order.id}\n` +
      `💰 المبلغ المخصوم: ${money(product.price)} ${CURRENCY}\n` +
      `📌 الحالة: قيد التنفيذ السريع من الإدارة.\n\n` +
      '⏳ سيصلك إشعار وبيانات التسليم هنا فور التنفيذ.'
    );

    await notifyAdmin(
      `📥 طلب خدمة جديد ينتظر التنفيذ!\n\n` +
      `🧾 رقم الطلب: #${order.id}\n` +
      `📦 الخدمة: ${product.name}\n` +
      `👤 العميل: ${user.name} (@${user.username || 'بدون_معرف'})\n` +
      `🆔 معرف العميل: ${user.id}\n` +
      `💵 المبلغ: ${money(product.price)} ${CURRENCY}\n\n` +
      `👇 لإرسال الكود أو البيانات للعميل اكتب:\n/deliver ${order.id} الكود_أو_الرسالة`,
      Markup.inlineKeyboard([
        [Markup.button.callback('✅ إكمال الطلب مباشرة', `complete_order_${order.id}`)]
      ])
    );
  }
});

// ==================== شحن الرصيد ====================

bot.action('topup', async (ctx) => {
  await ctx.answerCbQuery();
  await safeEdit(
    ctx,
    `💳 شحن المحفظة في ${SHOP_NAME}\n\n` +
    '1️⃣ اضغط على (إدخال مبلغ الشحن) واكتب القيمة بالدولار.\n' +
    `2️⃣ تواصل مع الإدارة @${ADMIN_USERNAME} لإرسال الإيصال واعتماد الرصيد فوراً.`,
    Markup.inlineKeyboard([
      [Markup.button.callback('💵 إدخال مبلغ الشحن', 'topup_enter')],
      [Markup.button.url('👨‍💼 مراسلة الإدارة (@' + ADMIN_USERNAME + ')', `https://t.me/${ADMIN_USERNAME}`)],
      [Markup.button.callback('🔙 رجوع', 'home')]
    ])
  );
});

bot.action('topup_enter', async (ctx) => {
  await ctx.answerCbQuery();
  setSession(ctx.from.id, { action: 'topup_amount' });
  await ctx.reply('💵 أرسل الآن مبلغ الشحن المطلوب بالأرقام (مثال: 10):');
});

bot.action('admin_topups', async (ctx) => {
  await ctx.answerCbQuery();
  if (!isAdmin(ctx)) return ctx.reply('غير مصرح.');

  const pending = db.topups.filter(t => t.status === 'pending');
  if (!pending.length) return safeEdit(ctx, '✅ لا توجد طلبات شحن معلقة حالياً.', adminKeyboard());

  for (const topup of pending.slice(0, 15)) {
    await ctx.reply(
      `💳 طلب شحن معلق #${topup.id}\n` +
      `🆔 العميل: ${topup.userId}\n` +
      `💵 المبلغ: ${money(topup.amount)} ${CURRENCY}`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ قبول وشحن الرصيد', `approve_topup_${topup.id}`),
          Markup.button.callback('❌ رفض', `reject_topup_${topup.id}`)
        ]
      ])
    );
  }
});

bot.action(/^approve_topup_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  if (!isAdmin(ctx)) return;

  const topup = db.topups.find(t => t.id === Number(ctx.match[1]) && t.status === 'pending');
  if (!topup) return ctx.reply('الطلب غير موجود أو تمت معالجته مسبقاً.');

  const user = db.users[topup.userId];
  if (!user) return ctx.reply('المستخدم غير موجود.');

  topup.status = 'approved';
  user.balance = Number((user.balance + topup.amount).toFixed(2));
  addTransaction(user.id, 'topup', topup.amount, `اعتماد شحن #${topup.id}`);
  saveDB();

  await ctx.reply(`✅ تم اعتماد الشحن #${topup.id} وإضافة ${money(topup.amount)}$ للعميل.`);
  await bot.telegram.sendMessage(
    user.id,
    `🎉 تم قبول طلب الشحن الخاص بك (#${topup.id})!\n` +
    `💵 المبلغ المضاف: ${money(topup.amount)} ${CURRENCY}\n` +
    `💰 رصيدك الجديد: ${money(user.balance)} ${CURRENCY}`
  ).catch(() => {});
});

bot.action(/^reject_topup_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  if (!isAdmin(ctx)) return;

  const topup = db.topups.find(t => t.id === Number(ctx.match[1]) && t.status === 'pending');
  if (!topup) return ctx.reply('الطلب غير موجود أو تمت معالجته.');

  topup.status = 'rejected';
  saveDB();

  await ctx.reply(`❌ تم رفض طلب الشحن #${topup.id}.`);
  await bot.telegram.sendMessage(topup.userId, `❌ تم رفض طلب الشحن رقم #${topup.id}.\nللاستفسار راسل الإدارة: @${ADMIN_USERNAME}`).catch(() => {});
});

// ==================== الطلبات وإدارة المنتجات ====================

bot.action('myorders', async (ctx) => {
  await ctx.answerCbQuery();
  const orders = db.orders.filter(o => o.userId === String(ctx.from.id)).slice(-10).reverse();

  if (!orders.length) {
    return safeEdit(
      ctx,
      '📦 لا توجد طلبات مسجلة في حسابك حتى الآن.',
      Markup.inlineKeyboard([
        [Markup.button.callback('🛍️ تصفح المتجر', 'shop')],
        [Markup.button.callback('🔙 رجوع', 'home')]
      ])
    );
  }

  const statusNames = { pending: '⏳ قيد المراجعة', completed: '✅ مكتمل', cancelled: '❌ ملغي' };
  let message = '📦 آخر طلباتك:\n\n';
  for (const order of orders) {
    message += `🧾 الطلب: #${order.id}\n📦 المنتج: ${order.productName}\n💵 السعر: ${money(order.price)} ${CURRENCY}\n📌 الحالة: ${statusNames[order.status] || order.status}\n\n`;
  }

  await safeEdit(ctx, message, Markup.inlineKeyboard([[Markup.button.callback('🔙 القائمة الرئيسية', 'home')]]));
});

bot.action('admin_orders', async (ctx) => {
  await ctx.answerCbQuery();
  if (!isAdmin(ctx)) return;

  const orders = db.orders.slice(-15).reverse();
  if (!orders.length) return safeEdit(ctx, 'لا توجد طلبات حتى الآن.', adminKeyboard());

  for (const order of orders) {
    await ctx.reply(
      `🧾 الطلب #${order.id}\n` +
      `🆔 العميل: ${order.userId}\n` +
      `📦 المنتج: ${order.productName}\n` +
      `💵 المبلغ: ${money(order.price)} ${CURRENCY}\n` +
      `📌 الحالة: ${order.status}`,
      order.status === 'pending'
        ? Markup.inlineKeyboard([[Markup.button.callback('✅ إكمال الطلب', `complete_order_${order.id}`)]])
        : undefined
    );
  }
});

bot.action(/^complete_order_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  if (!isAdmin(ctx)) return;

  const order = db.orders.find(o => o.id === Number(ctx.match[1]));
  if (!order || order.status !== 'pending') return ctx.reply('الطلب غير موجود أو مكتمل مسبقاً.');

  order.status = 'completed';
  saveDB();

  await ctx.reply(`✅ تم إكمال الطلب #${order.id}.`);
  await bot.telegram.sendMessage(
    order.userId,
    `✅ تم إكمال وتنفيذ طلبك رقم #${order.id}\n📦 الخدمة: ${order.productName}\nشكراً لثقتك بنا!`
  ).catch(() => {});
});

bot.action('admin_products', async (ctx) => {
  await ctx.answerCbQuery();
  if (!isAdmin(ctx)) return;

  if (!db.products.length) return safeEdit(ctx, 'لا توجد منتجات. استخدم زر إضافة منتج.', adminKeyboard());

  for (const p of db.products) {
    const stock = Array.isArray(p.stock) ? p.stock.length : 0;
    await ctx.reply(
      `📦 ${p.name}\n` +
      `🔢 رقم المنتج: ${p.id}\n` +
      `💵 السعر: ${money(p.price)} ${CURRENCY}\n` +
      `⚙️ التسليم: ${p.deliveryType === 'automatic' ? 'تلقائي (أكواد)' : 'يدوي'}\n` +
      `📥 المخزون: ${stock}\n` +
      `📌 الحالة: ${p.active ? '🟢 فعال' : '🔴 متوقف'}`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback('➕ إضافة أكواد للمخزون', `stock_${p.id}`),
          Markup.button.callback(p.active ? '🔴 إيقاف' : '🟢 تفعيل', `toggle_${p.id}`)
        ],
        [
          Markup.button.callback('🗑️ حذف المنتج نهائياً', `delprod_${p.id}`)
        ]
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
  await ctx.reply(`🗑️ تم حذف المنتج رقم ${id} بنجاح.`);
});

bot.action('admin_addproduct', async (ctx) => {
  await ctx.answerCbQuery();
  if (!isAdmin(ctx)) return;
  setSession(ctx.from.id, { action: 'new_product_name' });
  await ctx.reply('➕ إضافة منتج أو خدمة جديدة\n\nأرسل الآن اسم المنتج (مثال: اشتراك كانفا برو):');
});

bot.action(/^stock_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  if (!isAdmin(ctx)) return;

  const product = db.products.find(p => p.id === Number(ctx.match[1]));
  if (!product) return ctx.reply('المنتج غير موجود.');

  product.deliveryType = 'automatic'; // تحويله لتلقائي إذا أراد المدير إضافة أكواد
  saveDB();

  setSession(ctx.from.id, { action: 'add_stock', productId: product.id });
  await ctx.reply(`📥 أرسل الأكواد أو الحسابات الجاهزة للمنتج (${product.name}):\nضع كل كود أو حساب في سطر مستقل.`);
});

bot.action(/^toggle_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  if (!isAdmin(ctx)) return;

  const product = db.products.find(p => p.id === Number(ctx.match[1]));
  if (!product) return ctx.reply('المنتج غير موجود.');

  product.active = !product.active;
  saveDB();
  await ctx.reply(`✅ تم ${product.active ? 'تفعيل' : 'إيقاف'} المنتج: ${product.name}`);
});

bot.action('admin_users', async (ctx) => {
  await ctx.answerCbQuery();
  if (!isAdmin(ctx)) return;

  const users = Object.values(db.users);
  await safeEdit(
    ctx,
    `📊 إحصائيات المنصة الشاملة\n\n` +
    `👥 إجمالي العملاء: ${users.length}\n` +
    `🛍️ عدد المنتجات: ${db.products.length}\n` +
    `🧾 إجمالي الطلبات: ${db.orders.length}\n` +
    `💳 طلبات الشحن: ${db.topups.length}`,
    adminKeyboard()
  );
});

bot.action('admin_balance', async (ctx) => {
  await ctx.answerCbQuery();
  if (!isAdmin(ctx)) return;
  setSession(ctx.from.id, { action: 'balance_user' });
  await ctx.reply('💰 تعديل رصيد عميل\n\nأرسل رقم حساب العميل (ID):');
});

bot.action('admin_broadcast', async (ctx) => {
  await ctx.answerCbQuery();
  if (!isAdmin(ctx)) return;
  setSession(ctx.from.id, { action: 'broadcast' });
  await ctx.reply('📢 أرسل نص الإعلان أو الرسالة ليتم إرسالها لجميع عملاء البوت:');
});

// ==================== معالجة النصوص والمدخلات ====================

bot.on('text', async (ctx) => {
  const userId = String(ctx.from.id);
  const session = getSession(userId);
  const text = ctx.message.text.trim();

  if (!session) return;

  if (session.action === 'support_message') {
    clearSession(userId);
    await notifyAdmin(`📩 رسالة دعم جديدة\nمن: ${ctx.from.first_name || ''} (@${ctx.from.username || ''})\nالمعرف: ${userId}\n\nالرسالة:\n${text}`);
    return ctx.reply('✅ تم إرسال رسالتك إلى الإدارة بنجاح، سيتم الرد عليك قريباً.');
  }

  if (session.action === 'new_product_name') {
    setSession(userId, { action: 'new_product_description', name: text });
    return ctx.reply('📝 ممتاز! الآن أرسل وصف وتفاصيل المنتج:');
  }

  if (session.action === 'new_product_description') {
    setSession(userId, { action: 'new_product_price', name: session.name, description: text });
    return ctx.reply('💵 أرسل سعر المنتج بالدولار (أرقام فقط، مثال: 2.5):');
  }

  if (session.action === 'new_product_price') {
    if (!validAmount(text)) return ctx.reply('⚠️ السعر غير صحيح. أرسل رقماً أكبر من صفر (مثال: 1.5):');
    setSession(userId, { action: 'new_product_type', name: session.name, description: session.description, price: Number(text) });
    return ctx.reply(
      '⚙️ اختر طريقة تسليم المنتج بكتابة إحدى الكلمتين:\n\n' +
      'automatic = تسليم كود تلقائي من المخزون\n' +
      'manual = تنفيذ يدوي بواسطة الإدارة'
    );
  }

  if (session.action === 'new_product_type') {
    const type = text.toLowerCase();
    if (!['automatic', 'manual'].includes(type)) return ctx.reply('⚠️ اكتب automatic أو manual فقط:');

    const product = {
      id: db.nextProductId++,
      name: session.name,
      description: session.description,
      price: session.price,
      deliveryType: type,
      stock: [],
      active: true,
      createdAt: new Date().toISOString()
    };

    db.products.push(product);
    saveDB();
    clearSession(userId);

    return ctx.reply(
      `✅ تمت إضافة المنتج إلى المتجر بنجاح!\n\n` +
      `📦 الاسم: ${product.name}\n` +
      `💵 السعر: ${money(product.price)} ${CURRENCY}\n` +
      `⚙️ التسليم: ${product.deliveryType}`,
      adminKeyboard()
    );
  }

  if (session.action === 'add_stock') {
    const product = db.products.find(p => p.id === session.productId);
    if (!product) { clearSession(userId); return ctx.reply('المنتج غير موجود.'); }

    const codes = text.split('\n').map(x => x.trim()).filter(x => x.length > 0);
    if (!codes.length) return ctx.reply('لم يتم العثور على أكواد صالحة.');

    product.stock.push(...codes);
    saveDB();
    clearSession(userId);

    return ctx.reply(`✅ تمت إضافة ${codes.length} كود للمنتج (${product.name}).\nإجمالي المخزون الآن: ${product.stock.length}`);
  }

  if (session.action === 'topup_amount') {
    if (!validAmount(text)) return ctx.reply('⚠️ المبلغ غير صحيح. أرسل رقماً أكبر من صفر:');

    const topup = {
      id: db.nextTopupId++,
      userId,
      amount: Number(text),
      status: 'pending',
      date: new Date().toISOString()
    };

    db.topups.push(topup);
    saveDB();
    clearSession(userId);

    await ctx.reply(
      `✅ تم تسجيل طلب الشحن رقم #${topup.id} بمبلغ ${money(topup.amount)} ${CURRENCY}.\n\n` +
      `📲 أرسل الآن إشعار التحويل إلى الإدارة @${ADMIN_USERNAME} ليتم تفعيل الرصيد فوراً.`
    );

    return notifyAdmin(
      `💳 طلب شحن رصيد جديد!\n\n` +
      `🧾 رقم الطلب: #${topup.id}\n` +
      `👤 العميل: ${ctx.from.first_name || ''} (${userId})\n` +
      `💵 المبلغ المطلوب: ${money(topup.amount)} ${CURRENCY}`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ موافقة وشحن الرصيد', `approve_topup_${topup.id}`),
          Markup.button.callback('❌ رفض الطلب', `reject_topup_${topup.id}`)
        ]
      ])
    );
  }

  if (session.action === 'balance_user') {
    if (!db.users[text]) return ctx.reply('⚠️ لم يتم العثور على هذا العميل. تأكد من رقم الـ ID وأرسله مجدداً:');
    setSession(userId, { action: 'balance_amount', targetUser: text });
    return ctx.reply(
      `👤 العميل: ${db.users[text].name} (${text})\n` +
      `💰 رصيده الحالي: ${money(db.users[text].balance)} ${CURRENCY}\n\n` +
      'أرسل المبلغ المراد إضافته (أو رقماً سالباً للخصم مثل -5):'
    );
  }

  if (session.action === 'balance_amount') {
    const amount = Number(text);
    const target = db.users[session.targetUser];
    if (!target || !Number.isFinite(amount)) return ctx.reply('⚠️ مبلغ غير صحيح.');

    target.balance = Math.max(0, Number((target.balance + amount).toFixed(2)));
    addTransaction(target.id, 'admin_adjustment', amount, 'تعديل رصيد من الإدارة');
    saveDB();
    clearSession(userId);

    await ctx.reply(`✅ تم تحديث رصيد العميل (${target.id}). الرصيد الجديد: ${money(target.balance)} ${CURRENCY}`);
    await bot.telegram.sendMessage(target.id, `💰 تم تحديث رصيد محفظتك من الإدارة @${ADMIN_USERNAME}.\nرصيدك الحالي: ${money(target.balance)} ${CURRENCY}`).catch(() => {});
    return;
  }

  if (session.action === 'broadcast') {
    clearSession(userId);
    let sent = 0;
    await ctx.reply('⏳ جاري إرسال الإذاعة لجميع المشتركين...');
    for (const id of Object.keys(db.users)) {
      try {
        await bot.telegram.sendMessage(id, `📢 إعلان من إدارة ${SHOP_NAME}:\n\n${text}`);
        sent++;
      } catch (_) {}
    }
    return ctx.reply(`✅ اكتملت الإذاعة بنجاح! وصلت إلى ${sent} عميل.`);
  }
});

// ==================== أوامر التسليم السريع للمدير ====================

bot.command('deliver', async (ctx) => {
  if (!isAdmin(ctx)) return;
  const args = ctx.message.text.split(' ');
  const orderId = Number(args[1]);
  const delivery = args.slice(2).join(' ').trim();

  if (!Number.isInteger(orderId) || !delivery) {
    return ctx.reply('⚠️ الطريقة الصحيحة:\n/deliver رقم_الطلب الكود_أو_التفاصيل');
  }

  const order = db.orders.find(o => o.id === orderId);
  if (!order) return ctx.reply('الطلب غير موجود.');

  order.status = 'completed';
  order.delivery = delivery;
  saveDB();

  await bot.telegram.sendMessage(
    order.userId,
    `✅ تم تنفيذ طلبك رقم #${order.id} بنجاح!\n\n` +
    `📦 الخدمة: ${order.productName}\n\n` +
    `📨 بيانات التسليم / الكود:\n${delivery}`
  ).catch(() => {});

  return ctx.reply(`✅ تم إرسال التسليم للعميل وإكمال الطلب #${order.id}.`);
});

bot.catch((error) => console.error('Bot alert:', error.message));

// ==================== تشغيل البوت + خادم الويب السحابي (24/7) ====================

bot.telegram.setMyCommands([
  { command: 'start', description: '🚀 القائمة الرئيسية والمتجر' },
  { command: 'admin', description: '🛠️ لوحة تحكم الإدارة' },
  { command: 'id', description: '🆔 عرض رقم حسابي' }
]).catch(() => {});

bot.launch({ dropPendingUpdates: true })
  .then(() => console.log(`✅ ${SHOP_NAME} يعمل الآن بنجاح تام!`))
  .catch((err) => console.error('خطأ في اتصال تيليجرام:', err.message));

// خادم الويب الضروري لبقاء Render نشطاً 24 ساعة
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Shamel Store Bot is Alive and Running 24/7!');
}).listen(PORT, () => {
  console.log(`🌐 Cloud Web Server listening on port ${PORT}`);
});
