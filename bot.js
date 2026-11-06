const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const http = require('http');
const B = Markup.button.callback;
const K = Markup.inlineKeyboard;

const TOKEN = process.env.BOT_TOKEN || '9132364177:AAEID1FJHBUJPPMEslYbgTZw0o7QTbBlvWw';
const ADMIN = 'AlHaideri11';
const DB = './users_db.json';

const load = () => {
  try { return fs.existsSync(DB) ? JSON.parse(fs.readFileSync(DB, 'utf8')) : {}; }
  catch (e) { return {}; }
};
const save = (d) => fs.writeFileSync(DB, JSON.stringify(d, null, 2));

const bot = new Telegraf(TOKEN);
let admState = null;

const isAdm = (c) => c.from && (c.from.username || '').toLowerCase() === ADMIN.toLowerCase();

bot.use((c, next) => {
  if (isAdm(c)) {
    const db = load();
    if (db._adminId !== c.from.id) { db._adminId = c.from.id; save(db); }
  }
  return next();
});

const notifyAdmin = (txt, extra = {}) => {
  const db = load();
  if (db._adminId) bot.telegram.sendMessage(db._adminId, txt, extra).catch(() => {});
};

const kb = {
  reply_markup: {
    keyboard: [
      [{ text: '🚀 البدء / القائمة الرئيسية' }],
      [{ text: '💰 رصيدي' }, { text: '💳 شحن الرصيد' }],
      [{ text: '👨‍💼 تواصل مع الإدارة' }]
    ],
    resize_keyboard: true,
    is_persistent: true
  }
};

const mainMenu = (u) => {
  const rows = [
    [B('📱 قسم أرقام التفعيل (SMS)', 'm_num')],
    [B('🚀 قسم الرشق وزيادة المتابعين', 'm_smm')],
    [B('🏦 المصارف وتحويل العملات', 'm_ex')],
    [B('💎 المنتجات الرقمية والتعاقدات', 'm_dig')],
    [B('💰 رصيدي', 'bal'), B('💳 شحن الرصيد', 'pay')],
    [Markup.button.url('👨‍💼 الإدارة (@' + ADMIN + ')', 'https://t.me/' + ADMIN)]
  ];
  if ((u || '').toLowerCase() === ADMIN.toLowerCase()) rows.push([B('⚙️ لوحة التحكم الشاملة (للإدارة)', 'adm')]);
  return K(rows);
};

const homeTxt = (n, id, bal) =>
  `🌟 أهلاً بك يا ${n} في منصة شامل للخدمات الرقمية!\n\n🆔 رقم حسابك: ${id}\n💵 رصيدك الحالي: ${bal.toFixed(2)}$\n👑 بإشراف وإدارة: @${ADMIN}\n\n👇 اختر القسم المطلوب من القائمة:`;

async function sendHome(c) {
  admState = null;
  const id = String(c.from.id), n = c.from.first_name || 'عميلنا', db = load();
  const bonus = db._bonus !== undefined ? db._bonus : 5.0;
  if (!db[id]) {
    db[id] = { name: n, balance: bonus, orders: 0 }; save(db);
    const uTag = c.from.username ? `@${c.from.username}` : 'بدون معرف';
    notifyAdmin(`👤 عميل جديد دخل البوت!\nالاسم: ${n} (${uTag})\n🆔 الحساب: ${id}\n🎁 الرصيد الترحيبي: ${bonus}$`,
      K([[B('➕ شحن 5$', `qa_${id}_5`), B('➕ شحن 10$', `qa_${id}_10`)], [B('✉️ مراسلة العميل', `qm_${id}`)]]));
  }
  await c.reply('👋 القائمة السريعة جاهزة بالأسفل:', kb);
  return c.reply(homeTxt(n, id, db[id].balance), mainMenu(c.from.username));
}

bot.start(sendHome);
bot.hears('🚀 البدء / القائمة الرئيسية', sendHome);
bot.hears('👨‍💼 تواصل مع الإدارة', (c) => c.reply(`📞 للتواصل المباشر مع الإدارة:\n@${ADMIN}`));

const showBal = (c) => {
  const id = String(c.from.id), u = load()[id] || { balance: 0, orders: 0 };
  c.reply(`💰 محفظتك:\n🆔 رقم حسابك: ${id}\n💵 الرصيد: ${u.balance.toFixed(2)}$\n📦 الطلبات المنفذة: ${u.orders || 0}`);
};

const showPay = (c) => {
  c.reply(`💳 لشحن رصيدك (USDT / حوالات / محافظ):\n1️⃣ رقم حسابك هو: ${c.from.id}\n2️⃣ اضغط الزر بالأسفل لإشعار الإدارة أو أرسل الإيصال إلى @${ADMIN}`,
    K([[B('🔔 إرسال طلب شحن فوري للإدارة', 'req_pay')], [Markup.button.url('👨‍💼 مراسلة الإدارة', 'https://t.me/' + ADMIN)]]));
};

bot.hears('💰 رصيدي', showBal);
bot.hears('💳 شحن الرصيد', showPay);
bot.action('bal', (c) => { showBal(c); c.answerCbQuery(); });
bot.action('pay', (c) => { showPay(c); c.answerCbQuery(); });

bot.action('req_pay', (c) => {
  const id = String(c.from.id), uTag = c.from.username ? `@${c.from.username}` : 'بدون معرف';
  c.reply(`✅ تم إرسال إشعار طلب الشحن للإدارة @${ADMIN}، يرجى إرسال إيصال الدفع لهم ليتم اعتماد الرصيد.`);
  notifyAdmin(`💳 طلب شحن رصيد جديد!\n👤 العميل: ${c.from.first_name || ''} (${uTag})\n🆔 الحساب: ${id}\n👇 اضغط لشحن حسابه فوراً:`,
    K([
      [B('➕ 1$', `qa_${id}_1`), B('➕ 5$', `qa_${id}_5`), B('➕ 10$', `qa_${id}_10`), B('➕ 50$', `qa_${id}_50`)],
      [B('✉️ مراسلة العميل عبر البوت', `qm_${id}`)]
    ]));
  c.answerCbQuery();
});

bot.action('home', (c) => {
  admState = null;
  const id = String(c.from.id), db = load();
  c.editMessageText(homeTxt(c.from.first_name || 'عميلنا', id, db[id] ? db[id].balance : 0), mainMenu(c.from.username)).catch(()=>{});
  c.answerCbQuery();
});

const nums = { wa: ['واتساب', 1.5], tg: ['تيليجرام', 1.2], ig: ['انستقرام', 0.8], fb: ['فيسبوك', 0.8], tk: ['تيك توك', 0.7], go: ['جوجل', 1.0] };
bot.action('m_num', (c) => {
  c.editMessageText('📱 اختر التطبيق لشراء رقم تفعيل فوري:', K([
    [B('💬 واتساب (1.5$)', 'bn_wa'), B('✈️ تيليجرام (1.2$)', 'bn_tg')],
    [B('📸 انستقرام (0.8$)', 'bn_ig'), B('📘 فيسبوك (0.8$)', 'bn_fb')],
    [B('🎵 تيك توك (0.7$)', 'bn_tk'), B('🌐 جوجل (1.0$)', 'bn_go')],
    [B('🔙 رجوع للقائمة', 'home')]
  ])).catch(()=>{});
  c.answerCbQuery();
});

bot.action(/bn_(.+)/, (c) => {
  const [name, price] = nums[c.match[1]], id = String(c.from.id), db = load();
  if (!db[id] || db[id].balance < price) return c.reply(`❌ رصيدك غير كافٍ (${price}$). اشحن عبر @${ADMIN}`);
  db[id].balance -= price; db[id].orders++; save(db);
  const num = '+1' + Math.floor(2000000000 + Math.random() * 7000000000);
  const uTag = c.from.username ? `@${c.from.username}` : 'بدون معرف';
  c.reply(`✅ تم طلب رقم ${name}!\n📱 الرقم المخصص: ${num}\n💰 المتبقي: ${db[id].balance.toFixed(2)}$\n⏳ سيصلك كود التفعيل هنا فور وروده.`);
  notifyAdmin(`🔔 شراء رقم تفعيل!\n📦 التطبيق: ${name} (${price}$)\n📱 الرقم: ${num}\n👤 العميل: ${c.from.first_name || ''} (${uTag})\n🆔 الحساب: ${id}`,
    K([
      [B('✉️ إرسال الكود / رد للعميل', `qm_${id}`)],
      [B(`🔄 إرجاع المبلغ (${price}$)`, `qa_${id}_${price}`)]
    ]));
  c.answerCbQuery();
});

const smms = { tg: ['تيليجرام', 2], ig: ['انستقرام', 1.5], tk: ['تيك توك', 1.5], fb: ['فيسبوك', 2], yt: ['يوتيوب', 3] };
bot.action('m_smm', (c) => {
  c.editMessageText('🚀 قسم رشق المتابعين والمشاهدات (لكل 1000):', K([
    [B('✈️ تيليجرام (2$)', 'bs_tg'), B('📸 انستقرام (1.5$)', 'bs_ig')],
    [B('🎵 تيك توك (1.5$)', 'bs_tk'), B('📘 فيسبوك (2$)', 'bs_fb')],
    [B('▶️ يوتيوب (3$)', 'bs_yt')],
    [B('🔙 رجوع للقائمة', 'home')]
  ])).catch(()=>{});
  c.answerCbQuery();
});

bot.action(/bs_(.+)/, (c) => {
  const [name, price] = smms[c.match[1]], id = String(c.from.id), db = load();
  if (!db[id] || db[id].balance < price) return c.reply(`❌ رصيدك غير كافٍ (${price}$). اشحن عبر @${ADMIN}`);
  db[id].balance -= price; db[id].orders++; save(db);
  const ord = Math.floor(10000 + Math.random() * 90000);
  const uTag = c.from.username ? `@${c.from.username}` : 'بدون معرف';
  c.reply(`🎉 تم تسجيل طلب رشق ${name} رقم #${ord}\n💰 المتبقي: ${db[id].balance.toFixed(2)}$\nأرسل الرابط ورقم الطلب إلى @${ADMIN} للتنفيذ الفوري.`);
  notifyAdmin(`🔔 طلب رشق جديد #${ord}!\n🚀 المنصة: ${name} (${price}$)\n👤 العميل: ${c.from.first_name || ''} (${uTag})\n🆔 الحساب: ${id}`,
    K([
      [B('✉️ مراسلة العميل / تأكيد التنفيذ', `qm_${id}`)],
      [B(`🔄 إلغاء وإرجاع (${price}$)`, `qa_${id}_${price}`)]
    ]));
  c.answerCbQuery();
});

bot.action('m_ex', (c) => {
  c.editMessageText(`🏦 قسم المصارف وتحويل العملات بإشراف @${ADMIN}:`, K([
    [B('💵 بيع وشراء عملات رقمية (USDT)', 'info')],
    [B('🌐 بنوك إلكترونية (Payeer / Wise / PayPal)', 'info')],
    [B('💱 حوالات ومصارفة محلية ودولية', 'info')],
    [Markup.button.url('📲 طلب تحويل الآن', 'https://t.me/' + ADMIN)],
    [B('🔙 رجوع للقائمة', 'home')]
  ])).catch(()=>{});
  c.answerCbQuery();
});

bot.action('m_dig', (c) => {
  c.editMessageText(`💎 المنتجات الرقمية والتعاقدات بإشراف @${ADMIN}:`, K([
    [B('🎨 اشتراكات بريميوم (Canva, Adobe, GPT)', 'info')],
    [B('🤖 برمجة وتطوير البوتات والأنظمة', 'info')],
    [B('🛒 بيع وشراء حسابات ومنتجات رقمية', 'info')],
    [B('📄 إبرام عقود عمل ووساطة تجارية', 'info')],
    [Markup.button.url('🤝 التعاقد المباشر مع الإدارة', 'https://t.me/' + ADMIN)],
    [B('🔙 رجوع للقائمة', 'home')]
  ])).catch(()=>{});
  c.answerCbQuery();
});

bot.action('info', (c) => {
  const id = String(c.from.id), uTag = c.from.username ? `@${c.from.username}` : 'بدون معرف';
  c.reply(`📩 لإتمام طلبك بأمان وسرعة، راسل مدير المنصة مباشرة:\n👉 @${ADMIN}`);
  notifyAdmin(`📩 استفسار عن (مصارفة / منتجات / تعاقد)!\n👤 العميل: ${c.from.first_name || ''} (${uTag})\n🆔 الحساب: ${id}`,
    K([[B('✉️ مراسلة العميل عبر البوت', `qm_${id}`)]]));
  c.answerCbQuery();
});

const renderAdm = (c) => {
  if (!isAdm(c)) return;
  const db = load();
  const keys = Object.keys(db).filter(k => !k.startsWith('_'));
  const bonus = db._bonus !== undefined ? db._bonus : 5.0;
  const txt = `⚙️ لوحة التحكم الشاملة (@${ADMIN})\n\n👥 إجمالي العملاء: ${keys.length}\n🎁 الرصيد الترحيبي للجدد: ${bonus}$\n\n👇 اختر العملية المطلوبة بضغطة زر:`;
  const btns = K([
    [B('➕ شحن رصيد لعميل', 'ad_add'), B('➖ خصم رصيد من عميل', 'ad_sub')],
    [B('📢 إرسال إذاعة جماعية للكل', 'ad_bc')],
    [B('✉️ إرسال رسالة لعميل محدد', 'ad_msg')],
    [B(`🎁 تغيير الرصيد الترحيبي (الحالي: ${bonus}$)`, 'ad_bns')],
    [B('📊 عرض قائمة العملاء وأرصدتهم', 'ad_list')],
    [B('🔙 القائمة الرئيسية للبوت', 'home')]
  ]);
  c.editMessageText(txt, btns).catch(() => c.reply(txt, btns));
};

bot.action('adm', (c) => { admState = null; renderAdm(c); c.answerCbQuery(); });

bot.action('ad_bns', (c) => {
  if (!isAdm(c)) return;
  const db = load();
  db._bonus = (db._bonus === 0) ? 5.0 : 0;
  save(db);
  renderAdm(c);
  c.answerCbQuery(`تم ضبط الرصيد الترحيبي على ${db._bonus}$`);
});

bot.action('ad_list', (c) => {
  if (!isAdm(c)) return;
  const db = load();
  const list = Object.keys(db).filter(k => !k.startsWith('_')).slice(-15)
    .map(k => `🆔 ${k} | 💵 ${(db[k].balance||0).toFixed(1)}$ | 📦 ${db[k].orders||0}`).join('\n');
  c.reply(`📊 آخر العملاء المسجلين:\n\n${list || 'لا يوجد عملاء بعد'}`);
  c.answerCbQuery();
});

bot.action('ad_add', (c) => {
  if (!isAdm(c)) return;
  admState = { type: 'add' };
  c.reply('➕ أرسل الآن (رقم حساب العميل ثم مسافة ثم المبلغ المراد شحنه):\nمثال:\n123456789 20');
  c.answerCbQuery();
});

bot.action('ad_sub', (c) => {
  if (!isAdm(c)) return;
  admState = { type: 'sub' };
  c.reply('➖ أرسل الآن (رقم حساب العميل ثم مسافة ثم المبلغ المراد خصمه):\nمثال:\n123456789 5');
  c.answerCbQuery();
});

bot.action('ad_bc', (c) => {
  if (!isAdm(c)) return;
  admState = { type: 'bc' };
  c.reply('📢 أرسل الآن نص الرسالة أو الإعلان ليتم إرساله لجميع المشتركين في البوت:');
  c.answerCbQuery();
});

bot.action('ad_msg', (c) => {
  if (!isAdm(c)) return;
  admState = { type: 'msg_id' };
  c.reply('✉️ أرسل الآن (رقم حساب العميل ثم مسافة ثم الرسالة أو الكود):\nمثال:\n123456789 كود التفعيل هو 5544');
  c.answerCbQuery();
});

bot.action(/qa_(.+)_(.+)/, (c) => {
  if (!isAdm(c)) return;
  const [, id, amt] = c.match, db = load();
  if (!db[id]) db[id] = { balance: 0, orders: 0 };
  db[id].balance += parseFloat(amt); save(db);
  c.reply(`✅ تم إضافة ${amt}$ للحساب ${id} بنجاح!\n💰 رصيده الجديد: ${db[id].balance.toFixed(2)}$`);
  bot.telegram.sendMessage(id, `🎉 تم إضافة ${amt}$ إلى محفظتك من قِبل الإدارة @${ADMIN}!\n💰 رصيدك الحالي: ${db[id].balance.toFixed(2)}$`).catch(()=>{});
  c.answerCbQuery('تم الشحن بنجاح!');
});

bot.action(/qm_(.+)/, (c) => {
  if (!isAdm(c)) return;
  admState = { type: 'reply', target: c.match[1] };
  c.reply(`✍️ أرسل الآن الكود أو الرسالة ليتم إرسالها فوراً إلى العميل (${c.match[1]}):`);
  c.answerCbQuery();
});

bot.on('text', (c) => {
  if (!isAdm(c) || !admState) return;
  const txt = c.message.text.trim(), db = load();
  if (admState.type === 'add' || admState.type === 'sub') {
    const [id, amtStr] = txt.split(/\s+/);
    const amt = parseFloat(amtStr);
    if (!id || isNaN(amt)) return c.reply('⚠️ صيغة خاطئة! أرسل رقم الحساب ثم مسافة ثم الرقم (مثال: 123456 10)');
    if (!db[id]) db[id] = { balance: 0, orders: 0 };
    db[id].balance += (admState.type === 'add' ? amt : -amt);
    if (db[id].balance < 0) db[id].balance = 0;
    save(db); admState = null;
    c.reply(`✅ تم تحديث رصيد الحساب ${id}!\n💰 الرصيد الجديد: ${db[id].balance.toFixed(2)}$`);
    bot.telegram.sendMessage(id, `🔔 تحديث في محفظتك من الإدارة @${ADMIN}:\n💰 رصيدك الحالي: ${db[id].balance.toFixed(2)}$`).catch(()=>{});
  } else if (admState.type === 'bc') {
    const keys = Object.keys(db).filter(k => !k.startsWith('_'));
    keys.forEach(k => bot.telegram.sendMessage(k, `📢 إعلان من إدارة البوت (@${ADMIN}):\n\n${txt}`).catch(()=>{}));
    admState = null;
    c.reply(`✅ تم إرسال الإعلان إلى ${keys.length} عميل بنجاح!`);
  } else if (admState.type === 'msg_id') {
    const firstSpace = txt.indexOf(' ');
    if (firstSpace === -1) return c.reply('⚠️ أرسل رقم الحساب ثم مسافة ثم الرسالة.');
    const id = txt.slice(0, firstSpace), msg = txt.slice(firstSpace + 1);
    bot.telegram.sendMessage(id, `📩 رسالة من الإدارة (@${ADMIN}):\n\n${msg}`).catch(()=>{});
    admState = null;
    c.reply(`✅ تم إرسال الرسالة للعميل ${id}!`);
  } else if (admState.type === 'reply') {
    bot.telegram.sendMessage(admState.target, `📩 رسالة من الإدارة (@${ADMIN}) بخصوص طلبك:\n\n${txt}`).catch(()=>{});
    c.reply(`✅ تم إيصال رسالتك للعميل (${admState.target}) بنجاح!`);
    admState = null;
  }
});

bot.catch((e) => console.log('تنبيه:', e.message));
bot.telegram.setMyCommands([{ command: 'start', description: '🚀 البدء والقائمة الرئيسية' }]).catch(()=>{});
bot.launch({ dropPendingUpdates: true });

const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Shamel Bot is running 24/7!');
}).listen(PORT, () => console.log('🌐 Cloud Server Ready on port ' + PORT));
