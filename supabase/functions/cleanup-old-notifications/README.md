# Cleanup Old Notifications Edge Function

Bu Edge Function, 7 günden eski bildirimleri otomatik olarak siler.

## Özellikler

- ✅ 7 günden eski bildirimleri siler
- ✅ Veritabanı boyutunu optimize eder
- ✅ Performansı artırır
- ✅ Günde 1 kez çalışır (gece 03:00)

## Neden Gerekli?

Bildirimler zamanla birikir ve:
- Veritabanı boyutu artar
- Sorgular yavaşlar
- Gereksiz veri saklanır

7 günden eski bildirimler genellikle kullanıcılar tarafından zaten görülmüş ve işlenmiştir.

## Deployment

```bash
npx supabase functions deploy cleanup-old-notifications
```

## Cron Job Kurulumu

Bu fonksiyon günde 1 kez çalışmalı:
- 03:00 (00:00 UTC) - Gece yarısı temizlik

SQL komutu `supabase/cron-setup.sql` dosyasına eklenmelidir.

## Test

```bash
curl -X POST https://[PROJECT_REF].supabase.co/functions/v1/cleanup-old-notifications \
  -H "Authorization: Bearer [ANON_KEY]"
```

## Silme Kriteri

- **7 gün ve daha eski** bildirimler silinir
- Son 1 haftalık bildirimler korunur
- Tüm bildirim tipleri için geçerli

## Güvenlik

- Service role key kullanır (RLS bypass)
- Sadece eski bildirimleri siler
- Kullanıcı verilerini etkilemez
