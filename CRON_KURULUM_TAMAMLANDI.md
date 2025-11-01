# ✅ Cron Kurulum Hazır!

## 🎉 Tamamlanan Adımlar

### ✅ Adım 1: Edge Function Deploy Edildi
```
Function: check-task-deadlines
Status: ✅ Deployed
URL: https://fnkaythbzngszjfymtgm.supabase.co/functions/v1/check-task-deadlines
```

### ✅ Adım 2: SQL Dosyası Hazırlandı
```
Dosya: supabase/cron-setup.sql
Status: ✅ Hazır (bilgileriniz otomatik eklendi)
```

---

## 🚀 Şimdi Ne Yapmalısınız?

### Adım 3: SQL'i Supabase'de Çalıştırın

1. **Supabase Dashboard'u açın:**
   https://supabase.com/dashboard/project/fnkaythbzngszjfymtgm

2. **SQL Editor'e gidin:**
   Sol menüden **SQL Editor** → **New query**

3. **SQL dosyasını kopyalayın:**
   `supabase/cron-setup.sql` dosyasının tüm içeriğini kopyalayın

4. **Yapıştırın ve çalıştırın:**
   - SQL Editor'e yapıştırın
   - **Run** butonuna tıklayın

5. **Sonucu kontrol edin:**
   ```
   Beklenen: "Success. No rows returned"
   ```

---

## 🧪 Test Etme

### Manuel Test (Hemen Çalıştır)

Terminal'de:
```bash
curl -X POST https://fnkaythbzngszjfymtgm.supabase.co/functions/v1/check-task-deadlines -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZua2F5dGhiem5nc3pqZnltdGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NDkzMzUsImV4cCI6MjA3NzIyNTMzNX0.DFDIuWmZhj5miXCmMQP1EEOAAoMQ3XKTjaT7MPrDsFA"
```

Beklenen sonuç:
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

---

## 📊 Cron Job Kontrol

SQL Editor'de çalıştırın:

```sql
-- Cron job'lar kuruldu mu?
SELECT 
  jobid,
  jobname,
  schedule,
  active
FROM cron.job
WHERE jobname LIKE 'check-task-deadlines%'
ORDER BY jobname;
```

Beklenen sonuç:
```
jobid | jobname                          | schedule    | active
------|----------------------------------|-------------|--------
1     | check-task-deadlines-morning     | 0 8 * * *   | true
2     | check-task-deadlines-afternoon   | 0 13 * * *  | true
```

---

## ⏰ Çalışma Zamanları

| Türkiye Saati | UTC | Ne Zaman |
|---------------|-----|----------|
| **11:00** | 08:00 | Sabah vardiyası |
| **16:00** | 13:00 | Öğleden sonra vardiyası |

**Her gün bu saatlerde:**
- Bugün biten görevler kontrol edilir
- Gecikmiş görevler kontrol edilir
- Tüm manager/owner'lara bildirim gönderilir

---

## 📋 Checklist

- [x] Edge Function deploy edildi
- [x] SQL dosyası hazırlandı
- [ ] SQL Supabase'de çalıştırıldı
- [ ] Cron job'lar kontrol edildi
- [ ] Manuel test yapıldı
- [ ] İlk otomatik çalışma bekleniyor

---

## 🚨 Sorun Giderme

### pg_cron Extension Hatası

Eğer "extension pg_cron does not exist" hatası alırsanız:

1. Supabase Dashboard → **Database** → **Extensions**
2. `pg_cron` extension'ını bulun
3. **Enable** butonuna tıklayın
4. SQL'i tekrar çalıştırın

### Cron Job Görünmüyor

```sql
-- Extension aktif mi?
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

Boş dönerse:
```sql
CREATE EXTENSION pg_cron;
```

---

## 📞 Yardım

Sorun yaşarsanız:
1. Supabase Dashboard → **Logs** → **Edge Functions**
2. `check-task-deadlines` fonksiyonunun loglarını kontrol edin
3. SQL Editor'de cron job'ları kontrol edin

---

**Tebrikler! 🎉** Kurulum neredeyse tamamlandı. Sadece SQL'i Supabase'de çalıştırmanız kaldı!
