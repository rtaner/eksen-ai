# 🚀 Cron Kurulum - Hızlı Başlangıç

## ⏱️ 5 Dakikada Kurulum

### Adım 1: Edge Function Deploy (1 dk)

```bash
# Terminal'de çalıştır
supabase functions deploy check-task-deadlines
```

**Kontrol:**
```bash
supabase functions list
# ✅ check-task-deadlines listede görünmeli
```

---

### Adım 2: Supabase Bilgilerini Hazırla (1 dk)

1. **Supabase Dashboard** aç: https://supabase.com/dashboard
2. Projenizi seçin
3. **Settings** → **API** → Şunları kopyalayın:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon key**: `eyJhbGc...` (uzun bir string)

---

### Adım 3: SQL Dosyasını Düzenle (1 dk)

`supabase/cron-setup.sql` dosyasını açın ve şunları değiştirin:

**Değiştirilecek 1:**
```sql
url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-task-deadlines',
```
↓
```sql
url := 'https://xxxxx.supabase.co/functions/v1/check-task-deadlines',
```

**Değiştirilecek 2:**
```sql
'Authorization', 'Bearer YOUR_ANON_KEY_HERE'
```
↓
```sql
'Authorization', 'Bearer eyJhbGc...'
```

**⚠️ İki yerde değiştirmelisiniz** (sabah ve öğleden sonra job'ları için)

---

### Adım 4: SQL'i Çalıştır (1 dk)

1. **Supabase Dashboard** → **SQL Editor**
2. **New query** tıklayın
3. `supabase/cron-setup.sql` dosyasının içeriğini kopyalayıp yapıştırın
4. **Run** butonuna tıklayın

**Beklenen Sonuç:**
```
Success. No rows returned
```

---

### Adım 5: Kontrol Et (1 dk)

**SQL Editor'de yeni query açın:**

```sql
-- Cron job'ları listele
SELECT 
  jobid,
  jobname,
  schedule,
  active
FROM cron.job
WHERE jobname LIKE 'check-task-deadlines%'
ORDER BY jobname;
```

**Beklenen Sonuç:**
```
jobid | jobname                          | schedule    | active
------|----------------------------------|-------------|--------
1     | check-task-deadlines-morning     | 0 8 * * *   | true
2     | check-task-deadlines-afternoon   | 0 13 * * *  | true
```

✅ **İki satır görüyorsanız kurulum başarılı!**

---

## 🧪 Test (Opsiyonel)

### Manuel Test

```bash
# Terminal'de
curl -X POST https://xxxxx.supabase.co/functions/v1/check-task-deadlines \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Beklenen Sonuç:**
```json
{
  "success": true,
  "message": "Checked X tasks. Sent Y notifications.",
  "stats": {
    "totalTasks": 5,
    "dueToday": 2,
    "overdue": 1
  }
}
```

### Logs Kontrol

```bash
# Terminal'de
supabase functions logs check-task-deadlines --limit 10
```

---

## 📅 Çalışma Zamanları

| Türkiye Saati | UTC | Cron Schedule | Ne Zaman |
|---------------|-----|---------------|----------|
| **11:00** | 08:00 | `0 8 * * *` | Sabah vardiyası |
| **16:00** | 13:00 | `0 13 * * *` | Öğleden sonra vardiyası |

**Her gün bu saatlerde:**
- Bugün biten görevler kontrol edilir
- Gecikmiş görevler kontrol edilir
- Tüm manager/owner'lara bildirim gönderilir

---

## 🔍 Monitoring

### Bugün Çalıştı mı?

```sql
-- SQL Editor'de
SELECT 
  j.jobname,
  jrd.status,
  jrd.start_time,
  jrd.return_message
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
WHERE j.jobname LIKE 'check-task-deadlines%'
  AND jrd.start_time >= CURRENT_DATE
ORDER BY jrd.start_time DESC;
```

### Son 24 Saat

```sql
SELECT 
  j.jobname,
  COUNT(*) as run_count,
  COUNT(CASE WHEN jrd.status = 'succeeded' THEN 1 END) as success,
  COUNT(CASE WHEN jrd.status = 'failed' THEN 1 END) as failed
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
WHERE j.jobname LIKE 'check-task-deadlines%'
  AND jrd.start_time > NOW() - INTERVAL '24 hours'
GROUP BY j.jobname;
```

---

## 🚨 Sorun Giderme

### Cron Job Görünmüyor

```sql
-- pg_cron extension aktif mi?
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

Eğer boş dönerse:
```sql
CREATE EXTENSION pg_cron;
```

### Cron Çalışmıyor

```sql
-- Job aktif mi?
SELECT * FROM cron.job WHERE jobname LIKE 'check-task-deadlines%';
-- active = true olmalı
```

### Edge Function Hatası

```bash
# Logs kontrol et
supabase functions logs check-task-deadlines --limit 50

# Manuel test
curl -X POST https://xxxxx.supabase.co/functions/v1/check-task-deadlines \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

## 🔧 Yönetim

### Cron Job'ı Durdur

```sql
SELECT cron.unschedule('check-task-deadlines-morning');
SELECT cron.unschedule('check-task-deadlines-afternoon');
```

### Cron Job'ı Yeniden Başlat

1. Önce durdur (yukarıdaki komut)
2. `supabase/cron-setup.sql` dosyasını tekrar çalıştır

### Schedule Değiştir

```sql
-- Önce durdur
SELECT cron.unschedule('check-task-deadlines-morning');

-- Yeni saat ile oluştur (örnek: 10:00 TR = 07:00 UTC)
SELECT cron.schedule(
  'check-task-deadlines-morning',
  '0 7 * * *',
  $$ ... $$
);
```

---

## ✅ Checklist

- [ ] Edge Function deploy edildi
- [ ] Supabase bilgileri hazır (URL + Anon Key)
- [ ] SQL dosyası düzenlendi
- [ ] SQL çalıştırıldı
- [ ] Cron job'lar listede görünüyor
- [ ] Manuel test yapıldı
- [ ] İlk otomatik çalışma bekleniyor (11:00 veya 16:00)

---

## 📚 Detaylı Dokümantasyon

- **Adım Adım Kılavuz**: `SUPABASE_CRON_KURULUM.md`
- **Karşılaştırma**: `CRON_KARSILASTIRMA.md`
- **Limit Analizi**: `SUPABASE_LIMIT_ANALIZI.md`
- **Edge Function**: `supabase/functions/check-task-deadlines/README.md`

---

**Tebrikler! 🎉** Cron job'lar kuruldu ve günde 2 kez (11:00 ve 16:00) otomatik çalışacak.
