// ════════════════════════════════════════════════
//  Wavex — Production Backend API
//  Node.js + Express + JWT + bcryptjs
//  File-based JSON DB (replace with MongoDB for prod)
// ════════════════════════════════════════════════
//
//  ✏️  TO RENAME THE APP:
//  1. Change APP_NAME below
//  2. Update index.html logo text
//  3. Done!
//
const APP_NAME = 'Wavex';

const express  = require('express');
const cors     = require('cors');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const path     = require('path');
const fs       = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'wavex-ultra-secret-change-in-production-2025';

// ── Middleware ──
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','PATCH','DELETE'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json({ limit: '10mb' }));
// Serve frontend from root (one level up from backend/)
app.use(express.static(path.join(__dirname, '..')));

// ── JSON Database ──
const DB_PATH = path.join(__dirname, 'db.json'); // stored in backend/

function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    const init = { users: {}, posts: [], messages: {}, notifications: {}, verifications: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(init, null, 2));
    return init;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ── Auth Middleware ──
function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}

// ── Rate limiting (simple) ──
const rateMap = {};
function rateLimit(max = 30, windowMs = 60000) {
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    if (!rateMap[key] || now - rateMap[key].start > windowMs) rateMap[key] = { count: 0, start: now };
    rateMap[key].count++;
    if (rateMap[key].count > max) return res.status(429).json({ error: 'Too many requests' });
    next();
  };
}

// ════ ROUTES ════

// Health
app.get('/api/health', (req, res) => res.json({ status: 'ok', app: APP_NAME, time: new Date() }));

// ─── AUTH ───
app.post('/api/auth/register', rateLimit(5, 60000), async (req, res) => {
  try {
    const { name, username, email, password, avatar } = req.body;
    if (!name?.trim() || !username?.trim() || !password) return res.status(400).json({ error: 'All fields required' });
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return res.status(400).json({ error: 'Invalid username format' });
    if (password.length < 6) return res.status(400).json({ error: 'Password too short' });

    const db = readDB();
    if (db.users[username]) return res.status(400).json({ error: 'Username already taken' });

    const hash = await bcrypt.hash(password, 12);
    const user = {
      id: 'u_' + Date.now(),
      name: name.trim(),
      username: username.toLowerCase().trim(),
      email: email?.trim() || '',
      password: hash,
      avatar: avatar || '🌊',
      bio: '',
      verified: false,
      followers: 0,
      following: 0,
      cover: 'linear-gradient(135deg,rgba(110,231,247,0.4),rgba(167,139,250,0.4))',
      createdAt: new Date().toISOString(),
    };

    db.users[username] = user;
    writeDB(db);

    const { password: _, ...safe } = user;
    const token = jwt.sign({ id: user.id, username }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ ok: true, user: safe, token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', rateLimit(10, 60000), async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Credentials required' });

    const db = readDB();
    const user = db.users[username.toLowerCase()];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const { password: _, ...safe } = user;
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ ok: true, user: safe, token });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/auth/me', auth, (req, res) => {
  const db = readDB();
  const user = db.users[req.user.username];
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password: _, ...safe } = user;
  res.json({ ok: true, user: safe });
});

// ─── POSTS ───
app.get('/api/posts', auth, (req, res) => {
  const db = readDB();
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const start = (page - 1) * limit;
  const sorted = [...db.posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const posts = sorted.slice(start, start + limit).map(p => ({
    ...p,
    isLiked: (p.likedBy || []).includes(req.user.id),
    isOwner: p.authorId === req.user.id,
  }));
  res.json({ ok: true, posts, total: db.posts.length, page, limit });
});

app.post('/api/posts', auth, (req, res) => {
  const { content, image } = req.body;
  if (!content?.trim() && !image) return res.status(400).json({ error: 'Content required' });
  if (content?.length > 1000) return res.status(400).json({ error: 'Content too long' });

  const db = readDB();
  const user = db.users[req.user.username];
  const post = {
    id: Date.now(),
    content: content?.trim() || '',
    image: image || null,
    authorId: req.user.id,
    authorName: user.name,
    authorAvatar: user.avatar,
    authorUsername: req.user.username,
    verified: user.verified,
    likes: 0,
    likedBy: [],
    comments: [],
    shares: 0,
    createdAt: new Date().toISOString(),
  };
  db.posts.unshift(post);
  writeDB(db);
  res.json({ ok: true, post });
});

app.delete('/api/posts/:id', auth, (req, res) => {
  const db = readDB();
  const id = parseInt(req.params.id);
  const idx = db.posts.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Post not found' });
  if (db.posts[idx].authorId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  db.posts.splice(idx, 1);
  writeDB(db);
  res.json({ ok: true });
});

app.post('/api/posts/:id/like', auth, (req, res) => {
  const db = readDB();
  const post = db.posts.find(p => p.id === parseInt(req.params.id));
  if (!post) return res.status(404).json({ error: 'Not found' });
  const liked = (post.likedBy || []).includes(req.user.id);
  if (liked) { post.likes = Math.max(0, (post.likes||1)-1); post.likedBy = post.likedBy.filter(i => i !== req.user.id); }
  else { post.likes = (post.likes||0)+1; post.likedBy = [...(post.likedBy||[]), req.user.id]; }
  writeDB(db);
  res.json({ ok: true, liked: !liked, likes: post.likes });
});

app.post('/api/posts/:id/comment', auth, (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Comment required' });
  const db = readDB();
  const post = db.posts.find(p => p.id === parseInt(req.params.id));
  if (!post) return res.status(404).json({ error: 'Not found' });
  const user = db.users[req.user.username];
  const comment = { id: Date.now(), userId: req.user.id, username: req.user.username, name: user.name, avatar: user.avatar, text: text.trim(), createdAt: new Date().toISOString() };
  post.comments = post.comments || [];
  post.comments.push(comment);
  writeDB(db);
  res.json({ ok: true, comment });
});

app.get('/api/posts/user/:username', auth, (req, res) => {
  const db = readDB();
  const posts = db.posts.filter(p => p.authorUsername === req.params.username).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ ok: true, posts });
});

// ─── USERS ───
app.get('/api/users/search', auth, (req, res) => {
  const q = req.query.q?.toLowerCase();
  if (!q) return res.json({ ok: true, users: [] });
  const db = readDB();
  const users = Object.values(db.users)
    .filter(u => u.username !== req.user.username && (u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)))
    .map(({ password, ...u }) => u).slice(0, 10);
  res.json({ ok: true, users });
});

app.get('/api/users/:username', auth, (req, res) => {
  const db = readDB();
  const user = db.users[req.params.username];
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password, ...safe } = user;
  res.json({ ok: true, user: safe });
});

app.patch('/api/users/me', auth, (req, res) => {
  const { name, bio, avatar, cover } = req.body;
  const db = readDB();
  const user = db.users[req.user.username];
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (name?.trim()) user.name = name.trim();
  if (bio !== undefined) user.bio = bio.slice(0, 200);
  if (avatar) user.avatar = avatar;
  if (cover) user.cover = cover;
  writeDB(db);
  const { password: _, ...safe } = user;
  res.json({ ok: true, user: safe });
});

// ─── MESSAGES ───
app.get('/api/messages/conversations', auth, (req, res) => {
  const db = readDB();
  const msgs = db.messages || {};
  const convs = Object.entries(msgs)
    .filter(([k]) => k.includes(req.user.id))
    .map(([key, data]) => {
      const otherId = key.split('_').find(id => id !== req.user.id);
      const otherUser = Object.values(db.users).find(u => u.id === otherId);
      const last = data.messages[data.messages.length-1];
      return { key, user: otherUser ? { id: otherUser.id, name: otherUser.name, avatar: otherUser.avatar, username: otherUser.username, verified: otherUser.verified } : null, lastMessage: last?.text || '', lastTime: last?.time || data.createdAt, unread: (data.messages||[]).filter(m => m.from !== req.user.id && !m.read).length };
    })
    .filter(c => c.user)
    .sort((a,b) => new Date(b.lastTime) - new Date(a.lastTime));
  res.json({ ok: true, conversations: convs });
});

app.get('/api/messages/:userId', auth, (req, res) => {
  const db = readDB();
  const key = [req.user.id, req.params.userId].sort().join('_');
  const convo = (db.messages || {})[key];
  // Mark as read
  if (convo) { convo.messages.forEach(m => { if (m.from !== req.user.id) m.read = true; }); writeDB(db); }
  res.json({ ok: true, messages: convo?.messages || [] });
});

app.post('/api/messages/:userId', auth, (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Message required' });
  const db = readDB();
  db.messages = db.messages || {};
  const key = [req.user.id, req.params.userId].sort().join('_');
  if (!db.messages[key]) db.messages[key] = { participants: [req.user.id, req.params.userId], messages: [], createdAt: new Date().toISOString() };
  const msg = { id: Date.now(), from: req.user.id, text: text.trim(), time: new Date().toISOString(), read: false };
  db.messages[key].messages.push(msg);
  writeDB(db);
  res.json({ ok: true, message: msg });
});

// ─── NOTIFICATIONS ───
app.get('/api/notifications', auth, (req, res) => {
  const db = readDB();
  const notifs = (db.notifications || {})[req.user.id] || [];
  res.json({ ok: true, notifications: notifs.slice(0, 100) });
});

app.post('/api/notifications/read', auth, (req, res) => {
  const db = readDB();
  if (db.notifications?.[req.user.id]) db.notifications[req.user.id].forEach(n => n.read = true);
  writeDB(db);
  res.json({ ok: true });
});

// ─── VERIFICATION ───
app.post('/api/verification/apply', auth, (req, res) => {
  const db = readDB();
  db.verifications = db.verifications || [];
  const existing = db.verifications.find(v => v.userId === req.user.id && v.status === 'pending');
  if (existing) return res.status(400).json({ error: 'Application already pending' });
  db.verifications.push({ userId: req.user.id, username: req.user.username, status: 'pending', appliedAt: new Date().toISOString() });
  writeDB(db);
  res.json({ ok: true, message: 'Verification request submitted' });
});

// ─── FOLLOW ───
app.post('/api/users/:username/follow', auth, (req, res) => {
  const db = readDB();
  const target = db.users[req.params.username];
  const me = db.users[req.user.username];
  if (!target || !me) return res.status(404).json({ error: 'User not found' });
  const follows = db.follows = db.follows || {};
  const key = req.user.id + '_' + target.id;
  if (follows[key]) {
    delete follows[key];
    target.followers = Math.max(0, (target.followers||1)-1);
    me.following = Math.max(0, (me.following||1)-1);
    writeDB(db);
    return res.json({ ok: true, following: false });
  }
  follows[key] = true;
  target.followers = (target.followers||0)+1;
  me.following = (me.following||0)+1;
  writeDB(db);
  res.json({ ok: true, following: true });
});

// ════════════════════════════════════════════════
// ════════════════════════════════════════════════
//  🔐 ADMIN & MODERATOR SYSTEM
//  ✏️  غير SUPER_ADMIN_PASSWORD قبل النشر!
//
//  Roles:
//    superadmin  — كل الصلاحيات + إدارة المشرفين
//    moderator   — توثيق، حظر، حذف منشورات، بلاغات
// ════════════════════════════════════════════════
const SUPER_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'WavexAdmin@2025';
const ADMIN_SECRET = JWT_SECRET + '_admin_v2';
const OFFICIAL_ACCOUNTS = ['wavex_official', 'wavex_team'];

// ── Admin / Mod Auth Middleware ──
function adminAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.admin = jwt.verify(token, ADMIN_SECRET);
    if (!['superadmin','moderator'].includes(req.admin.role)) throw new Error();
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}

function superOnly(req, res, next) {
  if (req.admin?.role !== 'superadmin') return res.status(403).json({ error: 'Super Admin only' });
  next();
}

// ── Super Admin Login ──
app.post('/api/admin/login', (req, res) => {
  const db = readDB();
  const { username, password } = req.body;

  // Super admin login (بـ باسوورد ثابت)
  if (!username && password === SUPER_ADMIN_PASSWORD) {
    const token = jwt.sign({ role: 'superadmin', name: 'Super Admin' }, ADMIN_SECRET, { expiresIn: '12h' });
    return res.json({ ok: true, token, role: 'superadmin', name: 'Super Admin' });
  }

  // Moderator login (بـ يوزر + باسوورد)
  if (username) {
    const mods = db.moderators || {};
    const mod = mods[username];
    if (!mod) return res.status(401).json({ error: 'Moderator not found' });
    if (mod.password !== Buffer.from(password).toString('base64')) return res.status(401).json({ error: 'Wrong password' });
    const token = jwt.sign({ role: 'moderator', username, name: mod.name }, ADMIN_SECRET, { expiresIn: '12h' });
    return res.json({ ok: true, token, role: 'moderator', name: mod.name, username });
  }

  res.status(401).json({ error: 'Invalid credentials' });
});

// ── Stats ──
app.get('/api/admin/stats', adminAuth, (req, res) => {
  const db = readDB();
  const users = Object.values(db.users);
  res.json({
    ok: true,
    stats: {
      totalUsers:    users.length,
      verifiedUsers: users.filter(u => u.verified).length,
      bannedUsers:   users.filter(u => u.banned).length,
      totalPosts:    db.posts.length,
      totalReports:  (db.reports || []).filter(r => r.status === 'pending').length,
      totalMods:     Object.keys(db.moderators || {}).length,
    }
  });
});

// ── Get All Users ──
app.get('/api/admin/users', adminAuth, (req, res) => {
  const db = readDB();
  const users = Object.values(db.users).map(({ password, ...u }) => ({
    ...u,
    postsCount: db.posts.filter(p => p.authorId === u.id).length,
    isOfficial: OFFICIAL_ACCOUNTS.includes(u.username),
  }));
  res.json({ ok: true, users });
});

// ── Verify / Unverify ──
app.post('/api/admin/users/:username/verify', adminAuth, (req, res) => {
  const db = readDB();
  const user = db.users[req.params.username];
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.verified = !user.verified;
  writeDB(db);
  // سجل النشاط
  logActivity(db, req.admin, `${user.verified?'✓ وثّق':'✕ ألغى توثيق'} @${user.username}`);
  writeDB(db);
  res.json({ ok: true, verified: user.verified });
});

// ── Ban / Unban ──
app.post('/api/admin/users/:username/ban', adminAuth, (req, res) => {
  const db = readDB();
  const user = db.users[req.params.username];
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (OFFICIAL_ACCOUNTS.includes(user.username)) return res.status(403).json({ error: 'Cannot ban official accounts' });
  user.banned = !user.banned;
  logActivity(db, req.admin, `${user.banned?'🚫 حظر':'🔓 فك حظر'} @${user.username}`);
  writeDB(db);
  res.json({ ok: true, banned: user.banned });
});

// ── Delete User (super only) ──
app.delete('/api/admin/users/:username', adminAuth, superOnly, (req, res) => {
  const db = readDB();
  if (!db.users[req.params.username]) return res.status(404).json({ error: 'User not found' });
  if (OFFICIAL_ACCOUNTS.includes(req.params.username)) return res.status(403).json({ error: 'Cannot delete official accounts' });
  const userId = db.users[req.params.username].id;
  logActivity(db, req.admin, `🗑️ حذف حساب @${req.params.username}`);
  delete db.users[req.params.username];
  db.posts = db.posts.filter(p => p.authorId !== userId);
  writeDB(db);
  res.json({ ok: true });
});

// ── Delete User Posts ──
app.delete('/api/admin/users/:username/posts', adminAuth, (req, res) => {
  const db = readDB();
  const user = db.users[req.params.username];
  if (!user) return res.status(404).json({ error: 'User not found' });
  const before = db.posts.length;
  db.posts = db.posts.filter(p => p.authorId !== user.id);
  logActivity(db, req.admin, `🗑️ مسح منشورات @${user.username} (${before - db.posts.length} منشور)`);
  writeDB(db);
  res.json({ ok: true, deleted: before - db.posts.length });
});

// ── Get Posts ──
app.get('/api/admin/posts', adminAuth, (req, res) => {
  const db = readDB();
  res.json({ ok: true, posts: [...db.posts].sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)) });
});

// ── Delete Single Post ──
app.delete('/api/admin/posts/:id', adminAuth, (req, res) => {
  const db = readDB();
  const post = db.posts.find(p => p.id === parseInt(req.params.id));
  if (!post) return res.status(404).json({ error: 'Post not found' });
  db.posts = db.posts.filter(p => p.id !== parseInt(req.params.id));
  logActivity(db, req.admin, `🗑️ حذف منشور للـ @${post.authorId}`);
  writeDB(db);
  res.json({ ok: true });
});

// ── Reports ──
app.get('/api/admin/reports', adminAuth, (req, res) => {
  const db = readDB();
  res.json({ ok: true, reports: (db.reports || []).sort((a,b) => new Date(b.time)-new Date(a.time)) });
});

app.post('/api/admin/reports/:id/resolve', adminAuth, (req, res) => {
  const db = readDB();
  const report = (db.reports||[]).find(r => r.id === req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });
  report.status = 'resolved';
  report.resolvedBy = req.admin.username || 'superadmin';
  report.resolvedAt = new Date().toISOString();
  logActivity(db, req.admin, `✅ حل بلاغ #${report.id}`);
  writeDB(db);
  res.json({ ok: true });
});

app.post('/api/admin/reports/:id/dismiss', adminAuth, (req, res) => {
  const db = readDB();
  const report = (db.reports||[]).find(r => r.id === req.params.id);
  if (!report) return res.status(404).json({ error: 'Not found' });
  report.status = 'dismissed';
  writeDB(db);
  res.json({ ok: true });
});

// ── Moderators (super only) ──
app.get('/api/admin/moderators', adminAuth, superOnly, (req, res) => {
  const db = readDB();
  const mods = Object.entries(db.moderators || {}).map(([username, m]) => ({ username, name: m.name, addedAt: m.addedAt }));
  res.json({ ok: true, moderators: mods });
});

app.post('/api/admin/moderators', adminAuth, superOnly, (req, res) => {
  const { username, name, password } = req.body;
  if (!username || !name || !password) return res.status(400).json({ error: 'All fields required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 chars' });
  const db = readDB();
  db.moderators = db.moderators || {};
  if (db.moderators[username]) return res.status(400).json({ error: 'Moderator already exists' });
  db.moderators[username] = { name, password: Buffer.from(password).toString('base64'), addedAt: new Date().toISOString() };
  logActivity(db, req.admin, `➕ أضاف مشرف: @${username}`);
  writeDB(db);
  res.json({ ok: true });
});

app.delete('/api/admin/moderators/:username', adminAuth, superOnly, (req, res) => {
  const db = readDB();
  if (!db.moderators?.[req.params.username]) return res.status(404).json({ error: 'Not found' });
  logActivity(db, req.admin, `➖ حذف مشرف: @${req.params.username}`);
  delete db.moderators[req.params.username];
  writeDB(db);
  res.json({ ok: true });
});

// ── Activity Log ──
app.get('/api/admin/log', adminAuth, superOnly, (req, res) => {
  const db = readDB();
  res.json({ ok: true, log: (db.activityLog || []).slice(0, 100) });
});

function logActivity(db, admin, action) {
  db.activityLog = db.activityLog || [];
  db.activityLog.unshift({ by: admin.name || admin.role, role: admin.role, action, time: new Date().toISOString() });
  if (db.activityLog.length > 200) db.activityLog = db.activityLog.slice(0, 200);
}

// ── Serve Admin ──
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '..', 'admin.html')));

// ─── SERVE FRONTEND ───
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'index.html')));

// ─── START ───
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║                                          ║
║   🌊  ${APP_NAME} Server is Live!              ║
║   ➤  http://localhost:${PORT}                ║
║   ➤  API: http://localhost:${PORT}/api        ║
║                                          ║
╚══════════════════════════════════════════╝
  `);
});

module.exports = app;
