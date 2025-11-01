# Task Deadline Checker - Edge Function

Bu Edge Function, görev son tarihlerini kontrol eder ve bildirimleri otomatik olarak gönderir.

## Özellikler

- ✅ Bugün biten görevler için bildirim (`task_due`)
  - Sadece görevi atanan personele gönderilir (eğer kullanıcı hesabı varsa)
  - Personelin kullanıcı hesabı yoksa bildirim gönderilmez (log'lanır)
- ✅ Gecikmiş görevler için bildirim (`task_overdue`)
  - Tüm manager ve owner'lara bildirim gönderilir
- ✅ Aynı gün için tekrar bildirim göndermez

## Deploy

```bash
# Edge Function'ı deploy et
supabase functions deploy check-task-deadlines

# Test et (manuel çalıştır)
supabase functions invoke check-task-deadlines
```

## Cron Job Kurulumu

### Seçenek 1: Supabase Cron (Önerilen - Ücretli Plan)

Supabase Dashboard'da:
1. **Database** → **Cron Jobs** → **Create a new cron job**
2. **Name**: `check-task-deadlines`
3. **Schedule**: `0 9 * * *` (Her gün saat 09:00)
4. **Command**:
```sql
SELECT
  net.http_post(
    url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-task-deadlines',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  ) as request_id;
```

### Seçenek 2: External Cron Service (Ücretsiz)

**GitHub Actions** ile:

`.github/workflows/check-task-deadlines.yml`:
```yaml
name: Check Task Deadlines

on:
  schedule:
    - cron: '0 6 * * *'  # Her gün UTC 06:00 (Türkiye 09:00)
  workflow_dispatch:  # Manuel tetikleme

jobs:
  check-deadlines:
    runs-on: ubuntu-latest
    steps:
      - name: Call Edge Function
        run: |
          curl -X POST \
            'https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-task-deadlines' \
            -H 'Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}' \
            -H 'Content-Type: application/json'
```

**Secrets ekle:**
- `SUPABASE_ANON_KEY`: Supabase anon key

### Seçenek 3: Cron-job.org (Ücretsiz)

1. https://cron-job.org/ adresine git
2. Ücretsiz hesap oluştur
3. **Create Cronjob**:
   - **Title**: Check Task Deadlines
   - **URL**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-task-deadlines`
   - **Schedule**: Every day at 09:00
   - **Request Method**: POST
   - **Headers**:
     - `Authorization: Bearer YOUR_ANON_KEY`
     - `Content-Type: application/json`

## Test

### Manuel Test
```bash
# Local test
supabase functions serve check-task-deadlines

# Başka bir terminal'de
curl -X POST http://localhost:54321/functions/v1/check-task-deadlines \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Production Test
```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-task-deadlines \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Response Format

```json
{
  "success": true,
  "message": "Checked 5 tasks. Sent 2 due notifications and 1 overdue notifications.",
  "stats": {
    "totalTasks": 5,
    "dueToday": 2,
    "overdue": 1
  }
}
```

## Logs

```bash
# Production logs
supabase functions logs check-task-deadlines

# Follow logs
supabase functions logs check-task-deadlines --follow
```

## Troubleshooting

### Bildirim Gönderilmiyor
1. Edge Function deploy edildi mi kontrol et
2. Cron job çalışıyor mu kontrol et
3. Logs'u kontrol et
4. RLS policy'leri kontrol et (service role key kullanıldığı için sorun olmamalı)

### Duplicate Notifications
- Fonksiyon aynı gün için tekrar bildirim göndermez
- Eğer duplicate görüyorsanız, cron job'ın birden fazla kez çalışıyor olabilir

### Timezone Issues
- Supabase UTC kullanır
- Cron schedule'ı buna göre ayarlayın
- Türkiye için UTC+3 (yaz saati) veya UTC+2 (kış saati)
