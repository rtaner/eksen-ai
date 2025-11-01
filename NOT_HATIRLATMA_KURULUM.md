# Not Hatırlatma Sistemi Kurulum Kılavuzu

Bu doküman, not girişi hatırlatma bildirimlerinin kurulumunu açıklar.

## 📋 Özellikler

### 1. Günlük Genel Hatırlatma (22:00)
- **Hedef:** Owner ve Manager rolleri
- **Koşul:** Bugün hiç not girişi yapmadıysa
- **Mesaj:** "Bugün hiç not girişi yapmadınız"
- **İkon:** 💭

### 2. Personel Bazlı 3 Günlük Hatırlatma (22:15)
- **Hedef:** Owner ve Manager rolleri
- **Koşul:** Belirli bir personel için 3 gündür not girilmediyse
- **Mesaj:** "[Personel Adı] isimli personel için 3 gündür not girişi yapmıyorsunuz"
- **İkon:** 👤
- **Not:** Her personel için ayrı bildirim

## 🎯 Örnek Senaryo

**Kullanıcı:** Ahmet (Manager)
**Organizasyondaki Personeller:** Selim, Eren, Ayşe

### Bugün (1 Kasım):
- Eren için not girdi ✅
- Selim için 3 gündür not yok ❌
- Ayşe için 2 gündür not yok (henüz 3 gün olmadı)

**Alacağı Bildirimler:**
- ❌ "Bugün hiç not girişi yapmadınız" → GELMEYECEK (çünkü Eren için not girdi)
- ✅ "Selim isimli personel için 3 gündür not girişi yapmıyorsunuz" → GELECEK (22:15)

### Yarın (2 Kasım) - Hiç not girmezse:
- ✅ "Bugün hiç not girişi yapmadınız" → GELECEK (22:00)
- ✅ "Selim isimli personel için 3 gündür not girişi yapmıyorsunuz" → GELECEK (22:15)
- ✅ "Ayşe isimli personel için 3 gündür not girişi yapmıyorsunuz" → GELECEK (22:15)

## 🚀 Kurulum Adımları

### 1. Edge Function Deploy Edildi ✅

```bash
npx supabase functions deploy check-note-reminders
```

**Durum:** ✅ Başarıyla deploy edildi

### 2. Cron Job Kurulumu

Supabase Dashboard → SQL Editor'de aşağıdaki SQL komutlarını çalıştır:

```sql
-- 1. pg_cron extension'ını aktifleştir (eğer aktif değilse)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Akşam 22:00 için not hatırlatmaları - Günlük (19:00 UTC = 22:00 TR)
SELECT cron.schedule(
  'check-note-reminders-daily',
  '0 19 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://fnkaythbzngszjfymtgm.supabase.co/functions/v1/check-note-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZua2F5dGhiem5nc3pqZnltdGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NDkzMzUsImV4cCI6MjA3NzIyNTMzNX0.DFDIuWmZhj5miXCmMQP1EEOAAoMQ3XKTjaT7MPrDsFA'
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- 3. Akşam 22:15 için not hatırlatmaları - Personel bazlı (19:15 UTC = 22:15 TR)
SELECT cron.schedule(
  'check-note-reminders-personnel',
  '15 19 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://fnkaythbzngszjfymtgm.supabase.co/functions/v1/check-note-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZua2F5dGhiem5nc3pqZnltdGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NDkzMzUsImV4cCI6MjA3NzIyNTMzNX0.DFDIuWmZhj5miXCmMQP1EEOAAoMQ3XKTjaT7MPrDsFA'
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);
```

### 3. Kontrol Sorguları

**Cron job'ları listele:**
```sql
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname LIKE 'check-note-reminders%'
ORDER BY jobname;
```

**Son çalışmaları göster:**
```sql
SELECT 
  j.jobname,
  jrd.status,
  jrd.return_message,
  jrd.start_time,
  jrd.end_time
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
WHERE j.jobname LIKE 'check-note-reminders%'
ORDER BY jrd.start_time DESC
LIMIT 10;
```

## 🧪 Manuel Test

Edge Function'ı manuel olarak test etmek için:

```bash
curl -X POST https://fnkaythbzngszjfymtgm.supabase.co/functions/v1/check-note-reminders \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZua2F5dGhiem5nc3pqZnltdGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NDkzMzUsImV4cCI6MjA3NzIyNTMzNX0.DFDIuWmZhj5miXCmMQP1EEOAAoMQ3XKTjaT7MPrDsFA"
```

## 📊 Bildirim Tipleri

| Tip | Açıklama | İkon | Zamanlama |
|-----|----------|------|-----------|
| `note_reminder_daily` | Günlük genel hatırlatma | 💭 | 22:00 |
| `note_reminder_personnel` | Personel bazlı 3 günlük hatırlatma | 👤 | 22:15 |

## 🔧 Yönetim

### Cron Job'ları Durdurma

```sql
SELECT cron.unschedule('check-note-reminders-daily');
SELECT cron.unschedule('check-note-reminders-personnel');
```

### Cron Job'ları Yeniden Başlatma

1. Önce durdur (yukarıdaki komutlar)
2. Sonra schedule komutlarını tekrar çalıştır

## 📝 Notlar

- Bildirimler sadece owner ve manager rollerine gönderilir
- Aynı gün için aynı bildirim tekrar gönderilmez
- Personel bazlı bildirimler her personel için ayrı kontrol edilir
- 3 günlük süre, son not tarihinden itibaren hesaplanır
- Eğer personel için hiç not girilmemişse, personelin oluşturulma tarihinden itibaren 3 gün kontrol edilir

## ✅ Kurulum Durumu

- [x] Edge Function oluşturuldu
- [x] Edge Function deploy edildi
- [x] Bildirim tipleri eklendi
- [x] NotificationBell component güncellendi
- [ ] Cron job'ları kuruldu (SQL komutlarını çalıştır)
- [ ] Test edildi

## 🎉 Sonraki Adımlar

1. Supabase Dashboard'da SQL komutlarını çalıştır
2. Cron job'ların kurulduğunu kontrol et
3. Manuel test yap
4. Akşam 22:00 ve 22:15'te bildirimleri kontrol et
