// ════════════════════════════════════════════════
//  Wavex — Full Application Logic
//  Features: Auth, Feed, Chat, Notifications,
//            Verification Badges, i18n, Profile
// ════════════════════════════════════════════════

// ── Simulated DB (localStorage) ──
const DB = {
  get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  del: k => localStorage.removeItem(k),
};

// ── App State ──
let ME = null;            // current user
let activeChatId = null;  // active chat partner id
let chatPollingTimer = null;
let feedTab = 'all';
let selectedAvatar = '🌊';
let currentPostImage = null;
let currentPostVideo = null;  // { dataUrl, name }
let currentPostAudio = null;  // { dataUrl, name }
let emojiOpen = false;
let allConversations = [];

// ── Constants ──
const AVATARS = ['🌊','🦋','🌸','🦁','🐋','🦊','🌙','⭐','🔥','🌈','🦅','🐬','🌺','🦄','🍀','🎭','🦉','🐺','🦋','🌻'];
const COVER_GRADIENTS = [
  'linear-gradient(135deg,rgba(110,231,247,0.4),rgba(167,139,250,0.4))',
  'linear-gradient(135deg,rgba(244,114,182,0.4),rgba(167,139,250,0.4))',
  'linear-gradient(135deg,rgba(52,211,153,0.4),rgba(110,231,247,0.4))',
  'linear-gradient(135deg,rgba(251,191,36,0.4),rgba(244,114,182,0.4))',
  'linear-gradient(135deg,rgba(99,102,241,0.4),rgba(110,231,247,0.4))',
];
const EMOJI_LIST = ['😊','😂','❤️','🔥','💯','🌊','✨','😎','🙌','💪','🎉','😍','🤔','👏','😅','🥰','🤩','😢','😤','🤯','💀','🫡','🥹','😇','🤟','💫','⭐','🌟','🎯','🚀'];

// ════════════════════════════════════════
//  🔐 OFFICIAL ACCOUNTS
//  يتخلقوا تلقائياً عند أول تشغيل
//  ✏️ غير الباسوورد هنا قبل النشر!
// ════════════════════════════════════════
const OFFICIAL_ACCOUNTS = [
  {
    id:         'wavex_official_id',
    name:       'Wavex Official',
    username:   'wavex_official',
    password:   btoa('Wavex@Official2025'),
    avatar:     'assets/images/avatar-wavex-official.svg',
    coverImage: 'assets/images/cover-wavex-official.svg',
    cover:      'linear-gradient(135deg,rgba(110,231,247,0.5),rgba(167,139,250,0.5))',
    bio:        'الحساب الرسمي لـ Wavex 🌊 | The Official Wavex Account',
    verified:   true,
    followers:  0,
    following:  0,
    createdAt:  '2025-01-01T00:00:00.000Z',
  },
  {
    id:         'wavex_team_id',
    name:       'Wavex Team',
    username:   'wavex_team',
    password:   btoa('WavexTeam@2025'),
    avatar:     'assets/images/avatar-wavex-team.svg',
    coverImage: 'assets/images/cover-wavex-team.svg',
    cover:      'linear-gradient(135deg,rgba(167,139,250,0.5),rgba(244,114,182,0.5))',
    bio:        'فريق Wavex — نبنع معك مستقبل التواصل 🚀 | Building the future of social',
    verified:   true,
    followers:  0,
    following:  0,
    createdAt:  '2025-01-01T00:00:00.000Z',
  },
];

// الترند — بس بيانات ترند، مش حسابات وهمية
const TRENDS = [
  { cat: 'تقنية · Tech',  tag: '#الذكاء_الاصطناعي', count: '12.5K' },
  { cat: 'رياضة · Sport', tag: '#كأس_العالم',        count: '8.9K'  },
  { cat: 'ترفيه · Fun',   tag: '#أفلام_2025',        count: '5.2K'  },
  { cat: 'برمجة · Code',  tag: '#programming',       count: '4.8K'  },
  { cat: 'حياة · Life',   tag: '#motivation',        count: '3.1K'  },
];

// لا يوجد إشعارات وهمية — الإشعارات بتيجي من الأكشنز الحقيقية بس
const NOTIF_SEED = [];

// ════════ INIT ════════
window.addEventListener('DOMContentLoaded', () => {
  buildAvatarGrid();
  buildEmojiPicker();

  // ── إنشاء الحسابات الرسمية عند أول تشغيل ──
  seedOfficialAccounts();

  // ── Seed posts لأول مرة فقط ──
  if (!DB.get('wvx_seeded_v2')) {
    seedDemoPosts();
    DB.set('wvx_seeded_v2', true);
  }
  if (!DB.get('wvx_posts')) DB.set('wvx_posts', []);

  // ── Check session ──
  const session = DB.get('wvx_session');
  if (session) {
    // تحديث بيانات الجلسة من قاعدة البيانات (في حالة تغيرت)
    const users = DB.get('wvx_users') || {};
    ME = users[session.username] || session;
    DB.set('wvx_session', ME);
    enterApp();
  }
});

// ── إنشاء الحسابات الرسمية ──
function seedOfficialAccounts() {
  const users = DB.get('wvx_users') || {};
  OFFICIAL_ACCOUNTS.forEach(acc => {
    if (!users[acc.username]) {
      users[acc.username] = { ...acc };
    } else {
      // دايماً حدّث الصورة والغلاف والتوثيق
      users[acc.username].verified   = true;
      users[acc.username].avatar     = acc.avatar;
      users[acc.username].coverImage = acc.coverImage;
      users[acc.username].cover      = acc.cover;
    }
  });
  DB.set('wvx_users', users);

  // Patch any existing posts by official accounts to use new avatar
  const posts = DB.get('wvx_posts') || [];
  let patchedPosts = false;
  OFFICIAL_ACCOUNTS.forEach(acc => {
    posts.forEach(p => {
      if (p.authorId === acc.id && p.authorAvatar !== acc.avatar) {
        p.authorAvatar = acc.avatar;
        patchedPosts = true;
      }
    });
  });
  if (patchedPosts) DB.set('wvx_posts', posts);
}

// ════════ DEMO POSTS SEED ════════
function seedDemoPosts() {
  const now  = Date.now();
  const hour = 3600000;
  const posts = [
    {
      id: now - hour * 1,
      content: '🌊 أهلاً بكم في Wavex! المنصة الاجتماعية الجديدة. شاركونا آراءكم — نحن هنا نسمع! ✨ Welcome to Wavex — Connect Differently! 🚀',
      authorId: 'wavex_official_id', authorName: 'Wavex Official',
      authorAvatar: 'assets/images/avatar-wavex-official.svg', verified: true,
      reactions: { demo1: 'love', demo2: 'like', demo3: 'wow', demo4: 'like', demo5: 'love' },
      comments: [{ id: 1, authorId: 'wavex_team_id', authorName: 'Wavex Team', authorAvatar: 'assets/images/avatar-wavex-team.svg', verified: true, text: 'يلا نبدأ! 🔥', createdAt: new Date(now - hour + 600000).toISOString() }],
      shares: 12, createdAt: new Date(now - hour).toISOString(),
    },
    {
      id: now - hour * 3,
      content: '⚡ تحديث جديد! ✅ Feed Algorithm ذكي ✅ بحث Fuzzy ✅ قصص بفيديو وموسيقى ✅ مجموعات مع feed خاص ✅ Dark/Light mode — استمتعوا بالتجربة! 🌊',
      authorId: 'wavex_team_id', authorName: 'Wavex Team',
      authorAvatar: 'assets/images/avatar-wavex-team.svg', verified: true,
      reactions: { demo1: 'like', demo2: 'love', demo3: 'wow', demo4: 'like' },
      comments: [], shares: 8, createdAt: new Date(now - hour * 3).toISOString(),
    },
    {
      id: now - hour * 6,
      content: '💡 نصيحة اليوم: "التواصل الحقيقي مش بعدد المتابعين — هو بجودة المحادثات اللي بتعملها." شارك أفكارك، اسمع الآخرين، وابني علاقات حقيقية هنا على Wavex 🌟 #motivation #wavex #تواصل',
      authorId: 'wavex_official_id', authorName: 'Wavex Official',
      authorAvatar: 'assets/images/avatar-wavex-official.svg', verified: true,
      reactions: { demo1: 'love', demo2: 'love', demo3: 'like' },
      comments: [{ id: 2, authorId: 'wavex_team_id', authorName: 'Wavex Team', authorAvatar: 'assets/images/avatar-wavex-team.svg', verified: true, text: 'كلام من ذهب! 💯', createdAt: new Date(now - hour * 5).toISOString() }],
      shares: 5, createdAt: new Date(now - hour * 6).toISOString(),
    },
    {
      id: now - hour * 12,
      content: '🎨 Wavex مصمم بـ Liquid Glass Design — كل تفصيلة مصممة عشان تكون سلسة وجميلة على كل الأجهزة: 📱 موبايل 💻 لاب توب 🖥️ ديسك توب. جربوا Dark/Light mode من الإعدادات! #design #ui',
      authorId: 'wavex_team_id', authorName: 'Wavex Team',
      authorAvatar: 'assets/images/avatar-wavex-team.svg', verified: true,
      reactions: { demo1: 'wow', demo2: 'love', demo3: 'like', demo4: 'wow' },
      comments: [], shares: 15, createdAt: new Date(now - hour * 12).toISOString(),
    },
    {
      id: now - hour * 24,
      content: '🌍 Wavex بالعربي والإنجليزي! الـ app بيدعم اللغتين كامل — RTL وLTR. غير اللغة من الإعدادات في أي وقت 🌐 — Wavex supports Arabic & English, switch anytime from Settings!',
      authorId: 'wavex_official_id', authorName: 'Wavex Official',
      authorAvatar: 'assets/images/avatar-wavex-official.svg', verified: true,
      reactions: { demo1: 'like', demo2: 'wow' },
      comments: [], shares: 3, createdAt: new Date(now - hour * 24).toISOString(),
    },
  ];

  const existing = DB.get('wvx_posts') || [];
  // Only add if not already seeded
  const existingIds = new Set(existing.map(p => String(p.id)));
  const newPosts = posts.filter(p => !existingIds.has(String(p.id)));
  if (newPosts.length) DB.set('wvx_posts', [...newPosts, ...existing]);

  // Seed demo groups
  if (!(DB.get('wvx_groups') || []).length) {
    DB.set('wvx_groups', [
      { id: 1, name: 'مطورين Wavex', desc: 'للمهتمين بتطوير تطبيقات الويب والموبايل', avatar: '💻', creatorId: 'wavex_team_id', members: ['wavex_team_id', 'wavex_official_id'], createdAt: new Date(now - hour * 48).toISOString() },
      { id: 2, name: 'تصميم وإبداع', desc: 'شارك أعمالك الفنية والتصميمية', avatar: '🎨', creatorId: 'wavex_official_id', members: ['wavex_official_id'], createdAt: new Date(now - hour * 72).toISOString() },
      { id: 3, name: 'ترفيه وفن', desc: 'أفلام، موسيقى، وكل حاجة ترفيهية', avatar: '🎬', creatorId: 'wavex_team_id', members: ['wavex_team_id'], createdAt: new Date(now - hour * 96).toISOString() },
    ]);
  }

  // Seed demo market items
  if (!(DB.get('wvx_market') || []).length) {
    DB.set('wvx_market', [
      { id: 101, authorId: 'wavex_team_id', authorName: 'Wavex Team', authorAvatar: 'assets/images/avatar-wavex-team.svg', verified: true, type: 'sell', title: 'كورس تطوير تطبيقات الجوال', desc: 'تعلم Flutter من الصفر للاحتراف — 40 ساعة محتوى', price: 299, currency: 'جنيه مصري', saved: [], createdAt: new Date(now - hour * 24).toISOString() },
      { id: 102, authorId: 'wavex_official_id', authorName: 'Wavex Official', authorAvatar: 'assets/images/avatar-wavex-official.svg', verified: true, type: 'buy', title: 'مطلوب مصمم UI/UX', desc: 'نبحث عن مصمم متميز للانضمام لفريق Wavex', price: 0, currency: 'جنيه مصري', saved: [], createdAt: new Date(now - hour * 48).toISOString() },
    ]);
  }
}
// ════════ AVATAR SYSTEM ════════
// avatar = emoji string OR base64 image string
let selectedAvatarIsImage = false;

function buildAvatarGrid() {
  const grid = document.getElementById('avatar-grid');
  grid.innerHTML = '';

  // زر رفع صورة
  const uploadWrap = document.createElement('div');
  uploadWrap.className = 'avatar-opt avatar-upload-btn';
  uploadWrap.title = 'Upload photo';
  uploadWrap.innerHTML = '<input type="file" accept="image/*" class="hidden" id="avatar-file-input"/><span style="font-size:1.2rem">📷</span><span style="font-size:0.6rem;display:block;margin-top:2px">صورة</span>';
  uploadWrap.onclick = () => document.getElementById('avatar-file-input').click();
  grid.appendChild(uploadWrap);
  document.addEventListener('change', e => { if(e.target.id==='avatar-file-input') handleAvatarUpload(e.target,'auth'); });

  // Preview slot (مخفي)
  const previewOpt = document.createElement('div');
  previewOpt.className = 'avatar-opt avatar-img-preview hidden';
  previewOpt.id = 'auth-avatar-preview';
  previewOpt.innerHTML = '<img src="" alt="av" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>';
  previewOpt.onclick = () => {
    grid.querySelectorAll('.avatar-opt').forEach(a => a.classList.remove('selected'));
    previewOpt.classList.add('selected');
    selectedAvatar = previewOpt.querySelector('img').src;
    selectedAvatarIsImage = true;
  };
  grid.appendChild(previewOpt);

  // Emoji options
  AVATARS.forEach((em, i) => {
    const d = document.createElement('div');
    d.className = 'avatar-opt' + (i === 0 && !selectedAvatarIsImage ? ' selected' : '');
    d.textContent = em;
    d.onclick = () => {
      grid.querySelectorAll('.avatar-opt').forEach(a => a.classList.remove('selected'));
      d.classList.add('selected');
      selectedAvatar = em;
      selectedAvatarIsImage = false;
    };
    grid.appendChild(d);
  });
}

function handleAvatarUpload(input, context) {
  const file = input.files[0];
  if (!file) return;
  const MAX = 20 * 1024 * 1024; // 20 MB
  if (file.size > MAX) { showToast(t('avatarTooLarge')); return; }

  const reader = new FileReader();
  reader.onload = e => {
    // GIF/WebP animated: don't compress, store as-is (capped to 2MB base64 for perf)
    const isGif  = file.type === 'image/gif';
    const isWebp = file.type === 'image/webp';
    if (isGif || isWebp) {
      applyAvatarResult(e.target.result, context);
      showToast(currentLang==='ar'?'تم رفع الصورة ✅':'Photo uploaded ✅');
      return;
    }
    compressAvatar(e.target.result, 300, compressed => {
      applyAvatarResult(compressed, context);
      showToast(currentLang==='ar'?'تم رفع الصورة ✅':'Photo uploaded ✅');
    });
  };
  reader.readAsDataURL(file);
}

function applyAvatarResult(dataUrl, context) {
  if (context === 'auth') {
    const preview = document.getElementById('auth-avatar-preview');
    if (preview) {
      preview.querySelector('img').src = dataUrl;
      preview.classList.remove('hidden');
      document.querySelectorAll('#avatar-grid .avatar-opt').forEach(a => a.classList.remove('selected'));
      preview.classList.add('selected');
      selectedAvatar = dataUrl;
      selectedAvatarIsImage = true;
    }
  } else if (context === 'edit') {
    const preview = document.getElementById('edit-avatar-preview');
    if (preview) {
      preview.querySelector('img').src = dataUrl;
      preview.classList.remove('hidden');
      document.querySelectorAll('#avatar-grid-edit .avatar-opt').forEach(a => a.classList.remove('selected'));
      preview.classList.add('selected');
      window._editAvatar = dataUrl;
      window._editAvatarIsImage = true;
    }
    const bigPreview = document.getElementById('edit-avatar-big');
    if (bigPreview) bigPreview.src = dataUrl;
    // Save immediately to profile if in profile page (direct label click)
    if (document.getElementById('page-profile').classList.contains('active') && ME) {
      const users = DB.get('wvx_users') || {};
      if (users[ME.username]) { users[ME.username].avatar = dataUrl; DB.set('wvx_users', users); }
      ME.avatar = dataUrl;
      refreshUserUI();
    }
  }
}

function compressAvatar(src, size, callback) {
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    // crop مربع من المنتصف
    const min = Math.min(img.width, img.height);
    const sx = (img.width - min) / 2, sy = (img.height - min) / 2;
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2, 0, Math.PI*2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
    callback(canvas.toDataURL('image/jpeg', 0.82));
  };
  img.src = src;
}

function renderAvatar(avatar, sizePx) {
  if (!avatar) return '👤';
  const isImg = avatar.startsWith('data:') || avatar.startsWith('http') || avatar.startsWith('assets/');
  if (isImg) {
    return '<img src="' + avatar + '" alt="av" style="width:' + sizePx + 'px;height:' + sizePx + 'px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,0.2);display:block;flex-shrink:0"/>';
  }
  return avatar;
}

// ════════ EMOJI PICKER ════════
function buildEmojiPicker() {
  const picker = document.getElementById('emoji-picker');
  EMOJI_LIST.forEach(em => {
    const s = document.createElement('span');
    s.className = 'emoji-item';
    s.textContent = em;
    s.onclick = () => { document.getElementById('post-content').value += em; updateCharCount(); };
    picker.appendChild(s);
  });
}

function toggleEmojiPicker() {
  const p = document.getElementById('emoji-picker');
  emojiOpen = !emojiOpen;
  p.classList.toggle('hidden', !emojiOpen);
}

// ════════ AUTH ════════
function showLogin() {
  document.getElementById('login-form').classList.add('active');
  document.getElementById('register-form').classList.remove('active');
}
function showRegister() {
  document.getElementById('register-form').classList.add('active');
  document.getElementById('login-form').classList.remove('active');
}

function validateUsername(el) {
  const hint = document.getElementById('username-hint');
  const val = el.value.trim();
  const valid = /^[a-zA-Z0-9_]{3,20}$/.test(val);
  hint.textContent = val.length === 0 ? '' : valid ? '✓' : '✗';
  hint.style.color = valid ? '#34d399' : '#f87171';
}

function checkPasswordStrength(pw) {
  const wrap = document.getElementById('pw-strength-wrap');
  const fill = document.getElementById('strength-fill');
  const label = document.getElementById('strength-label');
  if (!pw) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'flex';
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { w: '25%', color: '#f87171', key: 'pwWeak' },
    { w: '50%', color: '#fb923c', key: 'pwFair' },
    { w: '75%', color: '#facc15', key: 'pwGood' },
    { w: '100%', color: '#34d399', key: 'pwStrong' },
  ];
  const lvl = levels[Math.min(score, 3)];
  fill.style.width = lvl.w;
  fill.style.background = lvl.color;
  label.textContent = t(lvl.key);
  label.style.color = lvl.color;
}

function login() {
  const username = document.getElementById('login-username').value.trim();
  const pw = document.getElementById('login-password').value;
  if (!username || !pw) return toast(t('fillAll'), '⚠️');
  const users = DB.get('wvx_users') || {};
  const user = users[username];
  if (!user || user.password !== btoa(pw)) return toast(t('badCreds'), '❌');
  ME = user;
  DB.set('wvx_session', ME);
  enterApp();
  toast(t('loginSuccess'), '👋');
}

function demoLogin() {
  const users = DB.get('wvx_users') || {};
  if (!users['demo_user']) {
    const demo = {
      id: 'demo_' + Date.now(),
      name: 'Demo User',
      username: 'demo_user',
      password: btoa('demo123'),
      avatar: '🌊',
      verified: false,
      bio: '',
      followers: 0,
      following: 0,
      cover: COVER_GRADIENTS[0],
      createdAt: new Date().toISOString(),
    };
    users['demo_user'] = demo;
    DB.set('wvx_users', users);
  }
  ME = users['demo_user'];
  DB.set('wvx_session', ME);
  enterApp();
  toast(t('loginSuccess'), '⚡');
}

function register() {
  const name     = document.getElementById('reg-name').value.trim();
  const username = document.getElementById('reg-username').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const pw       = document.getElementById('reg-password').value;
  const terms    = document.getElementById('terms-check').checked;
  if (!name || !username || !pw) return toast(t('fillAll'), '⚠️');
  if (pw.length < 6) return toast(t('pwShort'), '⚠️');
  if (!terms) return toast(t('acceptTerms'), '⚠️');
  const users = DB.get('wvx_users') || {};
  if (users[username]) return toast(t('userExists'), '❌');
  const user = { id: 'u_' + Date.now(), name, username, email, password: btoa(pw), avatar: selectedAvatar, verified: false, bio: '', followers: 0, following: 0, cover: COVER_GRADIENTS[0], createdAt: new Date().toISOString() };
  users[username] = user;
  DB.set('wvx_users', users);
  ME = user;
  DB.set('wvx_session', ME);
  enterApp();
  toast('🎉 ' + (currentLang === 'ar' ? 'أهلاً بك في Wavex!' : 'Welcome to Wavex!'), '🎉');
}

function logout() {
  DB.del('wvx_session');
  if (chatPollingTimer) clearInterval(chatPollingTimer);
  ME = null; activeChatId = null;
  document.getElementById('app').classList.add('hidden');
  document.getElementById('auth-screen').classList.remove('hidden');
  showLogin();
  toast(t('loggedOut'), '👋');
}

// ════════ ENTER APP ════════

// ════════════════════════════════════════════════
//  🪜 MULTI-STEP REGISTER
// ════════════════════════════════════════════════
let regStep = 1;
let regContactType = 'email';

function startRegister() {
  regStep = 1;
  showRegister();
  updateRegSteps(1);
  setTimeout(() => renderRegSuggestions(), 100);
}

function updateRegSteps(step) {
  regStep = step;
  for (let i = 1; i <= 4; i++) {
    const dot = document.getElementById('rstep-' + i);
    const content = document.getElementById('reg-step-' + i);
    if (dot) dot.classList.toggle('active', i <= step);
    if (content) content.classList.toggle('active', i === step);
  }
}

function regNext(from) {
  const isAr = currentLang === 'ar';
  if (from === 1) {
    const name = document.getElementById('reg-name')?.value.trim();
    const uname = document.getElementById('reg-username')?.value.trim();
    if (!name) { showToast('اكتب اسمك الأول', '👤'); return; }
    if (!uname || uname.length < 3) { showToast('اسم المستخدم على الأقل 3 حروف', '⚠️'); return; }
    const users = DB.get('wvx_users') || {};
    if (users[uname]) { showToast('الاسم ده موجود، جرب تاني', '❌'); return; }
    updateRegSteps(2);
  } else if (from === 2) {
    const pw = document.getElementById('reg-password')?.value;
    if (!pw || pw.length < 6) { showToast('الباسورد على الأقل 6 حروف', '🔐'); return; }
    updateRegSteps(3);
  } else if (from === 3) {
    updateRegSteps(4);
    renderRegSuggestions();
  }
}

function regBack(from) {
  updateRegSteps(from - 1);
}

function switchContactTab(type, btn) {
  regContactType = type;
  document.querySelectorAll('.reg-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('contact-email-wrap').classList.toggle('hidden', type !== 'email');
  document.getElementById('contact-phone-wrap').classList.toggle('hidden', type !== 'phone');
}

function previewRegCover(input) {
  const file = input.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = e => {
    const prev = document.getElementById('reg-cover-preview');
    if (prev) prev.style.background = 'url(' + e.target.result + ') center/cover no-repeat';
    window._regCoverImg = e.target.result;
  };
  r.readAsDataURL(file);
}

function renderRegSuggestions() {
  const el = document.getElementById('reg-suggestions');
  if (!el) return;
  const users = Object.values(DB.get('wvx_users') || {}).filter(u => u.verified).slice(0, 4);
  if (!users.length) {
    el.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:16px">مفيش اقتراحات دلوقتي</p>';
    return;
  }
  el.innerHTML = users.map(u => {
    const avIsImg = u.avatar && (u.avatar.startsWith('data:') || u.avatar.startsWith('http') || u.avatar.startsWith('assets/'));
    const avHTML = avIsImg
      ? '<img src="' + u.avatar + '" style="width:44px;height:44px;border-radius:50%;object-fit:cover"/>'
      : '<div style="width:44px;height:44px;border-radius:50%;background:rgba(110,231,247,0.1);display:flex;align-items:center;justify-content:center;font-size:1.4rem">' + (u.avatar || '👤') + '</div>';
    return '<div class="reg-suggest-item" id="rsg-' + u.id + '">' +
      avHTML +
      '<div style="flex:1;min-width:0">' +
        '<div style="font-weight:700;font-size:.88rem">' + esc(u.name) + (u.verified ? '<span class="badge-verified" style="width:13px;height:13px;font-size:.55rem">✓</span>' : '') + '</div>' +
        '<div style="font-size:.75rem;color:var(--text-muted)">@' + esc(u.username) + '</div>' +
      '</div>' +
      '<button class="reg-follow-btn" id="rfbtn-' + u.id + '" onclick="toggleRegFollow(\''+u.id+'\')">+ تابع</button>' +
    '</div>';
  }).join('');
}

function toggleRegFollow(userId) {
  const btn = document.getElementById('rfbtn-' + userId);
  const item = document.getElementById('rsg-' + userId);
  if (!btn) return;
  const isFollowing = btn.classList.contains('following');
  btn.classList.toggle('following', !isFollowing);
  btn.textContent = isFollowing ? '+ تابع' : '✓ بتابعه';
  item.style.opacity = isFollowing ? '1' : '0.6';
  if (!window._regFollowing) window._regFollowing = [];
  if (!isFollowing) window._regFollowing.push(userId);
  else window._regFollowing = window._regFollowing.filter(id => id !== userId);
}

function finishRegister() {
  const name  = document.getElementById('reg-name')?.value.trim();
  const uname = document.getElementById('reg-username')?.value.trim();
  const email = document.getElementById('reg-email')?.value.trim() || '';
  const phone = document.getElementById('reg-phone')?.value.trim() || '';
  const pw    = document.getElementById('reg-password')?.value;

  if (!name || !uname || !pw) { showToast('في حاجة ناقصة', '⚠️'); updateRegSteps(1); return; }

  const COVER_LIST = COVER_GRADIENTS;
  const coverImg = window._regCoverImg || null;
  const cover    = coverImg ? null : COVER_LIST[Math.floor(Math.random() * COVER_LIST.length)];

  const user = {
    id: 'u_' + Date.now(),
    name, username: uname,
    email, phone,
    password: btoa(pw),
    avatar: selectedAvatar || '🌊',
    cover, coverImage: coverImg,
    bio: '', verified: false,
    followers: 0, following: (window._regFollowing || []).length,
    createdAt: new Date().toISOString(),
  };

  const users = DB.get('wvx_users') || {};
  users[uname] = user;
  DB.set('wvx_users', users);

  // Auto-follow selected users
  if (window._regFollowing?.length) {
    const followed = DB.get('wvx_followed') || {};
    (window._regFollowing || []).forEach(id => { followed[id] = true; });
    DB.set('wvx_followed', followed);
  }
  window._regFollowing = [];
  window._regCoverImg  = null;

  ME = user;
  DB.set('wvx_session', ME);
  enterApp();
}

// ══ Create Menu ══
function toggleCreateMenu() {
  const overlay = document.getElementById('create-fab');
  const mbnIcon = document.getElementById('mbn-create-icon');
  if (!overlay) return;
  const isOpen = !overlay.classList.contains('hidden');
  overlay.classList.toggle('hidden', isOpen);
  if (mbnIcon) mbnIcon.textContent = isOpen ? '＋' : '✕';
  document.getElementById('mbn-create-btn')?.classList.toggle('open', !isOpen);
}

function closeFeedCreator() {
  const overlay = document.getElementById('create-fab');
  const mbnIcon = document.getElementById('mbn-create-icon');
  if (overlay) overlay.classList.add('hidden');
  if (mbnIcon) mbnIcon.textContent = '＋';
  document.getElementById('mbn-create-btn')?.classList.remove('open');
}

function focusPostCreator() {
  showPage('feed');
  setTimeout(() => {
    const ta = document.getElementById('post-content');
    if (ta) { ta.scrollIntoView({ behavior: 'smooth', block: 'center' }); ta.focus(); }
  }, 300);
}


// ════════════════════════════════════════════════
//  👥 FRIENDS SYSTEM
// ════════════════════════════════════════════════

// DB keys:
// wvx_friends_{userId}       → [userId, ...] accepted friends
// wvx_freq_sent_{userId}     → [userId, ...] sent requests
// wvx_freq_recv_{userId}     → [userId, ...] received requests

function getFriends(userId)      { return DB.get('wvx_friends_' + userId)   || []; }
function getSentReqs(userId)     { return DB.get('wvx_freq_sent_' + userId)  || []; }
function getReceivedReqs(userId) { return DB.get('wvx_freq_recv_' + userId)  || []; }
function isFriend(userId)        { return getFriends(ME.id).includes(userId); }
function hasSentReq(userId)      { return getSentReqs(ME.id).includes(userId); }
function hasReceivedReq(userId)  { return getReceivedReqs(ME.id).includes(userId); }

function sendFriendRequest(toId) {
  const isAr = currentLang === 'ar';
  if (isFriend(toId))    return showToast(isAr ? 'انتوا فريندز بالفعل' : 'Already friends', '👥');
  if (hasSentReq(toId))  return showToast(isAr ? 'بعتله ريكوست من قبل' : 'Request already sent', '⏳');

  // Add to my sent
  const sent = getSentReqs(ME.id);
  sent.push(toId);
  DB.set('wvx_freq_sent_' + ME.id, sent);

  // Add to their received
  const recv = getReceivedReqs(toId);
  recv.push(ME.id);
  DB.set('wvx_freq_recv_' + toId, recv);

  // Notification
  const notifs = DB.get('wvx_notifs_' + toId) || [];
  notifs.push({
    id: Date.now(), type: 'friend_req', fromId: ME.id,
    fromName: ME.name, avatar: ME.avatar,
    text: (isAr ? ME.name + ' بعتلك طلب فريندز' : ME.name + ' sent you a friend request'),
    time: new Date().toISOString(),
  });
  DB.set('wvx_notifs_' + toId, notifs);
  showToast(isAr ? 'اتبعت الريكوست!' : 'Friend request sent!', '📨');
}

function acceptFriendRequest(fromId) {
  const isAr = currentLang === 'ar';
  // Add to each other's friends
  const myFriends   = getFriends(ME.id);
  const theirFriends = getFriends(fromId);
  if (!myFriends.includes(fromId))   myFriends.push(fromId);
  if (!theirFriends.includes(ME.id)) theirFriends.push(ME.id);
  DB.set('wvx_friends_' + ME.id,  myFriends);
  DB.set('wvx_friends_' + fromId, theirFriends);

  // Remove from requests
  DB.set('wvx_freq_recv_' + ME.id,  getReceivedReqs(ME.id).filter(id => id !== fromId));
  DB.set('wvx_freq_sent_' + fromId, getSentReqs(fromId).filter(id => id !== ME.id));

  // Notify them
  const notifs = DB.get('wvx_notifs_' + fromId) || [];
  notifs.push({
    id: Date.now(), type: 'friend_accept', fromId: ME.id,
    fromName: ME.name, avatar: ME.avatar,
    text: (isAr ? ME.name + ' قبل طلب الفريندز بتاعك' : ME.name + ' accepted your friend request'),
    time: new Date().toISOString(),
  });
  DB.set('wvx_notifs_' + fromId, notifs);
  showToast(isAr ? 'اتقبل الطلب!' : 'Friend request accepted!', '🎉');
  renderNotifications();
}

function declineFriendRequest(fromId) {
  DB.set('wvx_freq_recv_' + ME.id,  getReceivedReqs(ME.id).filter(id => id !== fromId));
  DB.set('wvx_freq_sent_' + fromId, getSentReqs(fromId).filter(id => id !== ME.id));
  showToast(currentLang==='ar' ? 'اترفض الطلب' : 'Request declined', '✕');
  renderNotifications();
}

function removeFriend(userId) {
  const isAr = currentLang === 'ar';
  if (!confirm(isAr ? 'تشيله من الفريندز؟' : 'Remove from friends?')) return;
  DB.set('wvx_friends_' + ME.id,    getFriends(ME.id).filter(id => id !== userId));
  DB.set('wvx_friends_' + userId,   getFriends(userId).filter(id => id !== ME.id));
  showToast(isAr ? 'اتشال من الفريندز' : 'Removed from friends', '👋');
}

function showFriendsPage() {
  const isAr     = currentLang === 'ar';
  const friends  = getFriends(ME.id);
  const received = getReceivedReqs(ME.id);
  const allUsers = Object.values(DB.get('wvx_users') || {}).filter(u => u.id !== ME.id);
  const users    = allUsers.reduce((acc, u) => { acc[u.id] = u; return acc; }, {});

  openModal(`
    <div class="modal-title">👥 ${isAr ? 'الفريندز' : 'Friends'}</div>

    <!-- Tabs -->
    <div style="display:flex;gap:6px;margin-bottom:14px">
      <button class="tab-btn active" onclick="switchFriendsTab('friends',this)">${isAr?'فريندزي':'My Friends'} (${friends.length})</button>
      <button class="tab-btn" onclick="switchFriendsTab('requests',this)">${isAr?'طلبات':'Requests'} ${received.length?'<span class=badge-verified style=width:18px;height:18px;font-size:.65rem>'+received.length+'</span>':''}</button>
      <button class="tab-btn" onclick="switchFriendsTab('suggest',this)">${isAr?'مقترحين':'Suggested'}</button>
    </div>

    <div id="friends-tab-content">
      ${renderFriendsTab('friends', friends, users, isAr)}
    </div>
  `);
  window._friendsTabData = { friends, received, allUsers, users, isAr };
}

function switchFriendsTab(tab, btn) {
  document.querySelectorAll('.modal .tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const { friends, received, allUsers, users, isAr } = window._friendsTabData || {};
  document.getElementById('friends-tab-content').innerHTML = renderFriendsTab(tab, friends, users, isAr, received, allUsers);
}

function renderFriendsTab(tab, friends, users, isAr, received=[], allUsers=[]) {
  if (tab === 'friends') {
    if (!friends.length) return `<p style="color:var(--text-muted);text-align:center;padding:24px">${isAr?'مفيش فريندز لسه':'No friends yet'}</p>`;
    return friends.map(id => {
      const u = users[id]; if (!u) return '';
      return friendCard(u, isAr, 'friends');
    }).join('');
  }
  if (tab === 'requests') {
    if (!received.length) return `<p style="color:var(--text-muted);text-align:center;padding:24px">${isAr?'مفيش طلبات':'No requests'}</p>`;
    return received.map(id => {
      const u = users[id]; if (!u) return '';
      return friendCard(u, isAr, 'request');
    }).join('');
  }
  if (tab === 'suggest') {
    const friendIds = new Set(friends);
    const sentIds   = new Set(getSentReqs(ME.id));
    const suggested = allUsers.filter(u => !friendIds.has(u.id) && !sentIds.has(u.id) && u.id !== ME.id).slice(0, 10);
    if (!suggested.length) return `<p style="color:var(--text-muted);text-align:center;padding:24px">${isAr?'مفيش اقتراحات':'No suggestions'}</p>`;
    return suggested.map(u => friendCard(u, isAr, 'suggest')).join('');
  }
  return '';
}

function friendCard(u, isAr, type) {
  const avIsImg = u.avatar && (u.avatar.startsWith('data:')||u.avatar.startsWith('http')||u.avatar.startsWith('assets/'));
  const avHTML  = avIsImg
    ? '<img src="'+u.avatar+'" style="width:42px;height:42px;border-radius:50%;object-fit:cover;flex-shrink:0"/>'
    : '<div style="width:42px;height:42px;border-radius:50%;background:rgba(110,231,247,0.1);display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0">'+esc(u.avatar||'👤')+'</div>';
  
  let btns = '';
  if (type === 'friends') {
    btns = `<button class="reg-follow-btn" onclick="removeFriend('${u.id}')" style="color:var(--danger);border-color:rgba(248,113,113,0.3)">${isAr?'حذف':'Remove'}</button>
            <button class="reg-follow-btn" onclick="closeModal();startChatWith('${u.id}','${esc(u.name)}','${esc(u.username)}','${u.avatar||'👤'}',${u.verified})" style="margin-inline-start:4px">${isAr?'رسالة':'Message'}</button>`;
  } else if (type === 'request') {
    btns = `<button class="reg-follow-btn" onclick="acceptFriendRequest('${u.id}')" style="background:rgba(52,211,153,0.15);border-color:rgba(52,211,153,0.3);color:#34d399">${isAr?'قبول':'Accept'}</button>
            <button class="reg-follow-btn" onclick="declineFriendRequest('${u.id}')" style="color:var(--danger);border-color:rgba(248,113,113,0.3);margin-inline-start:4px">${isAr?'رفض':'Decline'}</button>`;
  } else {
    btns = `<button class="reg-follow-btn" onclick="sendFriendRequest('${u.id}')">${isAr?'+ أضف':'+ Add'}</button>`;
  }

  return `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
    ${avHTML}
    <div style="flex:1;min-width:0;cursor:pointer" onclick="closeFP?closeFP():closeModal();openUserProfile('${u.id}')">
      <div style="font-weight:700;font-size:.88rem">${esc(u.name)}${u.verified?'<span class=badge-verified style=width:12px;height:12px;font-size:.55rem>✓</span>':''}</div>
      <div style="font-size:.75rem;color:var(--text-muted)">@${esc(u.username)}</div>
    </div>
    <div style="display:flex;gap:4px;flex-shrink:0">${btns}</div>
  </div>`;
}

// Report user
function reportUser(userId) {
  const isAr = currentLang === 'ar';
  const reasons = isAr
    ? ['محتوى مسيء','سبام','انتحال شخصية','تحرش','أخرى']
    : ['Offensive content','Spam','Impersonation','Harassment','Other'];
  openModal(`
    <div class="modal-title">🚩 ${isAr?'إبلاغ عن المستخدم':'Report User'}</div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px">
      ${reasons.map(r => `
        <button class="settings-item" onclick="submitReport('${userId}','${r}')" style="text-align:start;padding:12px 14px;cursor:pointer;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid var(--border)">
          ${r}
        </button>`).join('')}
    </div>
  `);
}

function submitReport(userId, reason) {
  const reports = DB.get('wvx_reports') || [];
  reports.push({ id: Date.now(), fromId: ME.id, targetId: userId, reason, time: new Date().toISOString() });
  DB.set('wvx_reports', reports);
  closeModal();
  showToast(currentLang==='ar' ? 'اتبعت البلاغ، شكراً!' : 'Report submitted, thanks!', '🚩');
}

// Privacy mode: followers only vs friends
function togglePrivacyMode() {
  const isAr = currentLang === 'ar';
  const current = ME.privacyMode || 'public';
  const newMode = current === 'public' ? 'friends' : 'public';
  ME.privacyMode = newMode;
  const users = DB.get('wvx_users') || {};
  if (users[ME.username]) users[ME.username].privacyMode = newMode;
  DB.set('wvx_users', users);
  DB.set('wvx_session', ME);
  showToast(
    isAr
      ? (newMode === 'friends' ? 'الحساب بقى للفريندز بس 🔒' : 'الحساب بقى عام 🌍')
      : (newMode === 'friends' ? 'Account set to Friends only 🔒' : 'Account set to Public 🌍'),
    newMode === 'friends' ? '🔒' : '🌍'
  );
  loadSettings();
}


// ════════════════════════════════════════════════
//  🎛️ HOME CUSTOMIZATION SETTINGS
// ════════════════════════════════════════════════

function getHomePrefs() {
  return DB.get('wvx_home_prefs') || {
    showPosts:    true,
    showVideos:   true,
    showPhotos:   true,
    showStories:  true,
    showSuggested:true,
    showTrending: true,
    feedMode:     'smart',
  };
}

function saveHomePrefs(prefs) {
  DB.set('wvx_home_prefs', prefs);
}

function showHomeCustomizer() {
  const isAr  = currentLang === 'ar';
  const prefs = getHomePrefs();

  const row = (key, icon, labelAr, labelEn) =>
    `<div class="settings-item" style="padding:12px 14px">
      <div class="settings-item-left">
        <span class="settings-icon">${icon}</span>
        <div><div class="settings-label">${isAr?labelAr:labelEn}</div></div>
      </div>
      <label class="toggle-switch">
        <input type="checkbox" id="hp-${key}" ${prefs[key]!==false?'checked':''} onchange="updateHomePref('${key}',this.checked)"/>
        <span class="toggle-slider"></span>
      </label>
    </div>`;

  openModal(`
    <div class="modal-title">🏠 ${isAr?'تخصيص الهوم':'Customize Home'}</div>
    <p style="color:var(--text-muted);font-size:.8rem;margin-bottom:14px">${isAr?'اختار إيه اللي يظهر لك في الهوم':'Choose what appears in your home feed'}</p>
    ${row('showPosts',    '📝', 'البوستات',     'Posts')}
    ${row('showVideos',   '🎬', 'الفيديوهات',   'Videos')}
    ${row('showPhotos',   '🖼️', 'الصور',        'Photos')}
    ${row('showStories',  '📖', 'الستوريز',     'Stories')}
    ${row('showSuggested','👥', 'مقترح عليك',   'Suggested')}
    ${row('showTrending', '🔥', 'الترند',       'Trending')}
    <div class="settings-item" style="padding:12px 14px;margin-top:6px">
      <div class="settings-item-left">
        <span class="settings-icon">🧠</span>
        <div><div class="settings-label">${isAr?'ترتيب الفيد':'Feed Order'}</div></div>
      </div>
      <select class="glass-input" id="hp-feedMode" onchange="updateHomePref('feedMode',this.value)" style="width:auto;padding:6px 10px;font-size:.82rem;max-width:130px">
        <option value="smart"         ${prefs.feedMode==='smart'?'selected':''}>${isAr?'ذكي':'Smart'}</option>
        <option value="chronological" ${prefs.feedMode==='chronological'?'selected':''}>${isAr?'أحدث':'Recent'}</option>
        <option value="friends"       ${prefs.feedMode==='friends'?'selected':''}>${isAr?'فريندز':'Friends'}</option>
      </select>
    </div>
    <button class="btn-primary" onclick="closeModal();applyHomePrefs()" style="margin-top:14px">${isAr?'حفظ':'Save'}</button>
  `);
}

function updateHomePref(key, val) {
  const prefs = getHomePrefs();
  prefs[key] = val;
  saveHomePrefs(prefs);
}

function applyHomePrefs() {
  const prefs = getHomePrefs();
  // Apply feed mode
  if (typeof FeedModeManager !== 'undefined') {
    FeedModeManager.setMode(prefs.feedMode || 'smart');
  }
  // Show/hide stories
  const storiesBar = document.getElementById('stories-bar');
  if (storiesBar) storiesBar.style.display = prefs.showStories !== false ? '' : 'none';
  // Re-render feed
  if (typeof renderFeed === 'function') renderFeed();
  showToast(currentLang==='ar' ? 'اتحفظ التخصيص!' : 'Preferences saved!', '✅');
}

// Notification settings
function showNotifSettings() {
  const isAr  = currentLang === 'ar';
  const prefs = DB.get('wvx_notif_prefs') || {};

  const row = (key, icon, labelAr, labelEn) =>
    `<div class="settings-item" style="padding:12px 14px">
      <div class="settings-item-left">
        <span class="settings-icon">${icon}</span>
        <div><div class="settings-label">${isAr?labelAr:labelEn}</div></div>
      </div>
      <label class="toggle-switch">
        <input type="checkbox" id="np-${key}" ${prefs[key]!==false?'checked':''}
          onchange="saveNotifPref('${key}',this.checked)"/>
        <span class="toggle-slider"></span>
      </label>
    </div>`;

  openModal(`
    <div class="modal-title">🔔 ${isAr?'إعدادات الإشعارات':'Notification Settings'}</div>
    ${row('likes',     '❤️', 'اللايكات',    'Likes')}
    ${row('comments',  '💬', 'الكومنتات',   'Comments')}
    ${row('followers', '👤', 'المتابعين',   'Followers')}
    ${row('messages',  '✉️', 'الرسايل',     'Messages')}
    ${row('friends',   '👥', 'طلبات الفريند','Friend Requests')}
    ${row('mentions',  '📢', 'المنشنز',     'Mentions')}
    <div class="settings-item" style="padding:12px 14px;margin-top:6px">
      <div class="settings-item-left">
        <span class="settings-icon">🔕</span>
        <div><div class="settings-label">${isAr?'وضع عدم الإزعاج':'Do Not Disturb'}</div></div>
      </div>
      <label class="toggle-switch">
        <input type="checkbox" id="np-dnd" ${DB.get('wvx_dnd')?'checked':''}
          onchange="toggleDND(this.checked)"/>
        <span class="toggle-slider"></span>
      </label>
    </div>
    <button class="btn-primary" onclick="closeModal()" style="margin-top:14px">${isAr?'حفظ':'Save'}</button>
  `);
}

// Video settings
function showVideoSettings() {
  const isAr  = currentLang === 'ar';
  const prefs = DB.get('wvx_video_prefs') || {};

  const row = (key, icon, labelAr, labelEn, type='toggle', opts=[]) => {
    if (type === 'select') {
      return `<div class="settings-item" style="padding:12px 14px">
        <div class="settings-item-left">
          <span class="settings-icon">${icon}</span>
          <div><div class="settings-label">${isAr?labelAr:labelEn}</div></div>
        </div>
        <select class="glass-input" onchange="saveVideoPref('${key}',this.value)" style="width:auto;padding:6px 10px;font-size:.82rem;max-width:130px">
          ${opts.map(o => `<option value="${o.v}" ${prefs[key]===o.v?'selected':''}>${isAr?o.ar:o.en}</option>`).join('')}
        </select>
      </div>`;
    }
    return `<div class="settings-item" style="padding:12px 14px">
      <div class="settings-item-left">
        <span class="settings-icon">${icon}</span>
        <div><div class="settings-label">${isAr?labelAr:labelEn}</div></div>
      </div>
      <label class="toggle-switch">
        <input type="checkbox" ${prefs[key]!==false?'checked':''}
          onchange="saveVideoPref('${key}',this.checked)"/>
        <span class="toggle-slider"></span>
      </label>
    </div>`;
  };

  openModal(`
    <div class="modal-title">🎬 ${isAr?'إعدادات الفيديو':'Video Settings'}</div>
    ${row('autoplay',  '▶️', 'تشغيل تلقائي',    'Autoplay')}
    ${row('muted',     '🔇', 'صامت بالديفولت',  'Start Muted')}
    ${row('hd',        '🎥', 'جودة عالية HD',   'HD Quality')}
    ${row('quality', '📊', 'جودة الفيديو', 'Video Quality', 'select', [
      {v:'auto',ar:'تلقائي',en:'Auto'},
      {v:'hd',  ar:'جودة عالية',en:'HD'},
      {v:'sd',  ar:'جودة متوسطة',en:'SD'},
    ])}
    <button class="btn-primary" onclick="closeModal();applyVideoPrefs()" style="margin-top:14px">${isAr?'حفظ':'Save'}</button>
  `);
}

function saveVideoPref(key, val) {
  const prefs = DB.get('wvx_video_prefs') || {};
  prefs[key] = val;
  DB.set('wvx_video_prefs', prefs);
}

function applyVideoPrefs() {
  const prefs = DB.get('wvx_video_prefs') || {};
  // Apply autoplay
  document.querySelectorAll('video').forEach(v => {
    v.autoplay = prefs.autoplay === true;
    v.muted    = prefs.muted !== false;
  });
  showToast(currentLang==='ar'?'اتحفظ الإعدادات!':'Settings saved!','✅');
}

// Font size — more options
function setFontSizeCustom(size) {
  const sizes = { xs:'12px', small:'14px', medium:'16px', large:'18px', xl:'20px' };
  document.documentElement.style.fontSize = sizes[size] || '16px';
  DB.set('wvx_font_size', size);
  document.querySelectorAll('.font-sz-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('fs-' + size);
  if (btn) btn.classList.add('active');
  showToast(currentLang==='ar'?'اتغير حجم الخط':'Font size changed','🔤');
}

function enterApp() {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');

  refreshUserUI();
  renderFeed();
  renderRightPanel();
  renderConversationsList();
  renderNotifications();
  renderExplore();
  updateBadges();
  startChatPolling();

  // ⚛️ أعلم React بالـ login
  setTimeout(() => window.dispatchEvent(new CustomEvent('wavex-login')), 350);
  // Sync more menu user info
  setTimeout(syncMoreMenuUser, 400);
  // 🧠 Feed algorithm switcher
  setTimeout(() => {
    if (typeof renderFeedModeSwitcher === 'function') renderFeedModeSwitcher();
    if (typeof renderTrendingTopics   === 'function') renderTrendingTopics();
  }, 600);
  // Show mobile bottom nav
  document.getElementById('mobile-bottom-nav')?.classList.add('visible');
  // Update mbn active state
  syncMobileNav('feed');
  // Apply home prefs
  setTimeout(applyHomePrefs, 200);
}

function refreshUserUI() {
  const nameEl = document.getElementById('sidebar-name');
  nameEl.innerHTML = esc(ME.name) + (ME.verified ? ' <span class="badge-verified" title="' + t('verified') + '">✓</span>' : '');
  document.getElementById('sidebar-handle').textContent = '@' + ME.username;
  // Sidebar avatar
  const sidebarAv = document.getElementById('sidebar-avatar');
  if (ME.avatar && (ME.avatar.startsWith('data:') || ME.avatar.startsWith('http') || ME.avatar.startsWith('assets/'))) {
    sidebarAv.innerHTML = '<img src="'+ME.avatar+'" alt="av" style="width:36px;height:36px;border-radius:50%;object-fit:cover;display:block"/>';
    sidebarAv.textContent = '';
  } else {
    sidebarAv.innerHTML = '';
    sidebarAv.textContent = ME.avatar || '👤';
  }
  // Nav profile avatar
  const navProfAv = document.getElementById('nav-profile-av');
  if (navProfAv) {
    if (ME.avatar && (ME.avatar.startsWith('data:')||ME.avatar.startsWith('http')||ME.avatar.startsWith('assets/'))) {
      navProfAv.innerHTML = '<img src="'+ME.avatar+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>';
    } else {
      navProfAv.textContent = ME.avatar || '👤';
    }
  }
  // Also update mobile bottom nav profile
  const mbnProfAv = document.getElementById('mbn-profile');
  if (mbnProfAv) {
    const iconSpan = mbnProfAv.querySelector('.mbn-icon');
    if (iconSpan && ME.avatar && (ME.avatar.startsWith('data:')||ME.avatar.startsWith('http')||ME.avatar.startsWith('assets/'))) {
      iconSpan.innerHTML = '<img src="'+ME.avatar+'" style="width:26px;height:26px;border-radius:50%;object-fit:cover;display:block"/>';
    } else if (iconSpan) {
      iconSpan.textContent = ME.avatar || '👤';
    }
  }

  // Creator avatar
  const creatorAv = document.getElementById('creator-avatar');
  if (ME.avatar && (ME.avatar.startsWith('data:') || ME.avatar.startsWith('http') || ME.avatar.startsWith('assets/'))) {
    creatorAv.innerHTML = '<img src="'+ME.avatar+'" alt="av" style="width:42px;height:42px;border-radius:50%;object-fit:cover;display:block"/>';
    creatorAv.textContent = '';
  } else {
    creatorAv.innerHTML = '';
    creatorAv.textContent = ME.avatar || '👤';
  }
  // Profile
  const profileName = document.getElementById('profile-name-display');
  profileName.innerHTML = esc(ME.name) + (ME.verified ? ' <span class="badge-verified">✓</span>' : '');
  document.getElementById('profile-handle-display').textContent = '@' + ME.username;
  const profAvDiv = document.getElementById('profile-avatar-display');
  const profAvContent = (ME.avatar && (ME.avatar.startsWith('data:')||ME.avatar.startsWith('http')||ME.avatar.startsWith('assets/')))
    ? '<img src="'+ME.avatar+'" alt="av" style="width:100%;height:100%;border-radius:50%;object-fit:cover;display:block"/>'
    : ME.avatar || '👤';
  profAvDiv.innerHTML = profAvContent + `<label class="change-avatar-btn" style="cursor:pointer" title="${currentLang==='ar'?'تغيير الصورة':'Change photo'}">📷<input type="file" id="profile-avatar-file" accept="image/*,image/gif,image/webp" class="hidden" onchange="handleAvatarUpload(this,'edit')"/></label>`;
  document.getElementById('profile-bio-display').textContent = ME.bio || t('defaultBio');
  // Info pills (job, location, website, birthday, joined)
  const pillsEl = document.getElementById('profile-info-pills');
  if (pillsEl) {
    const pills = [];
    if (ME.job)      pills.push('<span class="profile-pill">💼 ' + esc(ME.job) + '</span>');
    if (ME.location) pills.push('<span class="profile-pill">📍 ' + esc(ME.location) + '</span>');
    if (ME.website)  pills.push('<span class="profile-pill">🔗 <a href="' + esc(ME.website) + '" target="_blank" style="color:var(--accent)">' + esc(ME.website.replace(/^https?:\/\//, '')) + '</a></span>');
    if (ME.birthday) pills.push('<span class="profile-pill">🎂 ' + esc(ME.birthday) + '</span>');
    const joined = ME.createdAt ? new Date(ME.createdAt).toLocaleDateString(currentLang==='ar'?'ar-EG':'en-US',{month:'long',year:'numeric'}) : '';
    if (joined) pills.push('<span class="profile-pill">📅 ' + t('profileJoined') + ' ' + joined + '</span>');
    pillsEl.innerHTML = pills.join('');
  }
  // Followers count from wvx_followed data
  const followedMap  = DB.get('wvx_followed') || {};
  const allUsers     = Object.values(DB.get('wvx_users') || {});
  const followingCnt = Object.values(followedMap).filter(Boolean).length;
  const followersCnt = allUsers.filter(u => {
    const theirFollowed = DB.get('wvx_followed_' + u.id) || {};
    return theirFollowed[ME.id];
  }).length;
  document.getElementById('profile-followers-count').textContent = ME.followers || followersCnt || 0;
  document.getElementById('profile-following-count').textContent = ME.following || followingCnt || 0;
  // Make counts clickable
  const fwersEl = document.getElementById('profile-followers-count');
  const fwingEl = document.getElementById('profile-following-count');
  if (fwersEl) fwersEl.parentElement.onclick = () => showFollowListModal('followers');
  if (fwingEl) fwingEl.parentElement.onclick = () => showFollowListModal('following');
  const coverBg = document.getElementById('profile-cover-bg');
  if (coverBg) {
    if (ME.coverImage) coverBg.style.background = 'url(' + ME.coverImage + ') center/cover no-repeat';
    else if (ME.cover)  coverBg.style.background = ME.cover;
  }
}

// ════════ NAV ════════
function syncMobileNav(page) {
  document.querySelectorAll('.mbn-item').forEach(n => n.classList.remove('active'));
  const mbnMap = { feed:'mbn-feed', explore:'mbn-explore', profile:'mbn-profile' };
  if (mbnMap[page]) document.getElementById(mbnMap[page])?.classList.add('active');
}

function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  const nav = document.getElementById('nav-' + page);
  if (nav) nav.classList.add('active');
  if (page === 'profile') { refreshUserUI(); renderProfilePosts(); }
  if (page === 'notifications') { DB.del('wvx_notif_unread_' + ME.id); document.getElementById('notif-badge').classList.add('hidden'); }
  if (emojiOpen) { emojiOpen = false; document.getElementById('emoji-picker').classList.add('hidden'); }
}

// ════════ FEED ════════
function switchFeedTab(tab, btn) {
  feedTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderFeed();
}

function renderFeed() {
  const posts = getPosts();
  const container = document.getElementById('posts-container');
  container.innerHTML = '';
  if (!posts.length) {
    container.innerHTML = `<div class="empty-state-full"><div style="font-size:3rem">📝</div><p style="color:var(--text-muted);margin-top:8px">${currentLang==='ar'?'مفيش منشورات لسه':'No posts yet'}</p></div>`;
    return;
  }
  posts.forEach(p => container.appendChild(buildPostCard(p)));
}

function getPosts() {
  const all = DB.get('wvx_posts') || [];
  return all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// ── Reaction definitions ──
const REACTIONS = [
  { key: 'like',    emoji: '❤️',  label: 'إعجاب',   labelEn: 'Like'    },
  { key: 'love',    emoji: '😍',  label: 'حب',      labelEn: 'Love'    },
  { key: 'haha',    emoji: '😂',  label: 'ضحك',     labelEn: 'Haha'    },
  { key: 'wow',     emoji: '😮',  label: 'واو',     labelEn: 'Wow'     },
  { key: 'sad',     emoji: '😢',  label: 'حزن',     labelEn: 'Sad'     },
  { key: 'angry',   emoji: '😡',  label: 'غضب',     labelEn: 'Angry'   },
];

// Reaction sounds (web audio, tiny & client-generated)
const _audioCtx = { ctx: null };
function getAudioCtx() {
  if (!_audioCtx.ctx) _audioCtx.ctx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx.ctx;
}
function playReactionSound(key) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    // Each reaction → unique tone
    const freqs = { like:880, love:1046, haha:1318, wow:659, sad:392, angry:220 };
    osc.frequency.value = freqs[key] || 880;
    osc.type = key === 'haha' ? 'square' : key === 'angry' ? 'sawtooth' : 'sine';
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start(); osc.stop(ctx.currentTime + 0.35);
  } catch(e) {}
}

function buildPostCard(post) {
  const myReaction = (post.reactions && post.reactions[ME?.id]) || null;
  const isOwner    = post.authorId === ME?.id;
  const card       = document.createElement('div');
  card.className   = 'post-card glass-card post-card-sep';
  card.id          = 'post-' + post.id;

  // ── Post media: image / video / audio ──
  let postMediaHTML = '';
  if (post.image) {
    const imgSrc = post.image;
    postMediaHTML = '<div class="post-image-wrap"><img src="' + imgSrc + '" class="post-image" onclick="openLightbox(\'' + imgSrc.substring(0,50) + '\')" onerror="this.style.display=\'none\'" alt="" loading="lazy"/></div>';
  } else if (post.video) {
    postMediaHTML =
      '<div class="post-video-wrap">' +
        '<video src="' + post.video.dataUrl + '" class="post-video" controls preload="metadata" ' +
          'style="max-width:100%;border-radius:12px;max-height:340px;display:block"></video>' +
      '</div>';
  } else if (post.audio) {
    postMediaHTML =
      '<div class="post-audio-wrap">' +
        '<div class="post-audio-inner">' +
          '<span class="post-audio-icon">🎵</span>' +
          '<div class="post-audio-info">' +
            '<div class="post-audio-name">' + esc(post.audio.name || 'Audio') + '</div>' +
            '<audio src="' + post.audio.dataUrl + '" controls class="post-audio-player" preload="none"></audio>' +
          '</div>' +
        '</div>' +
      '</div>';
  }
  const imageHTML = postMediaHTML;
  const avIsImg = post.authorAvatar && (post.authorAvatar.startsWith('data:')||post.authorAvatar.startsWith('http')||post.authorAvatar.startsWith('assets/'));
  const postAvHTML = avIsImg
    ? '<div class="post-avatar post-avatar-img"><img src="' + post.authorAvatar + '" alt="av"/></div>'
    : '<div class="post-avatar">' + esc(post.authorAvatar||'👤') + '</div>';

  // Reaction counts summary
  const rxCounts = {};
  if (post.reactions) Object.values(post.reactions).forEach(r => { rxCounts[r] = (rxCounts[r]||0)+1; });
  const totalRx   = Object.values(rxCounts).reduce((a,b)=>a+b, 0);
  const topRx     = REACTIONS.filter(r => rxCounts[r.key]).sort((a,b)=>(rxCounts[b.key]||0)-(rxCounts[a.key]||0)).slice(0,3);
  const rxSummary = topRx.length
    ? '<span class="rx-summary" onclick="openCommentModal(' + post.id + ')">' + topRx.map(r=>r.emoji).join('') + ' ' + totalRx + '</span>'
    : '';

  const myRxObj   = myReaction ? REACTIONS.find(r=>r.key===myReaction) : null;
  const rxBtnHTML = '<button class="action-btn rx-btn' + (myReaction?' has-reaction':'') + '" id="like-btn-' + post.id + '" '
    + 'onmouseenter="showReactionPicker(' + post.id + ',this)" '
    + 'ontouchstart="showReactionPickerTouch(' + post.id + ',this)" '
    + 'onclick="toggleLikeReaction(' + post.id + ',this)">'
    + (myRxObj ? myRxObj.emoji : '🤍') + ' <span>' + (myRxObj ? (currentLang==='ar'?myRxObj.label:myRxObj.labelEn) : t('like')) + '</span>'
    + '</button>'
    + '<div class="reaction-picker hidden" id="rxpicker-' + post.id + '">'
    + REACTIONS.map(function(r){ return '<button class="rx-opt" onclick="setReaction(' + post.id + ',\'' + r.key + '\',document.getElementById(\'like-btn-' + post.id + '\'))" data-key="' + r.key + '" title="' + (currentLang==='ar'?r.label:r.labelEn) + '">' + r.emoji + '</button>'; }).join('')
    + '</div>';

  // Wrap avatar and name with click-to-profile
  const avClickHTML = post.authorId !== ME?.id
    ? '<div class="post-avatar-wrap" onclick="openUserProfile(\'' + post.authorId + '\')" style="cursor:pointer">' + postAvHTML + '</div>'
    : '<div class="post-avatar-wrap">' + postAvHTML + '</div>';

  card.innerHTML =
    '<div class="post-header">' +
      avClickHTML +
      '<div class="post-user-info">' +
        '<div class="post-username' + (post.authorId !== ME?.id ? ' clickable-name' : '') + '"' +
          (post.authorId !== ME?.id ? ' onclick="openUserProfile(\'' + post.authorId + '\')" style="cursor:pointer"' : '') + '>' +
          esc(post.authorName) + (post.verified?' <span class="badge-verified" title="' + t('verified') + '">✓</span>':'') + '</div>' +
        '<div class="post-time">' + timeAgo(post.createdAt) + '</div>' +
      '</div>' +
      '<button class="post-menu-btn" onclick="togglePostMenu(' + post.id + ',this)">•••</button>' +
      '<div class="post-menu-dropdown hidden" id="menu-' + post.id + '">' +
        (isOwner ? '<div class="menu-item danger" onclick="deletePost(' + post.id + ')">🗑️ ' + t('delete') + '</div>' : '') +
        '<div class="menu-item" onclick="reportPost(' + post.id + ')">🚩 ' + t('report') + '</div>' +
        '<div class="menu-item" onclick="sharePostFn(' + post.id + ')">📤 ' + t('sharePost') + '</div>' +
        '<div class="menu-item" onclick="copyPostLink(' + post.id + ')">🔗 ' + t('copyLink') + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="post-content">' + esc(post.content) + '</div>' +
    imageHTML +
    '<div class="post-stats">' +
      (rxSummary || ('<span>🤍 ' + (totalRx||0) + ' ' + t('like') + '</span>')) +
      '<span>💬 ' + ((post.comments||[]).length) + '</span>' +
    '</div>' +
    '<div class="post-actions">' +
      '<div class="rx-wrap">' + rxBtnHTML + '</div>' +
      '<button class="action-btn" onclick="openCommentModal(' + post.id + ')">💬 <span>' + t('comment') + '</span></button>' +
      '<button class="action-btn" onclick="sharePostFn(' + post.id + ')">📤 <span>' + t('sharePost') + '</span></button>' +
      '<button class="action-btn save-btn" id="save-' + post.id + '" onclick="toggleSavePost(' + post.id + ')">🔖 <span>' + t('savePost') + '</span></button>' +
    '</div>';
  return card;
}

// ── Reaction logic ──
function toggleLikeReaction(postId, btn) {
  // If no reaction yet → set 'like'. If already liked → remove.
  const posts = DB.get('wvx_posts') || [];
  const post  = posts.find(p => p.id === postId);
  if (!post) return;
  post.reactions = post.reactions || {};
  if (post.reactions[ME.id]) {
    delete post.reactions[ME.id];
  } else {
    post.reactions[ME.id] = 'like';
    playReactionSound('like');
    animateReactionBtn(btn, '❤️');
  }
  post.likes = Object.keys(post.reactions).length;
  DB.set('wvx_posts', posts);
  refreshPostCard(postId);
  hideReactionPicker(postId);
}

function setReaction(postId, key, btn) {
  const posts = DB.get('wvx_posts') || [];
  const post  = posts.find(p => p.id === postId);
  if (!post) return;
  post.reactions = post.reactions || {};
  const same = post.reactions[ME.id] === key;
  if (same) delete post.reactions[ME.id];
  else {
    post.reactions[ME.id] = key;
    playReactionSound(key);
    const rx = REACTIONS.find(r=>r.key===key);
    if (rx) animateReactionBtn(document.getElementById('like-btn-' + postId), rx.emoji);
    // Fire notification to post author (if not me)
    if (post.authorId !== ME.id && typeof fireNotif === 'function') {
      const rxObj = REACTIONS.find(r=>r.key===key);
      const emoji = rxObj ? rxObj.emoji : '❤️';
      fireNotif(post.authorName, ME.name + (currentLang==='ar'?' تفاعل مع منشورك':' reacted to your post'), emoji);
    }
  }
  post.likes = Object.keys(post.reactions).length;
  DB.set('wvx_posts', posts);
  refreshPostCard(postId);
  hideReactionPicker(postId);
}

function animateReactionBtn(btn, emoji) {
  if (!btn) return;
  const fly = document.createElement('span');
  fly.textContent = emoji;
  fly.className = 'reaction-fly';
  btn.appendChild(fly);
  setTimeout(() => fly.remove(), 800);
}

let _rxHideTimer = {};
function showReactionPicker(postId, btn) {
  clearTimeout(_rxHideTimer[postId]);
  document.querySelectorAll('.reaction-picker').forEach(p => {
    if (p.id !== 'rxpicker-' + postId) p.classList.add('hidden');
  });
  const picker = document.getElementById('rxpicker-' + postId);
  if (picker) {
    picker.classList.remove('hidden');
    // Highlight current reaction
    const posts = DB.get('wvx_posts') || [];
    const post  = posts.find(p => p.id === postId);
    const myRx  = (post?.reactions || {})[ME?.id];
    picker.querySelectorAll('.rx-opt').forEach(b => b.classList.toggle('active', b.dataset.key === myRx));
  }
  btn.addEventListener('mouseleave', () => {
    _rxHideTimer[postId] = setTimeout(() => hideReactionPicker(postId), 500);
  }, { once: true });
  if (picker) picker.addEventListener('mouseleave', () => {
    _rxHideTimer[postId] = setTimeout(() => hideReactionPicker(postId), 300);
  }, { once: true });
  if (picker) picker.addEventListener('mouseenter', () => clearTimeout(_rxHideTimer[postId]));
}

function showReactionPickerTouch(postId, btn) {
  // Long press on mobile
  btn._touchTimer = setTimeout(() => showReactionPicker(postId, btn), 400);
}

function hideReactionPicker(postId) {
  document.getElementById('rxpicker-' + postId)?.classList.add('hidden');
}

function refreshPostCard(postId) {
  const posts = DB.get('wvx_posts') || [];
  const post  = posts.find(p => p.id === postId);
  if (!post) return;
  const oldCard = document.getElementById('post-' + postId);
  if (!oldCard) return;
  const newCard = buildPostCard(post);
  oldCard.replaceWith(newCard);
}

function updateCharCount() {
  const ta = document.getElementById('post-content');
  const cc = document.getElementById('char-count');
  const len = ta.value.length;
  cc.textContent = len + '/500';
  cc.style.color = len > 450 ? '#f87171' : 'var(--text-muted)';
}

function createPost() {
  const content = document.getElementById('post-content').value.trim();
  if (!content && !currentPostImage && !currentPostVideo && !currentPostAudio)
    return toast(t('writeFirst'), '✍️');
  if (content.length > 500) return toast(currentLang==='ar'?'المنشور طويل جداً':'Post is too long', '⚠️');
  const posts = DB.get('wvx_posts') || [];
  const post = {
    id: Date.now(), content, authorId: ME.id, authorName: ME.name,
    authorAvatar: ME.avatar || '🌊', verified: ME.verified,
    image:  currentPostImage  || null,
    video:  currentPostVideo  || null,
    audio:  currentPostAudio  || null,
    likes: 0, likedBy: [], comments: [], shares: 0,
    reactions: {},
    createdAt: new Date().toISOString()
  };
  posts.unshift(post);
  DB.set('wvx_posts', posts);
  document.getElementById('post-content').value = '';
  document.getElementById('char-count').textContent = '0/500';
  removeImage();
  removePostMedia('video');
  removePostMedia('audio');
  if (emojiOpen) toggleEmojiPicker();
  renderFeed();
  updateProfilePostCount();
  toast(t('postCreated'), '🎉');
}

function likePost(postId, btn) { toggleLikeReaction(postId, btn); }

function deletePost(postId) {
  let posts = DB.get('wvx_posts') || [];
  posts = posts.filter(p => !(p.id === postId && p.authorId === ME.id));
  DB.set('wvx_posts', posts);
  const card = document.getElementById('post-' + postId);
  if (card) { card.style.opacity = '0'; card.style.transform = 'translateY(-20px)'; card.style.transition = 'all 0.3s'; setTimeout(() => card.remove(), 300); }
  toast(t('postDeleted'), '🗑️');
  updateProfilePostCount();
}

function togglePostMenu(postId, btn) {
  const menu = document.getElementById('menu-' + postId);
  document.querySelectorAll('.post-menu-dropdown').forEach(m => { if (m.id !== 'menu-' + postId) m.classList.add('hidden'); });
  menu.classList.toggle('hidden');
  const close = (e) => { if (!menu.contains(e.target) && e.target !== btn) { menu.classList.add('hidden'); document.removeEventListener('click', close); } };
  setTimeout(() => document.addEventListener('click', close), 0);
}

function reportPost(id) {
  closeAllMenus();
  showToast(t('reported'));
}
function copyPostLink(id) {
  closeAllMenus();
  const url = window.location.origin + window.location.pathname + '?post=' + id;
  navigator.clipboard?.writeText(url).then(() => showToast(t('copyLink') + ' ✅')).catch(() => {
    prompt(currentLang==='ar'?'انسخ الرابط:':'Copy link:', url);
  });
}
function closeAllMenus() { document.querySelectorAll('.post-menu-dropdown').forEach(m => m.classList.add('hidden')); }
function sharePostFn(id) {
  const posts = DB.get('wvx_posts') || [];
  const post  = posts.find(p => p.id === id);
  const text  = post ? post.content.slice(0, 100) : 'Wavex';
  const url   = window.location.origin + window.location.pathname + '?post=' + id;
  if (navigator.share) {
    navigator.share({ title: 'Wavex — ' + (post?.authorName||''), text, url })
      .then(() => {
        // Increment share count
        if (post) {
          post.shares = (post.shares||0)+1;
          DB.set('wvx_posts', posts);
          refreshPostCard(id);
        }
      }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(url).then(() => showToast(t('copyLink') + ' ✅')).catch(() => {
      // Fallback: prompt
      prompt(currentLang==='ar'?'انسخ الرابط:':'Copy link:', url);
    });
  }
}

// ════════ COMMENTS — like + reply ════════
let _commentReplyTo = null; // { id, name }

function openCommentModal(postId) {
  _commentReplyTo = null;
  renderCommentModal(postId);
  openModal();
}

function renderCommentModal(postId) {
  const posts = DB.get('wvx_posts') || [];
  const post  = posts.find(p => p.id === postId);
  if (!post) return;
  const isAr = currentLang === 'ar';

  function buildCommentHTML(c, isReply) {
    const avIsImg = c.avatar && (c.avatar.startsWith('data:')||c.avatar.startsWith('http')||c.avatar.startsWith('assets/'));
    const avHTML  = avIsImg
      ? '<div class="comment-avatar c-av-img"><img src="' + c.avatar + '" alt="av"/></div>'
      : '<div class="comment-avatar">' + esc(c.avatar||'👤') + '</div>';
    const myLike  = (c.likedBy||[]).includes(ME.id);
    const replies = (c.replies||[]).map(r => buildCommentHTML(r, true)).join('');
    return '<div class="comment-item' + (isReply?' comment-reply':'') + '" id="cmt-' + c.id + '">' +
      avHTML +
      '<div class="comment-body">' +
        '<div class="comment-name">' + esc(c.name) + '</div>' +
        '<div class="comment-text">' + esc(c.text) + '</div>' +
        '<div class="comment-actions-row">' +
          '<span class="comment-time">' + timeAgo(c.time) + '</span>' +
          '<button class="comment-like-btn' + (myLike?' c-liked':'') + '" onclick="likeComment(' + postId + ',' + c.id + ',' + isReply + ')">' +
            (myLike?'❤️':'🤍') + ' <span>' + (c.likes||0) + '</span>' +
          '</button>' +
          (!isReply ? '<button class="comment-reply-btn" onclick="setReplyTo(' + postId + ',' + c.id + ',\'' + esc(c.name).replace(/'/g,'\\\'') + '\')">' + (isAr?'رد':'Reply') + '</button>' : '') +
        '</div>' +
        (replies ? '<div class="comment-replies">' + replies + '</div>' : '') +
      '</div>' +
    '</div>';
  }

  const comments   = post.comments || [];
  const noComments = '<p style="color:var(--text-muted);text-align:center;padding:16px;font-size:.85rem">' + (isAr?'لا توجد تعليقات بعد':'No comments yet') + '</p>';
  const commHTML   = comments.length ? comments.map(c => buildCommentHTML(c, false)).join('') : noComments;

  const avIsImg = ME.avatar && (ME.avatar.startsWith('data:')||ME.avatar.startsWith('http')||ME.avatar.startsWith('assets/'));
  const myAvHTML = avIsImg
    ? '<div class="comment-input-avatar c-av-img"><img src="' + ME.avatar + '" alt="av" style="width:32px;height:32px;border-radius:50%;object-fit:cover;display:block"/></div>'
    : '<div class="comment-input-avatar">' + ME.avatar + '</div>';

  document.getElementById('modal-content').innerHTML =
    '<h3 class="modal-title">💬 ' + (isAr?'التعليقات':'Comments') + ' <span style="color:var(--text-muted);font-size:.8rem">(' + comments.length + ')</span></h3>' +
    '<div class="comments-list" id="comments-list-' + postId + '">' + commHTML + '</div>' +
    '<div id="reply-indicator" class="reply-indicator hidden"></div>' +
    '<div class="comment-input-row">' +
      myAvHTML +
      '<input type="text" id="comment-txt" class="glass-input" placeholder="' + t('writePost') + '" style="flex:1" onkeydown="if(event.key==\'Enter\')submitComment(' + postId + ')"/>' +
      '<button class="btn-post" onclick="submitComment(' + postId + ')">' + t('submitComment') + '</button>' +
    '</div>';
}

function setReplyTo(postId, commentId, name) {
  _commentReplyTo = { postId, commentId, name };
  const ind = document.getElementById('reply-indicator');
  if (ind) {
    ind.textContent = (currentLang==='ar'?'رد على ':'Replying to ') + name + ' ✕';
    ind.classList.remove('hidden');
    ind.onclick = () => { _commentReplyTo = null; ind.classList.add('hidden'); };
  }
  document.getElementById('comment-txt')?.focus();
}

function likeComment(postId, commentId, isReply) {
  const posts   = DB.get('wvx_posts') || [];
  const post    = posts.find(p => p.id === postId);
  if (!post) return;
  let target = null;
  if (isReply) {
    for (const c of (post.comments||[])) {
      const r = (c.replies||[]).find(r => r.id === commentId);
      if (r) { target = r; break; }
    }
  } else {
    target = (post.comments||[]).find(c => c.id === commentId);
  }
  if (!target) return;
  target.likedBy = target.likedBy || [];
  const myIdx = target.likedBy.indexOf(ME.id);
  if (myIdx >= 0) { target.likedBy.splice(myIdx,1); target.likes = Math.max(0,(target.likes||1)-1); }
  else { target.likedBy.push(ME.id); target.likes = (target.likes||0)+1; }
  DB.set('wvx_posts', posts);
  renderCommentModal(postId); // re-render inside modal
}

function submitComment(postId) {
  const txt = document.getElementById('comment-txt')?.value.trim();
  if (!txt) { showToast(t('writeComment')); return; }
  const posts = DB.get('wvx_posts') || [];
  const post  = posts.find(p => p.id === postId);
  if (!post) return;
  post.comments = post.comments || [];

  const newComment = {
    id: Date.now(), userId: ME.id, name: ME.name,
    avatar: ME.avatar, text: txt, time: new Date().toISOString(),
    likes: 0, likedBy: [], replies: []
  };

  if (_commentReplyTo && _commentReplyTo.commentId) {
    // Add as reply to specific comment
    const parent = post.comments.find(c => c.id === _commentReplyTo.commentId);
    if (parent) {
      parent.replies = parent.replies || [];
      parent.replies.push(newComment);
    } else {
      post.comments.push(newComment);
    }
    _commentReplyTo = null;
  } else {
    post.comments.push(newComment);
  }

  DB.set('wvx_posts', posts);
  renderCommentModal(postId);
  refreshPostCard(postId);
  const input = document.getElementById('comment-txt');
  if (input) input.value = '';
  const ind = document.getElementById('reply-indicator');
  if (ind) ind.classList.add('hidden');
  showToast(t('commentAdded'));
  // Notify post author
  if (post.authorId !== ME.id && typeof fireNotif === 'function') {
    fireNotif(post.authorName, ME.name + (currentLang==='ar'?' علّق على منشورك':' commented on your post'), '💬');
  }
  // Also notify if replying to someone else's comment
  if (_commentReplyTo && _commentReplyTo.commentId) {
    const parent = (post.comments||[]).find(c => c.id === _commentReplyTo.commentId);
    if (parent && parent.userId !== ME.id && parent.userId !== post.authorId && typeof fireNotif === 'function') {
      fireNotif(parent.name, ME.name + (currentLang==='ar'?' رد على تعليقك':' replied to your comment'), '↩️');
    }
  }
}

// Image handling
function previewImage(input) {
  const file = input.files[0];
  if (!file) return;
  // Clear other media types
  removePostMedia('video'); removePostMedia('audio');
  const reader = new FileReader();
  reader.onload = e => {
    currentPostImage = e.target.result;
    document.getElementById('image-preview').src = e.target.result;
    document.getElementById('image-preview-wrap').classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

function previewPostVideo(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 100 * 1024 * 1024) { showToast(currentLang==='ar'?'الفيديو كبير جداً (100MB max)':'Video too large (100MB max)','⚠️'); return; }
  removeImage(); removePostMedia('audio');
  const reader = new FileReader();
  reader.onload = e => {
    currentPostVideo = { dataUrl: e.target.result, name: file.name, type: file.type };
    const vid = document.getElementById('video-preview');
    vid.src = e.target.result;
    document.getElementById('video-preview-wrap').classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

function previewPostAudio(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 30 * 1024 * 1024) { showToast(currentLang==='ar'?'الملف كبير جداً (30MB max)':'File too large (30MB max)','⚠️'); return; }
  removeImage(); removePostMedia('video');
  const reader = new FileReader();
  reader.onload = e => {
    currentPostAudio = { dataUrl: e.target.result, name: file.name, type: file.type };
    document.getElementById('audio-preview').src = e.target.result;
    document.getElementById('audio-filename').textContent = file.name;
    document.getElementById('audio-preview-wrap').classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

function removeImage() {
  currentPostImage = null;
  document.getElementById('image-preview-wrap').classList.add('hidden');
  document.getElementById('image-preview').src = '';
  document.getElementById('image-upload').value = '';
}

function removePostMedia(type) {
  if (type === 'video') {
    currentPostVideo = null;
    const v = document.getElementById('video-preview');
    if (v) { v.src=''; v.pause?.(); }
    document.getElementById('video-preview-wrap')?.classList.add('hidden');
    const inp = document.getElementById('video-upload');
    if (inp) inp.value = '';
  } else if (type === 'audio') {
    currentPostAudio = null;
    const a = document.getElementById('audio-preview');
    if (a) { a.src=''; a.pause?.(); }
    document.getElementById('audio-preview-wrap')?.classList.add('hidden');
    const inp = document.getElementById('audio-upload');
    if (inp) inp.value = '';
  }
}

// ════════ PROFILE ════════
function renderProfilePosts() {
  const posts = (DB.get('wvx_posts') || []).filter(p => p.authorId === ME.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const grid = document.getElementById('profile-posts');
  grid.innerHTML = '';
  updateProfilePostCount();
  if (!posts.length) {
    grid.innerHTML = `<div class="empty-state-full"><div style="font-size:2.5rem">📝</div><p style="color:var(--text-muted);margin-top:8px">${currentLang==='ar'?'مفيش منشورات لسه':'No posts yet'}</p></div>`;
    return;
  }
  posts.forEach(p => grid.appendChild(buildPostCard(p)));
}

function updateProfilePostCount() {
  const count = (DB.get('wvx_posts') || []).filter(p => p.authorId === ME.id).length;
  document.getElementById('profile-posts-count').textContent = count;
}

function switchProfileTab(tab, btn) {
  document.querySelectorAll('.profile-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const grid = document.getElementById('profile-posts');
  grid.innerHTML = '';
  if (tab === 'posts') {
    renderProfilePosts();
  } else if (tab === 'liked') {
    const liked = (DB.get('wvx_posts') || []).filter(p => (p.likedBy||[]).includes(ME.id));
    if (!liked.length) { grid.innerHTML = '<div class="empty-state-full"><div style="font-size:2.5rem">🤍</div><p style="color:var(--text-muted);margin-top:8px">' + (currentLang==='ar'?'لا توجد إعجابات بعد':'No liked posts yet') + '</p></div>'; return; }
    liked.forEach(p => grid.appendChild(buildPostCard(p)));
  } else if (tab === 'media') {
    const media = (DB.get('wvx_posts') || []).filter(p => p.authorId === ME.id && p.image);
    if (!media.length) { grid.innerHTML = '<div class="empty-state-full"><div style="font-size:2.5rem">🖼️</div><p style="color:var(--text-muted);margin-top:8px">' + (currentLang==='ar'?'لا توجد وسائط بعد':'No media yet') + '</p></div>'; return; }
    const wrap = document.createElement('div'); wrap.className = 'media-grid';
    media.forEach(p => { const img = document.createElement('img'); img.src = p.image; img.className = 'media-thumb'; img.onclick = () => openLightbox(p.image); wrap.appendChild(img); });
    grid.appendChild(wrap);
  } else if (tab === 'about') {
    renderAboutTab(grid);
  }
}

function renderAboutTab(container) {
  const isAr = currentLang === 'ar';
  const joined = ME.createdAt
    ? new Date(ME.createdAt).toLocaleDateString(isAr?'ar-EG':'en-US',{day:'numeric',month:'long',year:'numeric'})
    : '';
  container.innerHTML = '<div class="about-card glass-card">' +
    '<div class="about-section-title">' + (isAr?'معلومات شخصية':'Personal Info') + '</div>' +
    buildAboutRow('💼', t('profileJob'),     ME.job,      'edit-job',      t('jobPh')) +
    buildAboutRow('📍', t('profileLocation'),ME.location, 'edit-location', t('locationPh')) +
    buildAboutRow('🌐', t('profileWebsite'), ME.website,  'edit-website',  t('websitePh'), true) +
    buildAboutRow('🎂', t('profileBirthday'),ME.birthday, 'edit-birthday', t('birthdayPh'), false, 'date') +
    (joined ? '<div class="about-row"><span class="about-icon">📅</span><div class="about-info"><span class="about-label">' + t('profileJoined') + '</span><span class="about-value">' + joined + '</span></div></div>' : '') +
    '<button class="btn-primary" style="margin-top:16px" onclick="saveAboutInfo()">' + t('saveChanges') + '</button>' +
    '</div>';
}

function buildAboutRow(icon, label, value, inputId, ph, isLink, inputType) {
  const type = inputType || 'text';
  const val  = value || '';
  return '<div class="about-row">' +
    '<span class="about-icon">' + icon + '</span>' +
    '<div class="about-info">' +
    '<span class="about-label">' + label + '</span>' +
    '<input type="' + type + '" id="' + inputId + '" class="glass-input about-input" placeholder="' + ph + '" value="' + esc(val) + '"/>' +
    '</div></div>';
}

function saveAboutInfo() {
  ME.job      = document.getElementById('edit-job')?.value.trim()      || '';
  ME.location = document.getElementById('edit-location')?.value.trim() || '';
  ME.website  = document.getElementById('edit-website')?.value.trim()  || '';
  ME.birthday = document.getElementById('edit-birthday')?.value        || '';
  const users = DB.get('wvx_users') || {};
  users[ME.username] = ME;
  DB.set('wvx_users', users);
  DB.set('wvx_session', ME);
  showToast(t('profileUpdated'));
  refreshUserUI();
}

function editProfile() {
  const isImg = ME.avatar && (ME.avatar.startsWith('data:')||ME.avatar.startsWith('http')||ME.avatar.startsWith('assets/'));
  document.getElementById('modal-content').innerHTML =
    '<h3 class="modal-title">✏️ ' + t('editProfileTitle') + '</h3>' +

    // Name
    '<div class="input-group" style="margin-bottom:12px"><label class="field-label">' + t('nameLabel') + '</label>' +
    '<input type="text" id="edit-name" class="glass-input" value="' + esc(ME.name) + '" style="padding:12px 16px"/></div>' +

    // Bio
    '<div class="input-group" style="margin-bottom:12px"><label class="field-label">' + t('bioLabel') + '</label>' +
    '<textarea id="edit-bio" class="glass-input" rows="3" placeholder="' + t('bioPlaceholder') + '" style="resize:vertical">' + esc(ME.bio||'') + '</textarea></div>' +

    // Extra fields
    '<div class="input-group" style="margin-bottom:10px"><label class="field-label">💼 ' + t('profileJob') + '</label>' +
    '<input type="text" id="edit-job-modal" class="glass-input" value="' + esc(ME.job||'') + '" placeholder="' + t('jobPh') + '" style="padding:11px 14px"/></div>' +
    '<div class="input-group" style="margin-bottom:10px"><label class="field-label">📍 ' + t('profileLocation') + '</label>' +
    '<input type="text" id="edit-loc-modal" class="glass-input" value="' + esc(ME.location||'') + '" placeholder="' + t('locationPh') + '" style="padding:11px 14px"/></div>' +
    '<div class="input-group" style="margin-bottom:14px"><label class="field-label">🌐 ' + t('profileWebsite') + '</label>' +
    '<input type="url" id="edit-web-modal" class="glass-input" value="' + esc(ME.website||'') + '" placeholder="' + t('websitePh') + '" style="padding:11px 14px"/></div>' +

    // Avatar
    '<div style="margin-bottom:14px"><label class="field-label">' + t('chooseAvatar') + '</label>' +
    '<div class="avatar-upload-row">' +
    '<div class="avatar-current-big" id="avatar-current-big">' +
    (isImg ? '<img id="edit-avatar-big" src="' + ME.avatar + '" alt="av"/>' : '<span id="edit-avatar-big-emoji">' + ME.avatar + '</span>') +
    '</div>' +
    '<div class="avatar-upload-actions">' +
    '<label class="btn-upload-photo"><input type="file" accept="image/*,image/gif,image/webp" class="hidden" id="edit-avatar-file" onchange="handleAvatarUpload(this,\'edit\')"/>📷 ' +
    (currentLang==='ar'?'رفع صورة':'Upload Photo') + '</label>' +
    '<p class="upload-hint">' + (currentLang==='ar'?'أي فورمات · حتى 20MB':'Any format · Up to 20MB') + '</p>' +
    '</div></div>' +
    '<div class="avatar-divider"><span>' + (currentLang==='ar'?'أو اختار إيموجي':'or choose emoji') + '</span></div>' +
    '<div class="avatar-grid-edit" id="avatar-grid-edit">' +
    '<div class="avatar-opt avatar-img-preview hidden" id="edit-avatar-preview"><img src="" alt="av" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/></div>' +
    '</div></div>' +

    // Cover — gradient OR photo upload
    '<div style="margin-bottom:14px"><label class="field-label">' + (currentLang==='ar'?'صورة الغلاف':'Cover Photo') + '</label>' +
    '<div class="cover-upload-area" id="cover-upload-area">' +
    '<div class="cover-preview-mini" id="cover-preview-mini" style="' + (ME.coverImage ? 'background:url('+ME.coverImage+') center/cover no-repeat' : (ME.cover||'')) + '">' +
    '<label class="cover-upload-btn-mini"><input type="file" id="cover-file-modal" accept="image/*,image/gif,image/webp" class="hidden" onchange="handleCoverUpload(this)"/>📷 ' +
    (currentLang==='ar'?'رفع صورة':'Upload') + '</label>' +
    '</div>' +
    '<div class="cover-grid" style="margin-top:10px">' +
    COVER_GRADIENTS.map(function(g){ return '<div class="cover-opt' + (ME.cover===g&&!ME.coverImage?' selected':'') + '" style="background:' + g + '" onclick="selectCover(\'' + g + '\', this)"></div>'; }).join('') +
    '</div></div></div>' +

    '<button class="btn-primary" onclick="saveProfile()">' + t('saveChanges') + '</button>';
  // avatar grid for edit
  const ag = document.getElementById('avatar-grid-edit');
  const isCurrentImg = ME.avatar && (ME.avatar.startsWith('data:')||ME.avatar.startsWith('http')||ME.avatar.startsWith('assets/'));

  // If current avatar is image, show it in preview slot
  if (isCurrentImg) {
    const prev = document.getElementById('edit-avatar-preview');
    if (prev) {
      prev.querySelector('img').src = ME.avatar;
      prev.classList.remove('hidden');
      prev.classList.add('selected');
    }
  }

  AVATARS.forEach(em => {
    const d = document.createElement('div');
    const isSel = !isCurrentImg && em === ME.avatar;
    d.className = 'avatar-opt' + (isSel ? ' selected' : '');
    d.textContent = em;
    d.onclick = () => {
      ag.querySelectorAll('.avatar-opt').forEach(a => a.classList.remove('selected'));
      d.classList.add('selected');
      window._editAvatar = em;
      window._editAvatarIsImage = false;
      // Update big preview
      const bigEmoji = document.getElementById('edit-avatar-big-emoji');
      const bigImg = document.getElementById('edit-avatar-big');
      if (bigEmoji) bigEmoji.textContent = em;
      if (bigImg) { bigImg.style.display='none'; }
      const bigArea = document.getElementById('avatar-current-big');
      if (bigArea && !bigEmoji) bigArea.innerHTML = '<span id="edit-avatar-big-emoji">'+em+'</span>';
    };
    ag.appendChild(d);
  });

  // Edit avatar preview click handler
  const editPrev = document.getElementById('edit-avatar-preview');
  if (editPrev) {
    editPrev.onclick = () => {
      ag.querySelectorAll('.avatar-opt').forEach(a => a.classList.remove('selected'));
      editPrev.classList.add('selected');
      window._editAvatar = editPrev.querySelector('img').src;
      window._editAvatarIsImage = true;
    };
  }

  window._editAvatar = ME.avatar;
  window._editAvatarIsImage = isCurrentImg;
  window._editCover = ME.cover;
  openModal();
}

function selectCover(gradient, el) {
  document.querySelectorAll('.cover-opt').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  window._editCover = gradient;
  // Clear uploaded cover photo if user picks gradient
  ME.coverImage = null;
  const miniPreview = document.getElementById('cover-preview-mini');
  if (miniPreview) miniPreview.style.background = gradient;
}

function saveProfile() {
  const name = document.getElementById('edit-name')?.value.trim();
  const bio  = document.getElementById('edit-bio')?.value.trim();
  if (!name) { showToast(t('fillAll')); return; }
  ME.name     = name;
  ME.bio      = bio;
  ME.job      = document.getElementById('edit-job-modal')?.value.trim() || ME.job || '';
  ME.location = document.getElementById('edit-loc-modal')?.value.trim() || ME.location || '';
  ME.website  = document.getElementById('edit-web-modal')?.value.trim() || ME.website || '';
  ME.avatar   = window._editAvatar  || ME.avatar;
  ME.cover    = window._editCover   || ME.cover;
  const users = DB.get('wvx_users') || {};
  users[ME.username] = ME;
  DB.set('wvx_users', users);
  DB.set('wvx_session', ME);
  closeModal();
  refreshUserUI();
  showToast(t('profileUpdated'));
}

function changeProfileAvatar() { editProfile(); }
function changeCover() { editProfile(); }
function shareProfile() { showToast(t('shareComingSoon')); }

// Cover upload — direct file input (20 MB, any format)
function handleCoverUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const MAX = 20 * 1024 * 1024;
  if (file.size > MAX) { showToast(t('coverTooLarge')); return; }
  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    // Store on ME
    ME.coverImage = dataUrl;
    if (window._editCover !== undefined) window._editCover = null; // clear gradient choice
    // Update profile page live if visible
    const coverBg = document.getElementById('profile-cover-bg');
    if (coverBg) coverBg.style.background = 'url(' + dataUrl + ') center/cover no-repeat';
    // Update mini preview in modal if open
    const miniPreview = document.getElementById('cover-preview-mini');
    if (miniPreview) miniPreview.style.background = 'url(' + dataUrl + ') center/cover no-repeat';
    // Persist immediately
    const users = DB.get('wvx_users') || {};
    if (users[ME.username]) { users[ME.username].coverImage = dataUrl; DB.set('wvx_users', users); }
    DB.set('wvx_session', ME);
    showToast(t('coverUploaded'));
  };
  reader.readAsDataURL(file);
}

// ════════ EXPLORE ════════
function renderExplore() {
  const trending = document.getElementById('trending-posts');
  trending.innerHTML = '';
  const posts = getPosts().slice(0, 4);
  posts.forEach(p => trending.appendChild(buildPostCard(p)));
  renderSuggestedUsers();
}

function renderSuggestedUsers() {
  const container = document.getElementById('suggested-users');
  container.innerHTML = '';
  const users = DB.get('wvx_users') || {};
  const followed = DB.get('wvx_followed') || {};
  // أظهر كل المستخدمين ما عدا المستخدم الحالي
  const others = Object.values(users).filter(u => u.username !== ME?.username);
  if (!others.length) {
    container.innerHTML = `<div class="empty-state-full" style="grid-column:1/-1"><p style="color:var(--text-muted)">${currentLang==='ar'?'لا يوجد مستخدمون بعد':'No users yet'}</p></div>`;
    return;
  }
  others.forEach(u => {
    const isFollowing = !!followed[u.id];
    const d = document.createElement('div');
    d.className = 'user-card glass-card';
    d.innerHTML = `
      <div class="user-card-avatar" style="${u.avatar&&(u.avatar.startsWith('data:')||u.avatar.startsWith('http')||u.avatar.startsWith('assets/'))?'background:none;padding:0;overflow:hidden':''}">${u.avatar&&(u.avatar.startsWith('data:')||u.avatar.startsWith('http')||u.avatar.startsWith('assets/'))?'<img src="'+u.avatar+'" alt="av" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>':u.avatar}</div>
      <div class="user-card-name">${esc(u.name)}${u.verified?' <span class="badge-verified">✓</span>':''}</div>
      <div class="user-card-handle">@${esc(u.username)}</div>
      <div class="user-card-bio">${esc(u.bio||'')}</div>
      <button class="btn-follow${isFollowing?' following':''}" onclick="toggleFollow('${u.id}',this)">${isFollowing?'✓ '+(currentLang==='ar'?'يتابع':'Following'):'+ '+(currentLang==='ar'?'متابعة':'Follow')}</button>
    `;
    container.appendChild(d);
  });
}

function toggleFollow(userId, btn) {
  const followed = DB.get('wvx_followed') || {};
  if (followed[userId]) {
    delete followed[userId];
    btn.className = btn.className.includes('btn-follow-sm') ? 'btn-follow-sm' : 'btn-follow';
    btn.textContent = btn.className.includes('btn-follow-sm') ? '+' : '+ ' + (currentLang==='ar'?'متابعة':'Follow');
    ME.following = Math.max(0, (ME.following||1)-1);
    toast(t('unfollowed'), '👤');
  } else {
    followed[userId] = true;
    btn.className = (btn.className.includes('btn-follow-sm') ? 'btn-follow-sm' : 'btn-follow') + ' following';
    btn.textContent = btn.className.includes('btn-follow-sm') ? '✓' : '✓ ' + (currentLang==='ar'?'يتابع':'Following');
    ME.following = (ME.following||0)+1;
    toast(t('followed'), '🎉');
  }
  DB.set('wvx_followed', followed);
  const users = DB.get('wvx_users') || {};
  if (users[ME.username]) users[ME.username].following = ME.following;
  DB.set('wvx_users', users);
  DB.set('wvx_session', ME);
  document.getElementById('profile-following-count').textContent = ME.following;
}

// ── Fuzzy match helper — يقبل أخطاء إملائية صغيرة ──
function fuzzyMatch(str, q) {
  str = (str || '').toLowerCase();
  q   = (q   || '').toLowerCase();
  if (str.includes(q)) return true;
  // Levenshtein distance ≤ 2 للكلمات أطول من 4 حروف
  if (q.length < 3) return false;
  let prev = [...Array(q.length+1).keys()];
  for (let i = 1; i <= str.length; i++) {
    const curr = [i];
    for (let j = 1; j <= q.length; j++) {
      curr[j] = str[i-1] === q[j-1]
        ? prev[j-1]
        : 1 + Math.min(prev[j-1], prev[j], curr[j-1]);
    }
    prev = curr;
  }
  return prev[q.length] <= Math.floor(q.length / 4);
}

function searchContent(q) {
  const resultsEl = document.getElementById('search-results');
  const main      = document.getElementById('explore-main');
  const filter    = typeof exploreFilter !== 'undefined' ? exploreFilter : 'all';
  q = q.trim().toLowerCase();
  if (!q) {
    if (resultsEl) resultsEl.classList.add('hidden');
    if (main)      main.classList.remove('hidden');
    return;
  }
  if (resultsEl) resultsEl.classList.remove('hidden');
  if (main)      main.classList.add('hidden');
  resultsEl.innerHTML = '';
  const isAr   = currentLang === 'ar';
  const noHtml = '<div class="empty-state-full"><div style="font-size:2rem">🔍</div><p style="color:var(--text-muted);margin-top:8px">' + (isAr?'لا توجد نتائج':'No results found') + '</p></div>';

  // ── People ──
  if (filter === 'all' || filter === 'people') {
    const users = DB.get('wvx_users') || {};
    const matched = Object.values(users).filter(u =>
      u.username !== ME.username && (
        fuzzyMatch(u.name, q) ||
        fuzzyMatch(u.username, q) ||
        fuzzyMatch(u.bio, q) ||
        fuzzyMatch(u.job, q) ||
        fuzzyMatch(u.location, q)
      )
    );
    if (matched.length) {
      const sec = document.createElement('div');
      sec.innerHTML = '<h3 class="section-title">👥 ' + (isAr?'أشخاص':'People') + '</h3>';
      const grid = document.createElement('div');
      grid.className = 'users-grid';
      matched.forEach(u => {
        const isFollowing = (DB.get('wvx_followed')||{})[u.id];
        const avH = u.avatar&&(u.avatar.startsWith('data:')||u.avatar.startsWith('http')||u.avatar.startsWith('assets/'))
          ? '<div class="user-card-avatar" style="background:none;overflow:hidden;padding:0"><img src="'+u.avatar+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/></div>'
          : '<div class="user-card-avatar">'+esc(u.avatar||'👤')+'</div>';
        const d = document.createElement('div');
        d.className = 'user-card glass-card';
        d.innerHTML = avH +
          '<div class="user-card-name">' + esc(u.name) + (u.verified?'<span class="badge-verified" style="font-size:.7rem">✓</span>':'') + '</div>' +
          '<div class="user-card-handle">@'+esc(u.username)+'</div>' +
          (u.bio?'<div class="user-card-bio">'+esc(u.bio.slice(0,60))+'</div>':'') +
          '<button class="btn-follow'+(isFollowing?' following':'')+'" onclick="toggleFollow(\'' + u.id + '\',this)">'+(isFollowing?'✓ '+(isAr?'يتابع':'Following'):' + '+(isAr?'متابعة':'Follow'))+'</button>';
        grid.appendChild(d);
      });
      sec.appendChild(grid);
      resultsEl.appendChild(sec);
    } else if (filter === 'people') {
      resultsEl.innerHTML = noHtml; return;
    }
  }

  // ── Hashtags ──
  if (filter === 'all' || filter === 'tags') {
    const allPosts = getPosts();
    const hashQ    = q.startsWith('#') ? q.slice(1) : q;
    const tagged   = allPosts.filter(p => {
      const tags = (p.content.match(/#\w+/g)||[]).map(t=>t.slice(1).toLowerCase());
      return tags.some(tg => tg.includes(hashQ));
    });
    if (tagged.length) {
      const sec = document.createElement('div');
      sec.innerHTML = '<h3 class="section-title" style="margin-top:14px"># ' + (isAr?'هاشتاج':'Hashtags') + '</h3>';
      tagged.forEach(p => sec.appendChild(buildPostCard(p)));
      resultsEl.appendChild(sec);
    } else if (filter === 'tags') {
      resultsEl.innerHTML = noHtml; return;
    }
  }

  // ── Posts ──
  if (filter === 'all' || filter === 'posts') {
    const posts = getPosts().filter(p =>
      p.content.toLowerCase().includes(q) ||
      p.authorName.toLowerCase().includes(q)
    );
    if (posts.length) {
      const sec = document.createElement('div');
      sec.innerHTML = '<h3 class="section-title" style="margin-top:14px">📝 ' + (isAr?'منشورات':'Posts') + '</h3>';
      posts.forEach(p => sec.appendChild(buildPostCard(p)));
      resultsEl.appendChild(sec);
    } else if (filter === 'posts') {
      resultsEl.innerHTML = noHtml; return;
    }
  }

  if (!resultsEl.innerHTML) resultsEl.innerHTML = noHtml;
}

// ════════ CHAT ════════
// Messages stored as: wvx_chat_{sorted_ids}
function getChatKey(id1, id2) { return 'wvx_chat_' + [id1, id2].sort().join('_'); }

function renderConversationsList() {
  const users = DB.get('wvx_users') || {};
  allConversations = [];
  Object.entries(users).forEach(([uname, u]) => {
    if (u.id === ME.id) return;
    const key = getChatKey(ME.id, u.id);
    const msgs = DB.get(key) || [];
    if (msgs.length > 0) {
      allConversations.push({ user: u, msgs, key, lastMsg: msgs[msgs.length-1] });
    }
  });
  // Also add suggested users who haven't chatted yet — only show if no convs
  if (allConversations.length === 0) {
    // show placeholder
    document.getElementById('conversations-list').innerHTML = `
      <div class="empty-state-chat">
        <div style="font-size:2.5rem;margin-bottom:8px">💬</div>
        <p data-i18n="noConvs">${t('noConvs')}</p>
        <button class="btn-primary" style="margin-top:12px;padding:10px 20px;font-size:0.85rem" onclick="showNewChatModal()"><span>${t('startChat')}</span></button>
      </div>`;
    return;
  }
  displayConversations(allConversations);
}

function displayConversations(convs) {
  const list = document.getElementById('conversations-list');
  list.innerHTML = '';
  convs.forEach(cv => {
    const unread = cv.msgs.filter(m => m.from !== ME.id && !m.read).length;
    const d = document.createElement('div');
    d.className = 'conv-item' + (cv.user.id === activeChatId ? ' active' : '');
    d.innerHTML = `
      <div class="conv-avatar" style="${cv.user.avatar&&(cv.user.avatar.startsWith('data:')||cv.user.avatar.startsWith('http')||cv.user.avatar.startsWith('assets/'))?'background:none;padding:0;overflow:hidden':''}">${cv.user.avatar&&(cv.user.avatar.startsWith('data:')||cv.user.avatar.startsWith('http')||cv.user.avatar.startsWith('assets/'))?'<img src="'+cv.user.avatar+'" alt="av" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>':cv.user.avatar}<div class="online-dot"></div></div>
      <div class="conv-info">
        <div class="conv-name">${esc(cv.user.name)}${cv.user.verified?' <span class="badge-verified" style="font-size:0.7rem">✓</span>':''}</div>
        <div class="conv-preview">${esc(cv.lastMsg?.text||'').slice(0,40)}${cv.lastMsg?.text?.length>40?'...':''}</div>
      </div>
      <div class="conv-meta">
        <div class="conv-time">${timeAgo(cv.lastMsg?.time||cv.user.createdAt)}</div>
        ${unread>0?`<div class="conv-unread-badge">${unread}</div>`:''}
      </div>
    `;
    d.onclick = () => openChat(cv.user, d);
    list.appendChild(d);
  });
}

function filterConvs(q) {
  const filtered = allConversations.filter(cv => cv.user.name.toLowerCase().includes(q.toLowerCase()) || cv.user.username.toLowerCase().includes(q.toLowerCase()));
  if (filtered.length) displayConversations(filtered);
  else { document.getElementById('conversations-list').innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:20px">${t('noUsersFound')}</p>`; }
}

function openChat(user, listEl) {
  activeChatId = user.id;
  document.querySelectorAll('.conv-item').forEach(c => c.classList.remove('active'));
  if (listEl) listEl.classList.add('active');

  const key = getChatKey(ME.id, user.id);
  let msgs = DB.get(key) || [];
  // Mark messages as read
  msgs.forEach(m => { if (m.from === user.id) m.read = true; });
  DB.set(key, msgs);

  // Mobile: show chat pane, hide list
  const chatLayout = document.querySelector('.chat-layout');
  if (chatLayout && window.innerWidth <= 768) chatLayout.classList.add('chat-open');

  const chatMain = document.getElementById('chat-main-area');
  chatMain.innerHTML = `
    <div class="chat-header">
      <button class="chat-back-btn" onclick="closeChatMobile()">‹ <span>${currentLang==='ar'?'رجوع':'Back'}</span></button>
      <div class="chat-header-avatar" style="${user.avatar&&(user.avatar.startsWith('data:')||user.avatar.startsWith('http')||user.avatar.startsWith('assets/'))?'background:none;padding:0;overflow:hidden':''}">${user.avatar&&(user.avatar.startsWith('data:')||user.avatar.startsWith('http')||user.avatar.startsWith('assets/'))?'<img src="'+user.avatar+'" alt="av" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>':user.avatar}</div>
      <div>
        <div class="chat-header-name">${esc(user.name)}${user.verified?' <span class="badge-verified" style="font-size:0.75rem">✓</span>':''}</div>
        <div class="chat-header-status online-status" id="chat-status">${t('online')}</div>
      </div>
      <button class="btn-icon" style="margin-inline-start:auto" onclick="clearChat('${user.id}')">🗑️</button>
    </div>
    <div class="chat-messages-wrap" id="chat-messages-wrap">
      ${msgs.length===0?`<div class="chat-no-msgs"><div style="font-size:2.5rem">👋</div><p>${currentLang==='ar'?'ابدأ المحادثة الآن!':'Start the conversation!'}</p></div>`:''}
    </div>
    <div class="chat-input-area">
      <button class="emoji-chat-btn" onclick="toggleChatEmoji()">😊</button>
      <input type="text" id="chat-input" class="glass-input" placeholder="${t('typeMsg')}" onkeydown="if(event.key==='Enter')sendMessage('${user.id}')"/>
      <button class="btn-send" onclick="sendMessage('${user.id}')">✈️</button>
    </div>
    <div class="emoji-picker hidden" id="chat-emoji-picker"></div>
  `;
  // Build chat emoji
  const cep = document.getElementById('chat-emoji-picker');
  EMOJI_LIST.forEach(em => { const s = document.createElement('span'); s.className = 'emoji-item'; s.textContent = em; s.onclick = () => { document.getElementById('chat-input').value += em; }; cep.appendChild(s); });

  renderChatMessages(user.id);
  updateBadges();
}

function toggleChatEmoji() {
  const p = document.getElementById('chat-emoji-picker');
  if (p) p.classList.toggle('hidden');
}

function renderChatMessages(userId) {
  const key = getChatKey(ME.id, userId);
  const msgs = DB.get(key) || [];
  const wrap = document.getElementById('chat-messages-wrap');
  if (!wrap) return;
  const noMsgsDiv = wrap.querySelector('.chat-no-msgs');
  if (msgs.length === 0) {
    if (!noMsgsDiv) wrap.innerHTML = `<div class="chat-no-msgs"><div style="font-size:2.5rem">👋</div><p>${currentLang==='ar'?'ابدأ المحادثة الآن!':'Start the conversation!'}</p></div>`;
    return;
  }
  if (noMsgsDiv) noMsgsDiv.remove();
  // Only render new messages
  const existing = wrap.querySelectorAll('.msg-row').length;
  if (existing === msgs.length) return;
  msgs.slice(existing).forEach(msg => {
    const isMine = msg.from === ME.id;
    const row = document.createElement('div');
    row.className = 'msg-row ' + (isMine ? 'mine' : 'theirs');
    // Image messages
    const imgHtml = msg.image
      ? `<img src="${msg.image}" style="max-width:220px;border-radius:10px;margin-top:4px;display:block;cursor:zoom-in" onclick="openLightbox('${msg.image}')"/>`
      : '';
    // Read receipt
    const receipt = isMine
      ? `<span class="msg-receipt">${msg.read ? '✓✓' : '✓'}</span>`
      : '';
    row.innerHTML = `
      <div class="msg-bubble ${isMine?'sent':'received'}">
        ${esc(msg.text)}${imgHtml}
      </div>
      <div class="msg-time">${timeAgo(msg.time)}${receipt}</div>
    `;
    wrap.appendChild(row);
  });
  wrap.scrollTop = wrap.scrollHeight;
}

function sendMessage(userId) {
  const input = document.getElementById('chat-input');
  const text = input?.value.trim();
  if (!text) return;
  const key = getChatKey(ME.id, userId);
  const msgs = DB.get(key) || [];
  msgs.push({ id: Date.now(), from: ME.id, text, time: new Date().toISOString(), read: false });
  DB.set(key, msgs);
  input.value = '';
  renderChatMessages(userId);
  updateConvInList(userId, text);
  // No auto-reply — real messages only
}

function updateConvInList(userId, lastText) {
  renderConversationsList();
}

function clearChat(userId) {
  DB.del(getChatKey(ME.id, userId));
  renderConversationsList();
  openChat({ id: userId, name: '', avatar: '👤', verified: false }, null);
}

function showNewChatModal() {
  const users = DB.get('wvx_users') || {};
  const others = Object.values(users).filter(u => u.username !== ME?.username);

  document.getElementById('modal-content').innerHTML = `
    <h3 class="modal-title">✏️ ${t('newChatTitle')}</h3>
    <input type="text" class="glass-input" placeholder="${t('searchUsers')}" oninput="filterModalUsers(this.value)" style="margin-bottom:14px;padding:12px 16px"/>
    <div id="modal-user-list" class="modal-user-list">
      ${!others.length
        ? `<p style="color:var(--text-muted);text-align:center;padding:20px">${t('noUsersFound')}</p>`
        : others.map(u => `
        <div class="modal-user-item" onclick="startChatWith('${u.id}','${esc(u.name)}','${esc(u.username)}','${u.avatar}',${u.verified})">
          <div class="modal-user-avatar" style="${u.avatar&&(u.avatar.startsWith('data:')||u.avatar.startsWith('http')||u.avatar.startsWith('assets/'))?'background:none;padding:0;overflow:hidden':''}">${u.avatar&&(u.avatar.startsWith('data:')||u.avatar.startsWith('http')||u.avatar.startsWith('assets/'))?'<img src="'+u.avatar+'" alt="av" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>':u.avatar}</div>
          <div>
            <div class="modal-user-name">${esc(u.name)}${u.verified?' <span class="badge-verified" style="font-size:0.7rem">✓</span>':''}</div>
            <div class="modal-user-handle">@${esc(u.username)}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  window._modalAllUsers = others;
  openModal();
}

function filterModalUsers(q) {
  const list = document.getElementById('modal-user-list');
  if (!list) return;
  const filtered = (window._modalAllUsers||[]).filter(u => u.name.toLowerCase().includes(q.toLowerCase()) || u.username.toLowerCase().includes(q.toLowerCase()));
  list.innerHTML = filtered.map(u => `
    <div class="modal-user-item" onclick="startChatWith('${u.id}','${esc(u.name)}','${esc(u.username)}','${u.avatar}',${u.verified})">
      <div class="modal-user-avatar">${u.avatar}</div>
      <div>
        <div class="modal-user-name">${esc(u.name)}${u.verified?' <span class="badge-verified" style="font-size:0.7rem">✓</span>':''}</div>
        <div class="modal-user-handle">@${esc(u.username)}</div>
      </div>
    </div>
  `).join('') || `<p style="color:var(--text-muted);text-align:center;padding:20px">${t('noUsersFound')}</p>`;
}

function startChatWith(id, name, username, avatar, verified) {
  closeModal();
  const users = DB.get('wvx_users') || {};
  const u = users[username];
  if (!u) return toast(currentLang==='ar'?'المستخدم غير موجود':'User not found', '❌');
  showPage('chat');
  setTimeout(() => { renderConversationsList(); openChat(u, null); }, 50);
}

function startChatPolling() {
  if (chatPollingTimer) clearInterval(chatPollingTimer);
  chatPollingTimer = setInterval(() => {
    if (activeChatId) renderChatMessages(activeChatId);
    updateBadges();
  }, 2000);
}

// ════════ NOTIFICATIONS ════════
function renderNotifications() {
  const list  = document.getElementById('notifications-list');
  const isAr  = currentLang === 'ar';
  if (!list) return;
  list.innerHTML = '';
  const icons = { like:'❤️', comment:'💬', follow:'👤', share:'🔁', verified:'🛡️', reaction:'🎉', mention:'📢', friend_req:'👥', friend_accept:'🎉' };

  const userNotifs = (DB.get('wvx_notifs_' + ME?.id) || []).slice().reverse();
  if (!userNotifs.length) {
    list.innerHTML = `<div class="empty-state-full"><div style="font-size:2.5rem">🔔</div><p style="color:var(--text-muted)">${isAr?'مفيش إشعارات':'No notifications'}</p></div>`;
    return;
  }

  // Mark as read
  DB.set('wvx_notif_unread_' + ME.id, 0);
  document.getElementById('notif-badge')?.classList.add('hidden');
  document.getElementById('mth-notif-badge')?.classList.add('hidden');

  userNotifs.forEach((n, i) => {
    const d = document.createElement('div');
    d.className = 'notif-item glass-card' + (i < 3 ? ' notif-new' : '');
    const avIsImg = n.avatar && (n.avatar.startsWith('data:')||n.avatar.startsWith('http')||n.avatar.startsWith('assets/'));
    const avHTML = avIsImg
      ? `<div class="notif-avatar" style="overflow:hidden;padding:0;background:none"><img src="${n.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/></div>`
      : `<div class="notif-avatar">${icons[n.type]||'🔔'}</div>`;

    // Friend request gets special buttons
    const friendReqBtns = n.type === 'friend_req' && n.fromId
      ? `<div style="display:flex;gap:6px;margin-top:8px">
          <button class="reg-follow-btn" onclick="acceptFriendRequest('${n.fromId}')" style="background:rgba(52,211,153,0.15);border-color:rgba(52,211,153,0.3);color:#34d399">${isAr?'قبول':'Accept'}</button>
          <button class="reg-follow-btn" onclick="declineFriendRequest('${n.fromId}')" style="color:var(--danger);border-color:rgba(248,113,113,0.3)">${isAr?'رفض':'Decline'}</button>
         </div>`
      : '';

    d.innerHTML = `
      ${avHTML}
      <div class="notif-body" style="flex:1;min-width:0">
        <div class="notif-text">${esc(n.text||'')}</div>
        <div class="notif-time">${timeAgo(n.time||new Date().toISOString())}</div>
        ${friendReqBtns}
      </div>
      ${i < 3 ? '<div class="notif-new-dot"></div>' : ''}
    `;
    if (n.postId) {
      d.style.cursor = 'pointer';
      d.onclick = () => { showPage('feed'); setTimeout(() => document.getElementById('post-'+n.postId)?.scrollIntoView({behavior:'smooth',block:'center'}), 300); };
    }
    list.appendChild(d);
  });
}

function clearAllNotifs() {
  document.getElementById('notifications-list').innerHTML = `<div class="empty-state-full"><div style="font-size:2.5rem">🔔</div><p style="color:var(--text-muted)">${currentLang==='ar'?'لا توجد إشعارات':'No notifications'}</p></div>`;
  toast(t('clearAll'), '✅');
}

function syncMoreMenuUser() {
  if (!ME) return;
  const nameEl   = document.getElementById('more-menu-name');
  const handleEl = document.getElementById('more-menu-handle');
  const avEl     = document.getElementById('more-menu-av');
  if (nameEl)   nameEl.textContent   = ME.name || '';
  if (handleEl) handleEl.textContent = '@' + (ME.username || '');
  if (avEl) {
    avEl.innerHTML = '';
    renderAvatar(ME.avatar, 38, avEl);
  }
}

function updateBadges() {
  // Notif badge (sidebar + header + mobile top header)
  const notifBadge    = document.getElementById('notif-badge');
  const notifHdrBadge = document.getElementById('notif-header-badge');
  const mthBadge      = document.getElementById('mth-notif-badge');
  const unreadNotifs  = (DB.get('wvx_notif_unread_' + ME.id) || 0);
  if (unreadNotifs > 0) {
    const txt = unreadNotifs > 99 ? '99+' : String(unreadNotifs);
    if (notifBadge)    { notifBadge.textContent = txt;    notifBadge.classList.remove('hidden'); }
    if (notifHdrBadge) { notifHdrBadge.textContent = txt; notifHdrBadge.classList.remove('hidden'); }
    if (mthBadge)      { mthBadge.textContent = txt;      mthBadge.classList.remove('hidden'); }
  } else {
    if (notifBadge)    notifBadge.classList.add('hidden');
    if (notifHdrBadge) notifHdrBadge.classList.add('hidden');
    if (mthBadge)      mthBadge.classList.add('hidden');
  }
  // Chat unread (sidebar + header)
  let totalUnread = 0;
  const users = DB.get('wvx_users') || {};
  Object.values(users).forEach(u => {
    if (u.id === ME.id) return;
    const msgs = DB.get(getChatKey(ME.id, u.id)) || [];
    totalUnread += msgs.filter(m => m.from !== ME.id && !m.read).length;
  });
  const chatBadge    = document.getElementById('chat-badge');
  const chatHdrBadge = document.getElementById('chat-header-badge');
  const mthChatBadge = document.getElementById('mth-chat-badge');
  if (totalUnread > 0) {
    const txt = totalUnread > 99 ? '99+' : String(totalUnread);
    if (chatBadge)    { chatBadge.textContent = txt;    chatBadge.classList.remove('hidden'); }
    if (chatHdrBadge) { chatHdrBadge.textContent = txt; chatHdrBadge.classList.remove('hidden'); }
    if (mthChatBadge) { mthChatBadge.textContent = txt; mthChatBadge.classList.remove('hidden'); }
  } else {
    if (chatBadge)    chatBadge.classList.add('hidden');
    if (chatHdrBadge) chatHdrBadge.classList.add('hidden');
    if (mthChatBadge) mthChatBadge.classList.add('hidden');
  }
}

// ════════ RIGHT PANEL ════════
function renderRightPanel() {
  renderFriendSuggestions();
  renderTrends();
}

function renderFriendSuggestions() {
  const container = document.getElementById('friend-suggestions');
  container.innerHTML = '';
  const users = DB.get('wvx_users') || {};
  const followed = DB.get('wvx_followed') || {};
  const others = Object.values(users).filter(u => u.username !== ME?.username).slice(0, 4);
  if (!others.length) {
    container.innerHTML = `<p class="widget-empty">${currentLang==='ar'?'لا يوجد مستخدمون بعد':'No users yet'}</p>`;
    return;
  }
  others.forEach(u => {
    const isF = !!followed[u.id];
    const d = document.createElement('div');
    d.className = 'sug-item';
    const sugAvIsImg = u.avatar && (u.avatar.startsWith('data:')||u.avatar.startsWith('http')||u.avatar.startsWith('assets/'));
    const sugAvInner = sugAvIsImg
      ? `<img src="${u.avatar}" alt="av" style="width:34px;height:34px;border-radius:50%;object-fit:cover;display:block;flex-shrink:0"/>`
      : `<span style="font-size:1rem">${esc(u.avatar||'👤')}</span>`;
    d.innerHTML = `
      <div class="sug-avatar${sugAvIsImg?' sug-avatar-img':''}" style="${sugAvIsImg?'background:none;overflow:hidden;padding:0':''}">
        ${sugAvInner}${u.verified?'<span class="sug-verified">✓</span>':''}
      </div>
      <div class="sug-info" style="cursor:pointer" onclick="openUserProfile('${u.id}')">
        <div class="sug-name">${esc(u.name)}${u.verified?'<span class="badge-verified" style="font-size:.6rem;margin-inline-start:3px">✓</span>':''}</div>
        <div class="sug-mutual">@${esc(u.username)}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:4px;align-items:center">
        <button class="btn-follow-sm${isF?' following':''}" onclick="toggleFollow('${u.id}',this)">${isF?'✓':'+'}</button>
      </div>
    `;
    container.appendChild(d);
  });
}

function renderTrends() {
  const list = document.getElementById('trend-list');
  list.innerHTML = '';
  TRENDS.forEach(t => {
    const d = document.createElement('div');
    d.className = 'trend-item';
    d.innerHTML = `<div class="trend-cat">${t.cat}</div><div class="trend-tag">${t.tag}</div><div class="trend-count">${t.count} ${currentLang==='ar'?'منشور':'posts'}</div>`;
    list.appendChild(d);
  });
}

// ════════ VERIFICATION ════════
function applyVerification() {
  document.getElementById('modal-content').innerHTML = `
    <h3 class="modal-title">🛡️ ${t('verificationApply')}</h3>
    <div class="verif-modal-body">
      <div class="verif-badge-preview"><span class="badge-verified" style="font-size:1.2rem">✓</span></div>
      <p class="verif-desc">${t('verifModalDesc')}</p>
      <div class="verif-reqs">
        <strong>${t('verifRequirements')}</strong>
        <p>${t('verifReq1')}</p>
        <p>${t('verifReq2')}</p>
        <p>${t('verifReq3')}</p>
      </div>
    </div>
    <button class="btn-primary" onclick="submitVerif()" style="margin-top:16px">${t('submitApplication')}</button>
  `;
  openModal();
}

function submitVerif() {
  closeModal();
  toast(t('verifApplied'), '🛡️');
  const notifs = DB.get('wvx_notifs_' + ME.id) || [];
  notifs.push({ text: currentLang==='ar'?'تم استلام طلب التوثيق! سيتم مراجعته قريباً 🛡️':'Verification request received! Will be reviewed soon 🛡️', time: new Date().toISOString() });
  DB.set('wvx_notifs_' + ME.id, notifs);
}

// ════════ MODAL ════════
function openModal(html) {
  const mc = document.getElementById('modal-content');
  if (html !== undefined && mc) mc.innerHTML = html;
  document.getElementById('modal-overlay').classList.remove('hidden');
  // Reset modal size (story viewer may have changed it)
  const modal = document.querySelector('.modal');
  if (modal) { modal.style.padding = ''; modal.style.overflow = ''; modal.style.maxWidth = ''; }
}
function closeModal() { document.getElementById('modal-overlay').classList.add('hidden'); }
function handleModalOverlayClick(e) { if (e.target === document.getElementById('modal-overlay')) closeModal(); }

// ════════ LIGHTBOX ════════
function openLightbox(src) {
  // src might be truncated — find full src from DOM
  const imgs = document.querySelectorAll('.post-image');
  let fullSrc = src;
  imgs.forEach(img => { if (img.src && img.src.substring(0,50) === src.substring(0,50)) fullSrc = img.src; });
  document.getElementById('lightbox-img').src = fullSrc;
  document.getElementById('lightbox').classList.remove('hidden');
}
function closeLightbox() { document.getElementById('lightbox').classList.add('hidden'); }

// ════════ TOAST ════════
function toast(msg, icon = '✨') {
  const el = document.getElementById('toast');
  el.innerHTML = icon + ' ' + msg;
  el.classList.remove('hidden');
  el.classList.add('show');
  clearTimeout(window._toastT);
  window._toastT = setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.classList.add('hidden'), 350); }, 3000);
}

// ════════ UTILITIES ════════
function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff/1000), m = Math.floor(s/60), h = Math.floor(m/60), d = Math.floor(h/24);
  const ago = currentLang === 'ar' ? 'منذ ' : '';
  const suffix = currentLang === 'en' ? ' ago' : '';
  if (s < 10) return t('justNow');
  if (m < 1) return ago + s + (currentLang==='ar'?' ث':' s') + suffix;
  if (m < 60) return ago + m + ' ' + (m===1?t('minAgo'):t('minsAgo')) + suffix;
  if (h < 24) return ago + h + ' ' + (h===1?t('hourAgo'):t('hoursAgo')) + suffix;
  return ago + d + ' ' + (d===1?t('dayAgo'):t('daysAgo')) + suffix;
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeLightbox(); closeAllMenus(); } });

// ════════════════════════════════════════════════
//  🛒 MARKETPLACE
// ════════════════════════════════════════════════
let marketTab = 'all';
let marketImg  = null;

function switchMarketTab(tab, btn) {
  marketTab = tab;
  document.querySelectorAll('#page-market .tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderMarket();
}

function previewMarketImg(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    marketImg = e.target.result;
    const wrap = document.getElementById('market-img-preview-wrap');
    const img  = document.getElementById('market-img-preview');
    img.src    = marketImg;
    wrap.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

function removeMarketImg() {
  marketImg = null;
  document.getElementById('market-img-preview-wrap').classList.add('hidden');
  document.getElementById('market-img-input').value = '';
}

function postMarketItem() {
  const title    = document.getElementById('market-title').value.trim();
  const desc     = document.getElementById('market-desc').value.trim();
  const price    = document.getElementById('market-price').value.trim();
  const currency = document.getElementById('market-currency').value;
  const type     = document.getElementById('market-type').value;
  if (!title || !price) { showToast(t('fillMarketFields')); return; }

  const items = DB.get('wvx_market') || [];
  const item = {
    id: Date.now(), authorId: ME.id, authorName: ME.name,
    authorAvatar: ME.avatar, verified: ME.verified,
    title, desc, price, currency, type,
    image: marketImg || null,
    createdAt: new Date().toISOString(),
    saved: [],
  };
  items.unshift(item);
  DB.set('wvx_market', items);

  document.getElementById('market-title').value  = '';
  document.getElementById('market-desc').value   = '';
  document.getElementById('market-price').value  = '';
  removeMarketImg();
  showToast(t('marketItemPosted'));
  renderMarket();
}

function renderMarket() {
  const container = document.getElementById('market-items-container');
  let items = DB.get('wvx_market') || [];
  if (marketTab === 'sell') items = items.filter(i => i.type === 'sell');
  if (marketTab === 'buy')  items = items.filter(i => i.type === 'buy');

  if (!items.length) {
    container.innerHTML = `<div class="empty-state-full"><div style="font-size:3rem">🛒</div><p style="color:var(--text-muted);margin-top:8px">${t('noMarketItems')}</p></div>`;
    return;
  }
  container.innerHTML = items.map(item => {
    const avH = item.authorAvatar && (item.authorAvatar.startsWith('data:')||item.authorAvatar.startsWith('http')||item.authorAvatar.startsWith('assets/'))
      ? `<div class="post-avatar" style="overflow:hidden;padding:0"><img src="${item.authorAvatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/></div>`
      : `<div class="post-avatar">${item.authorAvatar || '👤'}</div>`;
    const isSaved = (item.saved || []).includes(ME.id);
    const typeTag = item.type === 'sell'
      ? `<span class="market-type-tag sell" data-i18n="forSale">${t('forSale')}</span>`
      : `<span class="market-type-tag buy" data-i18n="wanted">${t('wanted')}</span>`;
    const priceDisplay = item.type === 'sell'
      ? `<span class="market-price-tag">${item.price} ${item.currency}</span>` : '';
    return `<div class="post-card glass-card market-card">
      <div class="post-header">
        ${avH}
        <div class="post-user-info">
          <div class="post-username">${esc(item.authorName)}${item.verified ? '<span class="badge-verified">✓</span>' : ''}</div>
          <div class="post-time">${timeAgo(item.createdAt)}</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;margin-inline-start:auto">
          ${typeTag}
          ${priceDisplay}
        </div>
      </div>
      <div class="market-item-title">${esc(item.title)}</div>
      ${item.desc ? `<div class="post-content" style="margin-bottom:10px">${esc(item.desc)}</div>` : ''}
      ${item.image ? `<img src="${item.image}" class="post-image" onclick="openLightbox('${item.image}')" alt=""/>` : ''}
      <div class="post-actions" style="margin-top:10px">
        <button class="action-btn" onclick="saveMarketItem(${item.id})">${isSaved ? '🔖' : '📌'} <span>${isSaved ? t('unsavePost') : t('savePost')}</span></button>
        <button class="action-btn" onclick="contactMarketSeller('${item.authorId}')">💬 <span>${t('contactSeller')}</span></button>
      </div>
    </div>`;
  }).join('');
  // Set avatar for creator
  const av = document.getElementById('market-creator-avatar');
  if (av) { av.innerHTML = ''; renderAvatar(ME.avatar, 42, av); }
}

function saveMarketItem(id) {
  const items = DB.get('wvx_market') || [];
  const item  = items.find(i => i.id === id);
  if (!item) return;
  item.saved = item.saved || [];
  const idx  = item.saved.indexOf(ME.id);
  if (idx === -1) item.saved.push(ME.id);
  else item.saved.splice(idx, 1);
  DB.set('wvx_market', items);
  renderMarket();
  showToast(t('itemSavedToBookmarks'));
}

function contactMarketSeller(sellerId) {
  startChatWith(sellerId);
  showPage('chat');
}

// ════════════════════════════════════════════════
//  🎬 VIDEOS
// ════════════════════════════════════════════════
let videoTab = 'all';
let pendingVideoAttach = null;

function switchVideoTab(tab, btn) {
  videoTab = tab;
  document.querySelectorAll('#page-videos .tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderVideos();
}

function handleVideoFile(input) {
  const file = input.files[0];
  if (!file) return;
  const url  = URL.createObjectURL(file);
  pendingVideoAttach = { type: 'file', url, name: file.name };
  const wrap = document.getElementById('video-attach-preview');
  wrap.innerHTML = `🎬 ${esc(file.name)} (${(file.size/1024/1024).toFixed(1)} MB)`;
  wrap.classList.remove('hidden');
}

function showYoutubeModal() {
  openModal(`
    <div class="modal-title">▶️ ${t('addYoutubeLink')}</div>
    <div class="input-group">
      <input type="url" id="yt-url-input" class="glass-input" placeholder="https://youtube.com/watch?v=..." style="padding:12px 14px"/>
    </div>
    <button class="btn-primary" onclick="applyYoutubeLink()" style="margin-top:4px">${t('add') || 'إضافة'}</button>
  `);
}

function applyYoutubeLink() {
  const url = document.getElementById('yt-url-input').value.trim();
  if (!url) return;
  const ytId = extractYoutubeId(url);
  if (!ytId) { showToast('رابط يوتيوب غير صحيح'); return; }
  pendingVideoAttach = { type: 'youtube', url, id: ytId };
  const wrap = document.getElementById('video-attach-preview');
  wrap.innerHTML = `▶️ YouTube: <a href="${url}" style="color:var(--accent)" target="_blank">${url}</a>`;
  wrap.classList.remove('hidden');
  closeModal();
}

function extractYoutubeId(url) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return m ? m[1] : null;
}

function postVideo() {
  const title = document.getElementById('video-title').value.trim();
  const desc  = document.getElementById('video-desc').value.trim();
  if (!title) { showToast(t('fillVideoFields')); return; }
  if (!pendingVideoAttach) { showToast('أضف فيديو أو رابط يوتيوب'); return; }

  const videos = DB.get('wvx_videos') || [];
  videos.unshift({
    id: Date.now(), authorId: ME.id, authorName: ME.name,
    authorAvatar: ME.avatar, verified: ME.verified,
    title, desc, attach: pendingVideoAttach,
    likes: 0, likedBy: [], views: 0,
    createdAt: new Date().toISOString(),
  });
  DB.set('wvx_videos', videos);
  document.getElementById('video-title').value = '';
  document.getElementById('video-desc').value  = '';
  document.getElementById('video-attach-preview').classList.add('hidden');
  document.getElementById('video-file-input').value = '';
  pendingVideoAttach = null;
  showToast(t('videoPosted'));
  renderVideos();
}

function renderVideos() {
  const container = document.getElementById('videos-container');
  let videos = DB.get('wvx_videos') || [];
  if (videoTab === 'mine') videos = videos.filter(v => v.authorId === ME.id);

  if (!videos.length) {
    container.innerHTML = `<div class="empty-state-full"><div style="font-size:3rem">🎬</div><p style="color:var(--text-muted);margin-top:8px">${t('noVideos')}</p></div>`;
    return;
  }
  container.innerHTML = videos.map(v => {
    const avH = v.authorAvatar && (v.authorAvatar.startsWith('data:')||v.authorAvatar.startsWith('http')||v.authorAvatar.startsWith('assets/'))
      ? `<div class="post-avatar" style="overflow:hidden;padding:0"><img src="${v.authorAvatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/></div>`
      : `<div class="post-avatar">${v.authorAvatar || '👤'}</div>`;
    const isLiked = (v.likedBy || []).includes(ME.id);
    let mediaH = '';
    if (v.attach?.type === 'youtube') {
      mediaH = `<div class="video-embed-wrap"><iframe src="https://www.youtube.com/embed/${v.attach.id}" frameborder="0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen class="video-embed"></iframe></div>`;
    } else if (v.attach?.type === 'file') {
      mediaH = `<video controls class="video-file-player"><source src="${v.attach.url}"/></video>`;
    }
    // Track view when video plays
    const vidPlayAttr = v.attach?.type === 'file'
      ? `onplay="incrementVideoView(${v.id})"`
      : '';
    if (v.attach?.type === 'file') {
      mediaH = `<video controls class="video-file-player" ${vidPlayAttr}><source src="${v.attach.url}"/></video>`;
    }
    return `<div class="post-card glass-card">
      <div class="post-header">
        ${avH}
        <div class="post-user-info">
          <div class="post-username">${esc(v.authorName)}${v.verified ? '<span class="badge-verified">✓</span>' : ''}</div>
          <div class="post-time">${timeAgo(v.createdAt)}</div>
        </div>
        ${v.authorId === ME.id ? `<button class="post-menu-btn" onclick="deleteVideo(${v.id})" title="حذف">🗑️</button>` : ''}
      </div>
      <div class="market-item-title" style="margin-bottom:8px">${esc(v.title)}</div>
      ${v.desc ? `<div class="post-content" style="margin-bottom:10px">${esc(v.desc)}</div>` : ''}
      ${mediaH}
      <div class="post-actions" style="margin-top:10px">
        <button class="action-btn ${isLiked ? 'has-reaction' : ''}" onclick="likeVideo(${v.id})">❤️ <span>${v.likes || 0}</span></button>
        <button class="action-btn">👁️ <span id="vviews-${v.id}">${v.views || 0}</span></button>
        <button class="action-btn" onclick="shareVideoFn(${v.id})">📤 <span>${t('sharePost')}</span></button>
      </div>
    </div>`;
  }).join('');
  const av = document.getElementById('video-creator-avatar');
  if (av) { av.innerHTML = ''; renderAvatar(ME.avatar, 42, av); }
}

function likeVideo(id) {
  const videos = DB.get('wvx_videos') || [];
  const v      = videos.find(x => x.id === id);
  if (!v) return;
  v.likedBy = v.likedBy || [];
  const idx  = v.likedBy.indexOf(ME.id);
  if (idx === -1) { v.likedBy.push(ME.id); v.likes = (v.likes || 0) + 1; }
  else            { v.likedBy.splice(idx, 1); v.likes = Math.max(0, (v.likes || 1) - 1); }
  DB.set('wvx_videos', videos);
  renderVideos();
}

function incrementVideoView(id) {
  const videos = DB.get('wvx_videos') || [];
  const v      = videos.find(x => x.id === id);
  if (!v) return;
  // Count each user once per session
  v.viewedBy = v.viewedBy || [];
  if (v.viewedBy.includes(ME.id)) return;
  v.viewedBy.push(ME.id);
  v.views = (v.views || 0) + 1;
  DB.set('wvx_videos', videos);
  const el = document.getElementById('vviews-' + id);
  if (el) el.textContent = v.views;
}

function deleteVideo(id) {
  if (!confirm(currentLang==='ar'?'حذف الفيديو؟':'Delete video?')) return;
  const videos = (DB.get('wvx_videos') || []).filter(v => v.id !== id);
  DB.set('wvx_videos', videos);
  renderVideos();
  showToast(currentLang==='ar'?'تم حذف الفيديو':'Video deleted', '🗑️');
}

function shareVideoFn(id) {
  const videos = DB.get('wvx_videos') || [];
  const v      = videos.find(x => x.id === id);
  if (!v) return;
  if (navigator.share) {
    navigator.share({ title: v.title, text: v.desc || '', url: window.location.href })
      .catch(() => {});
  } else {
    navigator.clipboard?.writeText(window.location.href);
    showToast(currentLang==='ar'?'تم نسخ الرابط':'Link copied', '🔗');
  }
}

// ════════════════════════════════════════════════
//  👥 GROUPS
// ════════════════════════════════════════════════
function showCreateGroupModal() {
  openModal(`
    <div class="modal-title">👥 ${t('createGroup')}</div>
    <label class="field-label">${t('groupName')}</label>
    <div class="input-group"><input type="text" id="new-group-name" class="glass-input" placeholder="${t('groupName')}" style="padding:12px 14px"/></div>
    <label class="field-label" style="margin-top:10px">${t('groupDesc')}</label>
    <div class="input-group"><textarea id="new-group-desc" class="glass-input post-textarea" rows="2" placeholder="${t('groupDesc')}" style="min-height:60px"></textarea></div>
    <div style="display:flex;gap:8px;margin-top:6px">
      <button class="btn-primary" onclick="createGroup()" style="flex:1">${t('createGroup')}</button>
    </div>
  `);
}

function createGroup() {
  const name = document.getElementById('new-group-name').value.trim();
  const desc = document.getElementById('new-group-desc').value.trim();
  if (!name) { showToast(t('fillAll')); return; }
  const groups = DB.get('wvx_groups') || [];
  groups.unshift({
    id: Date.now(), name, desc,
    creatorId: ME.id, members: [ME.id],
    avatar: '👥', createdAt: new Date().toISOString(),
  });
  DB.set('wvx_groups', groups);
  closeModal();
  renderGroups();
  showToast('✅ تم إنشاء المجموعة!');
}

function renderGroups() {
  const container = document.getElementById('groups-container');
  const groups    = DB.get('wvx_groups') || [];
  if (!groups.length) {
    container.innerHTML = `<div class="empty-state-full"><div style="font-size:3rem">👥</div><h3 data-i18n="noGroups">${t('noGroups')}</h3><p style="color:var(--text-muted);margin-top:6px;font-size:.88rem">${t('createGroupHint')}</p><button class="btn-primary" style="margin-top:16px;max-width:200px" onclick="showCreateGroupModal()"><span>${t('createGroup')}</span></button></div>`;
    return;
  }
  container.innerHTML = `<div class="users-grid" style="margin-top:4px">${groups.map(g => {
    const isMember = g.members.includes(ME.id);
    return `<div class="glass-card user-card" style="padding:16px;text-align:center">
      <div style="font-size:2.8rem;margin-bottom:8px">${g.avatar}</div>
      <div style="font-weight:700;font-size:.95rem;margin-bottom:4px">${esc(g.name)}</div>
      ${g.desc ? `<div style="font-size:.8rem;color:var(--text-muted);margin-bottom:8px">${esc(g.desc)}</div>` : ''}
      <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:10px">${g.members.length} ${currentLang === 'ar' ? 'عضو' : 'members'}</div>
      <div style="display:flex;gap:6px;justify-content:center">
        <button class="btn-follow-sm" onclick="openGroup(${g.id})" style="background:rgba(110,231,247,0.1);border-color:rgba(110,231,247,0.3)">
          ${currentLang==='ar'?'فتح':'Open'}
        </button>
        <button class="btn-follow-sm ${isMember ? 'following' : ''}" onclick="event.stopPropagation();toggleGroupMembership(${g.id})">
          ${isMember ? (currentLang === 'ar' ? 'عضو ✓' : 'Member ✓') : (currentLang === 'ar' ? 'انضم' : 'Join')}
        </button>
      </div>
    </div>`;
  }).join('')}</div>`;
}

function toggleGroupMembership(id) {
  const groups = DB.get('wvx_groups') || [];
  const g      = groups.find(x => x.id === id);
  if (!g) return;
  const idx = g.members.indexOf(ME.id);
  if (idx === -1) g.members.push(ME.id);
  else g.members.splice(idx, 1);
  DB.set('wvx_groups', groups);
  renderGroups();
}

function openGroup(id) {
  const groups = DB.get('wvx_groups') || [];
  const g      = groups.find(x => x.id === id);
  if (!g) return;
  const isAr    = currentLang === 'ar';
  const isMember = g.members.includes(ME.id);
  const posts   = (DB.get('wvx_group_posts_' + id) || []);

  openModal(`
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
      <div style="font-size:2.2rem">${g.avatar}</div>
      <div>
        <div style="font-weight:800;font-size:1.1rem">${esc(g.name)}</div>
        <div style="font-size:.78rem;color:var(--text-muted)">${g.members.length} ${isAr?'عضو':'members'}</div>
      </div>
    </div>
    ${g.desc ? `<p style="color:var(--text-sub);font-size:.85rem;margin-bottom:14px">${esc(g.desc)}</p>` : ''}
    ${isMember ? `
    <div style="display:flex;gap:8px;margin-bottom:12px">
      <textarea id="group-post-text" class="glass-input" rows="2" placeholder="${isAr?'اكتب في المجموعة...':'Write in group...'}" style="flex:1;resize:none;padding:10px 12px"></textarea>
      <button class="btn-post" onclick="postInGroup(${id})" style="align-self:flex-end">${isAr?'نشر':'Post'}</button>
    </div>` : ''}
    <div id="group-feed-${id}" style="max-height:360px;overflow-y:auto;display:flex;flex-direction:column;gap:10px">
      ${posts.length ? posts.slice().reverse().map(p => `
        <div class="glass-card" style="padding:12px">
          <div style="font-weight:700;font-size:.85rem;margin-bottom:4px">${esc(p.authorName)}</div>
          <div style="font-size:.88rem;line-height:1.6">${esc(p.text)}</div>
          <div style="font-size:.7rem;color:var(--text-muted);margin-top:6px">${timeAgo(p.createdAt)}</div>
        </div>`).join('') :
        `<div style="text-align:center;padding:24px;color:var(--text-muted)">${isAr?'لا توجد منشورات بعد':'No posts yet'}</div>`
      }
    </div>
  `);
}

function postInGroup(groupId) {
  const text = document.getElementById('group-post-text')?.value.trim();
  if (!text) return;
  const posts = DB.get('wvx_group_posts_' + groupId) || [];
  posts.push({ id: Date.now(), authorId: ME.id, authorName: ME.name, text, createdAt: new Date().toISOString() });
  DB.set('wvx_group_posts_' + groupId, posts);
  showToast(currentLang==='ar'?'تم النشر في المجموعة ✅':'Posted in group ✅');
  closeModal();
  openGroup(groupId);
}

function showFollowListModal(type) {
  const isAr      = currentLang === 'ar';
  const followedMap = DB.get('wvx_followed') || {};
  const allUsers  = Object.values(DB.get('wvx_users') || {});
  let list = [];

  if (type === 'following') {
    list = allUsers.filter(u => followedMap[u.id]);
  } else {
    list = allUsers.filter(u => {
      const theirFollowed = DB.get('wvx_followed_' + u.id) || {};
      return theirFollowed[ME.id];
    });
  }

  const title = type === 'following'
    ? (isAr ? 'يتابعهم' : 'Following')
    : (isAr ? 'المتابعون' : 'Followers');

  openModal(`
    <div class="modal-title">${title} (${list.length})</div>
    <div style="max-height:380px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;margin-top:12px">
      ${list.length ? list.map(u => {
        const avIsImg = u.avatar && (u.avatar.startsWith('data:')||u.avatar.startsWith('http')||u.avatar.startsWith('assets/'));
        const avHTML  = avIsImg
          ? `<div style="width:40px;height:40px;border-radius:50%;overflow:hidden;flex-shrink:0"><img src="${u.avatar}" style="width:100%;height:100%;object-fit:cover"/></div>`
          : `<div style="width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0">${u.avatar||'👤'}</div>`;
        const isFollowing = followedMap[u.id];
        return `<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:12px;background:rgba(255,255,255,.04)">
          ${avHTML}
          <div style="flex:1;min-width:0">
            <div style="font-weight:700;font-size:.9rem">${esc(u.name)}${u.verified?'<span class="badge-verified" style="width:13px;height:13px;font-size:.6rem">✓</span>':''}</div>
            <div style="font-size:.75rem;color:var(--text-muted)">@${esc(u.username)}</div>
          </div>
          <button class="btn-follow-sm${isFollowing?' following':''}" onclick="toggleFollow('${u.id}',this)">
            ${isFollowing?(isAr?'يتابع':'Following'):(isAr?'متابعة':'Follow')}
          </button>
        </div>`;
      }).join('') : `<p style="text-align:center;color:var(--text-muted);padding:24px">${isAr?'لا يوجد':'None yet'}</p>`}
    </div>
  `);
}

// ── Notification Sound ──
function playNotifSound() {
  try {
    const ctx  = getAudioCtx();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(); osc.stop(ctx.currentTime + 0.4);
  } catch(e) {}
}

// ════════════════════════════════════════════════
//  🔖 SAVED POSTS
// ════════════════════════════════════════════════
function toggleSavePost(postId) {
  const saved = DB.get('wvx_saved_' + ME.id) || [];
  const idx   = saved.indexOf(postId);
  if (idx === -1) {
    saved.push(postId);
    showToast(t('itemSavedToBookmarks'));
  } else {
    saved.splice(idx, 1);
    showToast(t('unsavePost'));
  }
  DB.set('wvx_saved_' + ME.id, saved);
  if (document.getElementById('page-saved').classList.contains('active')) renderSaved();
}

function renderSaved() {
  const container = document.getElementById('saved-container');
  const savedIds  = DB.get('wvx_saved_' + ME.id) || [];
  const allPosts  = DB.get('wvx_posts') || [];
  const posts     = allPosts.filter(p => savedIds.includes(p.id));
  if (!posts.length) {
    container.innerHTML = `<div class="empty-state-full"><div style="font-size:3rem">🔖</div><p style="color:var(--text-muted);margin-top:8px">${t('noSaved')}</p></div>`;
    return;
  }
  container.innerHTML = '';
  posts.forEach(p => container.appendChild(buildPostCard(p)));
}

// ════════════════════════════════════════════════
//  ⚙️ SETTINGS — Theme, Accent, Font, Lang
// ════════════════════════════════════════════════

// ── THEME ──
const THEMES = {
  dark: {
    '--bg-from':    '#07071a',
    '--bg-mid':     '#0b1828',
    '--bg-to':      '#160a2a',
    '--glass':      'rgba(255,255,255,0.08)',
    '--glass-md':   'rgba(255,255,255,0.12)',
    '--glass-lg':   'rgba(255,255,255,0.16)',
    '--border':     'rgba(255,255,255,0.18)',
    '--text':       'rgba(255,255,255,0.95)',
    '--text-sub':   'rgba(255,255,255,0.65)',
    '--text-muted': 'rgba(255,255,255,0.38)',
    '--sidebar-bg': 'rgba(255,255,255,0.045)',
    logoSrc: 'assets/images/logo.svg',
    logoIconSrc: 'assets/images/logo-icon.svg',
  },
  light: {
    '--bg-from':    '#e8f0fe',
    '--bg-mid':     '#f0e8ff',
    '--bg-to':      '#ffe8f5',
    '--glass':      'rgba(255,255,255,0.65)',
    '--glass-md':   'rgba(255,255,255,0.75)',
    '--glass-lg':   'rgba(255,255,255,0.88)',
    '--border':     'rgba(0,0,0,0.10)',
    '--text':       'rgba(10,10,30,0.92)',
    '--text-sub':   'rgba(10,10,30,0.60)',
    '--text-muted': 'rgba(10,10,30,0.38)',
    '--sidebar-bg': 'rgba(255,255,255,0.55)',
    logoSrc: 'assets/images/logo-light.svg',
    logoIconSrc: 'assets/images/logo-icon-light.svg',
  },
};

// ── ACCENT COLORS ──
const ACCENTS = {
  cyan:   { '--accent': '#6ee7f7', '--accent2': '#a78bfa', '--accent3': '#f472b6' },
  pink:   { '--accent': '#f472b6', '--accent2': '#a78bfa', '--accent3': '#6ee7f7' },
  green:  { '--accent': '#34d399', '--accent2': '#6ee7f7', '--accent3': '#a78bfa' },
  orange: { '--accent': '#fb923c', '--accent2': '#f472b6', '--accent3': '#a78bfa' },
  indigo: { '--accent': '#818cf8', '--accent2': '#6ee7f7', '--accent3': '#f472b6' },
};

function applyTheme(themeName) {
  const theme = THEMES[themeName] || THEMES.dark;
  const root  = document.documentElement;
  Object.entries(theme).forEach(([k, v]) => {
    if (k.startsWith('--')) root.style.setProperty(k, v);
  });
  // Background orbs
  const bg = document.querySelector('.bg-scene');
  if (bg) bg.style.background = `linear-gradient(135deg, ${theme['--bg-from']} 0%, ${theme['--bg-mid']} 50%, ${theme['--bg-to']} 100%)`;
  document.documentElement.setAttribute('data-theme', themeName);

  // Switch logos
  const authLogo    = document.querySelector('.logo-svg-full');
  const sidebarIcon = document.querySelector('.sidebar-logo-img');
  if (authLogo)    authLogo.src    = theme.logoSrc;
  if (sidebarIcon) sidebarIcon.src = theme.logoIconSrc;

  // Scrollbar color
  const isLight = themeName === 'light';
  document.body.classList.toggle('theme-light', isLight);
}

function applyAccent(accentName) {
  const accent = ACCENTS[accentName] || ACCENTS.cyan;
  const root   = document.documentElement;
  Object.entries(accent).forEach(([k, v]) => root.style.setProperty(k, v));
}

function setTheme(themeName) {
  DB.set('wvx_theme', themeName);
  applyTheme(themeName);
  // Update Settings UI
  document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('theme-btn-' + themeName);
  if (btn) btn.classList.add('active');
  const icon = document.getElementById('theme-icon');
  const sub  = document.getElementById('theme-sub-label');
  if (icon) icon.textContent = themeName === 'dark' ? '🌙' : '☀️';
  if (sub)  sub.textContent  = t(themeName === 'dark' ? 'darkMode' : 'lightMode');
}

function setAccent(accentName) {
  DB.set('wvx_accent', accentName);
  applyAccent(accentName);
  document.querySelectorAll('.accent-dot').forEach(d => {
    d.classList.toggle('active', d.getAttribute('data-accent') === accentName);
  });
}

function setFontSize(size) {
  const sizes = { small: '14px', medium: '16px', large: '18px' };
  document.documentElement.style.fontSize = sizes[size] || '16px';
  DB.set('wvx_font_size', size);
  document.querySelectorAll('.font-sz-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('fs-' + size);
  if (btn) btn.classList.add('active');
}

function saveNotifPref(key, val) {
  const prefs = DB.get('wvx_notif_prefs') || {};
  prefs[key] = val;
  DB.set('wvx_notif_prefs', prefs);
  showToast(t('settingsSaved'));
}

function loadSettings() {
  const theme  = DB.get('wvx_theme')       || 'dark';
  const accent = DB.get('wvx_accent')      || 'cyan';
  const fs     = DB.get('wvx_font_size')   || 'medium';
  const prefs  = DB.get('wvx_notif_prefs') || {};

  // ── Theme ──
  document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
  const tb = document.getElementById('theme-btn-' + theme);
  if (tb) tb.classList.add('active');
  const icon = document.getElementById('theme-icon');
  const sub  = document.getElementById('theme-sub-label');
  if (icon) icon.textContent = theme === 'dark' ? '🌙' : '☀️';
  if (sub)  sub.setAttribute('data-i18n', theme === 'dark' ? 'darkMode' : 'lightMode');
  if (sub)  sub.textContent = t(theme === 'dark' ? 'darkMode' : 'lightMode');

  // ── Accent ──
  document.querySelectorAll('.accent-dot').forEach(d => {
    d.classList.toggle('active', d.getAttribute('data-accent') === accent);
  });

  // ── Font size ──
  document.querySelectorAll('.font-sz-btn').forEach(b => b.classList.remove('active'));
  const fb = document.getElementById('fs-' + fs);
  if (fb) fb.classList.add('active');
  // Apply saved font size
  const fsSizes = { xs:'12px', small:'14px', medium:'16px', large:'18px', xl:'20px' };
  document.documentElement.style.fontSize = fsSizes[fs] || '16px';

  // ── DND ──
  const dndActive = DB.get('wvx_dnd') === true;
  const dndChk    = document.getElementById('notif-dnd');
  if (dndChk) dndChk.checked = dndActive;
  applyDNDState(dndActive, false); // apply visual without saving

  // ── Per-type notif checkboxes ──
  ['likes','comments','followers','messages'].forEach(k => {
    const el = document.getElementById('notif-' + k);
    if (el) el.checked = prefs[k] !== false;
  });

  // ── Lang buttons ──
  const btnAr = document.getElementById('lang-btn-ar');
  const btnEn = document.getElementById('lang-btn-en');
  if (btnAr) btnAr.classList.toggle('active', currentLang === 'ar');
  if (btnEn) btnEn.classList.toggle('active', currentLang === 'en');
  const lbl = document.getElementById('current-lang-label');
  if (lbl) lbl.textContent = currentLang === 'ar' ? 'العربية' : 'English';

  // ── Account pill (top of account section) ──
  const sapAvEl  = document.getElementById('sap-avatar');
  const sapName  = document.getElementById('sap-name');
  const sapHndl  = document.getElementById('sap-handle');
  if (ME && sapName) {
    sapName.innerHTML = esc(ME.name) + (ME.verified ? ' <span class="badge-verified" style="font-size:.72rem">✓</span>' : '');
    if (sapHndl) sapHndl.textContent = '@' + ME.username;
    if (sapAvEl) sapAvEl.innerHTML = renderAvatar(ME.avatar, 36);
  }

  // ── Username / Email subs ──
  const userSub  = document.getElementById('current-username-sub');
  const emailSub = document.getElementById('current-email-sub');
  if (ME) {
    if (userSub)  userSub.textContent  = '@' + ME.username;
    if (emailSub) emailSub.textContent = ME.email || (currentLang === 'ar' ? 'غير محدد' : 'Not set');
  }

  // ── Admin section: show for admin usernames, hidden for others ──
  checkAdminAccess();

  // ── Storage + accounts count ──
  calcStorage();
  updateSettingsAccountsCount();
}

// ── Change Password Modal ──
function showChangePasswordModal() {
  openModal(`
    <div class="modal-title">🔐 ${t('changePassword')}</div>
    <label class="field-label">${t('currentPassword')}</label>
    <div class="input-group" style="margin-bottom:12px">
      <input type="password" id="cp-current" class="glass-input" style="padding:12px 14px"/>
    </div>
    <label class="field-label">${t('newPassword')}</label>
    <div class="input-group" style="margin-bottom:12px">
      <input type="password" id="cp-new" class="glass-input" style="padding:12px 14px"/>
    </div>
    <label class="field-label">${t('confirmNewPassword')}</label>
    <div class="input-group" style="margin-bottom:14px">
      <input type="password" id="cp-confirm" class="glass-input" style="padding:12px 14px"/>
    </div>
    <button class="btn-primary" onclick="doChangePassword()">${t('saveChanges')}</button>
  `);
}

function doChangePassword() {
  const current = document.getElementById('cp-current').value;
  const newPw   = document.getElementById('cp-new').value;
  const confirm = document.getElementById('cp-confirm').value;
  const users   = DB.get('wvx_users') || {};
  const user    = users[ME.username];
  if (!user || user.password !== btoa(current)) { showToast(t('wrongPassword')); return; }
  if (newPw.length < 6) { showToast(t('pwShort')); return; }
  if (newPw !== confirm)  { showToast(t('pwMismatch')); return; }
  user.password = btoa(newPw);
  DB.set('wvx_users', users);
  closeModal();
  showToast(t('passwordChanged'));
}

// ── Privacy Settings ──
function showPrivacySettings() {
  openModal(`
    <div class="modal-title">🔒 ${t('privacySettings')}</div>
    <div style="display:flex;flex-direction:column;gap:14px;margin-top:8px">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:rgba(255,255,255,.04);border-radius:12px">
        <div><div style="font-weight:700;font-size:.9rem">${currentLang === 'ar' ? 'حساب خاص' : 'Private Account'}</div><div style="font-size:.78rem;color:var(--text-muted)">${currentLang === 'ar' ? 'فقط المتابعون يرون منشوراتك' : 'Only followers see your posts'}</div></div>
        <label class="toggle-switch"><input type="checkbox" id="priv-private" ${(DB.get('wvx_priv_' + ME.id) || {}).private ? 'checked' : ''} onchange="savePrivacy('private',this.checked)"/><span class="toggle-slider"></span></label>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:rgba(255,255,255,.04);border-radius:12px">
        <div><div style="font-weight:700;font-size:.9rem">${currentLang === 'ar' ? 'إخفاء قائمة المتابعين' : 'Hide Followers List'}</div></div>
        <label class="toggle-switch"><input type="checkbox" id="priv-hide-followers" ${(DB.get('wvx_priv_' + ME.id) || {}).hideFollowers ? 'checked' : ''} onchange="savePrivacy('hideFollowers',this.checked)"/><span class="toggle-slider"></span></label>
      </div>
    </div>
  `);
}

function savePrivacy(key, val) {
  const priv = DB.get('wvx_priv_' + ME.id) || {};
  priv[key] = val;
  DB.set('wvx_priv_' + ME.id, priv);
  showToast(t('settingsSaved'));
}

// ── Terms Modal ──
function showTermsModal() {
  openModal(`
    <div class="modal-title">📄 ${t('termsAndPrivacy')}</div>
    <div style="font-size:.85rem;color:var(--text-sub);line-height:1.75;max-height:60vh;overflow-y:auto;padding-right:4px">
      <strong>شروط الاستخدام</strong><br/>
      باستخدامك لـ Wavex، أنت توافق على عدم نشر أي محتوى ضار أو مسيء أو ينتهك حقوق الآخرين. يحق لنا إزالة أي محتوى أو حساب يخالف شروط الاستخدام.<br/><br/>
      <strong>سياسة الخصوصية</strong><br/>
      نحن نحترم خصوصيتك. بياناتك محفوظة بشكل آمن ولا يتم مشاركتها مع أطراف ثالثة. يمكنك حذف حسابك وبياناتك في أي وقت من الإعدادات.<br/><br/>
      <strong>Privacy Policy</strong><br/>
      We respect your privacy. Your data is stored securely and is never shared with third parties. You can delete your account and data at any time from Settings.<br/><br/>
      <em>Wavex v2.0 — 2025</em>
    </div>
  `);
}

// ── Delete Account ──
function confirmDeleteAccount() {
  openModal(`
    <div style="text-align:center;padding:10px 0">
      <div style="font-size:3rem;margin-bottom:12px">⚠️</div>
      <div class="modal-title">${t('deleteAccount')}</div>
      <p style="color:var(--text-muted);font-size:.88rem;margin-bottom:20px">${t('confirmDeleteAccount')}</p>
      <div style="display:flex;gap:10px">
        <button style="flex:1;padding:12px;background:rgba(255,255,255,.07);border:1px solid var(--border);border-radius:12px;color:var(--text);cursor:pointer;font-family:inherit" onclick="closeModal()">${currentLang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
        <button style="flex:1;padding:12px;background:var(--danger);border:none;border-radius:12px;color:#fff;font-weight:700;cursor:pointer;font-family:inherit" onclick="deleteMyAccount()">${currentLang === 'ar' ? 'حذف نهائياً' : 'Delete Permanently'}</button>
      </div>
    </div>
  `);
}

function deleteMyAccount() {
  const users = DB.get('wvx_users') || {};
  delete users[ME.username];
  DB.set('wvx_users', users);
  // حذف المنشورات
  const posts = (DB.get('wvx_posts') || []).filter(p => p.authorId !== ME.id);
  DB.set('wvx_posts', posts);
  DB.del('wvx_session');
  showToast('تم حذف الحساب');
  setTimeout(() => location.reload(), 1200);
}

// ════════════════════════════════════════════════
//  🔧 showPage — extended
// ════════════════════════════════════════════════
const _originalShowPage = showPage;
// Override showPage to handle new pages
showPage = function(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const pageEl = document.getElementById('page-' + page);
  if (!pageEl) return;
  pageEl.classList.add('active');
  const nav = document.getElementById('nav-' + page);
  if (nav) nav.classList.add('active');

  // Original handlers
  if (page === 'profile')       { refreshUserUI(); renderProfilePosts(); }
  if (page === 'notifications') { DB.del('wvx_notif_unread_' + ME.id); document.getElementById('notif-badge').classList.add('hidden'); }
  if (emojiOpen) { emojiOpen = false; document.getElementById('emoji-picker').classList.add('hidden'); }

  // New page handlers
  if (page === 'market')   renderMarket();
  if (page === 'videos')   renderVideos();
  if (page === 'groups')   renderGroups();
  if (page === 'saved')    renderSaved();
  if (page === 'settings') loadSettings();
};

// ── Boot: apply saved theme/accent/font ──
(function bootAppearance() {
  const theme  = DB.get('wvx_theme')     || 'dark';
  const accent = DB.get('wvx_accent')    || 'cyan';
  const fs     = DB.get('wvx_font_size') || 'medium';
  applyTheme(theme);
  applyAccent(accent);
  setFontSize(fs);
})();

// ════════════════════════════════════════════════
//  📱 MOBILE MORE MENU
// ════════════════════════════════════════════════
function toggleMoreMenu() {
  const menu    = document.getElementById('more-menu');
  const overlay = document.getElementById('more-overlay');
  const isOpen  = menu.classList.contains('open');
  if (isOpen) closeMoreMenu();
  else {
    menu.classList.add('open');
    overlay.classList.add('open');
  }
}

function closeMoreMenu() {
  document.getElementById('more-menu')?.classList.remove('open');
  document.getElementById('more-overlay')?.classList.remove('open');
}

function showPageFromMore(page) {
  closeMoreMenu();
  // Mark active in more menu
  document.querySelectorAll('.more-menu-item').forEach(el => el.classList.remove('active'));
  const item = document.getElementById('more-' + page);
  if (item) item.classList.add('active');
  // Mark nav-more as active in bottom bar
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('nav-more')?.classList.add('active');
  showPage(page);
}

// ════════════════════════════════════════════════
//  👤 MULTI-ACCOUNT SYSTEM
// ════════════════════════════════════════════════

function getSavedAccounts() {
  return DB.get('wvx_saved_accounts') || [];
}

function saveCurrentAccount() {
  if (!ME) return;
  const accounts = getSavedAccounts();
  const idx = accounts.findIndex(a => a.username === ME.username);
  const entry = {
    username: ME.username,
    name:     ME.name,
    avatar:   ME.avatar,
    verified: ME.verified,
    lastActive: new Date().toISOString(),
  };
  if (idx >= 0) accounts[idx] = entry;
  else accounts.push(entry);
  DB.set('wvx_saved_accounts', accounts);
}

function showAccountSwitcher() {
  saveCurrentAccount();
  const accounts = getSavedAccounts();
  const panel    = document.getElementById('account-switcher-panel');
  const list     = document.getElementById('accounts-list');
  if (!panel) return;

  list.innerHTML = accounts.map(acc => {
    const isCurrent = acc.username === ME?.username;
    const avH = acc.avatar && (acc.avatar.startsWith('data:')||acc.avatar.startsWith('http')||acc.avatar.startsWith('assets/'))
      ? `<img src="${acc.avatar}" style="width:38px;height:38px;border-radius:50%;object-fit:cover"/>`
      : `<div style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0">${acc.avatar||'👤'}</div>`;
    return `<div class="account-list-item ${isCurrent?'active':''}" onclick="${isCurrent?'':'switchToAccount(\''+acc.username+'\')'}">
      ${avH}
      <div class="account-list-info">
        <div class="account-list-name">${esc(acc.name)}${acc.verified?'<span class="badge-verified" style="font-size:.7rem">✓</span>':''}</div>
        <div class="account-list-handle">@${esc(acc.username)}</div>
      </div>
      ${isCurrent
        ? '<span class="account-active-dot">●</span>'
        : '<button class="account-remove-btn" onclick="event.stopPropagation();removeAccount(\''+acc.username+'\')" title="Remove">✕</button>'
      }
    </div>`;
  }).join('') || `<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:.85rem">${currentLang==='ar'?'لا توجد حسابات محفوظة':'No saved accounts'}</div>`;

  panel.classList.remove('hidden');
  // Update settings count
  updateSettingsAccountsCount();
}

function hideAccountSwitcher() {
  document.getElementById('account-switcher-panel')?.classList.add('hidden');
}

function switchToAccount(username) {
  hideAccountSwitcher();
  const users = DB.get('wvx_users') || {};
  const user  = users[username];
  if (!user) {
    showToast(currentLang==='ar'?'الحساب غير موجود':'Account not found');
    return;
  }
  saveCurrentAccount();
  ME = user;
  DB.set('wvx_session', ME);
  refreshUserUI();
  showPage('feed');
  renderFeed();
  renderRightPanel();
  renderConversationsList();
  renderNotifications();
  updateBadges();
  showToast((currentLang==='ar'?'مرحباً، ':'Welcome, ') + ME.name + ' 👋');
}

function removeAccount(username) {
  if (username === ME?.username) return;
  const accounts = getSavedAccounts().filter(a => a.username !== username);
  DB.set('wvx_saved_accounts', accounts);
  showAccountSwitcher();
}

function addNewAccount() {
  hideAccountSwitcher();
  saveCurrentAccount();
  // Temporarily clear session to show auth
  DB.del('wvx_session');
  const prevMe = ME;
  ME = null;
  document.getElementById('app').classList.add('hidden');
  document.getElementById('auth-screen').classList.remove('hidden');
  showLogin();
  // After login, we re-enter app and the new account is active
  // Original account stays in saved accounts list
}

function updateSettingsAccountsCount() {
  const el = document.getElementById('settings-accounts-count');
  if (!el) return;
  const n = getSavedAccounts().length;
  const isAr = currentLang === 'ar';
  el.textContent = n <= 1
    ? (isAr ? 'حساب واحد نشط' : '1 active account')
    : (isAr ? `${n} حسابات محفوظة` : `${n} saved accounts`);
}

// Hook: save account on login
const _origLogin = login;
login = function() {
  _origLogin();
  setTimeout(saveCurrentAccount, 300);
};

// ════════════════════════════════════════════════
//  💾 STORAGE & ADMIN SETTINGS HELPERS
// ════════════════════════════════════════════════

function calcStorage() {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    const v = localStorage.getItem(k) || '';
    total += k.length + v.length;
  }
  const kb = (total * 2 / 1024).toFixed(1); // UTF-16
  const mb = (total * 2 / 1024 / 1024).toFixed(2);
  const el = document.getElementById('storage-used-label');
  if (el) el.textContent = mb > 0.1 ? `${mb} MB` : `${kb} KB`;
}

function clearCacheData() {
  const isAr = currentLang === 'ar';
  openModal(`
    <div style="text-align:center;padding:8px 0">
      <div style="font-size:2.5rem;margin-bottom:10px">🗑️</div>
      <div class="modal-title">${isAr?'مسح الكاش':'Clear Cache'}</div>
      <p style="color:var(--text-muted);font-size:.85rem;margin:10px 0 20px">${isAr?'سيتم مسح البيانات المؤقتة فقط. حسابك ومنشوراتك لن تتأثر.':'Temporary data will be cleared. Your account and posts are safe.'}</p>
      <div style="display:flex;gap:8px">
        <button style="flex:1;padding:11px;background:rgba(255,255,255,.07);border:1px solid var(--border);border-radius:12px;color:var(--text);cursor:pointer;font-family:inherit" onclick="closeModal()">${isAr?'إلغاء':'Cancel'}</button>
        <button style="flex:1;padding:11px;background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;border-radius:12px;color:#07071a;font-weight:700;cursor:pointer;font-family:inherit" onclick="doClearCache()">${isAr?'مسح':'Clear'}</button>
      </div>
    </div>
  `);
}

function doClearCache() {
  // Only clear non-critical keys
  const keep = ['wvx_users','wvx_posts','wvx_session','wvx_saved_accounts','wavex_lang','wvx_theme','wvx_accent','wvx_font_size'];
  const toRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!keep.some(kk => k.startsWith(kk))) toRemove.push(k);
  }
  toRemove.forEach(k => localStorage.removeItem(k));
  closeModal();
  showToast(currentLang==='ar'?'تم مسح الكاش ✅':'Cache cleared ✅');
  calcStorage();
}

// ════════════════════════════════════════════════
//  🛡️ ADMIN ACCESS SYSTEM
//  طريقتين للوصول:
//  1. رابط مباشر: /admin.html
//  2. كود سري في الإعدادات: اضغط 5 مرات على "إصدار التطبيق"
// ════════════════════════════════════════════════

// Admin usernames — غيّرهم لليوزرنيم بتاعك
const ADMIN_USERNAMES = ['wavex_official', 'wavex_team'];

// Secret tap counter (tap version label 5 times)
let _adminTapCount = 0;
let _adminTapTimer  = null;

function handleVersionTap() {
  _adminTapCount++;
  clearTimeout(_adminTapTimer);
  _adminTapTimer = setTimeout(() => { _adminTapCount = 0; }, 2000);

  if (_adminTapCount >= 5) {
    _adminTapCount = 0;
    // Check if current user is admin
    if (ADMIN_USERNAMES.includes(ME?.username)) {
      unlockAdminSection();
      showToast('🛡️ ' + (currentLang==='ar' ? 'تم فتح لوحة التحكم' : 'Admin panel unlocked'));
    } else {
      // Ask for admin password
      openModal(
        '<div class="modal-title">🛡️ ' + (currentLang==='ar'?'دخول الأدمن':'Admin Access') + '</div>' +
        '<p style="color:var(--text-muted);font-size:.82rem;margin-bottom:14px">' +
        (currentLang==='ar'?'أدخل كلمة المرور للمشرف':'Enter moderator password') + '</p>' +
        '<div class="input-group" style="margin-bottom:14px">' +
        '<input type="password" id="admin-pw-input" class="glass-input" placeholder="••••••••" style="padding:12px 14px" onkeydown="if(event.key==\'Enter\')checkAdminPassword()"/>' +
        '</div>' +
        '<button class="btn-primary" onclick="checkAdminPassword()">' + (currentLang==='ar'?'دخول':'Enter') + '</button>'
      );
      setTimeout(() => document.getElementById('admin-pw-input')?.focus(), 100);
    }
  } else if (_adminTapCount === 2) {
    // Subtle hint after 2 taps
    // No visible feedback to avoid revealing the feature
  }
}

function checkAdminPassword() {
  const pw = document.getElementById('admin-pw-input')?.value;
  // Default admin password — change this before deploy!
  const ADMIN_PW = localStorage.getItem('wvx_admin_pw') || 'WavexAdmin@2025';
  if (pw === ADMIN_PW) {
    closeModal();
    unlockAdminSection();
    showToast('🛡️ ' + (currentLang==='ar'?'تم فتح لوحة التحكم':'Admin panel unlocked'));
  } else {
    const inp = document.getElementById('admin-pw-input');
    if (inp) { inp.style.borderColor = 'var(--danger)'; inp.value = ''; inp.placeholder = currentLang==='ar'?'كلمة المرور خاطئة':'Wrong password'; }
  }
}

function checkAdminAccess() {
  // Called on settings load — show immediately for admin usernames
  const section = document.getElementById('admin-access-section');
  if (!section || !ME) return;
  if (ADMIN_USERNAMES.includes(ME.username)) {
    section.style.display = 'block';
  }
  // Others can still access via 5-tap secret
}

function unlockAdminSection() {
  const section = document.getElementById('admin-access-section');
  if (!section) return;
  section.style.display = 'block';
  // Scroll to it
  setTimeout(() => section.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
}

function openAdminPanel() {
  window.open('admin.html', '_blank');
}

// ── Explore filter ──
let exploreFilter = 'all';

function setExploreFilter(filter, btn) {
  exploreFilter = filter;
  document.querySelectorAll('.explore-filter').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const q = document.getElementById('explore-search').value.trim();
  if (q) searchContent(q);
}

function clearExploreSearch() {
  const input = document.getElementById('explore-search');
  input.value = '';
  document.getElementById('explore-clear')?.classList.add('hidden');
  document.getElementById('search-results')?.classList.add('hidden');
  document.getElementById('explore-main')?.classList.remove('hidden');
}

// Patch searchContent to show/hide clear button
const _origSearch = typeof searchContent === 'function' ? searchContent : null;
if (_origSearch) {
  searchContent = function(q) {
    const clearBtn = document.getElementById('explore-clear');
    if (clearBtn) clearBtn.classList.toggle('hidden', !q.trim());
    const main = document.getElementById('explore-main');
    const results = document.getElementById('search-results');
    if (!q.trim()) {
      if (results) results.classList.add('hidden');
      if (main)    main.classList.remove('hidden');
      return;
    }
    if (main)    main.classList.add('hidden');
    if (results) results.classList.remove('hidden');
    _origSearch(q);
  };
}

// loadSettings now calls calcStorage + updateSettingsAccountsCount internally
// No hook needed — admin section never shown automatically

// Close account switcher on outside click
document.addEventListener('click', function(e) {
  const panel = document.getElementById('account-switcher-panel');
  const wrap  = document.getElementById('sidebar-user-wrap');
  if (panel && !panel.classList.contains('hidden') && !panel.contains(e.target) && !wrap?.contains(e.target)) {
    hideAccountSwitcher();
  }
});

// ── Mobile chat back button ──
function closeChatMobile() {
  const chatLayout = document.querySelector('.chat-layout');
  if (chatLayout) chatLayout.classList.remove('chat-open');
  activeChatId = null;
}

// ════════════════════════════════════════════════
//  🔕 DND — Do Not Disturb
// ════════════════════════════════════════════════

function toggleDND(on) {
  DB.set('wvx_dnd', on);
  applyDNDState(on, true);
}

function applyDNDState(on, showToastMsg) {
  // Grey-out individual toggles when DND is on
  const grp = document.getElementById('notif-detail-group');
  if (grp) {
    grp.style.opacity  = on ? '0.38' : '1';
    grp.style.pointerEvents = on ? 'none' : '';
  }
  // DND item highlight
  const dndItem = document.getElementById('dnd-item');
  if (dndItem) dndItem.classList.toggle('dnd-active', on);

  if (showToastMsg) showToast(t(on ? 'dndOn' : 'dndOff'));
}

// ── Check DND before firing any notification ──
function isDND() {
  return DB.get('wvx_dnd') === true;
}

// ════════════════════════════════════════════════
//  🏷️  Change Username
// ════════════════════════════════════════════════

function showChangeUsernameModal() {
  const isAr = currentLang === 'ar';
  openModal(
    '<div class="modal-title">🏷️ ' + t('changeUsername') + '</div>' +
    '<p style="color:var(--text-muted);font-size:.82rem;margin:4px 0 14px">' +
    (isAr ? 'اسم المستخدم الحالي: ' : 'Current username: ') +
    '<strong style="color:var(--accent)">@' + esc(ME.username) + '</strong></p>' +
    '<label class="field-label">' + t('newUsername') + '</label>' +
    '<div class="input-group" style="margin-bottom:12px">' +
    '<input type="text" id="cu-new" class="glass-input" placeholder="new_username" maxlength="30" style="padding:12px 14px" oninput="validateUsernameInput(this)"/>' +
    '<div id="cu-hint" style="font-size:.74rem;margin-top:5px;color:var(--text-muted)">' +
    (isAr ? 'أحرف وأرقام و _ · 3–30 حرف' : 'Letters, numbers & _ · 3–30 chars') + '</div></div>' +
    '<label class="field-label">' + t('confirmWithPassword') + '</label>' +
    '<div class="input-group" style="margin-bottom:16px">' +
    '<input type="password" id="cu-pw" class="glass-input" placeholder="••••••••" style="padding:12px 14px"/></div>' +
    '<button class="btn-primary" onclick="doChangeUsername()">' + t('saveChanges') + '</button>'
  );
}

function validateUsernameInput(el) {
  const hint = document.getElementById('cu-hint');
  if (!hint) return;
  const isAr = currentLang === 'ar';
  const v = el.value;
  const ok = /^[a-zA-Z0-9_]{3,30}$/.test(v);
  const users = DB.get('wvx_users') || {};
  const taken = v !== ME.username && users[v];
  if (!v) {
    hint.style.color = 'var(--text-muted)';
    hint.textContent = isAr ? 'أحرف وأرقام و _ · 3–30 حرف' : 'Letters, numbers & _ · 3–30 chars';
  } else if (!ok) {
    hint.style.color = 'var(--danger)';
    hint.textContent = t('usernameInvalid');
  } else if (taken) {
    hint.style.color = 'var(--danger)';
    hint.textContent = t('usernameTaken');
  } else {
    hint.style.color = 'var(--accent4)';
    hint.textContent = isAr ? '✓ متاح' : '✓ Available';
  }
}

function doChangeUsername() {
  const newUn = (document.getElementById('cu-new')?.value || '').trim();
  const pw    = document.getElementById('cu-pw')?.value || '';
  const users = DB.get('wvx_users') || {};

  // Validate
  if (!newUn || newUn === ME.username) { showToast(currentLang==='ar'?'أدخل اسماً مختلفاً':'Enter a different username'); return; }
  if (!/^[a-zA-Z0-9_]{3,30}$/.test(newUn)) { showToast(t('usernameInvalid')); return; }
  if (users[newUn]) { showToast(t('usernameTaken')); return; }
  if (!users[ME.username] || users[ME.username].password !== btoa(pw)) { showToast(t('wrongPassword')); return; }

  // Move user record
  const oldKey = ME.username;
  users[newUn] = { ...users[oldKey], username: newUn };
  delete users[oldKey];

  // Update posts/likes
  const posts = (DB.get('wvx_posts') || []).map(p => {
    if (p.authorId === ME.id) p.author = newUn;
    return p;
  });
  DB.set('wvx_posts', posts);

  // Update saved accounts list
  const saved = (DB.get('wvx_saved_accounts') || []).map(a => {
    if (a.username === oldKey) a.username = newUn;
    return a;
  });
  DB.set('wvx_saved_accounts', saved);

  ME.username = newUn;
  DB.set('wvx_users', users);
  DB.set('wvx_session', ME);

  closeModal();
  refreshUserUI();
  loadSettings();
  showToast(t('usernameChanged'));
}

// ════════════════════════════════════════════════
//  📧 Change Email
// ════════════════════════════════════════════════

function showChangeEmailModal() {
  openModal(
    '<div class="modal-title">📧 ' + t('changeEmail') + '</div>' +
    '<p style="color:var(--text-muted);font-size:.82rem;margin:4px 0 14px">' +
    (currentLang==='ar' ? 'الإيميل الحالي: ' : 'Current email: ') +
    '<strong style="color:var(--accent)">' + esc(ME.email || (currentLang==='ar'?'غير محدد':'Not set')) + '</strong></p>' +
    '<label class="field-label">' + t('newEmail') + '</label>' +
    '<div class="input-group" style="margin-bottom:12px">' +
    '<input type="email" id="ce-new" class="glass-input" placeholder="you@example.com" style="padding:12px 14px"/></div>' +
    '<label class="field-label">' + t('confirmWithPassword') + '</label>' +
    '<div class="input-group" style="margin-bottom:16px">' +
    '<input type="password" id="ce-pw" class="glass-input" placeholder="••••••••" style="padding:12px 14px"/></div>' +
    '<button class="btn-primary" onclick="doChangeEmail()">' + t('saveChanges') + '</button>'
  );
}

function doChangeEmail() {
  const newEmail = (document.getElementById('ce-new')?.value || '').trim().toLowerCase();
  const pw       = document.getElementById('ce-pw')?.value || '';
  const users    = DB.get('wvx_users') || {};
  const user     = users[ME.username];

  if (!newEmail) { showToast(currentLang==='ar'?'أدخل الإيميل':'Enter email'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) { showToast(t('emailInvalid')); return; }
  if (!user || user.password !== btoa(pw)) { showToast(t('wrongPassword')); return; }

  user.email = newEmail;
  ME.email   = newEmail;
  DB.set('wvx_users', users);
  DB.set('wvx_session', ME);

  closeModal();
  loadSettings();
  showToast(t('emailChanged'));
}

// ════════════════════════════════════════════════
//  📖 STORIES SYSTEM (24h)
// ════════════════════════════════════════════════

const STORY_TTL = 24 * 60 * 60 * 1000; // 24 hours in ms

function getStories() {
  const all = DB.get('wvx_stories') || [];
  const now = Date.now();
  return all.filter(s => (now - new Date(s.createdAt).getTime()) < STORY_TTL);
}

function saveStories(stories) {
  DB.set('wvx_stories', stories);
}

function renderStories() {
  const bar  = document.getElementById('stories-list');
  if (!bar) return;
  const stories  = getStories();
  const isAr     = currentLang === 'ar';
  const users    = DB.get('wvx_users') || {};

  // Group by user — latest story per user
  const byUser = {};
  stories.forEach(s => {
    if (!byUser[s.userId] || s.createdAt > byUser[s.userId].createdAt) byUser[s.userId] = s;
  });

  bar.innerHTML = '';
  Object.values(byUser).forEach(s => {
    const isMe     = s.userId === ME.id;
    const seen     = (s.seenBy || []).includes(ME.id);
    // Always use freshest avatar from users DB
    const freshAv  = users[s.userId]?.avatar || s.avatar || '';
    const avIsImg  = freshAv && (freshAv.startsWith('data:')||freshAv.startsWith('http')||freshAv.startsWith('assets/'));
    const ring     = seen ? 'story-ring-seen' : 'story-ring';
    const d        = document.createElement('div');
    d.className    = 'story-item';
    d.onclick      = () => openStory(s.userId);
    d.innerHTML    =
      '<div class="story-avatar-wrap ' + ring + '">' +
        (avIsImg
          ? '<img src="' + freshAv + '" class="story-avatar-img"/>'
          : '<div class="story-avatar-emoji">' + esc(freshAv||'👤') + '</div>') +
      '</div>' +
      '<span class="story-label">' + esc(isMe ? (isAr?'قصتك':'My Story') : s.authorName.split(' ')[0]) + '</span>';
    bar.appendChild(d);
  });
}

function addStory() {
  const isAr = currentLang === 'ar';
  // modal: text or image
  openModal(
    '<div class="modal-title">📖 ' + (isAr?'إضافة قصة':'Add Story') + '</div>' +
    '<p style="color:var(--text-muted);font-size:.82rem;margin-bottom:12px">' +
    (isAr?'تختفي بعد 24 ساعة':'Disappears after 24 hours') + '</p>' +
    '<div class="story-creator">' +
      '<div id="story-img-preview" class="story-img-preview hidden"><img id="story-prev-img" src="" alt=""/><button onclick="clearStoryMedia(\'img\')">✕</button></div>' +
      '<div id="story-vid-preview" class="story-img-preview hidden" style="padding:0"><video id="story-prev-vid" controls style="width:100%;border-radius:10px;max-height:180px"></video><button onclick="clearStoryMedia(\'vid\')" style="position:absolute;top:6px;right:6px">✕</button></div>' +
      '<div id="story-audio-preview" class="story-audio-preview hidden">' +
        '<span>🎵</span><span id="story-audio-name" style="font-size:.8rem;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>' +
        '<audio id="story-prev-audio" controls style="width:100%;height:30px;margin-top:4px"></audio>' +
        '<button onclick="clearStoryMedia(\'audio\')" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:.85rem">✕</button>' +
      '</div>' +
      '<textarea id="story-text" class="glass-input" rows="3" placeholder="' + (isAr?'اكتب قصتك...':'Write your story...') + '" style="resize:none;margin-bottom:10px"></textarea>' +
      '<label class="story-bg-label">' + (isAr?'لون الخلفية:':'Background:') + '</label>' +
      '<div class="story-bg-picker" id="story-bg-picker">' +
        ['#1a1a3e','#0a2a1a','#2a0a1a','#1a2a0a','linear-gradient(135deg,#6ee7f7,#a78bfa)','linear-gradient(135deg,#f472b6,#fb923c)','linear-gradient(135deg,#34d399,#6ee7f7)'].map((bg,i) =>
          '<div class="story-bg-opt' + (i===0?' selected':'') + '" style="background:' + bg + '" onclick="selectStoryBg(\'' + bg.replace(/'/g,"\\'") + '\',this)"></div>'
        ).join('') +
      '</div>' +
      '<div class="story-media-btns">' +
        '<label class="story-img-upload-btn"><input type="file" accept="image/*,image/gif,image/webp" class="hidden" onchange="previewStoryImg(this)"/>🖼️ ' + (isAr?'صورة':'Image') + '</label>' +
        '<label class="story-img-upload-btn" style="background:rgba(110,231,247,0.1)"><input type="file" accept="video/*" class="hidden" onchange="previewStoryVid(this)"/>🎬 ' + (isAr?'فيديو':'Video') + '</label>' +
        '<label class="story-img-upload-btn" style="background:rgba(167,139,250,0.1)"><input type="file" accept="audio/*" class="hidden" onchange="previewStoryAudio(this)"/>🎵 ' + (isAr?'موسيقى':'Music') + '</label>' +
      '</div>' +
    '</div>' +
    '<button class="btn-primary" style="margin-top:12px" onclick="publishStory()">' + (isAr?'نشر القصة':'Publish Story') + '</button>'
  );
  window._storyBg    = '#1a1a3e';
  window._storyImg   = null;
  window._storyVid   = null;
  window._storyAudio = null;
}

function selectStoryBg(bg, el) {
  document.querySelectorAll('.story-bg-opt').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
  window._storyBg = bg;
}

function previewStoryImg(input) {
  const file = input.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = e => {
    window._storyImg = e.target.result;
    const prev = document.getElementById('story-img-preview');
    const img  = document.getElementById('story-prev-img');
    if (prev && img) { img.src = e.target.result; prev.classList.remove('hidden'); }
  };
  r.readAsDataURL(file);
}

function publishStory() {
  const text = document.getElementById('story-text')?.value.trim();
  if (!text && !window._storyImg && !window._storyVid && !window._storyAudio) {
    showToast(currentLang==='ar'?'اكتب شيئاً أو أضف ميديا':'Write something or add media');
    return;
  }
  const stories = getStories();
  stories.push({
    id:         Date.now(),
    userId:     ME.id,
    authorName: ME.name,
    avatar:     ME.avatar,
    text:       text || '',
    image:      window._storyImg   || null,
    video:      window._storyVid   || null,
    audio:      window._storyAudio || null,
    bg:         window._storyBg    || '#1a1a3e',
    createdAt:  new Date().toISOString(),
    seenBy:     [ME.id],
    views:      0,
  });
  saveStories(stories);
  window._storyVid = null;
  window._storyAudio = null;
  closeModal();
  renderStories();
  showToast(currentLang==='ar'?'تم نشر القصة 📖':'Story published 📖');
}

function openStory(userId) {
  const stories  = getStories().filter(s => s.userId === userId);
  if (!stories.length) return;
  const isAr     = currentLang === 'ar';
  let   idx      = 0;

  // Mark as seen
  stories.forEach(s => {
    if (!s.seenBy) s.seenBy = [];
    if (!s.seenBy.includes(ME.id)) { s.seenBy.push(ME.id); s.views = (s.views||0)+1; }
  });
  const allStories = DB.get('wvx_stories') || [];
  stories.forEach(s => { const i = allStories.findIndex(x=>x.id===s.id); if(i>=0) allStories[i]=s; });
  DB.set('wvx_stories', allStories);

  function renderStoryView() {
    const s      = stories[idx];
    // Story background — image > video frame > gradient
    const bgStyle = s.image ? 'background:url(' + s.image + ') center/cover no-repeat' : 'background:' + (s.bg || '#1a1a3e');
    const hasVideo = !!s.video;
    const hasAudio = !!s.audio;
    const avIsImg = s.avatar&&(s.avatar.startsWith('data:')||s.avatar.startsWith('http')||s.avatar.startsWith('assets/'));
    const timeLeft = Math.max(0, Math.round((STORY_TTL - (Date.now() - new Date(s.createdAt).getTime())) / 3600000));
    document.getElementById('modal-content').innerHTML =
      '<div class="story-viewer" style="' + bgStyle + '">' +
        '<div class="story-progress-bar"><div class="story-progress-fill" style="width:' + ((idx+1)/stories.length*100) + '%"></div></div>' +
        '<div class="story-viewer-header">' +
          '<div style="display:flex;align-items:center;gap:10px">' +
            (avIsImg?'<img src="'+s.avatar+'" class="story-vw-av"/>':'<div class="story-vw-av-emoji">'+esc(s.avatar||'👤')+'</div>') +
            '<div><div style="font-weight:700;font-size:.9rem">' + esc(s.authorName) + '</div><div style="font-size:.72rem;opacity:.7">' + timeLeft + (isAr?' ساعة متبقية':' hours left') + '</div></div>' +
          '</div>' +
          '<button style="background:none;border:none;color:white;font-size:1.2rem;cursor:pointer" onclick="closeModal()">✕</button>' +
        '</div>' +
        (hasVideo ? '<div class="story-video-wrap"><video src="' + s.video.dataUrl + '" class="story-video" autoplay loop muted playsinline style="width:100%;max-height:60%;object-fit:contain"></video></div>' : '') +
        (hasAudio ? '<div class="story-audio-bar"><span>🎵</span><div class="story-audio-bar-info"><div class="story-audio-bar-name">' + esc(s.audio.name||'Audio') + '</div><audio src="' + s.audio.dataUrl + '" controls autoplay class="story-audio-ctrl" style="width:100%;height:32px"></audio></div></div>' : '') +
        (s.text ? '<div class="story-text-overlay">' + esc(s.text) + '</div>' : '') +
        (s.userId === ME.id ? '<div class="story-views-badge">👁️ ' + (s.views||0) + '</div>' : '') +
        '<div class="story-nav">' +
          (idx > 0 ? '<button class="story-nav-btn" onclick="event.stopPropagation();storyNav(-1)">‹</button>' : '<div></div>') +
          (idx < stories.length-1 ? '<button class="story-nav-btn story-nav-next" onclick="event.stopPropagation();storyNav(1)">›</button>' : '<div></div>') +
        '</div>' +
      '</div>';
  }

  window.storyNav = (dir) => { idx = Math.max(0, Math.min(stories.length-1, idx+dir)); renderStoryView(); };
  renderStoryView();
  openModal();
  // Style modal for full story view
  setTimeout(() => {
    const modal = document.querySelector('.modal');
    if (modal) { modal.style.padding='0'; modal.style.overflow='hidden'; modal.style.maxWidth='400px'; }
    const ov = document.querySelector('.modal-overlay');
    if (ov) ov.onclick = e => { if(e.target===ov) closeModal(); };
  }, 50);
}

// Hook into enterApp and renderFeed to render stories
const _origEnterApp = enterApp;
enterApp = function() {
  _origEnterApp();
  setTimeout(renderStories, 100);
  if (typeof askNotifPermission === 'function') askNotifPermission();
};

// ════════════════════════════════════════════════
//  👤 OPEN USER PROFILE (any user by ID)
// ════════════════════════════════════════════════

function openUserProfile(userId) {
  const users = DB.get('wvx_users') || {};
  const user  = Object.values(users).find(u => u.id === userId);
  if (!user) return;

  // If it's me — go to my profile page
  if (userId === ME?.id) { showPage('profile'); return; }

  const isAr      = currentLang === 'ar';
  const isFollowing = (DB.get('wvx_followed') || {})[userId];
  const userPosts = (DB.get('wvx_posts') || []).filter(p => p.authorId === userId);

  // Avatar
  const avIsImg = user.avatar && (user.avatar.startsWith('data:') || user.avatar.startsWith('http') || user.avatar.startsWith('assets/'));
  const avHTML  = avIsImg
    ? '<img src="' + user.avatar + '" class="up-avatar-img" onclick="openAvatarViewer(\'' + encodeURIComponent(user.avatar) + '\',\'avatar\')" style="cursor:zoom-in" alt="avatar"/>'
    : '<div class="up-avatar-emoji" onclick="void(0)">' + esc(user.avatar || '👤') + '</div>';

  // Cover
  const hasCoverImg = user.coverImage;
  const coverStyle  = hasCoverImg
    ? 'background:url(' + user.coverImage + ') center/cover no-repeat;cursor:zoom-in'
    : 'background:' + (user.cover || 'linear-gradient(135deg,var(--accent),var(--accent2))');
  const coverClick  = hasCoverImg
    ? 'onclick="openAvatarViewer(\'' + encodeURIComponent(user.coverImage) + '\',\'cover\')"'
    : '';

  // Stats
  const followersCount = Object.values(DB.get('wvx_followed') || {}).filter(v => v === true).length; // approx
  const followedByUser = (DB.get('wvx_followed') || {})[userId] ? 1 : 0;

  // ── Full-screen profile overlay ──
  const existing = document.getElementById('fullscreen-profile');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'fullscreen-profile';
  overlay.className = 'fullscreen-profile';
  overlay.innerHTML =
    '<div class="fp-inner">' +
      // Header bar
      '<div class="fp-topbar">' +
        '<button class="fp-back" onclick="closeFP()">‹</button>' +
        '<span class="fp-topbar-name">' + esc(user.username) + '</span>' +
        '<div style="width:36px"></div>' +
      '</div>' +

      // Cover
      '<div class="fp-cover" style="' + coverStyle + '" ' + coverClick + '></div>' +

      // Avatar
      '<div class="fp-avatar-wrap">' + avHTML + '</div>' +

      // Action row
      '<div class="fp-actions">' +
        (isFriend(userId)
          ? '<button class="fp-follow-btn following" onclick="removeFriend(\''+userId+'\')">👥 ' + (isAr?'فريندز':'Friends') + '</button>'
          : hasSentReq(userId)
            ? '<button class="fp-follow-btn" style="opacity:.65" disabled>⏳ ' + (isAr?'طلب مبعوت':'Requested') + '</button>'
            : hasReceivedReq(userId)
              ? '<button class="fp-follow-btn" onclick="acceptFriendRequest(\''+userId+'\')">✓ ' + (isAr?'قبول':'Accept') + '</button>'
              : '<button class="fp-follow-btn" onclick="sendFriendRequest(\''+userId+'\')">+ ' + (isAr?'فريند':'Friend') + '</button>'
        ) +
        '<button class="fp-msg-btn" onclick="closeFP();startChatWith(\''+userId+'\')">💬 ' + (isAr?'رسالة':'Message') + '</button>' +
        '<button class="fp-msg-btn" onclick="reportUser(\''+userId+'\')" style="padding:9px 10px" title="Report">🚩</button>' +
      '</div>' +

      // Info
      '<div class="fp-info">' +
        '<div class="fp-name">' + esc(user.name) + (user.verified ? ' <span class="badge-verified">✓</span>' : '') + '</div>' +
        '<div class="fp-handle">@' + esc(user.username) + '</div>' +
        (user.bio ? '<div class="fp-bio">' + esc(user.bio) + '</div>' : '') +
        (user.location ? '<div class="fp-pill">📍 ' + esc(user.location) + '</div>' : '') +
        (user.job ? '<div class="fp-pill">💼 ' + esc(user.job) + '</div>' : '') +
      '</div>' +

      // Stats
      '<div class="fp-stats">' +
        '<div class="fp-stat" style="cursor:pointer" onclick="showFollowListModal(\'followers\')">' +
          '<span class="fp-stat-n">' + userPosts.length + '</span>' +
          '<span class="fp-stat-l">' + (isAr ? 'منشور' : 'Posts') + '</span>' +
        '</div>' +
        '<div class="fp-stat" style="cursor:pointer" onclick="showFollowListModal(\'followers\')">' +
          '<span class="fp-stat-n">' + (user.followers || 0) + '</span>' +
          '<span class="fp-stat-l">' + (isAr ? 'متابع' : 'Followers') + '</span>' +
        '</div>' +
        '<div class="fp-stat" style="cursor:pointer" onclick="showFollowListModal(\'following\')">' +
          '<span class="fp-stat-n">' + (user.following || 0) + '</span>' +
          '<span class="fp-stat-l">' + (isAr ? 'يتابع' : 'Following') + '</span>' +
        '</div>' +
      '</div>' +

      // Posts title
      (userPosts.length ? '<div class="fp-posts-title">' + (isAr ? 'المنشورات' : 'Posts') + '</div>' : '<div class="fp-posts-title empty">' + (isAr ? 'مفيش منشورات لسه' : 'No posts yet') + '</div>') +
      '<div class="fp-posts-list" id="fp-posts-' + userId + '"></div>' +
    '</div>';

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('visible'));

  // Inject posts
  setTimeout(() => {
    const list = document.getElementById('fp-posts-' + userId);
    if (!list) return;
    if (!userPosts.length) return;
    userPosts.slice(0, 5).forEach(p => list.appendChild(buildPostCard(p)));
  }, 50);
}

function closeFP() {
  const el = document.getElementById('fullscreen-profile');
  if (el) { el.classList.remove('visible'); setTimeout(() => el.remove(), 280); }
}

function toggleFollowModal(userId, btn) {
  toggleFollow(userId, btn);
}

// startChatWith by userId — used from profile modal
function startChatWithId(userId) {
  const users = DB.get('wvx_users') || {};
  const user  = Object.values(users).find(u => u.id === userId);
  if (!user) return;
  closeModal();
  showPage('chat');
  setTimeout(() => openChat(user), 100);
}

// ════════════════════════════════════════════════
//  🔍 AVATAR / COVER VIEWER
// ════════════════════════════════════════════════

function openAvatarViewer(encodedSrc, type) {
  const src = decodeURIComponent(encodedSrc);
  const isAr = currentLang === 'ar';
  const label = type === 'cover'
    ? (isAr ? 'صورة الغلاف' : 'Cover Photo')
    : (isAr ? 'الصورة الشخصية' : 'Profile Photo');

  openModal(
    '<div class="avatar-viewer-modal">' +
      '<div class="av-label">' + label + '</div>' +
      '<div class="av-img-wrap">' +
        '<img src="' + esc(src) + '" class="av-full-img" alt="' + label + '"/>' +
      '</div>' +
      '<a href="' + esc(src) + '" download class="av-download-btn">⬇️ ' + (isAr ? 'تحميل' : 'Download') + '</a>' +
    '</div>'
  );
  // Expand modal for image
  setTimeout(() => {
    const mbox = document.getElementById('modal-box');
    if (mbox) { mbox.style.maxWidth = '560px'; mbox.style.padding = '0'; }
    const mc = document.getElementById('modal-content');
    if (mc) mc.style.padding = '0';
  }, 30);
}

// Also make profile page avatar/cover clickable
function initProfileImageClicks() {
  const av = document.getElementById('profile-avatar');
  if (av) av.style.cursor = 'zoom-in';

  // Cover click
  const cover = document.querySelector('.profile-cover');
  if (cover) {
    cover.style.cursor = 'zoom-in';
    cover.onclick = () => {
      const src = ME.coverImage || null;
      if (src) openAvatarViewer(encodeURIComponent(src), 'cover');
    };
  }
}

// Hook into renderProfile
const _origRenderProfile = typeof renderProfile === 'function' ? renderProfile : null;
if (_origRenderProfile) {
  renderProfile = function() {
    _origRenderProfile();
    setTimeout(initProfileImageClicks, 100);
  };
}

// View my own avatar/cover
function viewMyAvatar() {
  if (!ME) return;
  const av = ME.avatar;
  if (!av) return;
  const isImg = av.startsWith('data:') || av.startsWith('http') || av.startsWith('assets/');
  if (isImg) openAvatarViewer(encodeURIComponent(av), 'avatar');
}
function viewMyCover() {
  if (!ME) return;
  const src = ME.coverImage;
  if (src) openAvatarViewer(encodeURIComponent(src), 'cover');
}

// ════════════════════════════════════════════════
//  🎬🎵  STORY MEDIA HANDLERS
// ════════════════════════════════════════════════

function previewStoryVid(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 50 * 1024 * 1024) { showToast(currentLang==='ar'?'الفيديو كبير جداً (50MB max)':'Video too large (50MB max)','⚠️'); return; }
  clearStoryMedia('img'); clearStoryMedia('audio');
  const r = new FileReader();
  r.onload = e => {
    window._storyVid  = { dataUrl: e.target.result, name: file.name };
    window._storyImg  = null;
    const vid = document.getElementById('story-prev-vid');
    if (vid) vid.src = e.target.result;
    document.getElementById('story-vid-preview')?.classList.remove('hidden');
  };
  r.readAsDataURL(file);
}

function previewStoryAudio(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 20 * 1024 * 1024) { showToast(currentLang==='ar'?'الملف كبير جداً (20MB max)':'File too large (20MB max)','⚠️'); return; }
  clearStoryMedia('img'); clearStoryMedia('vid');
  const r = new FileReader();
  r.onload = e => {
    window._storyAudio = { dataUrl: e.target.result, name: file.name };
    const aud = document.getElementById('story-prev-audio');
    if (aud) aud.src = e.target.result;
    const nm = document.getElementById('story-audio-name');
    if (nm) nm.textContent = file.name;
    document.getElementById('story-audio-preview')?.classList.remove('hidden');
  };
  r.readAsDataURL(file);
}

function clearStoryMedia(type) {
  if (type === 'img') {
    window._storyImg = null;
    document.getElementById('story-img-preview')?.classList.add('hidden');
    const img = document.getElementById('story-prev-img'); if(img) img.src='';
  } else if (type === 'vid') {
    window._storyVid = null;
    const vid = document.getElementById('story-prev-vid'); if(vid){vid.src='';vid.pause?.();}
    document.getElementById('story-vid-preview')?.classList.add('hidden');
  } else if (type === 'audio') {
    window._storyAudio = null;
    const aud = document.getElementById('story-prev-audio'); if(aud){aud.src='';aud.pause?.();}
    document.getElementById('story-audio-preview')?.classList.add('hidden');
  }
}

// Remove old clearStoryImg calls — map to new
function clearStoryImg() { clearStoryMedia('img'); }
