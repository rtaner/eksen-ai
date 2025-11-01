# OneSignal Production Kurulum - Eksen AI

## ✅ Durum
- OneSignal App ID: `44ee0e0e-0cc0-423a-8caa-736e8869fd41`
- Production URL: `https://eksen-ai.vercel.app`
- OneSignal SDK: Kurulu ✅
- Provider: Güncellendi ✅

## 🚀 Yapılacaklar

### 1️⃣ OneSignal Dashboard Ayarları

OneSignal Dashboard'da şu ayarları yapın:

#### Settings → Configuration → Site Setup
- **Site Name**: Eksen AI
- **Site URL**: `https://eksen-ai.vercel.app`
- **Auto Resubscribe**: ✅ Açık
- **Default Icon URL**: `https://eksen-ai.vercel.app/icon-192x192.png`

#### Allowed Origins
- `https://eksen-ai.vercel.app`

**Save** butonuna tıklayın!

---

### 2️⃣ REST API Key Al

OneSignal Dashboard → **Settings → Keys & IDs**

Şu bilgileri kopyalayın:
- **App ID**: `44ee0e0e-0cc0-423a-8caa-736e8869fd41` ✅ (Zaten biliyoruz)
- **REST API Key**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (Kopyalayın!)

---

### 3️⃣ Vercel Environment Variables Ekle

1. **Vercel Dashboard'a gidin**: https://vercel.com/dashboard
2. **eksen-ai** projesini seçin
3. **Settings** → **Environment Variables**
4. Şu değişkenleri ekleyin:

#### Variable 1:
- **Name**: `NEXT_PUBLIC_ONESIGNAL_APP_ID`
- **Value**: `44ee0e0e-0cc0-423a-8caa-736e8869fd41`
- **Environment**: Production, Preview, Development (hepsini seç)

#### Variable 2:
- **Name**: `ONESIGNAL_REST_API_KEY`
- **Value**: `[OneSignal Dashboard'dan kopyaladığınız REST API Key]`
- **Environment**: Production, Preview, Development (hepsini seç)

5. **Save** butonuna tıklayın

---

### 4️⃣ Redeploy

Environment variables ekledikten sonra:

1. **Vercel Dashboard** → **Deployments**
2. En son deployment'ı bulun
3. **⋯** (üç nokta) → **Redeploy**
4. **Redeploy** butonuna tıklayın

Deploy tamamlanınca (2-3 dakika) OneSignal aktif olacak!

---

### 5️⃣ Test Et

Deploy tamamlandıktan sonra:

1. **https://eksen-ai.vercel.app** adresine gidin
2. Tarayıcı bildirim izni isteyecek
3. **Allow** / **İzin Ver** butonuna tıklayın
4. OneSignal Dashboard → **Audience** → **All Users** → Kullanıcınızı görmelisiniz

#### Test Bildirimi Gönder

1. OneSignal Dashboard → **Messages** → **New Push**
2. **Message** sekmesinde:
   - Title: "Test Bildirimi"
   - Message: "OneSignal çalışıyor! 🎉"
3. **Delivery** sekmesinde:
   - Send to: "All Subscribed Users"
4. **Review & Send** → **Send Message**

Bildirim geldi mi? ✅

---

## 🔧 Service Worker (Opsiyonel)

OneSignal SDK otomatik olarak service worker'ı yönetir. Ancak manuel kontrol isterseniz:

### OneSignal Service Worker İndir

1. OneSignal Dashboard → **Settings** → **Web Configuration**
2. **Download Service Worker File** butonuna tıklayın
3. `OneSignalSDKWorker.js` dosyasını indirin
4. Projenizin `public/` klasörüne koyun

**Not**: Next.js + Vercel için bu adım genellikle gerekli değildir.

---

## 📊 Sonraki Adımlar

### User ID Entegrasyonu

Kullanıcı login olduğunda OneSignal'a user ID gönderin:

```typescript
// Login sonrası
import OneSignal from 'react-onesignal';

OneSignal.login(user.id); // Supabase user ID
```

Bu sayede:
- Belirli kullanıcılara bildirim gönderebilirsiniz
- Kullanıcı bazlı analytics görebilirsiniz
- Segmentasyon yapabilirsiniz

### Supabase Edge Function Entegrasyonu

Backend'den bildirim göndermek için:

```typescript
// supabase/functions/send-notification/index.ts
const response = await fetch('https://onesignal.com/api/v1/notifications', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${Deno.env.get('ONESIGNAL_REST_API_KEY')}`,
  },
  body: JSON.stringify({
    app_id: Deno.env.get('NEXT_PUBLIC_ONESIGNAL_APP_ID'),
    include_external_user_ids: [userId],
    headings: { en: title },
    contents: { en: message },
    url: `https://eksen-ai.vercel.app/notifications`,
  }),
});
```

---

## ✅ Checklist

- [ ] OneSignal Dashboard'da Site URL güncellendi
- [ ] Allowed Origins eklendi
- [ ] REST API Key kopyalandı
- [ ] Vercel'e environment variables eklendi
- [ ] Redeploy yapıldı
- [ ] Test bildirimi gönderildi
- [ ] Bildirim alındı ✅

---

## 🎉 Tebrikler!

OneSignal production'da çalışıyor! Artık:
- ✅ Tarayıcı kapalıyken bile bildirim gönderebilirsiniz
- ✅ Dashboard'dan kolayca yönetebilirsiniz
- ✅ Analytics görebilirsiniz
- ✅ Segmentasyon yapabilirsiniz

**Sorularınız varsa bana sorun!** 🚀
