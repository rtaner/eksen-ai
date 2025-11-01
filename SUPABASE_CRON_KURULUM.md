# Supabase Cron Kurulum Kılavuzu

## 🎯 Hedef
Görev son tarih kontrolü için günde 2 kez cron job çalıştırma:
- **11:00** (Sabah vardiyası)
- **16:00** (Öğleden sonra vardiyası)

---

## 📋 Ön Gereksinimler

### 1. Edge Function Deploy
```bash
# Terminal'de çalıştır
supabase functions deploy check-task-deadlines
```

**Kontrol:**
```bash
supabase functions list
# check-task-deadlines listede görünmeli
```

### 2. Supabase Bilgilerini Hazırla

**Supabase Dashboard → Settings → API**

Şunları not edin:
- **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## 🚀 Kurulum Adımları

### Adım 1: pg_cron Extension'ı Aktifleştir

1. **Supabase Dashboard** → **Database** → **Extensions**
2. `pg_cron` extension'ını bulun
3. **Enable** butonuna tıklayın
4. Birkaç saniye bekleyin (extension yükleniyor)

**Kontrol:**
```sql
-- SQL Editor'de çalıştır
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
-- Sonuç dönmeli
```

### Adım 2: Cron Job Oluştur (11:00)

**Supabase Dashboard → SQL Editor → New query**

```sql
-- Sabah 11:00 için cron job
SELECT cron.schedule(
  'check-task-deadlines-morning',           -- Job adı
  '0 8 * * *',                              -- Her gün 08:00 UTC (TR 11:00)
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-task-deadlines',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_ANON_KEY_HERE'
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);
```

**⚠️ ÖNEMLİ:**
1. `YOUR_PROJECT_REF` yerine kendi project ref'inizi yazın
2. `YOUR_ANON_KEY_HERE` yerine kendi anon key'inizi yazın

**Run** butonuna tıklayın.

### Adım 3: Cron Job Oluştur (16:00)

**Yeni query açın:**

```sql
-- Öğleden sonra 16:00 için cron job
SELECT cron.schedule(
  'check-task-deadlines-afternoon',         -- Job adı
  '0 13 * * *',                             -- Her gün 13:00 UTC (TR 16:00)
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-task-deadlines',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_ANON_KEY_HERE'
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);
```

**⚠️ ÖNEMLİ:**
1. `YOUR_PROJECT_REF` yerine kendi project ref'inizi yazın
2. `YOUR_ANON_KEY_HERE` yerine kendi anon key'inizi yazın

**Run** butonuna tıklayın.

### Adım 4: Cron Job'ları Kontrol Et

```sql
-- Tüm cron job'ları listele
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  active
FROM cron.job
ORDER BY jobname;
```

**Beklenen Sonuç:**
```
jobid | jobname                          | schedule    | active
------|----------------------------------|-------------|--------
1     | check-task-deadlines-morning     | 0 8 * * *   | true
2     | check-task-deadlines-afternoon   | 0 13 * * *  | true
```

---

## 🧪 Test Etme

### Manuel Test (Hemen Çalıştır)

```sql
-- Test için geçici job oluştur (her dakika çalışır)
SELECT cron.schedule(
  'check-task-deadlines-test',
  '* * * * *',  -- Her dakika
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-task-deadlines',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_ANON_KEY_HERE'
      )
    );
  $$
);
```

**2-3 dakika bekleyin, sonra kontrol edin:**

```sql
-- Son çalışmaları göster
SELECT 
  jobid,
  runid,
  job_pid,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'check-task-deadlines-test')
ORDER BY start_time DESC
LIMIT 5;
```

**Test job'ı sil:**
```sql
SELECT cron.unschedule('check-task-deadlines-test');
```

### Edge Function Logs Kontrol

```bash
# Terminal'de
supabase functions logs check-task-deadlines --follow
```

Cron çalıştığında log'ları göreceksiniz.

---

## 📊 Monitoring

### Çalışma Geçmişi

```sql
-- Son 24 saatteki tüm çalışmalar
SELECT 
  j.jobname,
  jrd.runid,
  jrd.status,
  jrd.return_message,
  jrd.start_time,
  jrd.end_time,
  EXTRACT(EPOCH FROM (jrd.end_time - jrd.start_time)) as duration_seconds
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
WHERE j.jobname LIKE 'check-task-deadlines%'
  AND jrd.start_time > NOW() - INTERVAL '24 hours'
ORDER BY jrd.start_time DESC;
```

### Başarısız Çalışmalar

```sql
-- Hatalı çalışmaları göster
SELECT 
  j.jobname,
  jrd.status,
  jrd.return_message,
  jrd.start_time
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
WHERE j.jobname LIKE 'check-task-deadlines%'
  AND jrd.status = 'failed'
ORDER BY jrd.start_time DESC
LIMIT 10;
```

### Bugünkü Çalışmalar

```sql
-- Bugün kaç kez çalıştı?
SELECT 
  j.jobname,
  COUNT(*) as run_count,
  COUNT(CASE WHEN jrd.status = 'succeeded' THEN 1 END) as success_count,
  COUNT(CASE WHEN jrd.status = 'failed' THEN 1 END) as failed_count
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
WHERE j.jobname LIKE 'check-task-deadlines%'
  AND jrd.start_time >= CURRENT_DATE
GROUP BY j.jobname;
```

---

## 🔧 Yönetim

### Cron Job'ı Durdur

```sql
-- Sabah job'ını durdur
SELECT cron.unschedule('check-task-deadlines-morning');

-- Öğleden sonra job'ını durdur
SELECT cron.unschedule('check-task-deadlines-afternoon');
```

### Cron Schedule Değiştir

```sql
-- Önce mevcut job'ı sil
SELECT cron.unschedule('check-task-deadlines-morning');

-- Yeni schedule ile tekrar oluştur (örnek: 10:00)
SELECT cron.schedule(
  'check-task-deadlines-morning',
  '0 7 * * *',  -- 07:00 UTC = 10:00 TR
  $$ ... $$
);
```

### Tüm Cron Job'ları Sil

```sql
-- Dikkatli kullanın!
SELECT cron.unschedule('check-task-deadlines-morning');
SELECT cron.unschedule('check-task-deadlines-afternoon');
```

---

## ⏰ Timezone Hesaplaması

**Türkiye Saati → UTC Dönüşümü:**

| Türkiye Saati | UTC (Yaz) | UTC (Kış) | Cron Schedule |
|---------------|-----------|-----------|---------------|
| 09:00 | 06:00 | 07:00 | `0 6 * * *` (yaz) |
| 11:00 | 08:00 | 09:00 | `0 8 * * *` (yaz) |
| 16:00 | 13:00 | 14:00 | `0 13 * * *` (yaz) |
| 18:00 | 15:00 | 16:00 | `0 15 * * *` (yaz) |

**Not:** Türkiye yaz saati uygulaması 2016'da kaldırıldı, şu an sürekli UTC+3.

**Bizim Kurulum:**
- 11:00 TR = 08:00 UTC → `0 8 * * *`
- 16:00 TR = 13:00 UTC → `0 13 * * *`

---

## 🚨 Sorun Giderme

### Cron Çalışmıyor

**1. Extension aktif mi?**
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

**2. Job aktif mi?**
```sql
SELECT * FROM cron.job WHERE jobname LIKE 'check-task-deadlines%';
-- active = true olmalı
```

**3. Son çalışma ne zaman?**
```sql
SELECT MAX(start_time) 
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
WHERE j.jobname LIKE 'check-task-deadlines%';
```

### Edge Function Hatası

**Logs kontrol:**
```bash
supabase functions logs check-task-deadlines --limit 50
```

**Manuel test:**
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/check-task-deadlines \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Duplicate Bildirimler

Edge Function aynı gün için tekrar bildirim göndermez. Eğer duplicate görüyorsanız:

```sql
-- Bugün kaç bildirim gönderildi?
SELECT 
  type,
  COUNT(*) as count
FROM notifications
WHERE created_at >= CURRENT_DATE
  AND type IN ('task_due', 'task_overdue')
GROUP BY type;
```

---

## ✅ Kurulum Checklist

- [ ] Edge Function deploy edildi (`supabase functions deploy`)
- [ ] pg_cron extension aktif
- [ ] Sabah cron job oluşturuldu (11:00)
- [ ] Öğleden sonra cron job oluşturuldu (16:00)
- [ ] Cron job'lar listede görünüyor
- [ ] Manuel test yapıldı ve başarılı
- [ ] Logs kontrol edildi
- [ ] İlk otomatik çalışma bekleniyor

---

## 📞 Destek

**Sorun devam ediyorsa:**
1. Supabase Dashboard → Logs → Edge Functions
2. SQL Editor'de çalışma geçmişini kontrol et
3. Edge Function logs'u kontrol et
4. Timezone hesaplamasını doğrula

**Tebrikler! 🎉** Cron job'lar kuruldu ve günde 2 kez (11:00 ve 16:00) otomatik çalışacak.
