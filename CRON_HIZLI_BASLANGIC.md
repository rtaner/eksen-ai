# Cron Job Hızlı Başlangıç Kılavuzu

## 🎯 En Hızlı Kurulum (5 Dakika)

### Seçenek 1: GitHub Actions (ÖNERİLEN)

```bash
# 1. Workflow dosyası oluştur
mkdir -p .github/workflows
```

`.github/workflows/check-task-deadlines.yml` dosyası oluştur:
```yaml
name: Check Task Deadlines
on:
  schedule:
    - cron: '0 6 * * *'  # Her gün 09:00 TR
  workflow_dispatch:
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X POST \
            '${{ secrets.SUPABASE_URL }}/functions/v1/check-task-deadlines' \
            -H 'Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}'
```

```bash
# 2. Edge Function deploy et
supabase functions deploy check-task-deadlines

# 3. GitHub Secrets ekle
# GitHub → Settings → Secrets → Actions
# SUPABASE_URL: https://xxx.supabase.co
# SUPABASE_ANON_KEY: eyJhbGc...

# 4. Git'e push et
git add .github/workflows/check-task-deadlines.yml
git commit -m "Add task deadline cron job"
git push

# 5. Test et
# GitHub → Actions → Check Task Deadlines → Run workflow
```

**✅ Tamamlandı!** Her gün sabah 09:00'da otomatik çalışacak.

---

## 📊 Hızlı Karşılaştırma

| Özellik | GitHub Actions | Supabase Cron | Cron-job.org |
|---------|---------------|---------------|--------------|
| Fiyat | ✅ Ücretsiz | ❌ $25/ay | ✅ Ücretsiz |
| Kurulum | 5 dakika | 2 dakika | 3 dakika |
| Güvenilirlik | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Monitoring | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| **ÖNERİ** | 🌟 **EN İYİ** | Pro plan varsa | Geçici çözüm |

---

## 🔍 Test Komutları

### Edge Function Test
```bash
# Local test
supabase functions serve check-task-deadlines

# Başka terminal'de
curl -X POST http://localhost:54321/functions/v1/check-task-deadlines \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Production test
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/check-task-deadlines \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### GitHub Actions Test
```bash
# Manuel tetikleme
gh workflow run check-task-deadlines

# Son çalışmaları göster
gh run list --workflow=check-task-deadlines --limit 5

# Logs
gh run view --log
```

---

## ⏰ Cron Schedule Örnekleri

```yaml
# Her gün 09:00 (Türkiye saati)
- cron: '0 6 * * *'

# Her gün 09:00 ve 18:00
- cron: '0 6,15 * * *'

# Her 6 saatte bir
- cron: '0 */6 * * *'

# Sadece hafta içi 09:00
- cron: '0 6 * * 1-5'

# Her Pazartesi 09:00
- cron: '0 6 * * 1'
```

**Timezone Hesaplama:**
- Türkiye yaz saati (UTC+3): TR 09:00 = UTC 06:00
- Türkiye kış saati (UTC+2): TR 09:00 = UTC 07:00

---

## 🚨 Sorun Giderme

### Bildirim Gelmiyor

**1. Edge Function çalışıyor mu?**
```bash
supabase functions list
# check-task-deadlines listede olmalı
```

**2. Cron çalışıyor mu?**
- GitHub: Actions sekmesinde çalışmaları kontrol et
- Supabase: SQL ile `SELECT * FROM cron.job_run_details`

**3. Manuel test yap:**
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/check-task-deadlines \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**4. Logs kontrol et:**
```bash
supabase functions logs check-task-deadlines --follow
```

### Duplicate Bildirimler

Edge Function aynı gün için tekrar bildirim göndermez. Eğer duplicate görüyorsanız:
1. Cron job'ın birden fazla kez çalışıp çalışmadığını kontrol edin
2. Farklı cron servislerinin aynı anda çalışmadığından emin olun

### Geç Bildirimler

- GitHub Actions 5-10 dakika gecikebilir (normal)
- Daha hassas zamanlama için Supabase Cron kullanın
- Timezone ayarlarını kontrol edin

---

## 📚 Detaylı Dokümantasyon

- **Karşılaştırma ve Detaylar:** `CRON_KARSILASTIRMA.md`
- **Edge Function Detayları:** `supabase/functions/check-task-deadlines/README.md`
- **Bildirim Sistemi:** `BILDIRIM_SISTEMI_KURULUM.md`

---

## ✅ Checklist

- [ ] Edge Function deploy edildi
- [ ] Cron job kuruldu (GitHub Actions / Supabase / Cron-job.org)
- [ ] Manuel test yapıldı ve başarılı
- [ ] Monitoring kuruldu
- [ ] Email bildirimleri aktif
- [ ] Timezone doğru ayarlandı
- [ ] İlk otomatik çalışma bekleniyor

**Tebrikler! 🎉** Görev bildirimleri artık otomatik çalışıyor.
