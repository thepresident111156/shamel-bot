'use strict';

const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');
const http = require('http');

// ==================== 1. خادم الويب السحابي لاستقرار Render 24/7 ====================
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Shamel Bot is running 24/7!');
}).listen(PORT, () => {
  console.log('🌐 Cloud Server listening on port ' + PORT);
});

// ==================== 2. الإعدادات الأساسية ====================
const BOT_TOKEN = process.env.BOT_TOKEN || '9132364177:AAEID1FJHBUJPPMEslYbgTZw0o7QTbBlvWw';
const ADMIN_USERNAME = 'AlHaideri11';
const ENV_ADMIN_ID = String(process.env.ADMIN_ID || '');
const CURRENCY = 'USD';

const bot = new Telegraf(BOT_TOKEN);
const DB_FILE = path.join(__dirname, 'store_db.json');

// ==================== 3. البيانات الشجرية للأقسام والدول والخدمات ====================

const APPS_LIST = {
  wa: { name: 'واتساب (WhatsApp)', icon: '🟢' },
  tg: { name: 'تيليجرام (Telegram)', icon: '✈️' },
  imo: { name: 'إيمو (imo)', icon: '🔵' },
  sc: { name: 'سناب شات (Snapchat)', icon: '👻' },
  tk: { name: 'تيك توك (TikTok)', icon: '🎵' },
  fb: { name: 'فيسبوك (Facebook)', icon: '📘' },
  ig: { name: 'انستقرام (Instagram)', icon: '📸' },
  em: { name: 'بريد إلكتروني (Email / Gmail)', icon: '📧' }
};

// قائمة دول العالم مع أعلامها ومفاتيحها وأسعارها الافتراضية
const COUNTRIES = [
  { code: 'ye', name: 'اليمن', flag: '🇾🇪', dial: '+967', price: 1.50 },
  { code: 'sa', name: 'السعودية', flag: '🇸🇦', dial: '+966', price: 2.00 },
  { code: 'ae', name: 'الإمارات', flag: '🇦🇪', dial: '+971', price: 2.00 },
  { code: 'eg', name: 'مصر', flag: '🇪🇬', dial: '+20', price: 1.00 },
  { code: 'qa', name: 'قطر', flag: '🇶🇦', dial: '+974', price: 2.20 },
  { code: 'kw', name: 'الكويت', flag: '🇰🇼', dial: '+965', price: 2.20 },
  { code: 'om', name: 'عُمان', flag: '🇴🇲', dial: '+968', price: 2.00 },
  { code: 'bh', name: 'البحرين', flag: '🇧🇭', dial: '+973', price: 2.00 },
  { code: 'jo', name: 'الأردن', flag: '🇯🇴', dial: '+962', price: 1.50 },
  { code: 'iq', name: 'العراق', flag: '🇮🇶', dial: '+964', price: 1.40 },
  { code: 'sy', name: 'سوريا', flag: '🇸🇾', dial: '+963', price: 1.30 },
  { code: 'lb', name: 'لبنان', flag: '🇱🇧', dial: '+961', price: 1.50 },
  { code: 'ps', name: 'فلسطين', flag: '🇵🇸', dial: '+970', price: 1.60 },
  { code: 'sd', name: 'السودان', flag: '🇸🇩', dial: '+249', price: 1.20 },
  { code: 'ly', name: 'ليبيا', flag: '🇱🇾', dial: '+218', price: 1.50 },
  { code: 'tn', name: 'تونس', flag: '🇹🇳', dial: '+216', price: 1.40 },
  { code: 'dz', name: 'الجزائر', flag: '🇩🇿', dial: '+213', price: 1.30 },
  { code: 'ma', name: 'المغرب', flag: '🇲🇦', dial: '+212', price: 1.20 },
  { code: 'mr', name: 'موريتانيا', flag: '🇲🇷', dial: '+222', price: 1.40 },
  { code: 'so', name: 'الصومال', flag: '🇸🇴', dial: '+252', price: 1.20 },
  { code: 'dj', name: 'جيبوتي', flag: '🇩🇯', dial: '+253', price: 1.50 },
  { code: 'km', name: 'جزر القمر', flag: '🇰🇲', dial: '+269', price: 1.50 },
  { code: 'us', name: 'الولايات المتحدة', flag: '🇺🇸', dial: '+1', price: 1.20 },
  { code: 'gb', name: 'بريطانيا', flag: '🇬🇧', dial: '+44', price: 1.30 },
  { code: 'ca', name: 'كندا', flag: '🇨🇦', dial: '+1', price: 1.20 },
  { code: 'ru', name: 'روسيا', flag: '🇷🇺', dial: '+7', price: 0.90 },
  { code: 'tr', name: 'تركيا', flag: '🇹🇷', dial: '+90', price: 1.10 },
  { code: 'de', name: 'ألمانيا', flag: '🇩🇪', dial: '+49', price: 1.60 },
  { code: 'fr', name: 'فرنسا', flag: '🇫🇷', dial: '+33', price: 1.60 },
  { code: 'nl', name: 'هولندا', flag: '🇳🇱', dial: '+31', price: 1.50 },
  { code: 'es', name: 'إسبانيا', flag: '🇪🇸', dial: '+34', price: 1.50 },
  { code: 'it', name: 'إيطاليا', flag: '🇮🇹', dial: '+39', price: 1.50 },
  { code: 'se', name: 'السويد', flag: '🇸🇪', dial: '+46', price: 1.60 },
  { code: 'ch', name: 'سويسرا', flag: '🇨🇭', dial: '+41', price: 1.80 },
  { code: 'ua', name: 'أوكرانيا', flag: '🇺🇦', dial: '+380', price: 1.00 },
  { code: 'pl', name: 'بولندا', flag: '🇵🇱', dial: '+48', price: 1.20 },
  { code: 'ro', name: 'رومانيا', flag: '🇷🇴', dial: '+40', price: 1.20 },
  { code: 'id', name: 'إندونيسيا', flag: '🇮🇩', dial: '+62', price: 0.70 },
  { code: 'my', name: 'ماليزيا', flag: '🇲🇾', dial: '+60', price: 0.90 },
  { code: 'in', name: 'الهند', flag: '🇮🇳', dial: '+91', price: 0.80 },
  { code: 'pk', name: 'باكستان', flag: '🇵🇰', dial: '+92', price: 0.80 },
  { code: 'ph', name: 'الفلبين', flag: '🇵🇭', dial: '+63', price: 0.80 },
  { code: 'vn', name: 'فيتنام', flag: '🇻🇳', dial: '+84', price: 0.75 },
  { code: 'th', name: 'تايلاند', flag: '🇹🇭', dial: '+66', price: 0.85 },
  { code: 'cn', name: 'الصين', flag: '🇨🇳', dial: '+86', price: 1.30 },
  { code: 'jp', name: 'اليابان', flag: '🇯🇵', dial: '+81', price: 1.80 },
  { code: 'kr', name: 'كوريا الجنوبية', flag: '🇰🇷', dial: '+82', price: 1.70 },
  { code: 'kz', name: 'كازاخستان', flag: '🇰🇿', dial: '+7', price: 0.95 },
  { code: 'br', name: 'البرازيل', flag: '🇧🇷', dial: '+55', price: 1.10 },
  { code: 'ar', name: 'الأرجنتين', flag: '🇦🇷', dial: '+54', price: 1.10 },
  { code: 'mx', name: 'المكسيك', flag: '🇲🇽', dial: '+52', price: 1.10 },
  { code: 'co', name: 'كولومبيا', flag: '🇨🇴', dial: '+57', price: 1.00 },
  { code: 'ng', name: 'نيجيريا', flag: '🇳🇬', dial: '+234', price: 0.90 },
  { code: 'za', name: 'جنوب أفريقيا', flag: '🇿🇦', dial: '+27', price: 1.00 },
  { code: 'ke', name: 'كينيا', flag: '🇰🇪', dial: '+254', price: 0.90 },
  { code: 'au', name: 'أستراليا', flag: '🇦🇺', dial: '+61', price: 1.70 }
];

// منصات وخدمات الرشق
const SMM_PLATFORMS = {
  tg: {
    name: 'تيليجرام (Telegram)', icon: '✈️',
    services: [
      { id: 'tg_m1', name: '👥 رشق 1,000 عضو للقنوات والمجموعات', price: 1.80 },
      { id: 'tg_v1', name: '👁️ رشق 5,000 مشاهدة لمنشورات القناة', price: 0.80 },
      { id: 'tg_r1', name: '👍 رشق 1,000 تفاعل إيجابي على المنشورات', price: 1.20 }
    ]
  },
  tk: {
    name: 'تيك توك (TikTok)', icon: '🎵',
    services: [
      { id: 'tk_f1', name: '👥 زيادة 1,000 متابع حقيقي متفاعل', price: 2.00 },
      { id: 'tk_l1', name: '❤️ زيادة 1,000 إعجاب (لايك) للفيديو', price: 1.00 },
      { id: 'tk_v1', name: '▶️ زيادة 10,000 مشاهدة فيديو فورية', price: 0.90 }
    ]
  },
  ig: {
    name: 'انستقرام (Instagram)', icon: '📸',
    services: [
      { id: 'ig_f1', name: '👥 زيادة 1,000 متابع بضمان عدم النقصان', price: 1.80 },
      { id: 'ig_l1', name: '❤️ زيادة 1,000 إعجاب للمنشورات والريلز', price: 0.90 },
      { id: 'ig_v1', name: '🎬 زيادة 5,000 مشاهدة ستوري أو ريلز', price: 1.00 }
    ]
  },
  fb: {
    name: 'فيسبوك (Facebook)', icon: '📘',
    services: [
      { id: 'fb_f1', name: '👥 زيادة 1,000 متابع للصفحات والحسابات', price: 2.00 },
      { id: 'fb_l1', name: '👍 زيادة 1,000 إعجاب وتفاعل للمنشورات', price: 1.20 }
    ]
  },
  yt: {
    name: 'يوتيوب (YouTube)', icon: '▶️',
    services: [
      { id: 'yt_s1', name: '🔔 زيادة 1,000 مشترك للقناة', price: 3.50 },
      { id: 'yt_v1', name: '👁️ زيادة 2,000 مشاهدة فيديو عالية الجودة', price: 2.20 }
    ]
  },
  sc: {
    name: 'سناب شات (Snapchat)', icon: '👻',
    services: [
      { id: 'sc_f1', name: '👥 زيادة 1,000 متابع ملف تعريفي', price: 3.00 },
      { id: 'sc_v1', name: '🔥 زيادة مشاهدات الأضواء والقصص', price: 2.00 }
    ]
  },
  tw: {
    name: 'منصة إكس / تويتر (X)', icon: '🐦',
    services: [
      { id: 'tw_f1', name: '👥 زيادة 1,000 متابع لحسابك', price: 2.50 },
      { id: 'tw_r1', name: '🔁 زيادة 1,000 إعادة تغريد وإعجاب', price: 1.50 }
    ]
  }
};

// قوائم العملات الرقمية والنقدية
const CRYPTO_CURRENCIES = [
  { id: 'usdt_trc20', name: '💎 عملة USDT (شبكة TRC20)' },
  { id: 'usdt_bep20', name: '💛 عملة USDT (شبكة BEP20 / Binance)' },
  { id: 'btc', name: '🪙 عملة بيتكوين (Bitcoin - BTC)' },
  { id: 'eth', name: '💠 عملة إيثيريوم (Ethereum - ETH)' },
  { id: 'bnb', name: '🔶 عملة بينانس كوين (BNB)' },
  { id: 'trx', name: '🔴 عملة ترون (Tron - TRX)' },
  { id: 'ton', name: '💎 عملة تون كوين (Toncoin - TON)' }
];

const FIAT_CURRENCIES = [
  { id: 'yer', name: '🇾🇪 الريال اليمني (صنعاء / عدن - كافة المحافظ والبنوك)' },
  { id: 'sar', name: '🇸🇦 الريال السعودي (راجحي / أهلي / STC Pay)' },
  { id: 'usd', name: '🇺🇸 الدولار الأمريكي (حوالات / نقد)' },
  { id: 'aed', name: '🇦🇪 الدرهم الإماراتي (تحويل بنكي / صرافة)' },
  { id: 'egp', name: '🇪🇬 الجنيه المصري (فودافون كاش / انستا باي)' },
  { id: 'payeer', name: '🅿️ بنك بايير الإلكتروني (Payeer)' },
  { id: 'paypal', name: '💳 بنك بايبال العالمي (PayPal)' },
  { id: 'wise', name: '🌐 بنك وايز وحوالات ويسترن يونيون (Wise / WU)' }
];

// المنتجات الرقمية والتعاقدات (شراء وبيع)
const DIGITAL_BUY_ITEMS = [
  { id: 'db_1', name: '🎨 اشتراكات بريميوم (Canva Pro / ChatGPT Plus / Adobe)', price: 3.00 },
  { id: 'db_2', name: '🎬 اشتراكات ترفيهية (Netflix / Shahid VIP / OSN)', price: 2.50 },
  { id: 'db_3', name: '🎮 بطاقات ألعاب وشحن (PUBG / FreeFire / iTunes / Google Play)', price: 5.00 },
  { id: 'db_4', name: '📱 شراء حسابات مواقع تواصل جاهزة وقديمة', price: 4.00 },
  { id: 'db_5', name: '🤖 برمجة وتطوير بوتات تيليجرام والأنظمة الرقمية', price: 15.00 },
  { id: 'db_6', name: '🤝 طلب وساطة تجارية أو إبرام عقد عمل رسمي مضمون', price: 5.00 }
];

const DIGITAL_SELL_ITEMS = [
  { id: 'ds_1', name: '📲 بيع حسابات وقنوات ومجموعات (تيليجرام / تيك توك / انستا)' },
  { id: 'ds_2', name: '🔑 بيع أكواد وتراخيص برامج وبطاقات رقمية بالجملة' },
  { id: 'ds_3', name: '💼 عرض خدماتك المهنية أو البرمجية للتعاقد عبر المنصة' },
  { id: 'ds_4', name: '📄 توثيق صفقة بيع رقمية بضمان ووساطة الإدارة' }
];

// ==================== 4. قاعدة البيانات ====================
function initialDB() {
  return {
    adminId: ENV_ADMIN_ID || null,
    autoGenerateNumbers: false, // إذا كانت false يظهر "لا يوجد رقم حالياً" ما لم يوجد في المخزون، وإذا true يولد أرقاماً فورية
    numberStock: {}, // مخزون أرقام حقيقية بصيغة: "wa_ye": ["+96777...", ...]
    users: {},
    products: [],
    orders: [],
    topups: [],
    nextProductId: 1,
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

// ==================== 5. دوال المساعدة والتحقق ====================
const money = (val) => Number(val || 0).toFixed(2);
const validAmount = (val) => {
  const n = Number(val);
  return Number.isFinite(n) && n > 0 && n <= 1000000;
};
const getBotName = (ctx) => (ctx && ctx.botInfo && ctx.botInfo.first_name) ? ctx.botInfo.first_name : 'منصة شامل للخدمات الرقمية';

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

const sessions = new Map();
const setSession = (id, data) => sessions.set(String(id), data);
const getSession = (id) => sessions.get(String(id));
const clearSession = (id) => sessions.delete(String(id));

// ==================== 6. القوائم الرئيسية ولوحة المفاتيح ====================
const bottomKeyboard = {
  reply_markup: {
    keyboard: [
      [{ text: '🚀 القائمة الرئيسية' }, { text: '🛍️ تصفح الأقسام والخدمات' }],
      [{ text: '👤 حسابي ورصيدي' }, { text: '💳 شحن الرصيد' }],
      [{ text: '📦 طلباتي' }, { text: '📞 الدعم الفني' }]
    ],
    resize_keyboard: true,
    is_persistent: true
  }
};

function mainKeyboard(ctx) {
  const rows = [
    [Markup.button.callback('🛍️ تصفح الأقسام والخدمات', 'browse_sections')],
    [
      Markup.button.callback('👤 حسابي ورصيدي', 'account'),
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
    rows.push([Markup.button.callback('🛠️ لوحة تحكم الإدارة الشاملة', 'admin_home')]);
  }
  return Markup.inlineKeyboard(rows);
}

// قائمة الأقسام الأربعة الرئيسية عند الضغط على "تصفح الأقسام والخدمات"
function sectionsMenuKeyboard() {
  const rows = [
    [Markup.button.callback('📲 قسم تفعيل مواقع التواصل (SMS - Email)', 'sec_verify')],
    [Markup.button.callback('🚀 قسم الرشق وزيادة المتابعين', 'sec_smm')],
    [Markup.button.callback('🏦 قسم المصارف وتحويل العملات', 'sec_exchange')],
    [Markup.button.callback('💎 قسم المنتجات الرقمية والتعاقدات', 'sec_digital')]
  ];

  // إذا أضاف المدير منتجات إضافية خاصة من لوحة التحكم تظهر كقسم إضافي
  if (db.products && db.products.some(p => p.active)) {
    rows.push([Markup.button.callback('🛒 عروض ومنتجات إضافية مميزة', 'sec_custom_products')]);
  }

  rows.push([Markup.button.callback('🔙 العودة للقائمة الرئيسية', 'home')]);
  return Markup.inlineKeyboard(rows);
}

// ==================== 7. البداية والقسم الرئيسي ====================
async function sendHome(ctx) {
  const user = getUser(ctx);
  clearSession(ctx.from.id);
  const botName = getBotName(ctx);

  await ctx.reply('👋 القائمة السريعة جاهزة بالأسفل لخدمتك:', bottomKeyboard).catch(() => {});

  return ctx.reply(
    `🌟 أهلاً بك يا ${user.name} في ${botName}!\n\n` +
    `🆔 رقم حسابك: ${user.id}\n` +
    `💰 رصيدك الحالي: ${money(user.balance)} ${CURRENCY}\n` +
    `👑 بإشراف وإدارة: @${ADMIN_USERNAME}\n\n` +
    '👇 اضغط على (تصفح الأقسام والخدمات) أو اختر من القائمة أدناه:',
    mainKeyboard(ctx)
  );
}

bot.start(sendHome);
bot.hears('🚀 القائمة الرئيسية', sendHome);

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
    '👇 اختر القسم المطلوب من القائمة:',
    mainKeyboard(ctx)
  );
});

const openSectionsText =
  '🛍️ **تصفح الأقسام والخدمات الرئيسية**\n\n' +
  'اختر القسم المطلوب من الأقسام الأربعة أدناه للمتابعة:';

bot.hears('🛍️ تصفح الأقسام والخدمات', (ctx) => {
  clearSession(ctx.from.id);
  return ctx.reply(openSectionsText, sectionsMenuKeyboard());
});

bot.action('browse_sections', async (ctx) => {
  await ctx.answerCbQuery();
  clearSession(ctx.from.id);
  return safeEdit(ctx, openSectionsText, sectionsMenuKeyboard());
});

// ==================== 8. القسم الأول: تفعيل مواقع التواصل (SMS - Email) ====================
bot.action('sec_verify', async (ctx) => {
  await ctx.answerCbQuery();
  const rows = [
    [
      Markup.button.callback('🟢 تفعيل واتساب (WhatsApp)', 'vapp_wa_0'),
      Markup.button.callback('✈️ تفعيل تيليجرام (Telegram)', 'vapp_tg_0')
    ],
    [
      Markup.button.callback('🔵 تفعيل إيمو (imo)', 'vapp_imo_0'),
      Markup.button.callback('👻 تفعيل سناب شات (Snapchat)', 'vapp_sc_0')
    ],
    [
      Markup.button.callback('🎵 تفعيل تيك توك (TikTok)', 'vapp_tk_0'),
      Markup.button.callback('📘 تفعيل فيسبوك (Facebook)', 'vapp_fb_0')
    ],
    [
      Markup.button.callback('📸 تفعيل انستقرام (Instagram)', 'vapp_ig_0'),
      Markup.button.callback('📧 تفعيل بالبريد الإلكتروني (Email)', 'vapp_em_0')
    ],
    [Markup.button.callback('🔙 رجوع للأقسام الرئيسية', 'browse_sections')]
  ];

  await safeEdit(
    ctx,
    '📲 **قسم تفعيل مواقع التواصل (SMS - Email)**\n\n' +
    'اختر التطبيق أو الموقع الذي ترغب في تفعيله لعرض قائمة دول العالم:',
    Markup.inlineKeyboard(rows)
  );
});

// عرض دول العالم مع أعلامها بنظام الصفحات السلس
bot.action(/^vapp_([a-z]+)_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const appKey = ctx.match[1];
  const page = Number(ctx.match[2]);
  const app = APPS_LIST[appKey];
  if (!app) return;

  const perPage = 14; // 14 دولة في كل صفحة (7 صفوف × عمودين)
  const totalPages = Math.ceil(COUNTRIES.length / perPage);
  const currentList = COUNTRIES.slice(page * perPage, (page + 1) * perPage);

  const rows = [];
  for (let i = 0; i < currentList.length; i += 2) {
    const pair = [];
    const c1 = currentList[i];
    pair.push(Markup.button.callback(`${c1.flag} ${c1.name} (${money(c1.price)}$)`, `vcnt_${appKey}_${c1.code}`));
    if (currentList[i + 1]) {
      const c2 = currentList[i + 1];
      pair.push(Markup.button.callback(`${c2.flag} ${c2.name} (${money(c2.price)}$)`, `vcnt_${appKey}_${c2.code}`));
    }
    rows.push(pair);
  }

  // أزرار التنقل بين صفحات الدول
  const navRow = [];
  if (page > 0) {
    navRow.push(Markup.button.callback('➡️ الصفحة السابقة', `vapp_${appKey}_${page - 1}`));
  }
  if (page < totalPages - 1) {
    navRow.push(Markup.button.callback('⬅️ مزيد من الدول', `vapp_${appKey}_${page + 1}`));
  }
  if (navRow.length) rows.push(navRow);

  rows.push([Markup.button.callback('🔙 رجوع لقائمة تطبيقات التفعيل', 'sec_verify')]);

  await safeEdit(
    ctx,
    `${app.icon} **قسم تفعيل ${app.name}**\n` +
    `🌍 اختر الدولة المطلوبة من القائمة (صفحة ${page + 1} من ${totalPages}):`,
    Markup.inlineKeyboard(rows)
  );
});

// عند الضغط على أي دولة: إظهار "جارٍ توليد الرقم بسرعة فائقة..." ثم فحص التوفر
bot.action(/^vcnt_([a-z]+)_([a-z]+)$/, async (ctx) => {
  const appKey = ctx.match[1];
  const countryCode = ctx.match[2];
  const app = APPS_LIST[appKey];
  const country = COUNTRIES.find(c => c.code === countryCode);
  if (!app || !country) return ctx.answerCbQuery();

  await ctx.answerCbQuery('⚡ جارٍ الاتصال بالخادم وتوليد الرقم...');

  // 1. إظهار شاشة التوليد الفائق السرعة للعميل فوراً
  await safeEdit(
    ctx,
    `⏳ **جارٍ توليد الرقم بسرعة فائقة...**\n\n` +
    `📱 القسم: تفعيل ${app.name}\n` +
    `🌍 الدولة: ${country.flag} ${country.name} (${country.dial})\n` +
    `🔄 يرجى الانتظار للحظة ريثما يتم فحص الخوادم المتاحة...`
  );

  // انتظار لحظي (900 ملي ثانية) لمحاكاة البحث السريع في السيرفر
  await new Promise(resolve => setTimeout(resolve, 900));

  const stockKey = `${appKey}_${countryCode}`;
  const customStock = Array.isArray(db.numberStock[stockKey]) ? db.numberStock[stockKey] : [];
  const hasStock = customStock.length > 0 || db.autoGenerateNumbers;

  const user = getUser(ctx);

  // الحالة الأولى: لا توجد أرقام متوفرة حالياً في السيرفر لهذه الدولة
  if (!hasStock) {
    return safeEdit(
      ctx,
      `⚠️ **عذراً، لا يوجد رقم متوفر حالياً لهذه الدولة في الخادم الآلي!**\n\n` +
      `📱 التطبيق: ${app.icon} ${app.name}\n` +
      `🌍 الدولة: ${country.flag} ${country.name}\n` +
      `💵 السعر المعتمد: ${money(country.price)}$\n\n` +
      `💡 يمكنك اختيار دولة أخرى، أو الضغط على (طلب توفير الرقم عبر الإدارة) ليتم تجهيزه لك فوراً:`,
      Markup.inlineKeyboard([
        [Markup.button.callback(`📩 طلب توفير رقم ${country.name} فوراً (${money(country.price)}$)`, `vreq_${appKey}_${countryCode}`)],
        [Markup.button.callback('🌍 اختيار دولة أخرى', `vapp_${appKey}_0`)],
        [Markup.button.callback('🔙 رجوع لقسم التفعيل', 'sec_verify')]
      ])
    );
  }

  // الحالة الثانية: الرقم متوفر (ولكن نتحقق من رصيد العميل أولاً)
  if (user.balance < country.price) {
    return safeEdit(
      ctx,
      `✅ **الرقم متوفر وجاهز للتوليد الفوري!**\n\n` +
      `📱 التطبيق: ${app.icon} ${app.name}\n` +
      `🌍 الدولة: ${country.flag} ${country.name}\n` +
      `💵 سعر الرقم: ${money(country.price)}$\n` +
      `💰 رصيدك الحالي: ${money(user.balance)}$\n\n` +
      `❌ **رصيدك غير كافٍ لسحب الرقم.** يرجى شحن حسابك أولاً:`,
      Markup.inlineKeyboard([
        [Markup.button.callback('💳 شحن الرصيد الآن', 'topup')],
        [Markup.button.callback('🌍 اختيار دولة أخرى', `vapp_${appKey}_0`)]
      ])
    );
  }

  // خصم الرصيد وتوليد/سحب الرقم
  user.balance = Number((user.balance - country.price).toFixed(2));
  let generatedNumber;
  if (customStock.length > 0) {
    generatedNumber = db.numberStock[stockKey].shift();
  } else {
    const randomDigits = Math.floor(100000000 + Math.random() * 900000000);
    generatedNumber = `${country.dial}${randomDigits}`;
  }

  const order = {
    id: db.nextOrderId++,
    userId: user.id,
    productName: `تفعيل ${app.name} - ${country.flag} ${country.name} (${generatedNumber})`,
    price: country.price,
    status: 'pending',
    date: new Date().toISOString()
  };
  db.orders.push(order);
  saveDB();

  await safeEdit(
    ctx,
    `🎉 **تم توليد وتخصيص الرقم لك بنجاح!**\n\n` +
    `🧾 رقم الطلب: #${order.id}\n` +
    `📱 التطبيق: ${app.icon} ${app.name}\n` +
    `🌍 الدولة: ${country.flag} ${country.name}\n` +
    `📞 الرقم المخصص: \`${generatedNumber}\`\n` +
    `💰 رصيدك المتبقي: ${money(user.balance)}$\n\n` +
    `⏳ **ضع الرقم في التطبيق الآن؛ سيصلك كود التفعيل (SMS/Email) هنا فوراً.**`,
    Markup.inlineKeyboard([
      [Markup.button.callback('🔙 رجوع لقسم التفعيل', 'sec_verify')]
    ])
  );

  await notifyAdmin(
    `🔔 **سحب رقم تفعيل جديد (#${order.id})**\n\n` +
    `📱 التطبيق: ${app.name}\n` +
    `🌍 الدولة: ${country.flag} ${country.name}\n` +
    `📞 الرقم: ${generatedNumber}\n` +
    `👤 العميل: ${user.name} (@${user.username || 'بدون_معرف'})\n` +
    `🆔 معرف العميل: ${user.id}\n` +
    `💵 المبلغ المخصوم: ${money(country.price)}$\n\n` +
    `👇 لإرسال كود التفعيل للعميل اكتب:\n/deliver ${order.id} كود_التفعيل`,
    Markup.inlineKeyboard([
      [Markup.button.callback('✅ إكمال الطلب', `complete_order_${order.id}`)]
    ])
  );
});

// طلب توفير رقم يدوي عندما يكون الخادم الآلي فارغاً
bot.action(/^vreq_([a-z]+)_([a-z]+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const app = APPS_LIST[ctx.match[1]];
  const country = COUNTRIES.find(c => c.code === ctx.match[2]);
  if (!app || !country) return;

  const user = getUser(ctx);
  if (user.balance < country.price) {
    return safeEdit(
      ctx,
      `❌ **رصيدك غير كافٍ لتسجيل الطلب.**\n\n` +
      `💵 المطلوب: ${money(country.price)}$ | 💰 رصيدك: ${money(user.balance)}$`,
      Markup.inlineKeyboard([
        [Markup.button.callback('💳 شحن الرصيد الآن', 'topup')],
        [Markup.button.callback('🔙 رجوع', `vapp_${ctx.match[1]}_0`)]
      ])
    );
  }

  user.balance = Number((user.balance - country.price).toFixed(2));
  const order = {
    id: db.nextOrderId++,
    userId: user.id,
    productName: `طلب تفعيل ${app.name} - ${country.flag} ${country.name}`,
    price: country.price,
    status: 'pending',
    date: new Date().toISOString()
  };
  db.orders.push(order);
  saveDB();

  await safeEdit(
    ctx,
    `✅ **تم تسجيل طلب توفير الرقم بنجاح (#${order.id})!**\n\n` +
    `📱 القسم: ${app.icon} ${app.name}\n` +
    `🌍 الدولة: ${country.flag} ${country.name}\n` +
    `💰 رصيدك المتبقي: ${money(user.balance)}$\n\n` +
    `⏳ ستقوم الإدارة (@${ADMIN_USERNAME}) بإرسال الرقم وكود التفعيل لك هنا فوراً.`,
    Markup.inlineKeyboard([[Markup.button.callback('🔙 القائمة الرئيسية', 'home')]])
  );

  await notifyAdmin(
    `📲 **طلب توفير رقم تفعيل (#${order.id})**\n\n` +
    `📱 التطبيق: ${app.name}\n` +
    `🌍 الدولة: ${country.flag} ${country.name}\n` +
    `💵 المبلغ المخصوم: ${money(country.price)}$\n` +
    `👤 العميل: ${user.name} (${user.id})\n\n` +
    `👇 لإرسال الرقم أو الكود للعميل اكتب:\n/deliver ${order.id} الرقم_أو_الكود`,
    Markup.inlineKeyboard([[Markup.button.callback('✅ إكمال الطلب', `complete_order_${order.id}`)]])
  );
});

// ==================== 9. القسم الثاني: الرشق وزيادة المتابعين ====================
bot.action('sec_smm', async (ctx) => {
  await ctx.answerCbQuery();
  const rows = Object.keys(SMM_PLATFORMS).map(key => {
    const p = SMM_PLATFORMS[key];
    return [Markup.button.callback(`${p.icon} رشق ${p.name}`, `smm_plat_${key}`)];
  });
  rows.push([Markup.button.callback('🔙 رجوع للأقسام الرئيسية', 'browse_sections')]);

  await safeEdit(
    ctx,
    '🚀 **قسم الرشق وزيادة المتابعين والمشاهدات**\n\n' +
    'اختر المنصة التي ترغب في دعمها وزيادة التفاعل فيها:',
    Markup.inlineKeyboard(rows)
  );
});

bot.action(/^smm_plat_([a-z]+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const key = ctx.match[1];
  const plat = SMM_PLATFORMS[key];
  if (!plat) return;

  const rows = plat.services.map(srv => [
    Markup.button.callback(`${srv.name} — ${money(srv.price)}$`, `smm_buy_${key}_${srv.id}`)
  ]);
  rows.push([Markup.button.callback('🔙 رجوع لمنصات الرشق', 'sec_smm')]);

  await safeEdit(
    ctx,
    `${plat.icon} **خدمات رشق ${plat.name}**\n\n` +
    'اختر الباقة المطلوبة لتنفيذها بسرعة وضمان عالٍ:',
    Markup.inlineKeyboard(rows)
  );
});

bot.action(/^smm_buy_([a-z]+)_([a-z0-9_]+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const platKey = ctx.match[1];
  const srvId = ctx.match[2];
  const plat = SMM_PLATFORMS[platKey];
  if (!plat) return;
  const srv = plat.services.find(s => s.id === srvId);
  if (!srv) return;

  const user = getUser(ctx);
  if (user.balance < srv.price) {
    return safeEdit(
      ctx,
      `❌ **رصيدك غير كافٍ لطلب هذه الباقة.**\n\n` +
      `📦 الخدمة: ${srv.name}\n` +
      `💵 السعر: ${money(srv.price)}$ | 💰 رصيدك: ${money(user.balance)}$`,
      Markup.inlineKeyboard([
        [Markup.button.callback('💳 شحن الرصيد الآن', 'topup')],
        [Markup.button.callback('🔙 رجوع', `smm_plat_${platKey}`)]
      ])
    );
  }

  setSession(ctx.from.id, {
    action: 'smm_link',
    platName: plat.name,
    srvName: srv.name,
    price: srv.price
  });

  await safeEdit(
    ctx,
    `🔗 **إدخال رابط الحساب أو المنشور**\n\n` +
    `📦 الخدمة المختارة: ${srv.name}\n` +
    `💵 التكلفة: ${money(srv.price)}$\n\n` +
    `✍️ **أرسل الآن في رسالة رابط الحساب أو القناة أو الفيديو المراد رشقه:**`,
    Markup.inlineKeyboard([[Markup.button.callback('❌ إلغاء والرجوع', `smm_plat_${platKey}`)]])
  );
});

// ==================== 10. القسم الثالث: المصارف وتحويل العملات ====================
bot.action('sec_exchange', async (ctx) => {
  await ctx.answerCbQuery();
  const rows = [
    [Markup.button.callback('💎 قسم العملات الرقمية (Crypto / USDT)', 'ex_crypto')],
    [Markup.button.callback('💵 قسم العملات النقدية والبنوك والحوالات', 'ex_fiat')],
    [Markup.button.callback('🔙 رجوع للأقسام الرئيسية', 'browse_sections')]
  ];

  await safeEdit(
    ctx,
    '🏦 **قسم المصارف وتحويل العملات**\n\n' +
    'نقدم خدمات المصارفة والتحويل والشحن والسحب بأفضل الأسعار وأعلى درجات الأمان.\n' +
    '👇 اختر القسم المطلوب:',
    Markup.inlineKeyboard(rows)
  );
});

bot.action('ex_crypto', async (ctx) => {
  await ctx.answerCbQuery();
  const rows = CRYPTO_CURRENCIES.map(c => [
    Markup.button.callback(c.name, `ex_item_${c.id}`)
  ]);
  rows.push([Markup.button.callback('🔙 رجوع لقسم المصارف', 'sec_exchange')]);

  await safeEdit(
    ctx,
    '💎 **قسم العملات الرقمية (بيع / شراء / تبديل)**\n\n' +
    'اختر العملة الرقمية التي ترغب في التعامل بها:',
    Markup.inlineKeyboard(rows)
  );
});

bot.action('ex_fiat', async (ctx) => {
  await ctx.answerCbQuery();
  const rows = FIAT_CURRENCIES.map(f => [
    Markup.button.callback(f.name, `ex_item_${f.id}`)
  ]);
  rows.push([Markup.button.callback('🔙 رجوع لقسم المصارف', 'sec_exchange')]);

  await safeEdit(
    ctx,
    '💵 **قسم العملات النقدية والبنوك الإلكترونية والحوالات**\n\n' +
    'اختر العملة أو البنك المطلوب لإجراء التحويل أو المصارفة:',
    Markup.inlineKeyboard(rows)
  );
});

bot.action(/^ex_item_([a-z0-9_]+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const itemId = ctx.match[1];
  const item = [...CRYPTO_CURRENCIES, ...FIAT_CURRENCIES].find(x => x.id === itemId);
  if (!item) return;

  setSession(ctx.from.id, {
    action: 'exchange_request',
    currencyName: item.name
  });

  await safeEdit(
    ctx,
    `🏦 **طلب عملية مصارفة أو تحويل**\n\n` +
    `📌 العملة / الجهة المختارة:\n${item.name}\n\n` +
    `✍️ **أرسل الآن تفاصيل طلبك في رسالة (المبلغ، وهل ترغب في البيع أم الشراء أم التحويل) وسيتم الرد عليك فوراً، أو تواصل مباشرة مع الإدارة:**`,
    Markup.inlineKeyboard([
      [Markup.button.url('👨‍💼 محادثة الإدارة مباشرة (@' + ADMIN_USERNAME + ')', 'https://t.me/' + ADMIN_USERNAME)],
      [Markup.button.callback('🔙 رجوع لقسم المصارف', 'sec_exchange')]
    ])
  );
});

// ==================== 11. القسم الرابع: المنتجات الرقمية والتعاقدات ====================
bot.action('sec_digital', async (ctx) => {
  await ctx.answerCbQuery();
  const rows = [
    [Markup.button.callback('🛒 قسم شراء المنتجات الرقمية والتعاقدات', 'dig_buy_menu')],
    [Markup.button.callback('💰 قسم بيع المنتجات الرقمية والتعاقدات', 'dig_sell_menu')],
    [Markup.button.callback('🔙 رجوع للأقسام الرئيسية', 'browse_sections')]
  ];

  await safeEdit(
    ctx,
    '💎 **قسم المنتجات الرقمية والتعاقدات**\n\n' +
    'بوابتك الآمنة لشراء وبيع كافة المنتجات الرقمية والاشتراكات وإبرام عقود العمل والوساطة التجارية بإشراف الإدارة.\n' +
    '👇 اختر القسم المطلوب:',
    Markup.inlineKeyboard(rows)
  );
});

bot.action('dig_buy_menu', async (ctx) => {
  await ctx.answerCbQuery();
  const rows = DIGITAL_BUY_ITEMS.map(item => [
    Markup.button.callback(`${item.name} — ${money(item.price)}$`, `dig_b_item_${item.id}`)
  ]);
  rows.push([Markup.button.callback('🔙 رجوع لقسم المنتجات الرقمية', 'sec_digital')]);

  await safeEdit(
    ctx,
    '🛒 **قسم شراء المنتجات الرقمية والتعاقدات**\n\n' +
    'اختر المنتج أو الخدمة التي ترغب في شرائها:',
    Markup.inlineKeyboard(rows)
  );
});

bot.action(/^dig_b_item_([a-z0-9_]+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const item = DIGITAL_BUY_ITEMS.find(x => x.id === ctx.match[1]);
  if (!item) return;

  await safeEdit(
    ctx,
    `🛒 **تفاصيل المنتج / الخدمة**\n\n` +
    `📦 الخدمة: ${item.name}\n` +
    `💵 السعر المبدئي: ${money(item.price)}$\n` +
    `🛡️ الضمان: ضمان كامل وإشراف مباشر من @${ADMIN_USERNAME}\n\n` +
    `اضغط لتأكيد الشراء من رصيدك أو راسل الإدارة للتفاصيل الخاصة:`,
    Markup.inlineKeyboard([
      [Markup.button.callback(`✅ تأكيد الشراء (${money(item.price)}$)`, `dig_confirm_${item.id}`)],
      [Markup.button.url('👨‍💼 التعاقد المباشر مع الإدارة', 'https://t.me/' + ADMIN_USERNAME)],
      [Markup.button.callback('🔙 رجوع لقائمة الشراء', 'dig_buy_menu')]
    ])
  );
});

bot.action(/^dig_confirm_([a-z0-9_]+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const item = DIGITAL_BUY_ITEMS.find(x => x.id === ctx.match[1]);
  if (!item) return;

  const user = getUser(ctx);
  if (user.balance < item.price) {
    return safeEdit(
      ctx,
      `❌ **رصيدك غير كافٍ لإتمام الشراء.**\n` +
      `💵 السعر: ${money(item.price)}$ | 💰 رصيدك: ${money(user.balance)}$`,
      Markup.inlineKeyboard([
        [Markup.button.callback('💳 شحن الرصيد الآن', 'topup')],
        [Markup.button.callback('🔙 رجوع', 'dig_buy_menu')]
      ])
    );
  }

  user.balance = Number((user.balance - item.price).toFixed(2));
  const order = {
    id: db.nextOrderId++,
    userId: user.id,
    productName: item.name,
    price: item.price,
    status: 'pending',
    date: new Date().toISOString()
  };
  db.orders.push(order);
  saveDB();

  await safeEdit(
    ctx,
    `✅ **تم تسجيل طلب الشراء بنجاح (#${order.id})!**\n\n` +
    `📦 المنتج: ${item.name}\n` +
    `💰 رصيدك المتبقي: ${money(user.balance)}$\n\n` +
    `⏳ سيتم تسليمك تفاصيل المنتج والتعاقد هنا فوراً من قِبل الإدارة @${ADMIN_USERNAME}.`,
    Markup.inlineKeyboard([[Markup.button.callback('🔙 القائمة الرئيسية', 'home')]])
  );

  await notifyAdmin(
    `💎 **طلب شراء منتج رقمي / تعاقد (#${order.id})**\n\n` +
    `📦 المنتج: ${item.name}\n` +
    `💵 المبلغ: ${money(item.price)}$\n` +
    `👤 العميل: ${user.name} (${user.id})\n\n` +
    `👇 لتسليم العميل اكتب:\n/deliver ${order.id} بيانات_المنتج`,
    Markup.inlineKeyboard([[Markup.button.callback('✅ إكمال الطلب', `complete_order_${order.id}`)]])
  );
});

bot.action('dig_sell_menu', async (ctx) => {
  await ctx.answerCbQuery();
  const rows = DIGITAL_SELL_ITEMS.map(item => [
    Markup.button.callback(item.name, `dig_s_item_${item.id}`)
  ]);
  rows.push([Markup.button.callback('🔙 رجوع لقسم المنتجات الرقمية', 'sec_digital')]);

  await safeEdit(
    ctx,
    '💰 **قسم بيع المنتجات الرقمية والتعاقدات**\n\n' +
    'اختر نوع المنتج أو الخدمة الرقمية التي ترغب في بيعها أو عرضها للتعاقد:',
    Markup.inlineKeyboard(rows)
  );
});

bot.action(/^dig_s_item_([a-z0-9_]+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const item = DIGITAL_SELL_ITEMS.find(x => x.id === ctx.match[1]);
  if (!item) return;

  setSession(ctx.from.id, {
    action: 'sell_digital_offer',
    categoryName: item.name
  });

  await safeEdit(
    ctx,
    `💰 **تقديم عرض بيع أو تعاقد رقمي**\n\n` +
    `📌 القسم المختار:\n${item.name}\n\n` +
    `✍️ **أرسل الآن في رسالة مواصفات المنتج أو الحساب الذي تريد بيعه والسعر المطلوب، ليتم فحصه واعتماده من الإدارة:**`,
    Markup.inlineKeyboard([
      [Markup.button.url('👨‍💼 التواصل المباشر مع الإدارة', 'https://t.me/' + ADMIN_USERNAME)],
      [Markup.button.callback('🔙 رجوع لقائمة البيع', 'dig_sell_menu')]
    ])
  );
});

// عرض المنتجات المضافة يدوياً من لوحة التحكم (إن وجدت)
bot.action('sec_custom_products', async (ctx) => {
  await ctx.answerCbQuery();
  const products = db.products.filter(p => p.active);
  if (!products.length) return safeEdit(ctx, 'لا توجد عروض إضافية حالياً.', sectionsMenuKeyboard());

  const buttons = products.map(p => [
    Markup.button.callback(`${p.name} — ${money(p.price)}$`, `product_${p.id}`)
  ]);
  buttons.push([Markup.button.callback('🔙 رجوع للأقسام الرئيسية', 'browse_sections')]);
  await safeEdit(ctx, '🛒 **العروض والمنتجات الإضافية:**', Markup.inlineKeyboard(buttons));
});

bot.action(/^product_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const product = db.products.find(p => p.id === Number(ctx.match[1]) && p.active);
  if (!product) return ctx.reply('هذه الخدمة غير متاحة حالياً.');

  await safeEdit(
    ctx,
    `🛍️ ${product.name}\n\n📝 التفاصيل: ${product.description}\n💵 السعر: ${money(product.price)}$`,
    Markup.inlineKeyboard([
      [Markup.button.callback('✅ شراء وتأكيد الطلب', `buy_${product.id}`)],
      [Markup.button.callback('🔙 رجوع', 'sec_custom_products')]
    ])
  );
});

bot.action(/^buy_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const user = getUser(ctx);
  const product = db.products.find(p => p.id === Number(ctx.match[1]) && p.active);
  if (!product) return;

  if (user.balance < product.price) {
    return ctx.reply(`❌ رصيدك غير كافٍ (${money(user.balance)}$).`, Markup.inlineKeyboard([[Markup.button.callback('💳 شحن الرصيد', 'topup')]]));
  }

  user.balance = Number((user.balance - product.price).toFixed(2));
  let deliveredCode = (product.deliveryType === 'automatic' && Array.isArray(product.stock) && product.stock.length)
    ? product.stock.shift()
    : null;

  const order = {
    id: db.nextOrderId++,
    userId: user.id,
    productName: product.name,
    price: product.price,
    status: deliveredCode ? 'completed' : 'pending',
    date: new Date().toISOString()
  };
  db.orders.push(order);
  saveDB();

  if (deliveredCode) {
    await ctx.reply(`✅ تم الشراء بنجاح (#${order.id})!\n🔐 البيانات:\n${deliveredCode}`);
  } else {
    await ctx.reply(`✅ تم تسجيل طلبك (#${order.id})، سيتم التنفيذ فوراً عبر @${ADMIN_USERNAME}.`);
    await notifyAdmin(`🔔 طلب جديد #${order.id}: ${product.name}\nالعميل: ${user.id}\n/deliver ${order.id} الكود`);
  }
});

// ==================== 12. الحساب، الشحن، الطلبات، والدعم ====================
bot.hears('👤 حسابي ورصيدي', (ctx) => {
  const user = getUser(ctx);
  return ctx.reply(
    `👤 **بيانات حسابك الشخصي:**\n\n🆔 رقم الحساب: ${user.id}\n👤 الاسم: ${user.name}\n💰 الرصيد الحالي: ${money(user.balance)} ${CURRENCY}`,
    Markup.inlineKeyboard([[Markup.button.callback('💳 شحن الرصيد', 'topup')]])
  );
});

bot.action('account', async (ctx) => {
  await ctx.answerCbQuery();
  const user = getUser(ctx);
  await safeEdit(
    ctx,
    `👤 **بيانات حسابك الشخصي:**\n\n🆔 رقم الحساب: ${user.id}\n👤 الاسم: ${user.name}\n💰 الرصيد الحالي: ${money(user.balance)} ${CURRENCY}\n📅 تاريخ الانضمام: ${user.createdAt.slice(0, 10)}`,
    Markup.inlineKeyboard([
      [Markup.button.callback('💳 شحن الرصيد', 'topup')],
      [Markup.button.callback('🔙 رجوع', 'home')]
    ])
  );
});

bot.hears('💳 شحن الرصيد', (ctx) => {
  return ctx.reply(
    `💳 **شحن رصيد المحفظة**\n\nاضغط على الزر أدناه لتحديد المبلغ، أو تواصل مع الإدارة @${ADMIN_USERNAME}:`,
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
    `💳 **شحن رصيد المحفظة**\n\n1️⃣ اضغط على (إدخال مبلغ الشحن) واكتب القيمة بالدولار.\n2️⃣ أرسل إشعار الدفع إلى الإدارة @${ADMIN_USERNAME} لاعتماد الرصيد فوراً.`,
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
  if (!orders.length) return ctx.reply('📦 لا توجد طلبات سابقة مسجلة في حسابك.');
  const st = { pending: '⏳ قيد التنفيذ', completed: '✅ مكتمل', cancelled: '❌ ملغي' };
  let msg = '📦 **سجل آخر طلباتك:**\n\n';
  orders.forEach(o => {
    msg += `🧾 #${o.id} | ${o.productName}\n💵 ${money(o.price)}$ | ${st[o.status] || o.status}\n\n`;
  });
  return ctx.reply(msg);
});

bot.action('myorders', async (ctx) => {
  await ctx.answerCbQuery();
  const orders = db.orders.filter(o => o.userId === String(ctx.from.id)).slice(-10).reverse();
  if (!orders.length) {
    return safeEdit(ctx, '📦 لا توجد طلبات سابقة مسجلة في حسابك.', Markup.inlineKeyboard([[Markup.button.callback('🔙 رجوع', 'home')]]));
  }
  const st = { pending: '⏳ قيد التنفيذ', completed: '✅ مكتمل', cancelled: '❌ ملغي' };
  let msg = '📦 **سجل آخر طلباتك:**\n\n';
  orders.forEach(o => {
    msg += `🧾 #${o.id} | ${o.productName}\n💵 ${money(o.price)}$ | ${st[o.status] || o.status}\n\n`;
  });
  await safeEdit(ctx, msg, Markup.inlineKeyboard([[Markup.button.callback('🔙 رجوع', 'home')]]));
});

bot.hears('📞 الدعم الفني', (ctx) => {
  return ctx.reply(
    `📞 **الدعم الفني وإدارة المنصة:** @${ADMIN_USERNAME}`,
    Markup.inlineKeyboard([
      [Markup.button.callback('✉️ إرسال رسالة مباشرة عبر البوت', 'contact_support')],
      [Markup.button.url('👨‍💼 محادثة الإدارة مباشرة', 'https://t.me/' + ADMIN_USERNAME)]
    ])
  );
});

bot.action('support', async (ctx) => {
  await ctx.answerCbQuery();
  await safeEdit(
    ctx,
    `📞 **الدعم الفني وإدارة المنصة (@${ADMIN_USERNAME}):**`,
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
  await ctx.reply('✉️ اكتب رسالتك أو استفسارك الآن ليتم إرساله مباشرة إلى الإدارة:');
});

bot.action('help', async (ctx) => {
  await ctx.answerCbQuery();
  await safeEdit(
    ctx,
    'ℹ️ **دليل استخدام المنصة:**\n\n' +
    '1️⃣ اضغط على (تصفح الأقسام والخدمات) لاستعراض كافة الأقسام الأربعة.\n' +
    '2️⃣ في قسم التفعيل، اختر التطبيق ثم الدولة لتوليد الرقم واستلام الكود.\n' +
    '3️⃣ في قسم الرشق، اختر المنصة والباقة وأرسل الرابط للتنفيذ.\n' +
    '4️⃣ في قسم المصارف والمنتجات الرقمية، اختر نوع العملة أو التعاقد المطلوب.\n\n' +
    `👑 بإشراف وإدارة: @${ADMIN_USERNAME}`,
    Markup.inlineKeyboard([[Markup.button.callback('🔙 رجوع', 'home')]])
  );
});

// ==================== 13. لوحة تحكم الإدارة الشاملة ====================
function adminKeyboard() {
  const autoStatus = db.autoGenerateNumbers ? '🟢 التوليد الفوري للأرقام: مفعل' : '🔴 التوليد الفوري: متوقف (حسب المخزون)';
  return Markup.inlineKeyboard([
    [Markup.button.callback(autoStatus, 'admin_toggle_autogen')],
    [
      Markup.button.callback('📥 طلبات الشحن المعلقة', 'admin_topups'),
      Markup.button.callback('🧾 سجل الطلبات', 'admin_orders')
    ],
    [
      Markup.button.callback('💰 شحن أو خصم رصيد عميل', 'admin_balance'),
      Markup.button.callback('📊 إحصائيات المنصة', 'admin_users')
    ],
    [
      Markup.button.callback('📦 إدارة العروض الإضافية', 'admin_products'),
      Markup.button.callback('➕ إضافة عرض جديد', 'admin_addproduct')
    ],
    [Markup.button.callback('📢 إرسال إذاعة جماعية للكل', 'admin_broadcast')],
    [Markup.button.callback('🔙 العودة لواجهة البوت', 'home')]
  ]);
}

bot.command('admin', (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('⛔ هذا القسم مخصص لإدارة البوت فقط.');
  clearSession(ctx.from.id);
  return ctx.reply('🛠️ **لوحة تحكم الإدارة الشاملة:**', adminKeyboard());
});

bot.action('admin_home', async (ctx) => {
  await ctx.answerCbQuery();
  if (!isAdmin(ctx)) return;
  clearSession(ctx.from.id);
  return safeEdit(ctx, '🛠️ **لوحة تحكم الإدارة الشاملة:**', adminKeyboard());
});

bot.action('admin_toggle_autogen', async (ctx) => {
  if (!isAdmin(ctx)) return;
  db.autoGenerateNumbers = !db.autoGenerateNumbers;
  saveDB();
  await ctx.answerCbQuery(db.autoGenerateNumbers ? 'تم تفعيل توليد الأرقام الفوري لجميع الدول' : 'تم التحويل لوضع عدم التوفر إلا بالمخزون');
  return safeEdit(ctx, '🛠️ **لوحة تحكم الإدارة الشاملة:**', adminKeyboard());
});

bot.action('admin_topups', async (ctx) => {
  await ctx.answerCbQuery();
  if (!isAdmin(ctx)) return;
  const pending = db.topups.filter(t => t.status === 'pending');
  if (!pending.length) return safeEdit(ctx, '✅ لا توجد طلبات شحن معلقة حالياً.', adminKeyboard());

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
    `🎉 **تم اعتماد شحن رصيدك بنجاح!**\n💵 المبلغ المضاف: ${money(topup.amount)}$\n💰 رصيدك الحالي: ${money(user.balance)}$`
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
  await bot.telegram.sendMessage(topup.userId, `❌ تم رفض طلب الشحن #${topup.id}. للاستفسار تواصل مع @${ADMIN_USERNAME}`).catch(() => {});
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
  if (!db.products.length) return safeEdit(ctx, 'لا توجد عروض إضافية مخصصة حالياً.', adminKeyboard());

  for (const p of db.products) {
    await ctx.reply(
      `📦 ${p.name}\n💵 السعر: ${money(p.price)}$\n📌 الحالة: ${p.active ? '🟢 مفعل' : '🔴 متوقف'}`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback(p.active ? '🔴 إيقاف' : '🟢 تفعيل', `toggle_${p.id}`),
          Markup.button.callback('🗑️ حذف', `delprod_${p.id}`)
        ]
      ])
    );
  }
});

bot.action(/^delprod_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  if (!isAdmin(ctx)) return;
  db.products = db.products.filter(p => p.id !== Number(ctx.match[1]));
  saveDB();
  await ctx.reply('🗑️ تم حذف العرض بنجاح.');
});

bot.action(/^toggle_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  if (!isAdmin(ctx)) return;
  const p = db.products.find(x => x.id === Number(ctx.match[1]));
  if (!p) return;
  p.active = !p.active;
  saveDB();
  await ctx.reply(`✅ تم ${p.active ? 'تفعيل' : 'إيقاف'} العرض.`);
});

bot.action('admin_addproduct', async (ctx) => {
  await ctx.answerCbQuery();
  if (!isAdmin(ctx)) return;
  setSession(ctx.from.id, { action: 'new_product_name' });
  await ctx.reply('➕ أرسل اسم العرض أو المنتج الجديد:');
});

bot.action('admin_users', async (ctx) => {
  await ctx.answerCbQuery();
  if (!isAdmin(ctx)) return;
  await safeEdit(
    ctx,
    `📊 **إحصائيات البوت الشاملة:**\n\n👥 المشتركون: ${Object.keys(db.users).length}\n🧾 إجمالي الطلبات: ${db.orders.length}\n💳 طلبات الشحن: ${db.topups.length}`,
    adminKeyboard()
  );
});

bot.action('admin_balance', async (ctx) => {
  await ctx.answerCbQuery();
  if (!isAdmin(ctx)) return;
  setSession(ctx.from.id, { action: 'balance_user' });
  await ctx.reply('💰 أرسل رقم حساب العميل (ID) الذي تريد شحن أو خصم رصيده:');
});

bot.action('admin_broadcast', async (ctx) => {
  await ctx.answerCbQuery();
  if (!isAdmin(ctx)) return;
  setSession(ctx.from.id, { action: 'broadcast' });
  await ctx.reply('📢 أرسل نص الإعلان ليتم إرساله لجميع المشتركين في البوت:');
});

// ==================== 14. معالجة المدخلات النصية والأوامر ====================
bot.command('deliver', async (ctx) => {
  if (!isAdmin(ctx)) return;
  const parts = ctx.message.text.split(' ');
  const orderId = Number(parts[1]);
  const msg = parts.slice(2).join(' ').trim();
  if (!orderId || !msg) return ctx.reply('الطريقة الصحيحة:\n/deliver رقم_الطلب الكود_أو_التفاصيل');

  const order = db.orders.find(o => o.id === orderId);
  if (!order) return ctx.reply('الطلب غير موجود.');

  order.status = 'completed';
  saveDB();
  await bot.telegram.sendMessage(
    order.userId,
    `✅ **تم تنفيذ طلبك رقم #${order.id} بنجاح!**\n` +
    `📦 الخدمة: ${order.productName}\n\n` +
    ` 🔐 **الكود / بيانات التسليم:**\n\`${msg}\``
  ).catch(() => {});
  return ctx.reply(`✅ تم إرسال الكود وإكمال الطلب #${order.id}.`);
});

bot.on('text', async (ctx, next) => {
  const userId = String(ctx.from.id);
  const session = getSession(userId);
  const text = ctx.message.text.trim();

  if (!session || text.startsWith('/')) return next();

  // إتمام طلب رشق بعد إرسال الرابط
  if (session.action === 'smm_link') {
    const user = getUser(ctx);
    if (user.balance < session.price) {
      clearSession(userId);
      return ctx.reply('❌ رصيدك غير كافٍ لإتمام الطلب.');
    }

    user.balance = Number((user.balance - session.price).toFixed(2));
    const order = {
      id: db.nextOrderId++,
      userId,
      productName: `${session.srvName} (${session.platName})`,
      price: session.price,
      link: text,
      status: 'pending',
      date: new Date().toISOString()
    };
    db.orders.push(order);
    saveDB();
    clearSession(userId);

    await ctx.reply(
      `🎉 **تم تسجيل طلب الرشق بنجاح (#${order.id})!**\n\n` +
      `📦 الباقة: ${session.srvName}\n` +
      `🔗 الرابط: ${text}\n` +
      `💰 رصيدك المتبقي: ${money(user.balance)}$\n\n` +
      `⚡ بدأ التنفيذ وسيصلك إشعار عند الاكتمال.`
    );

    return notifyAdmin(
      `🚀 **طلب رشق جديد (#${order.id})**\n\n` +
      `📦 الخدمة: ${session.srvName} (${session.platName})\n` +
      `🔗 الرابط: ${text}\n` +
      `💵 المبلغ: ${money(session.price)}$\n` +
      `👤 العميل: ${user.name} (${userId})`,
      Markup.inlineKeyboard([[Markup.button.callback('✅ تأكيد اكتمال الرشق', `complete_order_${order.id}`)]])
    );
  }

  // طلب تحويل أو مصارفة عملات
  if (session.action === 'exchange_request') {
    clearSession(userId);
    await notifyAdmin(
      `🏦 **طلب مصارفة وتحويل عملات**\n\n` +
      `📌 القسم: ${session.currencyName}\n` +
      `👤 العميل: ${ctx.from.first_name || ''} (@${ctx.from.username || 'بدون_معرف'})\n` +
      `🆔 رقم الحساب: ${userId}\n\n` +
      `📝 التفاصيل المرسلة:\n${text}`
    );
    return ctx.reply(`✅ تم إرسال طلب المصارفة والتحويل إلى الإدارة (@${ADMIN_USERNAME}) بنجاح، سيتم التواصل معك فوراً.`);
  }

  // عرض بيع منتج رقمي أو تعاقد
  if (session.action === 'sell_digital_offer') {
    clearSession(userId);
    await notifyAdmin(
      `💰 **عرض بيع منتج رقمي / تعاقد جديد**\n\n` +
      `📌 الفئة: ${session.categoryName}\n` +
      `👤 المرسل: ${ctx.from.first_name || ''} (@${ctx.from.username || 'بدون_معرف'})\n` +
      `🆔 رقم الحساب: ${userId}\n\n` +
      `📝 تفاصيل العرض:\n${text}`
    );
    return ctx.reply(`✅ تم استلام عرضك وإحالته إلى الإدارة (@${ADMIN_USERNAME}) للمراجعة والتعاقد.`);
  }

  // رسائل الدعم الفني
  if (session.action === 'support_message') {
    clearSession(userId);
    await notifyAdmin(`📩 **رسالة دعم فني جديدة**\nمن: ${ctx.from.first_name || ''} (@${ctx.from.username || ''})\nID: ${userId}\n\nالرسالة:\n${text}`);
    return ctx.reply('✅ تم إرسال رسالتك إلى الإدارة بنجاح.');
  }

  // إضافة منتج إضافي من المدير
  if (session.action === 'new_product_name') {
    setSession(userId, { action: 'new_product_desc', name: text });
    return ctx.reply('📝 أرسل وصف وتفاصيل العرض:');
  }

  if (session.action === 'new_product_desc') {
    setSession(userId, { action: 'new_product_price', name: session.name, description: text });
    return ctx.reply('💵 أرسل السعر بالدولار (أرقام فقط، مثال: 2.5):');
  }

  if (session.action === 'new_product_price') {
    if (!validAmount(text)) return ctx.reply('⚠️ أرسل رقماً صحيحاً أكبر من صفر:');
    const product = {
      id: db.nextProductId++,
      name: session.name,
      description: session.description,
      price: Number(text),
      deliveryType: 'manual',
      stock: [],
      active: true
    };
    db.products.push(product);
    saveDB();
    clearSession(userId);
    return ctx.reply(`✅ تمت إضافة (${product.name}) بسعر ${money(product.price)}$ بنجاح!`, adminKeyboard());
  }

  // طلب شحن الرصيد
  if (session.action === 'topup_amount') {
    if (!validAmount(text)) return ctx.reply('⚠️ أرسل مبلغاً صحيحاً بالأرقام (مثال: 10):');
    const topup = { id: db.nextTopupId++, userId, amount: Number(text), status: 'pending' };
    db.topups.push(topup);
    saveDB();
    clearSession(userId);

    await ctx.reply(`✅ تم تسجيل طلب الشحن (#${topup.id}) بمبلغ ${money(topup.amount)}$.\nيرجى مراسلة الإدارة @${ADMIN_USERNAME} لتأكيد الدفع.`);
    return notifyAdmin(
      `💳 **طلب شحن رصيد جديد #${topup.id}**\n👤 العميل: ${ctx.from.first_name || ''} (${userId})\n💵 المبلغ: ${money(topup.amount)}$`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ موافقة وشحن', `approve_topup_${topup.id}`),
          Markup.button.callback('❌ رفض', `reject_topup_${topup.id}`)
        ]
      ])
    );
  }

  // تعديل رصيد عميل
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

  // الإذاعة الجماعية
  if (session.action === 'broadcast') {
    clearSession(userId);
    let sent = 0;
    for (const id of Object.keys(db.users)) {
      try {
        await bot.telegram.sendMessage(id, `📢 **إعلان من الإدارة:**\n\n${text}`);
        sent++;
      } catch (_) {}
    }
    return ctx.reply(`✅ تم إرسال الإعلان إلى ${sent} مشترك.`);
  }
});

bot.catch((err) => console.error('Bot error:', err.message));

// ==================== 15. التشغيل الذكي المقاوم لتعارض الجلسات ====================
function startBotWithRetry() {
  bot.telegram.setMyCommands([
    { command: 'start', description: '🚀 القائمة الرئيسية وتصفح الأقسام' },
    { command: 'admin', description: '🛠️ لوحة تحكم الإدارة' }
  ]).catch(() => {});

  bot.launch({ dropPendingUpdates: true })
    .then(() => console.log('✅ Shamel Bot launched successfully with Multi-Level Menus!'))
    .catch((err) => {
      console.error('⚠️ إعادة محاولة الاتصال بعد 5 ثوانٍ:', err.message);
      setTimeout(startBotWithRetry, 5000);
    });
}

setTimeout(startBotWithRetry, 2000);

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
