# 🚀 Production Deployment Guide

## 📋 Ön Hazırlık

### 1. Build Test
```bash
npm run build
```
✅ Build başarılı olmalı (zaten test ettik)

---

## 🗄️ Supabase Production Setup

### 1. Migrations Kontrolü
Tüm migrations production'da çalıştırılmış mı kontrol et:

```bash
# Local'de migrations listesi
supabase migration list
```

Production'da eksik migration varsa:
```bash
supabase db push
```

### 2. Edge Functions Deploy

```bash
# Tüm functions'ları deploy et
supabase functions deploy analyze-butunlesik
supabase functions deploy analyze-egilim
supabase functions deploy analyze-yetkinlik
supabase functions deploy check-note-reminders
supabase functions deploy check-task-deadlines
supabase functions deploy cleanup-old-notifications
supabase functions deploy create-scheduled-task-instances
supabase functions deploy send-push-notification
```

Veya tek komutla:
```bash
# Tüm functions'ları deploy et
for func in analyze-butunlesik analyze-egilim analyze-yetkinlik check-note-reminders check-task-deadlines cleanup-old-notifications create-scheduled-task-instances send-push-notification; do
  supabase functions deploy $func
done
```

### 3. Secrets Ayarla

Supabase Dashboard → Settings → Secrets:
```bash
GEMINI_API_KEY=your_actual_gemini_api_key
```

### 4. Cron Jobs Kur

Supabase Dashboard → Database → Cron Jobs:

**Job 1: Task Deadlines Check**
- Name: `check-task-deadlines`
- Schedule: `0 9 * * *` (Her gün 09:00)
- Command: `SELECT net.http_post(...)`

**Job 2: Note Reminders Check**
- Name: `check-note-reminders`
- Schedule: `0 * * * *` (Her saat)
- Command: `SELECT net.http_post(...)`

**Job 3: Scheduled Task Instances**
- Name: `create-scheduled-task-instances`
- Schedule: `0 0 * * *` (Her gün 00:00)
- Command: `SELECT net.http_post(...)`

**Job 4: Cleanup Old Notifications**
- Name: `cleanup-old-notifications`
- Schedule: `0 2 * * *` (Her gün 02:00)
- Command: `SELECT net.http_post(...)`

SQL komutları için `supabase/cron-setup.sql` dosyasını kullan.

---

## 🚂 Railway Deployment

### 1. Railway Projesi Oluştur

1. https://railway.app/ → Login
2. New Project → Deploy from GitHub repo
3. Repository seç: `pts` (veya repo adınız)
4. Branch: `main`

### 2. Environment Variables Ekle

Railway Dashboard → Variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://fnkaythbzngszjfymtgm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BHo15ZXHo6uoi78dEShMLROwyzhv7YO_aT5SqgMq7UgcSIScS2vtCa3IaxUbbm9fz6hPJN12OF8WPiepWqwIj18
VAPID_PRIVATE_KEY=6bT7Jc5FKJeq9b4WQWb_TOIipKd8z_2r0x4eiRbMTf8
NEXT_PUBLIC_ONESIGNAL_APP_ID=440e080e-05cb-423a-8caa-736e88691fd1
ONESIGNAL_REST_API_KEY=os_v2_app_iqhaqdqfznbdvdfkonxiq2i72ht4rhae2jiu7xf26upzbqbewqf6k2g2ouafcyizvh4mb6of6kxc4gsim6iq7dhcotzm5p6ykieyaoi
```

### 3. Build Settings (Otomatik algılanır)

Railway otomatik algılar:
- Build Command: `npm run build`
- Start Command: `npm start`

### 4. Deploy

Railway otomatik deploy eder. İlk deploy 2-3 dakika sürer.

### 5. Domain Ayarla (Opsiyonel)

Railway Dashboard → Settings → Domains:
- Railway subdomain: `your-app.up.railway.app`
- Custom domain: `your-domain.com` (DNS ayarları gerekir)

---

## 🔔 OneSignal Production Setup

### 1. Web Push Yapılandırması

OneSignal Dashboard → Settings → Platforms → Web Push:

1. **Site URL**: `https://your-app.up.railway.app`
2. **Allowed Origins**: 
   - `https://your-app.up.railway.app`
   - `https://your-domain.com` (varsa)
3. **Auto Resubscribe**: ✅ Enabled
4. **Default Icon**: `https://your-app.up.railway.app/icon-192x192.png`

### 2. Save & Test

OneSignal Dashboard → Messages → New Push:
- Test bildirimi gönder
- Production'da çalıştığını doğrula

---

## ✅ Post-Deployment Checklist

### 1. Smoke Tests

- [ ] Ana sayfa açılıyor
- [ ] Login çalışıyor
- [ ] Register çalışıyor
- [ ] Personel listesi yükleniyor
- [ ] Not ekleme çalışıyor
- [ ] Görev ekleme çalışıyor
- [ ] AI analiz çalışıyor
- [ ] Bildirimler çalışıyor
- [ ] Zamanlanmış görevler çalışıyor

### 2. Mobile Test

- [ ] Mobil tarayıcıda açılıyor
- [ ] PWA install prompt çıkıyor
- [ ] Home screen'e eklenebiliyor
- [ ] Offline çalışıyor (temel özellikler)

### 3. Performance Test

- [ ] İlk yükleme < 3 saniye
- [ ] Sayfa geçişleri hızlı
- [ ] Bundle size < 200KB

### 4. Security Check

- [ ] RLS policy'leri çalışıyor
- [ ] Permission kontrolü çalışıyor
- [ ] Unauthorized erişim engellenmiş

---

## 🐛 Troubleshooting

### Build Hatası
```bash
# Local'de test et
npm run build

# Hata varsa düzelt ve tekrar push et
```

### Environment Variables Hatası
```bash
# Railway logs kontrol et
railway logs

# Eksik variable varsa ekle
```

### Supabase Connection Hatası
```bash
# .env variables doğru mu kontrol et
# Supabase URL ve Anon Key doğru mu?
```

### OneSignal Çalışmıyor
```bash
# Browser console'da hata var mı?
# OneSignal App ID doğru mu?
# Web Push yapılandırıldı mı?
```

---

## 📊 Monitoring

### Railway Logs
```bash
railway logs --follow
```

### Supabase Logs
Supabase Dashboard → Logs → Edge Functions

### OneSignal Analytics
OneSignal Dashboard → Analytics

---

## 🎉 Deployment Tamamlandı!

Artık uygulamanız production'da! 🚀

**Production URL**: https://your-app.up.railway.app

**Sonraki Adımlar:**
1. Kullanıcılara duyuru yap
2. Feedback topla
3. Bug'ları düzelt
4. Yeni özellikler ekle

