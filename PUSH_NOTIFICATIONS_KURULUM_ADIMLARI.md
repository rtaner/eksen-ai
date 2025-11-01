# PWA Push Notifications - Kurulum Adımları

## ✅ Tamamlanan Adımlar

### 1. VAPID Keys Oluşturuldu ✓
```
Public Key: BHo15ZXHo6uoi78dEShMLROwyzhv7YO_aT5SqgMq7UgcSIScS2vtCa3IaxUbbm9fz6hPJN12OF8WPiepWqwIj18
Private Key: 6bT7Jc5FKJeq9b4WQWb_TOIipKd8z_2r0x4eiRbMTf8
```

### 2. Environment Variables Eklendi ✓
`.env.local` dosyasına eklendi:
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BHo15ZXHo6uoi78dEShMLROwyzhv7YO_aT5SqgMq7UgcSIScS2vtCa3IaxUbbm9fz6hPJN12OF8WPiepWqwIj18
VAPID_PRIVATE_KEY=6bT7Jc5FKJeq9b4WQWb_TOIipKd8z_2r0x4eiRbMTf8
```

## 📋 Yapılması Gerekenler

### 3. Migration Çalıştır (Manuel)

**Supabase Dashboard'dan:**

1. https://supabase.com/dashboard → Projenizi seçin
2. Sol menüden **SQL Editor** seçin
3. **New Query** butonuna tıklayın
4. Aşağıdaki SQL'i yapıştırın:

```sql
-- Create push_subscriptions table for PWA push notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Push subscription data
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  
  -- Device info
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one subscription per endpoint
  UNIQUE(endpoint)
);

-- Indexes
CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_org ON push_subscriptions(organization_id);

-- RLS Policies
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view own push subscriptions"
  ON push_subscriptions FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own subscriptions
CREATE POLICY "Users can insert own push subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id = get_user_organization_id()
  );

-- Users can delete their own subscriptions
CREATE POLICY "Users can delete own push subscriptions"
  ON push_subscriptions FOR DELETE
  USING (user_id = auth.uid());

-- Function to clean up old subscriptions (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_push_subscriptions()
RETURNS void AS $$
BEGIN
  DELETE FROM push_subscriptions
  WHERE last_used_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_old_push_subscriptions() TO authenticated;

COMMENT ON TABLE push_subscriptions IS 'Stores PWA push notification subscriptions for users';
COMMENT ON COLUMN push_subscriptions.endpoint IS 'Push service endpoint URL';
COMMENT ON COLUMN push_subscriptions.p256dh IS 'Public key for encryption';
COMMENT ON COLUMN push_subscriptions.auth IS 'Authentication secret';
```

5. **Run** butonuna tıklayın
6. "Success" mesajını görün

### 4. Development Server Yeniden Başlat

Environment variables değişti, server'ı yeniden başlatmalısınız:

```bash
# Ctrl+C ile durdur
# Sonra tekrar başlat
npm run dev
```

### 5. Test Et

1. Tarayıcıda aç: http://localhost:3000/settings/notifications
2. "Bildirimleri Aç" butonuna tıkla
3. İzin ver popup'ında "İzin Ver" seç
4. "✓ Aktif" durumunu gör
5. "Test Et" butonuna tıkla
6. Test bildirimi görünmeli

### 6. Veritabanını Kontrol Et

Supabase Dashboard → Table Editor → push_subscriptions

Yeni bir kayıt görmelisiniz:
- user_id: Sizin user ID'niz
- endpoint: Push service URL
- p256dh: Public key
- auth: Auth secret

## 🎯 Sonraki Adımlar

### Edge Function Oluştur (Bildirim Göndermek İçin)

Şu anda kullanıcılar abone olabiliyor ama push gönderemiyoruz. Bunun için Edge Function gerekli:

1. `supabase/functions/send-push-notification/index.ts` oluştur
2. web-push kütüphanesi kullan
3. Yeni bildirim oluşturulduğunda tetikle
4. Kullanıcının subscription'ını bul
5. Push gönder

### Settings Sayfasına Link Ekle

`app/(dashboard)/settings/page.tsx` dosyasına "Bildirim Ayarları" kartı ekle.

## 🔍 Sorun Giderme

### "VAPID key bulunamadı" Hatası
- Development server'ı yeniden başlattınız mı?
- `.env.local` dosyasında `NEXT_PUBLIC_VAPID_PUBLIC_KEY` var mı?

### "Service Worker kaydedilemedi" Hatası
- `public/sw.js` dosyası var mı?
- Browser console'da hata var mı?

### Migration Hatası
- `get_user_organization_id()` fonksiyonu var mı?
- Eğer yoksa, önce bu fonksiyonu oluşturmalısınız

## 📞 Yardım

Sorun yaşarsanız:
1. Browser console'u kontrol edin (F12)
2. Network tab'ını kontrol edin
3. Supabase Dashboard → Logs kontrol edin

---

**Şu anda:** Adım 3'tesiniz (Migration çalıştırma)
**Sonraki:** Development server yeniden başlatma
