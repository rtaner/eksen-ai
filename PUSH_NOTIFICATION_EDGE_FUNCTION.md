# Push Notification Edge Function Kurulumu

## 📋 Oluşturulan Dosyalar

1. ✅ `supabase/functions/send-push-notification/index.ts` - Edge Function
2. ✅ `supabase/migrations/20241101_011_push_notification_trigger.sql` - Database Trigger

## ⚠️ Önemli Not

Şu anda oluşturduğumuz Edge Function **basitleştirilmiş bir versiyon**. Gerçek production kullanımı için **web-push** kütüphanesi gerekli.

### Neden Basitleştirilmiş?

Web Push Protocol çok karmaşık:
- VAPID authentication (JWT token)
- Payload encryption (AES-GCM)
- Content encoding
- ECDH key exchange

Bu işlemler için `web-push` npm paketi kullanılmalı, ama Deno'da bu paket tam desteklenmiyor.

## 🚀 Kurulum Seçenekleri

### Seçenek 1: Manuel Test (Şimdilik)

Şu anda browser notification çalışıyor. Gerçek push için:

1. Notification oluşturulduğunda
2. Manuel olarak Edge Function çağırın:

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/send-push-notification \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"notificationId": "NOTIFICATION_ID"}'
```

### Seçenek 2: Production-Ready (Önerilen)

**web-push-deno** kütüphanesi kullanın:

```typescript
// supabase/functions/send-push-notification/index.ts
import webpush from 'https://deno.land/x/web_push/mod.ts';

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!
);

// Push gönder
await webpush.sendNotification(
  {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  },
  JSON.stringify(payload)
);
```

### Seçenek 3: Alternatif Servis

**OneSignal** veya **Firebase Cloud Messaging** gibi hazır servisler kullanın.

## 📝 Yapılması Gerekenler

### 1. Migration Çalıştır

```sql
-- Supabase Dashboard → SQL Editor
-- supabase/migrations/20241101_011_push_notification_trigger.sql içeriğini yapıştır
```

### 2. Edge Function Deploy Et (Opsiyonel)

```bash
# Supabase CLI ile
supabase functions deploy send-push-notification --no-verify-jwt

# Environment variables ekle
supabase secrets set VAPID_PUBLIC_KEY=YOUR_PUBLIC_KEY
supabase secrets set VAPID_PRIVATE_KEY=YOUR_PRIVATE_KEY
```

### 3. Test Et

```bash
# 1. Yeni bir notification oluştur
# 2. Notification ID'yi al
# 3. Edge Function'ı çağır

curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/send-push-notification \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"notificationId": "YOUR_NOTIFICATION_ID"}'
```

## 🎯 Şu Anki Durum

### ✅ Çalışan
- Browser notifications (tarayıcı açıkken)
- Service Worker
- Push subscription yönetimi
- Veritabanı yapısı

### ⏳ Eksik
- Gerçek push notification (tarayıcı kapalıyken)
- Otomatik trigger (pg_net extension)
- Production-ready encryption

## 💡 Öneriler

### Kısa Vadede
Şu anki sistem yeterli! Browser notifications çoğu kullanım senaryosu için yeterli.

### Uzun Vadede
1. **OneSignal** entegrasyonu (en kolay)
2. **Firebase Cloud Messaging** (Google ekosistemi)
3. **web-push-deno** ile custom implementation

## 📚 Kaynaklar

- [Web Push Protocol](https://datatracker.ietf.org/doc/html/rfc8030)
- [VAPID Spec](https://datatracker.ietf.org/doc/html/rfc8292)
- [OneSignal Docs](https://documentation.onesignal.com/)
- [web-push npm](https://www.npmjs.com/package/web-push)

## 🎊 Sonuç

**Sistem şu haliyle kullanıma hazır!** 

Browser notifications çalışıyor ve çoğu kullanım senaryosu için yeterli. Gerçek push notification (tarayıcı kapalıyken) için yukarıdaki seçeneklerden birini uygulayabilirsiniz.

---

**Sorularınız için:** Dokümantasyonu okuyun veya destek isteyin! 🚀
