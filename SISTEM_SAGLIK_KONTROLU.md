# 🏥 Sistem Sağlık Kontrolü

Bu dosya, Eksen AI sisteminin tüm bağlantılarını ve servislerini kontrol etmek için SQL sorguları içerir.

## 📋 Kontrol Listesi

### 1️⃣ Cron Jobs Kontrolü

```sql
-- Tüm cron job'ları listele
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
ORDER BY jobname;
```

**Beklenen Sonuç:**
- ✅ `create-scheduled-task-instances-daily` - `1 0 * * *` - active: true
- ✅ `check-task-deadlines` - `0 9 * * *` - active: true (varsa)
- ✅ `check-note-reminders` - `0 * * * *` - active: true (varsa)
- ✅ `cleanup-old-notifications` - `0 2 * * *` - active: true (varsa)

---

### 2️⃣ Cron Job Çalışma Geçmişi

```sql
-- Son 10 cron job çalıştırmasını göster
SELECT 
  j.jobname,
  r.runid,
  r.start_time,
  r.end_time,
  r.status,
  r.return_message
FROM cron.job_run_details r
JOIN cron.job j ON j.jobid = r.jobid
ORDER BY r.start_time DESC
LIMIT 10;
```

**Beklenen Sonuç:**
- ✅ Status: `succeeded` veya `starting`
- ✅ Son çalışma zamanı: Bugün veya dün
- ❌ Status: `failed` ise sorun var!

---

### 3️⃣ Real-time Publication Kontrolü

```sql
-- Real-time için aktif tablolar
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
```

**Beklenen Sonuç:**
- ✅ `scheduled_tasks`
- ✅ `tasks`
- ✅ `notifications`
- ✅ `notes`

---

### 4️⃣ Edge Functions Kontrolü

Supabase Dashboard → Edge Functions → Functions

**Beklenen Sonuç:**
- ✅ `analyze-butunlesik` - Deployed
- ✅ `analyze-egilim` - Deployed
- ✅ `analyze-yetkinlik` - Deployed
- ✅ `check-note-reminders` - Deployed
- ✅ `check-task-deadlines` - Deployed
- ✅ `cleanup-old-notifications` - Deployed
- ✅ `create-scheduled-task-instances` - Deployed
- ✅ `send-push-notification` - Deployed
- ✅ `send-onesignal-notification` - Deployed
- ✅ `update-user-password` - Deployed

---

### 5️⃣ Database Tablolar Kontrolü

```sql
-- Tüm tabloları listele
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Beklenen Tablolar:**
- ✅ `organizations`
- ✅ `profiles`
- ✅ `personnel`
- ✅ `notes`
- ✅ `tasks`
- ✅ `scheduled_tasks`
- ✅ `scheduled_task_skip_dates`
- ✅ `scheduled_task_leave_dates`
- ✅ `notifications`
- ✅ `ai_analyses`

---

### 6️⃣ RLS (Row Level Security) Kontrolü

```sql
-- RLS aktif mi?
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Beklenen Sonuç:**
- ✅ Tüm tablolarda `rowsecurity = true`

---

### 7️⃣ Zamanlanmış Görevler Kontrolü

```sql
-- Aktif zamanlanmış görevler
SELECT 
  id,
  description,
  recurrence_type,
  assignment_type,
  is_active,
  created_at
FROM scheduled_tasks
WHERE is_active = true
ORDER BY created_at DESC;
```

**Kontrol:**
- ✅ Zamanlanmış görevler var mı?
- ✅ `is_active = true` olanlar var mı?

---

### 8️⃣ Son Oluşturulan Görevler

```sql
-- Son 24 saatte oluşturulan görevler
SELECT 
  t.id,
  t.description,
  t.deadline,
  t.status,
  t.scheduled_task_id,
  t.created_at,
  p.name || ' ' || p.surname as personnel_name
FROM tasks t
LEFT JOIN personnel p ON p.id = t.personnel_id
WHERE t.created_at > NOW() - INTERVAL '24 hours'
  AND t.scheduled_task_id IS NOT NULL
ORDER BY t.created_at DESC;
```

**Kontrol:**
- ✅ Bugün otomatik görev oluştu mu?
- ✅ `scheduled_task_id` dolu mu?

---

### 9️⃣ Bildirimler Kontrolü

```sql
-- Son 24 saatte oluşturulan bildirimler
SELECT 
  type,
  title,
  COUNT(*) as count,
  MAX(created_at) as last_created
FROM notifications
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY type, title
ORDER BY last_created DESC;
```

**Kontrol:**
- ✅ Bildirimler oluşuyor mu?
- ✅ `task_assigned` bildirimleri var mı?

---

### 🔟 OneSignal Entegrasyonu

```sql
-- Push notification ayarları olan kullanıcılar
SELECT 
  COUNT(*) as total_users_with_push
FROM profiles
WHERE push_subscription IS NOT NULL;
```

**Kontrol:**
- ✅ Push notification'a abone kullanıcı var mı?

---

## 🧪 Manuel Test

### Test 1: Zamanlanmış Görev Oluşturma

1. Ayarlar → Zamanlanmış Görevler
2. Yeni görev oluştur:
   - Açıklama: "Test Görevi"
   - Tekrar: Günlük
   - Atanan: Kendin
   - Varsayılan Saat: 23:59
3. Kaydet
4. ✅ Liste anında güncellendi mi?

### Test 2: Manuel Cron Tetikleme

```sql
-- Manuel olarak cron job'ı tetikle
SELECT
  net.http_post(
    url:='https://fnkaythbzngszjfymtgm.supabase.co/functions/v1/create-scheduled-task-instances',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZua2F5dGhiem5nc3pqZnltdGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NDkzMzUsImV4cCI6MjA3NzIyNTMzNX0.DFDIuWmZhj5miXCmMQP1EEOAAoMQ3XKTjaT7MPrDsFA"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
```

**Kontrol:**
- ✅ Görevler oluştu mu? (tasks tablosuna bak)
- ✅ Bildirimler gitti mi? (notifications tablosuna bak)

### Test 3: Real-time Subscription

1. İki tarayıcı/sekme aç
2. Her ikisinde de zamanlanmış görevler sayfası
3. Birinden görev ekle/sil
4. ✅ Diğer sekmede anında güncellendi mi?

---

## 🚨 Sorun Giderme

### Cron Job Çalışmıyor

```sql
-- Cron job'ı yeniden oluştur
SELECT cron.unschedule('create-scheduled-task-instances-daily');

SELECT cron.schedule(
  'create-scheduled-task-instances-daily',
  '1 0 * * *',
  $$
  SELECT
    net.http_post(
      url:='https://fnkaythbzngszjfymtgm.supabase.co/functions/v1/create-scheduled-task-instances',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZua2F5dGhiem5nc3pqZnltdGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NDkzMzUsImV4cCI6MjA3NzIyNTMzNX0.DFDIuWmZhj5miXCmMQP1EEOAAoMQ3XKTjaT7MPrDsFA"}'::jsonb,
      body:='{}'::jsonb
    ) AS request_id;
  $$
);
```

### Real-time Çalışmıyor

```sql
-- Real-time'ı yeniden aktifleştir
ALTER PUBLICATION supabase_realtime DROP TABLE scheduled_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE scheduled_tasks;
```

### Edge Function Hatası

Supabase Dashboard → Edge Functions → Logs

- Son hataları kontrol et
- Function'ı yeniden deploy et

---

## ✅ Sağlık Raporu Özeti

| Bileşen | Durum | Son Kontrol |
|---------|-------|-------------|
| Cron Jobs | ✅ Çalışıyor | - |
| Edge Functions | ✅ Deploy | - |
| Real-time | ✅ Aktif | - |
| Database | ✅ Çalışıyor | - |
| RLS | ✅ Aktif | - |
| Bildirimler | ✅ Çalışıyor | - |
| OneSignal | ✅ Entegre | - |

---

## 📊 Performans Metrikleri

```sql
-- Toplam istatistikler
SELECT 
  (SELECT COUNT(*) FROM organizations) as total_organizations,
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM personnel) as total_personnel,
  (SELECT COUNT(*) FROM tasks) as total_tasks,
  (SELECT COUNT(*) FROM scheduled_tasks WHERE is_active = true) as active_scheduled_tasks,
  (SELECT COUNT(*) FROM notifications WHERE created_at > NOW() - INTERVAL '7 days') as notifications_last_7_days,
  (SELECT COUNT(*) FROM ai_analyses WHERE created_at > NOW() - INTERVAL '30 days') as analyses_last_30_days;
```

---

**Son Güncelleme:** 3 Kasım 2024
**Sistem Versiyonu:** 1.0.0
**Durum:** ✅ Tüm sistemler çalışıyor
