# OneSignal Push Notifications Kurulum Rehberi

## 🎯 Neden OneSignal?

- ✅ Ücretsiz plan: 10,000 bildirim/ay
- ✅ 5 dakikada kurulum
- ✅ Tarayıcı kapalıyken bile bildirim
- ✅ Dashboard'dan test
- ✅ Analytics dahil
- ✅ Güvenilir altyapı

## 📋 Kurulum Adımları

### Adım 1: OneSignal Hesabı Oluştur

1. https://onesignal.com/ → Sign Up (Ücretsiz)
2. Email ile kayıt ol
3. Email'i doğrula

### Adım 2: Yeni App Oluştur

1. Dashboard → "New App/Website"
2. App Name: "Vector PWA"
3. Platform: **Web Push**
4. "Create App" tıkla

### Adım 3: Web Push Yapılandırması

1. **Site Setup** seçeneğini seç
2. **Typical Site** seç (Custom Code için)
3. Bilgileri gir:
   - Site Name: `Vector`
   - Site URL: `http://localhost:3000` (şimdilik)
   - Auto Resubscribe: ✅ (Açık)
   - Default Icon URL: `http://localhost:3000/icon-192x192.png`

4. **Save** tıkla

### Adım 4: App ID ve API Key Al

1. Dashboard → Settings → Keys & IDs
2. Şunları kopyala:
   - **App ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - **REST API Key**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Adım 5: Environment Variables Ekle

`.env.local` dosyasına ekle:

```env
# OneSignal Configuration
NEXT_PUBLIC_ONESIGNAL_APP_ID=YOUR_APP_ID
ONESIGNAL_REST_API_KEY=YOUR_REST_API_KEY
```

### Adım 6: OneSignal SDK Yükle

```bash
npm install react-onesignal
```

### Adım 7: OneSignal Initialize

`app/layout.tsx` veya `app/providers.tsx` dosyasına ekle:

```typescript
'use client';

import { useEffect } from 'react';
import OneSignal from 'react-onesignal';

export default function OneSignalProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    OneSignal.init({
      appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
      allowLocalhostAsSecureOrigin: true, // Development için
    });
  }, []);

  return <>{children}</>;
}
```

### Adım 8: Bildirim Gönderme Fonksiyonu

Backend'den bildirim göndermek için:

```typescript
// lib/onesignal.ts
export async function sendPushNotification(
  userIds: string[],
  title: string,
  message: string,
  url?: string
) {
  const response = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
    },
    body: JSON.stringify({
      app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
      include_external_user_ids: userIds,
      headings: { en: title },
      contents: { en: message },
      url: url,
    }),
  });

  return response.json();
}
```

### Adım 9: User ID Ayarla

Kullanıcı giriş yaptığında:

```typescript
// Login sonrası
OneSignal.setExternalUserId(user.id);
```

### Adım 10: Test Et

1. Uygulamayı aç: `http://localhost:3000`
2. OneSignal izin popup'ı çıkacak
3. "Allow" tıkla
4. OneSignal Dashboard → Messages → New Push
5. Test bildirimi gönder

## 🎯 Entegrasyon

### Mevcut Notification Sistemi ile Entegre Et

```typescript
// Notification oluşturulduğunda OneSignal'a gönder
async function createNotification(userId: string, title: string, message: string) {
  // 1. Veritabanına kaydet (mevcut sistem)
  const { data } = await supabase
    .from('notifications')
    .insert({ user_id: userId, title, message })
    .select()
    .single();

  // 2. OneSignal'a gönder (yeni)
  await sendPushNotification([userId], title, message);

  return data;
}
```

## 📊 Avantajlar

### Şu Anki Sistem (PWA Push)
- ✅ Tarayıcı açıkken çalışıyor
- ❌ Tarayıcı kapalıyken çalışmıyor
- ❌ Karmaşık encryption

### OneSignal ile
- ✅ Tarayıcı açıkken çalışıyor
- ✅ Tarayıcı kapalıyken çalışıyor
- ✅ Kolay kurulum
- ✅ Dashboard
- ✅ Analytics

## 🔧 Production Ayarları

### Site URL Güncelle

Production'a alırken:

1. OneSignal Dashboard → Settings → Configuration
2. Site URL: `https://your-domain.com`
3. Allowed Origins: `https://your-domain.com`
4. Save

### Service Worker

OneSignal kendi service worker'ını kullanır. Mevcut `sw.js` ile çakışabilir.

**Çözüm:** OneSignal'ın service worker'ını kullan veya ikisini birleştir.

## 📱 Test Senaryoları

### Test 1: Tarayıcı Açıkken
1. Uygulamayı aç
2. OneSignal Dashboard'dan bildirim gönder
3. ✅ Bildirim görünmeli

### Test 2: Tarayıcı Kapalıyken
1. Tarayıcıyı kapat
2. OneSignal Dashboard'dan bildirim gönder
3. ✅ Bildirim görünmeli (işletim sistemi bildirimi)

### Test 3: Mobil
1. Mobil tarayıcıda aç
2. Home screen'e ekle (PWA)
3. Uygulamayı kapat
4. Bildirim gönder
5. ✅ Bildirim görünmeli

## 🎊 Sonuç

OneSignal ile push notification sistemi **tam çalışır** hale gelecek!

- Tarayıcı kapalıyken bile bildirim ✅
- Kolay yönetim ✅
- Güvenilir altyapı ✅

## 📚 Kaynaklar

- [OneSignal Docs](https://documentation.onesignal.com/)
- [React OneSignal](https://github.com/OneSignal/react-onesignal)
- [Web Push Guide](https://documentation.onesignal.com/docs/web-push-quickstart)

---

**Hazır mısınız?** Adım adım kuralım! 🚀
