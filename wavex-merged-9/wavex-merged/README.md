# 🌊 Wavex — Liquid Glass Social Platform v2.0

> منصة اجتماعية عصرية · Modern Social Media Platform

---

## 📁 هيكل المشروع / Project Structure

```
wavex/
│
├── index.html              ← الصفحة الرئيسية (entry point)
├── package.json            ← npm للتشغيل من الـ root
├── .env.example            ← نموذج متغيرات البيئة
├── .gitignore              ← ملفات متجاهلة في Git
├── README.md               ← هذا الملف
│
├── 🎨 styles/
│   └── style.css           ← كل الـ CSS (Liquid Glass design)
│
├── ⚡ js/
│   ├── app.js              ← منطق التطبيق الكامل
│   └── i18n.js             ← نظام الترجمة عربي/إنجليزي
│
├── 🖼️ assets/
│   ├── images/
│   │   └── logo.svg        ← ✏️ ضع لوجو التطبيق هنا
│   ├── icons/
│   │   └── favicon.svg     ← ✏️ ضع الـ favicon هنا
│   └── fonts/              ← (اختياري) فونتات محلية
│
├── 🌐 public/              ← ملفات عامة إضافية
│
└── 🔧 backend/
    ├── server.js           ← Node.js + Express API
    ├── package.json        ← مكتبات الـ backend
    └── db.json             ← قاعدة البيانات (تتخلق تلقائياً)
```

---

## 🖼️ إضافة اللوجو الخاص بك

1. ضع صورة اللوجو في `assets/images/logo.svg` أو `.png`
2. ضع الـ favicon في `assets/icons/favicon.svg` أو `.ico`
3. في `index.html` شيل التعليق من السطور دي:

```html
<!-- auth screen logo -->
<img src="assets/images/logo.svg" alt="Wavex" class="logo-img"/>

<!-- sidebar logo -->
<img src="assets/images/logo.svg" alt="Wavex" class="sidebar-logo-img"/>
```

4. احذف سطر الإيموجي 🌊 اللي جنبه

---

## 🚀 التشغيل / How to Run

### Frontend فقط (بدون Node.js):
افتح `index.html` في المتصفح مباشرة — البيانات في localStorage

### Full Stack:
```bash
npm install
npm start
# ← http://localhost:3000
```

---

## ⚙️ متغيرات البيئة

```bash
cp .env.example .env
# عدل JWT_SECRET و PORT
```

---

## 🌐 النشر / Deployment

**Render.com:**
- Build: `cd backend && npm install`
- Start: `node backend/server.js`
- أضف `JWT_SECRET` في Environment Variables

**VPS مع PM2:**
```bash
npm install -g pm2
pm2 start backend/server.js --name wavex
```

---

## 🔐 الحسابات الرسمية

الحسابات الرسمية بتتخلق تلقائياً عند أول تشغيل.
للوصول للأدمن راجع الـ admin panel من الإعدادات.

---

Made By Ahmed Rami | 2026
