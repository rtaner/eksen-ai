# Check Note Reminders Edge Function

Bu Edge Function, owner ve manager rolündeki kullanıcılara not girişi hatırlatmaları gönderir.

## Özellikler

### 1. Günlük Genel Hatırlatma
- **Hedef:** Owner ve Manager rolleri
- **Koşul:** Bugün hiç not girişi yapmadıysa
- **Mesaj:** "Bugün hiç not girişi yapmadınız"
- **Bildirim Tipi:** `note_reminder_daily`
- **Zamanlama:** Günde 1 kez (22:00)

### 2. Personel Bazlı 3 Günlük Hatırlatma
- **Hedef:** Owner ve Manager rolleri
- **Koşul:** Belirli bir personel için 3 gündür not girilmediyse
- **Mesaj:** "[Personel Adı] isimli personel için 3 gündür not girişi yapmıyorsunuz"
- **Bildirim Tipi:** `note_reminder_personnel`
- **Zamanlama:** Günde 1 kez (22:15)
- **Not:** Her personel için ayrı bildirim gönderilir

## Mantık

### Günlük Hatırlatma
```
IF kullanıcı bugün hiç not girmedi THEN
  "Bugün hiç not girişi yapmadınız" bildirimi gönder
END IF
```

### Personel Bazlı Hatırlatma
```
FOR her personel IN organizasyon
  IF son not tarihi > 3 gün önce OR hiç not girilmemiş (ve personel > 3 gün önce oluşturulmuş) THEN
    "[Personel Adı] için 3 gündür not girişi yapmıyorsunuz" bildirimi gönder
  END IF
END FOR
```

## Örnek Senaryo

**Kullanıcı:** Ahmet (Manager)
**Organizasyondaki Personeller:** Selim, Eren, Ayşe

**Bugün (1 Kasım):**
- Eren için not girdi ✅
- Selim için 3 gündür not yok ❌
- Ayşe için 2 gündür not yok (henüz 3 gün olmadı)

**Alacağı Bildirimler:**
- ❌ "Bugün hiç not girişi yapmadınız" → GELMEYECEK (çünkü Eren için not girdi)
- ✅ "Selim isimli personel için 3 gündür not girişi yapmıyorsunuz" → GELECEK

**Yarın (2 Kasım) - Hiç not girmezse:**
- ✅ "Bugün hiç not girişi yapmadınız" → GELECEK (22:00)
- ✅ "Selim isimli personel için 3 gündür not girişi yapmıyorsunuz" → GELECEK (22:15)
- ✅ "Ayşe isimli personel için 3 gündür not girişi yapmıyorsunuz" → GELECEK (22:15)

## Tekrar Bildirim Önleme

- Her bildirim tipi için günde sadece 1 kez gönderilir
- Aynı gün içinde aynı bildirim tekrar gönderilmez
- Personel bazlı bildirimler her personel için ayrı kontrol edilir

## Deployment

```bash
npx supabase functions deploy check-note-reminders
```

## Cron Job Kurulumu

Bu fonksiyon günde 2 kez çalışmalı:
- 22:00 (19:00 UTC) - Günlük hatırlatmalar
- 22:15 (19:15 UTC) - Personel bazlı hatırlatmalar

SQL komutları `supabase/cron-setup.sql` dosyasına eklenmelidir.

## Test

```bash
curl -X POST https://[PROJECT_REF].supabase.co/functions/v1/check-note-reminders \
  -H "Authorization: Bearer [ANON_KEY]"
```

## Bildirim Tipleri

- `note_reminder_daily`: Günlük genel hatırlatma
- `note_reminder_personnel`: Personel bazlı 3 günlük hatırlatma
