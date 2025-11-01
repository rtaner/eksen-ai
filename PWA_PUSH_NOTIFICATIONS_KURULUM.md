# PWA Push Notifications Kurulum Rehberi

## 🎯 Özellikler

✅ Tarayıcı kapalıyken bile bildirim
✅ Cross-platform (Chrome, Firefox, Edge, Safari)
✅ Kullanıcı bazlı abonelik yönetimi
✅ Test modu
✅ Otomatik temizleme (90 gün)

## 📋 Gereksinimler

1. **HTTPS** - Push notifications sadece HTTPS'de çalışır
2. **VAPID Keys** - Web Push için gerekli
3. **Service Worker** - PWA için gerekli

## 🔧 Kurulum Adımları

### 1. VAPID Keys Oluştur

```bash
# Node.js ile
npx web-push generate-vapid-keys

# Veya online tool kullan
# https://vapidkeys.com/
```

Çıktı:
```
Public Key: BKxxx...
Private Key: xxx...
```

### 2. Environment Variables Ekle

`.env.local` dosyasına ekle:

```env
# VAPID Keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BKxxx...
VAPID_PRIVATE_KEY=xxx...
```

**ÖNEMLİ:** 
- Public key `NEXT_PUBLIC_` prefix ile başlamalı (client-side)
- Private key prefix olmadan (server-side only)

### 3. Migration Çalıştır

```bash
# Supabase CLI ile
supabase db push

# Veya SQL Editor'de manuel çalıştır
# supabase/migrations/20241101_010_create_push_subscriptions.sql
```

### 4. Service Worker Kontrol

`public/sw.js` dosyası otomatik olarak oluşturuldu. Kontrol edin:

```bash
# Dosya var mı?
ls public/sw.js

# İçeriği kontrol et
cat public/sw.js
```

### 5. Test Et

1. **Development server başlat:**
```bash
npm run dev
```

2. **Tarayıcıda aç:**
```
http://localhost:3000/settings/notifications
```

3. **"Bildirimleri Aç" butonuna tıkla**
   - İzin iste popup'ı çıkacak
   - "İzin Ver" seç
   - Abonelik başarılı mesajı

4. **"Test Et" butonuna tıkla**
   - Test bildirimi görünmeli

## 📱 Kullanım

### Frontend (Kullanıcı)

1. Settings → Bildirim Ayarları
2. "Bildirimleri Aç" butonu
3. İzin ver
4. ✅ Aktif

### Backend (Bildirim Gönderme)

Şu anda bildirimler veritabanına kaydediliyor ama push gönderilmiyor. Push göndermek için Edge Function gerekli.

## 🚀 Edge Function (Sonraki Adım)

Push notification göndermek için bir Edge Function oluşturmalıyız:

```typescript
// supabase/functions/send-push-notification/index.ts
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!
);

// Bildirim gönder
await webpush.sendNotification(subscription, payload);
```

Bu fonksiyon:
1. Yeni bildirim oluşturulduğunda tetiklenir
2. Kullanıcının push subscription'ını bulur
3. Web Push API ile bildirim gönderir

## 🔍 Sorun Giderme

### "VAPID key bulunamadı" Hatası

**Çözüm:**
1. `.env.local` dosyasını kontrol et
2. `NEXT_PUBLIC_VAPID_PUBLIC_KEY` var mı?
3. Development server'ı yeniden başlat

### "Service Worker kaydedilemedi" Hatası

**Çözüm:**
1. `public/sw.js` dosyası var mı?
2. HTTPS kullanıyor musunuz? (localhost hariç)
3. Browser console'da hata var mı?

### "Bildirim izni reddedildi" Hatası

**Çözüm:**
1. Tarayıcı ayarlarından izni sıfırla
2. Chrome: Settings → Privacy → Site Settings → Notifications
3. Siteyi bulup "Reset permissions"

### Push Bildirimi Gelmiyor

**Kontrol listesi:**
- [ ] VAPID keys doğru mu?
- [ ] Service Worker aktif mi? (DevTools → Application → Service Workers)
- [ ] Subscription veritabanına kaydedildi mi?
- [ ] Edge Function çalışıyor mu?
- [ ] Tarayıcı bildirimlere izin verdi mi?

## 📊 Veritabanı Yapısı

### push_subscriptions Tablosu

```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  organization_id UUID REFERENCES organizations(id),
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ
);
```

### Örnek Subscription

```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "BKxxx...",
    "auth": "xxx..."
  }
}
```

## 🔐 Güvenlik

### VAPID Keys
- ✅ Public key frontend'de kullanılabilir
- ❌ Private key ASLA frontend'e koyma
- ✅ Private key sadece Edge Function'da

### RLS Policies
- ✅ Kullanıcılar sadece kendi subscription'larını görebilir
- ✅ Kullanıcılar sadece kendi subscription'larını silebilir
- ✅ Organization izolasyonu

### Endpoint Validation
- ✅ Unique constraint (aynı endpoint tekrar kaydedilemez)
- ✅ User agent kaydediliyor (debug için)
- ✅ Last used tracking (temizlik için)

## 📈 İzleme ve Bakım

### Otomatik Temizleme

90 günden eski subscription'lar otomatik silinir:

```sql
SELECT cleanup_old_push_subscriptions();
```

Bu fonksiyonu cron job ile çalıştırabilirsiniz:

```sql
SELECT cron.schedule(
  'cleanup-push-subscriptions',
  '0 0 * * 0',  -- Her Pazar 00:00
  $$ SELECT cleanup_old_push_subscriptions(); $$
);
```

### Metrics

```sql
-- Aktif subscription sayısı
SELECT COUNT(*) FROM push_subscriptions;

-- Organizasyon bazında
SELECT organization_id, COUNT(*) 
FROM push_subscriptions 
GROUP BY organization_id;

-- Son 7 günde kullanılan
SELECT COUNT(*) 
FROM push_subscriptions 
WHERE last_used_at > NOW() - INTERVAL '7 days';
```

## 🎨 UI Customization

### Bildirim İkonları

`public/` klasöründe:
- `icon-192x192.png` - Bildirim ikonu
- `icon-512x512.png` - Splash screen

### Bildirim Sesleri

Service Worker'da ses ekle:

```javascript
self.addEventListener('push', (event) => {
  // ... mevcut kod
  
  const options = {
    // ... mevcut options
    sound: '/notification-sound.mp3',  // Ses ekle
    vibrate: [200, 100, 200],  // Titreşim pattern
  };
});
```

## 📚 Kaynaklar

- [Web Push Protocol](https://datatracker.ietf.org/doc/html/rfc8030)
- [Push API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [VAPID Spec](https://datatracker.ietf.org/doc/html/rfc8292)

## ✅ Checklist

Kurulum tamamlandı mı?

- [ ] VAPID keys oluşturuldu
- [ ] Environment variables eklendi
- [ ] Migration çalıştırıldı
- [ ] Service Worker test edildi
- [ ] Push subscription test edildi
- [ ] Test bildirimi gönderildi
- [ ] Edge Function planlandı (sonraki adım)

## 🚀 Sonraki Adımlar

1. **Edge Function Oluştur** - Push göndermek için
2. **Bildirim Trigger'ları** - Hangi olaylarda push gönderilecek?
3. **Bildirim Tercihleri** - Kullanıcı hangi bildirimleri almak istiyor?
4. **Analytics** - Kaç bildirim gönderildi, kaçı açıldı?
5. **A/B Testing** - Hangi bildirimler daha etkili?

---

**Sorularınız için:** Dokümantasyonu okuyun veya destek isteyin! 🎉
