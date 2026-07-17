# Sonix Project — Memory File (ملف ذاكرة شامل)

> الغرض: حفظ كل تفاصيل مشروع بيع تطبيق Sonix عشان ما نخربط في المحادثات الجاية.
> آخر تحديث: 17 يوليو 2026

---

## 1. الهدف الأساسي
بيع الكود المصدري لتطبيق سونيك (Sonix) — منصة تواصل اجتماعي كاملة (Laravel + React Native/Expo).
السعر المطلوب: $35,000 - $45,000 (Acquire.com) أو $49 (CodeCanyon).

---

## 2. البنية التقنية
- **Backend:** Laravel 13 + PostgreSQL، Sanctum auth، عند `C:\Users\HEYTHEM\Downloads\sonix\laravel-backend`
- **Mobile:** React Native 0.86 / Expo SDK 57، عند `C:\Users\HEYTHEM\Downloads\sonix\expo-app`
- **Root:** `C:\Users\HEYTHEM\Downloads\sonix` (فيه Dockerfile + docker-entrypoint.sh)

---

## 3. الحسابات والمفاتيح (مهم جداً)

| العنصر | القيمة | ملاحظة |
|--------|--------|--------|
| GitHub repo الفعلي (اللي Runsite يسحب منه) | `https://github.com/HEYTHEM2009/sonix.git` | **هذا المهم** |
| GitHub repo الثاني | `https://github.com/sonix-project/sonix.git` | origin عند المستخدم، بس Runsite ما يسحب منه |
| Runsite project | `HEYTHEM2009/sonix` (branch main) | لوحة التحكم: dashboard.runsite.app |
| API الحي | `https://sonix-api.runsite.app/api` | يرجع 200 الآن |
| test user (مش موجود دايماً) | `test@test.com` / `password123` | الـ seed أحياناً ما يشتغل |
| Gmail المقترح للبيع | `sonix.project@gmail.com` | **لم يُنشأ بعد** — لازم المستخدم يسويه يدوياً |

---

## 4. القيود البيئية (مهمة جداً — ما ننساها)

### ❌ الـ shell tool عند الوكيل (أنا) معزول عن:
- `git push` → يفشل بـ `Failed to connect to github.com port 443` أو ينقتل
- `eas build` بدون توكن صحيح → يفشل
- الدخول لـ Runsite dashboard → ما عندي وصول

### ✅ الـ shell عند الوكيل شغال لـ:
- `Invoke-WebRequest` / `https.request` لـ API (الإنترنت متاح لهذا)
- تشغيل Playwright + Chromium (نتحقق من التطبيق)
- أوامر محلية (node, php -l, git commit محلي)

### ✅ المستخدم (أنت) يقدر يسوي في CMD عنده:
- `git push https://github.com/HEYTHEM2009/sonix.git main`
- Redeploy على Runsite
- `eas build` مع EXPO_TOKEN صحيح

---

## 5. سير العمل الإلزامي (workflow) لكل تعديل

عشان أي تعديل يوصل للإنتاج:
1. الوكيل يعدّل الكود محلياً + `git commit`
2. **المستخدم** يدفع: `git push https://github.com/HEYTHEM2009/sonix.git main`
3. **المستخدم** يعمل Redeploy على Runsite (يتأكد اللوج يكتب `Cloned at commit` جديد)
4. الوكيل يتحقق عبر Playwright من `https://sonix-api.runsite.app/api`

⚠️ Runsite يسحب من `HEYTHEM2009/sonix` مش `sonix-project/sonix`! (اكتشفناها من اللوج: `Cloning from HEYTHEM2009/sonix`)

---

## 6. المشاكل اللي انحلت (تاريخياً)

| المشكلة | السبب | الحل |
|---------|-------|------|
| API يرجع 500 + CORS `http://localhost` | Runsite كان يبني من commit قديم `6ce341b3` | redeploy بالكود الجديد (`ad5d861`) |
| Reels upload يرجع 500 | مجلد `public/reels` غير موجود → `$file->move()` يفشل | `StorageHelper::uploadLocal` يعمل `mkdir` + Dockerfile ينشئ `public/reels` |
| ReelController كان يخزن في `storage/app/reels/public` (404 عند العرض) | مسار غلط | صار `StorageHelper::upload('reels')` + `getUrl()` |
| MediaController كان `public_path('uploads/'.$path)` | ما يعرض ملفات خارج uploads | صار `public_path($path)` (آمن من traversal) |
| DatabaseSeeder يفشل عند إعادة التشغيل | `User::create` بدل `firstOrCreate` | صار idempotent |
| Web build يشير لـ localhost:8000 | default في client.js | صار `https://sonix-api.runsite.app/api` |
| Messages pencil كان يروح CreatePost | navigation غلط | صار يروح `Users` |

---

## 7. حالة الكود الحالية (17 يوليو 2026 — بعد آخر redeploy)

✅ **كل الـ endpoints ترجع 200** (Register, /users/me, /feed, /reels, /explore, /posts, /messages, /stories, /groups, /notifications)
✅ **Reels upload يرجع 201** (تم التحقق فعلياً برفع فيديو)
✅ **CORS = `*`** على كل الـ endpoints
✅ **0 console errors** في Playwright
✅ كود `ReelController` نظيف (شلنا الـ debug try/catch)
✅ آخر commit: `60276f2` (cleanup)

النتيجة النهائية للتطبيق: **100/100 شغال**

---

## 8. ملفات البيع (عند `E:\Sonix_Sale\`)
- `GUIDE.md`, `CLEANUP_CHECKLIST.md`, `DELIVERY_MESSAGE.md`, `ACCOUNTS.md`
- `SALES_PITCH.md` (إنجليزي), `SALE_LISTING_AR.md`, `SELLING_GUIDE_AR.md`
- `README_CODECANYON_AR.md`, `SALE_DESCRIPTION_ACQUIRE.md`
- **ملاحظة:** بعضها فيه تناقضات قديمة (claiming `sonix-team` cleanup) — انصلحت GUIDE.md و CLEANUP_CHECKLIST.md

## 9. مجلد التسليم (`E:\Sonix_Complete\`)
- `source-code\`, `apk\`, `buyer-docs\`, `Sonix_Delivery_v3.zip`
- **محتاج تحديث** بآخر كود (الـ reels fixes + seed idempotency)

## 9b. ملاحظة: تم مسح كل ما يتعلق بـ Expo/EAS/APK/التوكنات من الذاكرة
- لا نفترض أي حساب Expo، ولا توكن، ولا EAS project ID
- بناء الـ APK يتطلب من المستخدم توفير توكن جديد عند الحاجة فقط

## 10. سكربتات Playwright (عند `expo-app\`)
- `playwright-check.js` — تحميل أساسي
- `playwright-login.js` — تسجيل دخول
- `playwright-verify.js` — تحقق شامل + network logging
- `playwright-api.js` — اختبار كل الـ endpoints عبر API مباشر ✅ (الأهم)
- `playwright-reel.js` — اختبار رفع Reel ✅ (الأهم)
- مثبتة: `playwright` + Chromium محلياً

---

## 11. الخطوات الباقية للتسليم (محتاجة المستخدم)
1. ❌ إنشاء Gmail `sonix.project@gmail.com` (يدوي على gmail.com)
2. ❌ بناء APK عبر EAS (محتاج توكن جديد من المستخدم عند الحاجة — لا حسابات محفوظة)
3. ❌ تحديث `E:\Sonix_Complete\source-code\` + `Sonix_Delivery_v3.zip` بآخر كود
4. ⚠️ قبل التسليم: التأكد `APP_DEBUG=false` (هو أصلاً false في .env اللي ما متتبَّع)

---

## 12. أخطاء متكررة نعملها (نتجنبها)
- ❌ ننسى إن Runsite يسحب من `HEYTHEM2009/sonix` مش `sonix-project/sonix`
- ❌ نحاول `git push` من الـ shell (ممنوع/معزول) — نطلب من المستخدم
- ❌ نحاول redeploy من الـ shell (مستحيل) — نطلب من المستخدم
- ❌ نظن Playwright يبني APK (ما يقدر — بس يتحقق)
- ❌ نفترض أي حساب Expo / EAS / توكن — محذوف تماماً من الذاكرة
- ✅ دايماً نتحقق عبر Playwright بعد كل redeploy
