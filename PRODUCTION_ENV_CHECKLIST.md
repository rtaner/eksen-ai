# Production Environment Variables Checklist

## ✅ Gerekli Environment Variables

### 1. Supabase (Railway'de ayarlanacak)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://fnkaythbzngszjfymtgm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. PWA Push Notifications (Railway'de ayarlanacak)
```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BHo15ZXHo6uoi78dEShMLROwyzhv7YO_aT5SqgMq7UgcSIScS2vtCa3IaxUbbm9fz6hPJN12OF8WPiepWqwIj18
VAPID_PRIVATE_KEY=6bT7Jc5FKJeq9b4WQWb_TOIipKd8z_2r0x4eiRbMTf8
```

### 3. OneSignal (Railway'de ayarlanacak)
```bash
NEXT_PUBLIC_ONESIGNAL_APP_ID=440e080e-05cb-423a-8caa-736e88691fd1
ONESIGNAL_REST_API_KEY=os_v2_app_iqhaqdqfznbdvdfkonxiq2i72ht4rhae2jiu7xf26upzbqbewqf6k2g2ouafcyizvh4mb6of6kxc4gsim6iq7dhcotzm5p6ykieyaoi
```

### 4. Gemini API (Supabase Secrets'ta ayarlanacak)
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 📝 Deployment Adımları

### Railway Deployment
1. Railway Dashboard → New Project
2. Connect GitHub repository
3. Environment Variables ekle (yukarıdaki 1, 2, 3)
4. Deploy

### Supabase Production Setup
1. Supabase Dashboard → Settings → Secrets
2. `GEMINI_API_KEY` ekle
3. Edge Functions deploy et
4. Cron jobs kur

### OneSignal Production Setup
1. OneSignal Dashboard → Settings → Platforms → Web Push
2. Site URL güncelle: `https://your-domain.com`
3. Allowed Origins ekle
4. Save

---

## ✅ Kontrol Listesi

- [ ] Railway'de tüm env variables set edildi
- [ ] Supabase Secrets'ta GEMINI_API_KEY var
- [ ] OneSignal web push yapılandırıldı
- [ ] Production build test edildi
- [ ] Domain bağlandı (opsiyonel)

---

## 🔒 Güvenlik Notları

- ❌ ASLA `.env.local` dosyasını commit etme
- ✅ Production'da farklı API keys kullan (opsiyonel)
- ✅ Supabase RLS policy'leri aktif
- ✅ CORS ayarları doğru

