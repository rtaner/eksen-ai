# GitHub'a Yükleme Rehberi

## 📋 Adım Adım GitHub Setup

### 1. GitHub'da Repository Oluştur

1. https://github.com/ → Login
2. **New repository** (yeşil buton)
3. Repository bilgileri:
   - **Repository name**: `eksen-ai`
   - **Description**: `AI destekli personel yönetim ve analiz sistemi`
   - **Visibility**: Private veya Public (tercihinize göre)
   - ❌ **Initialize this repository with** → HİÇBİRİNİ SEÇMEYİN (boş repo)
4. **Create repository** tıkla

### 2. Local Git Başlatma

Terminal'de proje klasöründe:

```bash
# Git başlat
git init

# Tüm dosyaları ekle
git add .

# İlk commit
git commit -m "Initial commit: Eksen AI v1.0"

# Main branch oluştur
git branch -M main

# GitHub remote ekle (YOUR_USERNAME yerine kendi kullanıcı adınızı yazın)
git remote add origin https://github.com/YOUR_USERNAME/eksen-ai.git

# Push et
git push -u origin main
```

### 3. Doğrulama

GitHub'da repository'nizi yenileyin. Tüm dosyalar yüklenmiş olmalı!

---

## ⚠️ Önemli Notlar

### Yüklenmeyen Dosyalar (.gitignore)
Şu dosyalar **yüklenmeyecek** (güvenlik için):
- ❌ `.env.local` (API keys içeriyor)
- ❌ `node_modules/` (bağımlılıklar)
- ❌ `.next/` (build dosyaları)

Bu dosyalar her ortamda ayrı ayrı oluşturulmalı!

### Yüklenen Dosyalar
✅ Tüm kaynak kodlar
✅ `package.json`
✅ `README.md`
✅ `LICENSE`
✅ `.env.example` (şablon)
✅ Supabase migrations
✅ Edge Functions

---

## 🔄 Sonraki Güncellemeler İçin

```bash
# Değişiklikleri ekle
git add .

# Commit
git commit -m "Açıklayıcı mesaj"

# Push
git push
```

---

## 🚀 Vercel'e Bağlama

GitHub'a yükledikten sonra:

1. Vercel Dashboard → **Add New** → **Project**
2. **Import Git Repository** → `eksen-ai` seç
3. **Import** tıkla
4. Environment variables ekle
5. **Deploy**!

---

## ✅ Checklist

- [ ] GitHub'da repository oluşturuldu
- [ ] Local'de git init yapıldı
- [ ] İlk commit atıldı
- [ ] GitHub'a push edildi
- [ ] Repository'de dosyalar görünüyor
- [ ] `.env.local` yüklenmemiş (güvenlik ✅)
- [ ] Vercel'e import edildi

---

**Hazırsınız!** 🎉
