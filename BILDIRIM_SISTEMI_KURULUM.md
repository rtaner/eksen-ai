# Bildirim Sistemi Kurulum ve Sorun Giderme

## ✅ Yapılan Düzeltmeler

### 1. Real-time Çalışmıyor
**Sorun:** Bildirimler sadece sayfa yenilenince geliyordu.

**Çözüm:**
- Supabase channel'a `filter` eklendi (sadece kendi bildirimleriniz)
- Console log'lar eklendi (debug için)
- Subscription status kontrolü eklendi

**Supabase'de Kontrol:**
1. Supabase Dashboard → Settings → API
2. **Realtime** bölümünü bulun
3. `notifications` tablosu için Realtime **AÇIK** olmalı

**Eğer kapalıysa:**
```sql
-- SQL Editor'de çalıştır
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

### 2. Mobilde Modal Taşıyor
**Sorun:** Dropdown ekran dışına çıkıyordu.

**Çözüm:**
- Mobilde `fixed` positioning
- Desktop'ta `absolute` positioning
- `left-2 right-2` ile ekran içinde kalması sağlandı
- Padding'ler küçültüldü

### 3. İngilizce Yazıyor
**Sorun:** Bildirim başlıkları İngilizce geliyordu.

**Neden:** Test sayfasından gönderilen bildirimler İngilizce başlık kullanıyordu.

**Çözüm:** Test sayfasını Türkçe'ye çevirdik (bir sonraki adımda).

---

## 🧪 Test Etme

### 1. Real-time Test
```bash
# Terminal'de
npm run dev

# Tarayıcı Console'u aç (F12)
# Şu log'ları göreceksiniz:
# - "Subscription status: SUBSCRIBED"
# - "Real-time notification received: {...}"
```

### 2. İki Sekme Testi
1. İki tarayıcı sekmesi aç
2. Her ikisinde de giriş yap
3. Birinci sekmede: `/test-notifications`
4. İkinci sekmede: Herhangi bir sayfa
5. Birinci sekmeden bildirim gönder
6. İkinci sekmede **ANINDA** badge güncellenmeli

### 3. Mobil Test
1. Chrome DevTools → Toggle Device Toolbar (Ctrl+Shift+M)
2. iPhone/Android seç
3. Zil ikonuna tıkla
4. Modal ekran içinde kalmalı

---

## 🔧 Sorun Giderme

### Real-time Çalışmıyor
**Console'da "Subscription status: CHANNEL_ERROR" görüyorsanız:**

1. Supabase Realtime aktif mi kontrol edin
2. RLS policy'leri kontrol edin
3. Supabase project restart deneyin

**SQL ile test:**
```sql
-- Supabase SQL Editor
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- notifications tablosu listede olmalı
```

### Bildirim Gelmiyor
**Console'da hata yoksa ama bildirim gelmiyorsa:**

```sql
-- Manuel bildirim ekle
INSERT INTO notifications (user_id, organization_id, type, title, message)
SELECT 
  id,
  organization_id,
  'task_assigned',
  'Test Bildirimi',
  'Bu bir test',
  '/personnel'
FROM profiles 
WHERE id = auth.uid();
```

### Mobilde Modal Görünmüyor
- Z-index çakışması olabilir
- Header'ın z-index'i kontrol edin
- `z-50` yeterli olmalı

---

## 📱 Responsive Breakpoints

```css
/* Mobil (< 640px) */
- fixed positioning
- left-2 right-2 (ekran içinde)
- p-3 (küçük padding)
- max-h-[70vh]

/* Desktop (>= 640px) */
- absolute positioning
- w-96 (sabit genişlik)
- p-4 (normal padding)
- max-h-[80vh]
```

---

## 📋 Bildirim Kuralları

### Görevler (Tasks)
**Bildirim Gönderilir:** ✅
- Yeni görev atandığında
- Görevin son günü geldiğinde
- Görev geciktiğinde

**Kime Gönderilir:**
- Organizasyondaki TÜM manager ve owner'lara

**Kod Konumu:** `components/tasks/TaskForm.tsx`

### Notlar (Notes)
**Bildirim Gönderilir:** ❌
- Not eklendiğinde bildirim GÖNDERİLMEZ

**Neden:**
- Notlar kişisel kayıtlardır
- Gereksiz bildirim kirliliği yaratır

**Kod Konumu:** `components/notes/NoteForm.tsx`

### AI Analizleri
**Bildirim Gönderilir:** ✅ (Planlı)
- Analiz tamamlandığında

**Kime Gönderilir:**
- Analizi başlatan kişiye

**Durum:** Henüz implement edilmedi

---

## ⏰ Otomatik Görev Bildirimleri (Cron Job)

### Edge Function
**Dosya:** `supabase/functions/check-task-deadlines/index.ts`

**Ne Yapar:**
- Her gün çalışır (önerilen: sabah 09:00)
- Bugün biten görevleri bulur → `task_due` bildirimi
- Gecikmiş görevleri bulur → `task_overdue` bildirimi
- Tüm manager/owner'lara bildirim gönderir
- Aynı gün için tekrar bildirim göndermez

### Kurulum

#### 1. Edge Function Deploy
```bash
supabase functions deploy check-task-deadlines
```

#### 2. Cron Job Kurulumu

**Seçenek A: GitHub Actions (Ücretsiz - Önerilen)**

`.github/workflows/check-task-deadlines.yml` oluştur:
```yaml
name: Check Task Deadlines
on:
  schedule:
    - cron: '0 6 * * *'  # Her gün UTC 06:00 (TR 09:00)
  workflow_dispatch:
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X POST \
            'https://YOUR_PROJECT.supabase.co/functions/v1/check-task-deadlines' \
            -H 'Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}'
```

**Seçenek B: Cron-job.org (Ücretsiz)**
1. https://cron-job.org/ → Hesap oluştur
2. Create Cronjob:
   - URL: `https://YOUR_PROJECT.supabase.co/functions/v1/check-task-deadlines`
   - Schedule: Daily at 09:00
   - Method: POST
   - Header: `Authorization: Bearer YOUR_ANON_KEY`

**Seçenek C: Supabase Cron (Ücretli Plan)**
```sql
SELECT cron.schedule(
  'check-task-deadlines',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT.supabase.co/functions/v1/check-task-deadlines',
    headers:='{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

### Test
```bash
# Manuel test
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/check-task-deadlines \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Logs
supabase functions logs check-task-deadlines
```

Detaylı dokümantasyon: `supabase/functions/check-task-deadlines/README.md`

---

## 🚀 Tamamlanan ve Sonraki Adımlar

1. ✅ Real-time düzeltildi
2. ✅ Mobil responsive düzeltildi
3. ✅ Bildirim kuralları belirlendi (görevler ✅, notlar ❌)
4. ✅ Görev son gün/gecikme bildirimleri (Edge Function hazır, cron kurulumu gerekli)
5. ⏳ AI analiz tamamlanma bildirimleri
6. ⏳ PWA Push Notifications ekle

---

## 📞 Destek

Sorun devam ediyorsa:
1. Browser Console'u kontrol edin (F12)
2. Network tab'ında WebSocket bağlantısını kontrol edin
3. Supabase Dashboard → Logs → Realtime kontrol edin
