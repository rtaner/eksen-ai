# Bildirim Silme Sorunu - Çözüm

## 🐛 Sorun

"Temizle" butonuna basıldığında bildirimler silinmiyor, sayfa yenilendiğinde geri geliyor.

## 🔍 Neden?

Notifications tablosunda DELETE policy eksik. Kullanıcılar kendi bildirimlerini silemiyor.

## ✅ Çözüm

Supabase Dashboard → SQL Editor'de aşağıdaki SQL komutunu çalıştır:

```sql
-- Add DELETE policy for notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);
```

## 🧪 Test

1. SQL komutunu çalıştır
2. Uygulamada "Temizle" butonuna bas
3. Sayfayı yenile
4. Bildirimler geri gelmemeli ✅

## 📋 Mevcut Policies

**Öncesi:**
- ✅ SELECT: Users can view own notifications
- ✅ UPDATE: Users can update own notifications
- ✅ INSERT: Service role can insert notifications
- ❌ DELETE: YOK (eksik!)

**Sonrası:**
- ✅ SELECT: Users can view own notifications
- ✅ UPDATE: Users can update own notifications
- ✅ INSERT: Service role can insert notifications
- ✅ DELETE: Users can delete own notifications

## 🎯 Sonuç

Bu policy eklendikten sonra:
- "Temizle" butonu çalışacak
- Bildirimler veritabanından silinecek
- Sayfa yenilendiğinde geri gelmeyecek
