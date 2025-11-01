# Zamanlanmış Görev Saat Sorunu - Düzeltildi

## 🐛 Sorun

Zamanlanmış görevler oluşturulurken **saat bilgisi** kayboluyordu.

**Örnek:**
- Zamanlanmış görev: Her gün 02:15
- Oluşturulan görev: Bugün (saat yok)
- Beklenen: Bugün 02:15

## ✅ Çözüm

`create-scheduled-task-instances` Edge Function güncellendi:

```typescript
// Önce (Yanlış)
deadline: todayStr,  // "2024-11-02"

// Sonra (Doğru)
const deadlineWithTime = task.default_time 
  ? `${todayStr}T${task.default_time}:00`
  : todayStr;

deadline: deadlineWithTime,  // "2024-11-02T02:15:00"
```

## 🚀 Deploy

Edge Function'ı yeniden deploy etmemiz gerekiyor.

### Manuel Deploy (Supabase Dashboard)

1. **Supabase Dashboard** → Edge Functions
2. `create-scheduled-task-instances` fonksiyonunu bul
3. **Deploy** butonuna tıkla
4. Veya yeni kod ile yeniden deploy et

### CLI ile Deploy (Eğer Supabase CLI varsa)

```bash
supabase functions deploy create-scheduled-task-instances
```

## 🧪 Test

Deploy sonrası manuel test:

```bash
curl -X POST https://fnkaythbzngszjfymtgm.supabase.co/functions/v1/create-scheduled-task-instances \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

Veya Supabase Dashboard'dan:
1. Edge Functions → create-scheduled-task-instances
2. **Invoke** butonuna tıkla
3. Response'u kontrol et

## 📊 Beklenen Sonuç

Artık oluşturulan görevler **saat bilgisi ile** oluşturulacak:

```json
{
  "description": "Test görevi",
  "deadline": "2024-11-02T02:15:00",
  "status": "open"
}
```

## ⏰ Otomatik Çalışma

Cron job her gece 00:00'da çalışacak ve o gün için zamanlanmış görevleri **doğru saat ile** oluşturacak.

---

**Not:** Bugün için görev oluşturmak isterseniz, fonksiyonu manuel çalıştırabilirsiniz.
