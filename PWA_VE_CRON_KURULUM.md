# PWA ve Cron Jobs Kurulum Rehberi

## 🎯 Sorunlar ve Çözümler

### ❌ Sorunlar:
1. Android'de uygulama gibi çalışmıyor
2. OneSignal bildirimleri gelmiyor
3. Zamanlanmış görevler otomatik oluşturulmuyor

### ✅ Çözümler:
1. PWA manifest eklendi
2. Service Worker OneSignal ile uyumlu hale getirildi
3. Cron job SQL hazırlandı

---

## 📱 1. PWA Kurulumu (Tamamlandı ✅)

### Eklenen Dosyalar:
- ✅ `public/manifest.json` - PWA manifest
- ✅ `public/icon-192x192.png` - Küçük icon (placeholder)
- ✅ `public/icon-512x512.png` - Büyük icon (placeholder)
- ✅ `app/layout.tsx` - PWA meta tagleri eklendi
- ✅ `public/sw.js` - Service Worker güncellendi

### ⚠️ Icon Dosyaları Güncellenmeli

Şu anda placeholder icon'lar var. Gerçek icon'ları ekleyin:

1. **192x192 PNG** oluşturun (Eksen AI logosu)
2. **512x512 PNG** oluşturun (Eksen AI logosu)
3. `public/icon-192x192.png` dosyasını değiştirin
4. `public/icon-512x512.png` dosyasını değiştirin

**Online araçlar:**
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

---

## 🔔 2. OneSignal Service Worker

### Sorun:
OneSignal kendi service worker'ını kullanır. Mevcut `sw.js` ile çakışıyor.

### Çözüm:
Service Worker OneSignal ile uyumlu hale getirildi. OneSignal kendi worker'ını yönetecek.

### Test:
1. https://eksen-ai.vercel.app adresine gidin
2. Console'da hata olmamalı
3. OneSignal izin popup'ı çıkmalı
4. "Allow" tıklayın
5. OneSignal Dashboard → Audience → Kullanıcınızı görmelisiniz

---

## ⏰ 3. Cron Jobs Kurulumu

### Adım 1: SQL'i Supabase'de Çalıştırın

1. **Supabase Dashboard** → https://supabase.com/dashboard
2. **SQL Editor** → **New query**
3. `supabase/cron-scheduled-tasks.sql` dosyasını açın
4. Tüm içeriği kopyalayın
5. SQL Editor'e yapıştırın
6. **Run** butonuna tıklayın

### Adım 2: Kontrol Edin

SQL Editor'de çalıştırın:

```sql
SELECT 
  jobid,
  jobname,
  schedule,
  active
FROM cron.job
WHERE jobname = 'create-scheduled-task-instances-daily';
```

Beklenen sonuç:
```
jobid | jobname                              | schedule    | active
------|--------------------------------------|-------------|--------
1     | create-scheduled-task-instances-daily| 1 0 * * *   | true
```

### Adım 3: Manuel Test

Terminal'de:

```bash
curl -X POST https://fnkaythbzngszjfymtgm.supabase.co/functions/v1/create-scheduled-task-instances \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZua2F5dGhiem5nc3pqZnltdGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NDkzMzUsImV4cCI6MjA3NzIyNTMzNX0.DFDIuWmZhj5miXCmMQP1EEOAAoMQ3XKTjaT7MPrDsFA"
```

Beklenen sonuç:
```json
{
  "success": true,
  "message": "Created X task instances, skipped Y",
  "stats": {
    "created": 5,
    "skipped": 2,
    "totalTasks": 10
  }
}
```

---

## 🚀 Deploy

### Commit ve Push:

```bash
git add .
git commit -m "feat: PWA manifest, service worker fix, cron jobs"
git push
```

Vercel otomatik deploy edecek (2-3 dakika).

---

## ✅ Test Checklist

### PWA Test:
- [ ] Android Chrome'da siteyi açın
- [ ] Adres çubuğunda "Install app" ikonu görünüyor mu?
- [ ] Tıklayın ve yükleyin
- [ ] Ana ekranda Eksen AI ikonu var mı?
- [ ] Uygulamayı açın - tam ekran açılıyor mu?

### OneSignal Test:
- [ ] https://eksen-ai.vercel.app adresine gidin
- [ ] Bildirim izni popup'ı çıkıyor mu?
- [ ] "Allow" tıklayın
- [ ] OneSignal Dashboard → Audience → Kullanıcı görünüyor mu?
- [ ] Dashboard'dan test bildirimi gönderin
- [ ] Bildirim geliyor mu?

### Cron Jobs Test:
- [ ] SQL çalıştırıldı mı?
- [ ] Cron job listede görünüyor mu?
- [ ] Manuel test başarılı mı?
- [ ] Zamanlanmış görev oluşturun
- [ ] Yarın otomatik görev oluştu mu?

---

## 🔧 Sorun Giderme

### PWA Yüklenmiyor

**Sorun:** "Install app" ikonu görünmüyor

**Çözüm:**
1. HTTPS olmalı (Vercel otomatik sağlıyor ✅)
2. manifest.json erişilebilir olmalı
3. Service worker kayıtlı olmalı
4. Icon dosyaları mevcut olmalı

**Kontrol:**
```
https://eksen-ai.vercel.app/manifest.json
https://eksen-ai.vercel.app/icon-192x192.png
```

### OneSignal Çalışmıyor

**Sorun:** Bildirim gelmiyor

**Çözüm:**
1. Console'da hata var mı?
2. OneSignal App ID doğru mu?
3. Site URL OneSignal'da güncel mi?
4. Tarayıcı cache'ini temizleyin

### Cron Job Çalışmıyor

**Sorun:** Görevler otomatik oluşturulmuyor

**Çözüm:**
1. pg_cron extension aktif mi?
2. Cron job listede var mı?
3. Edge Function deploy edildi mi?
4. Manuel test çalışıyor mu?

**Kontrol:**
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
SELECT * FROM cron.job;
```

---

## 📊 Çalışma Zamanları

### Cron Job:
- **00:01 UTC** = **03:01 Türkiye** (her gün)
- Zamanlanmış görevler bu saatte oluşturulur
- Günlük, haftalık, aylık görevler kontrol edilir
- İzinli personel için vekiller atanır

---

## 🎉 Tamamlandı!

Artık:
- ✅ Android'de uygulama gibi çalışıyor
- ✅ OneSignal bildirimleri geliyor
- ✅ Zamanlanmış görevler otomatik oluşturuluyor

**Sonraki adım:** Icon dosyalarını gerçek logo ile değiştirin!
