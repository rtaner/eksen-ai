# Toggle Fonksiyonalite Testi

## Nasıl Test Edilir?

### 1. Manuel Test
1. Bir zamanlanmış görev oluştur (aktif)
2. Toggle ile pasife al
3. Supabase Dashboard'dan kontrol et:
   ```sql
   SELECT id, name, is_active FROM scheduled_tasks;
   ```
4. `is_active` kolonunun `false` olduğunu gör

### 2. Edge Function Test
1. Pasif bir görev oluştur
2. Edge Function'ı manuel çalıştır:
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/create-scheduled-task-instances \
     -H "Authorization: Bearer YOUR_ANON_KEY"
   ```
3. Response'da pasif görevin işlenmediğini gör

### 3. Cron Job Test
1. Bir görevi pasife al
2. Ertesi gün kontrol et
3. O görev için yeni task instance oluşturulmamış olmalı

## Beklenen Davranış

### Aktif Görev (is_active: true)
- ✅ Edge Function tarafından işlenir
- ✅ Cron job her gün çalışır
- ✅ Task instance'lar oluşturulur
- ✅ Bildirimler gönderilir

### Pasif Görev (is_active: false)
- ❌ Edge Function tarafından atlanır
- ❌ Cron job işlemez
- ❌ Task instance oluşturulmaz
- ❌ Bildirim gönderilmez

## Veritabanı Kontrolü

```sql
-- Aktif görevleri listele
SELECT id, name, is_active, created_at 
FROM scheduled_tasks 
WHERE is_active = true;

-- Pasif görevleri listele
SELECT id, name, is_active, created_at 
FROM scheduled_tasks 
WHERE is_active = false;

-- Bir görevin oluşturduğu task'ları gör
SELECT t.id, t.description, t.deadline, t.status, t.scheduled_task_id
FROM tasks t
WHERE t.scheduled_task_id = 'YOUR_SCHEDULED_TASK_ID'
ORDER BY t.created_at DESC;
```

## Sonuç

Toggle butonu hem görsel hem de işlevsel olarak çalışıyor:
- UI anında güncelleniyor (optimistic update)
- Veritabanında `is_active` değişiyor
- Edge Function pasif görevleri atlıyor
- Cron job sadece aktif görevleri işliyor

✅ **Sistem tam çalışır durumda!**
