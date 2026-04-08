# 🚀 Wavex — دليل البناء لكل الأنظمة

---

## ⚡ المتطلبات الأساسية

| الأداة | الرابط | ملاحظة |
|--------|--------|--------|
| Node.js 18+ | https://nodejs.org | مطلوب للكل |
| Git | https://git-scm.com | اختياري |

---

---
# 🖥️ PART 1 — ELECTRON (Windows · macOS · Linux)
---

## الخطوات (3 دقايق)

```bash
# 1. افتح Terminal/CMD جوه مجلد wavex
cd wavex

# 2. انسخ package-desktop.json → package.json
cp package-desktop.json package.json          # Mac/Linux
copy package-desktop.json package.json        # Windows CMD

# 3. ثبّت Electron
npm install

# 4. جرّب محلياً
npm start
```

## 🪟 بناء Windows (.exe installer + portable)

```bash
npm run build:win
```
النتيجة في: `dist-desktop/`
- `Wavex-Setup-2.0.0-x64.exe` ← installer كامل
- `Wavex-2.0.0-x64.exe` ← portable (بدون تثبيت)

**ملاحظة Windows:** لو ظهر خطأ code signing — اضغط "Run Anyway" أو امضي الملف بـ self-signed cert.

---

## 🍎 بناء macOS (.dmg + .zip)

```bash
npm run build:mac
```
النتيجة في: `dist-desktop/`
- `Wavex-2.0.0-universal.dmg` ← installer جاهز لـ Intel و M1/M2/M3

**ملاحظة macOS:** محتاج Mac عشان تبني لـ iOS/macOS.
لو ظهر "unidentified developer":
```
System Preferences → Security → Open Anyway
```
أو عدّل الـ Gatekeeper:
```bash
sudo spctl --master-disable
```

---

## 🐧 بناء Linux (.AppImage + .deb + .rpm)

```bash
npm run build:linux
```
النتيجة في: `dist-desktop/`
- `Wavex-2.0.0.AppImage` ← يشتغل على أي distro
- `wavex_2.0.0_amd64.deb` ← Ubuntu/Debian
- `wavex-2.0.0.x86_64.rpm` ← Fedora/RHEL

تشغيل AppImage:
```bash
chmod +x Wavex-2.0.0.AppImage
./Wavex-2.0.0.AppImage
```

---

## 🌍 بناء كل الأنظمة دفعة واحدة (على Mac فقط)

```bash
npm run build:all
```

---

---
# 📱 PART 2 — CAPACITOR (Android + iOS)
---

## المتطلبات الإضافية

| النظام | الأداة | الرابط |
|--------|--------|--------|
| Android | Android Studio | https://developer.android.com/studio |
| iOS/iPadOS | Xcode (Mac فقط) | App Store |
| Android | Java JDK 17 | https://adoptium.net |

---

## الخطوات الأساسية (مشتركة)

```bash
# 1. انسخ package-mobile.json → package.json
cp package-mobile.json package.json

# 2. ثبّت Capacitor
npm install

# 3. ثبّت Capacitor CLI عالمياً
npm install -g @capacitor/cli
```

---

## 🤖 Android APK

### الخطوات:

```bash
# 1. أضف platform Android
npx cap add android

# 2. انسخ الملفات
npx cap sync android

# 3. افتح Android Studio
npx cap open android
```

### في Android Studio:
```
Build → Generate Signed Bundle / APK
    ↓
APK
    ↓
Create new keystore:
  - Key store path: wavex-release.keystore
  - Password: اختار باسوورد قوي
  - Alias: wavex
    ↓
release
    ↓
Finish
```

**النتيجة:** `android/app/release/app-release.apk`

### بناء Debug APK سريع (للتجربة):
```bash
cd android
./gradlew assembleDebug
# النتيجة: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🍎 iOS + iPadOS IPA

> **مطلوب:** Mac + Xcode 15+

```bash
# 1. أضف platform iOS
npx cap add ios

# 2. انسخ الملفات
npx cap sync ios

# 3. افتح Xcode
npx cap open ios
```

### في Xcode:
```
1. اختار Team (Apple Developer Account)
2. Product → Archive
3. Distribute App → App Store Connect أو Ad Hoc
4. Export IPA
```

**للتجربة بدون Developer Account:**
```
Product → Run (على simulator أو جهاز متصل)
```

---

## 🔄 تحديث الكود بعد التعديل

```bash
# بعد أي تعديل في HTML/JS/CSS:
npx cap sync

# ثم افتح Android Studio أو Xcode وـ Build
```

---

---
# 🌐 PART 3 — PWA (أسرع طريقة)
---

## Windows · macOS · Linux · Android · iOS/iPadOS

### الخطوة الوحيدة:

```
1. ارفع wavex على Vercel (مجاناً):
   - rooh vercel.com → Import Project → رفع المجلد
   - احصل على رابط: wavex-xxx.vercel.app

2. افتح الرابط في Chrome/Edge/Safari

3. Chrome/Edge: "Install Wavex" في شريط العنوان
   Safari (iOS): Share → Add to Home Screen

4. بيشتغل كـ App حقيقي بدون متصفح ✅
```

---

---
# 📋 ملخص المخرجات
---

| الملف | النظام | الطريقة |
|-------|--------|---------|
| `Wavex-Setup-x.x.x-x64.exe` | Windows 10/11 | Electron |
| `Wavex-x.x.x-universal.dmg` | macOS 12+ | Electron |
| `Wavex-x.x.x.AppImage` | Linux (أي توزيعة) | Electron |
| `wavex_x.x.x_amd64.deb` | Ubuntu/Debian | Electron |
| `app-release.apk` | Android 7+ | Capacitor |
| IPA via Xcode | iOS 15+ / iPadOS 15+ | Capacitor |
| PWA | كل الأنظمة | Web |

---

# 🆘 مشاكل شائعة

| المشكلة | الحل |
|---------|------|
| `electron: command not found` | `npm install` أولاً |
| `SDK not found` (Android) | افتح Android Studio وثبّت SDK 34 |
| `Xcode must be installed` | محتاج Mac |
| `code signing error` (macOS) | شغّل بدون signing للتطوير |
| AppImage مش بيفتح | `chmod +x` ثم شغّله |
| `EACCES` في Linux | `sudo npm install -g @capacitor/cli` |

---

# 📞 الدعم

راجع: https://capacitorjs.com/docs
راجع: https://www.electronjs.org/docs
