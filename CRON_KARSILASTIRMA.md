# Cron Job Seçenekleri Karşılaştırması

## 📊 Hızlı Karşılaştırma Tablosu

| Özellik | GitHub Actions | Supabase Cron | Cron-job.org |
|---------|---------------|---------------|--------------|
| **Fiyat** | ✅ Ücretsiz (2000 dk/ay) | ❌ Ücretli plan gerekli | ✅ Ücretsiz |
| **Kurulum Kolaylığı** | 🟡 Orta (YAML dosyası) | 🟢 Kolay (SQL sorgusu) | 🟢 Çok Kolay (Web UI) |
| **Güvenilirlik** | 🟢 Yüksek | 🟢 Çok Yüksek | 🟡 Orta |
| **Monitoring** | 🟢 GitHub UI | 🟢 Supabase Dashboard | 🟡 Basit web UI |
| **Hata Bildirimi** | 🟢 Email + Slack | 🟢 Supabase Logs | 🟡 Email |
| **Timezone Desteği** | 🟢 UTC (manuel hesap) | 🟢 UTC (manuel hesap) | 🟢 Timezone seçimi |
| **Manuel Tetikleme** | 🟢 Evet (workflow_dispatch) | 🟡 SQL ile | 🟢 Evet (web UI) |
| **Retry Mekanizması** | 🟡 Manuel eklemeli | 🟢 Otomatik | ❌ Yok |
| **Bakım Gereksinimi** | 🟢 Düşük | 🟢 Çok Düşük | 🟡 Orta |
| **Ölçeklenebilirlik** | 🟢 Yüksek | 🟢 Çok Yüksek | 🟡 Orta |

---

## 1️⃣ GitHub Actions (ÖNERİLEN)

### ✅ Avantajlar
- **Tamamen ücretsiz** (public repo için sınırsız, private için 2000 dk/ay)
- **Versiyon kontrolü** - Cron config Git'te saklanır
- **Güçlü monitoring** - GitHub UI'da tüm çalışmalar görünür
- **Kolay debug** - Her çalışmanın detaylı logları
- **Manuel tetikleme** - Tek tıkla test edebilirsiniz
- **Bildirimler** - Email, Slack, Discord entegrasyonu
- **Conditional runs** - Sadece belirli durumlarda çalıştırma
- **Secrets yönetimi** - Güvenli API key saklama

### ❌ Dezavantajlar
- GitHub repo gerekli
- YAML syntax öğrenme eğrisi
- Minimum 5 dakika gecikme olabilir (GitHub'ın cron hassasiyeti)
- Private repo'da aylık limit var

### 📋 Kurulum Adımları

#### Adım 1: Workflow Dosyası Oluştur
Projenizde `.github/workflows/check-task-deadlines.yml` dosyası oluşturun:

```yaml
name: Check Task Deadlines

on:
  schedule:
    # Her gün UTC 06:00'da çalış (Türkiye saati 09:00)
    - cron: '0 6 * * *'
  
  # Manuel tetikleme için
  workflow_dispatch:

jobs:
  check-deadlines:
    runs-on: ubuntu-latest
    
    steps:
      - name: Call Supabase Edge Function
        run: |
          response=$(curl -s -w "\n%{http_code}" -X POST \
            '${{ secrets.SUPABASE_URL }}/functions/v1/check-task-deadlines' \
            -H 'Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}' \
            -H 'Content-Type: application/json')
          
          http_code=$(echo "$response" | tail -n1)
          body=$(echo "$response" | head -n-1)
          
          echo "Response: $body"
          echo "HTTP Code: $http_code"
          
          if [ "$http_code" -ne 200 ]; then
            echo "Error: Edge function returned $http_code"
            exit 1
          fi

      - name: Notify on Failure
        if: failure()
        run: |
          echo "Task deadline check failed!"
          # Buraya Slack/Discord webhook ekleyebilirsiniz
```

#### Adım 2: GitHub Secrets Ekle
1. GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** tıklayın
3. İki secret ekleyin:

**Secret 1:**
- Name: `SUPABASE_URL`
- Value: `https://your-project-ref.supabase.co`

**Secret 2:**
- Name: `SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (Supabase Dashboard → Settings → API → anon public key)

#### Adım 3: Edge Function Deploy
```bash
# Terminal'de
supabase functions deploy check-task-deadlines
```

#### Adım 4: Test Et
1. GitHub repo → **Actions** sekmesi
2. **Check Task Deadlines** workflow'u seç
3. **Run workflow** → **Run workflow** tıkla
4. Sonuçları kontrol et

#### Adım 5: Cron Schedule Ayarla
Türkiye saati için UTC hesaplaması:
- **Yaz saati (UTC+3)**: Türkiye 09:00 = UTC 06:00 → `0 6 * * *`
- **Kış saati (UTC+2)**: Türkiye 09:00 = UTC 07:00 → `0 7 * * *`

```yaml
# Yaz saati için
- cron: '0 6 * * *'

# Kış saati için (Ekim-Mart)
- cron: '0 7 * * *'

# Her 6 saatte bir
- cron: '0 */6 * * *'

# Sadece hafta içi
- cron: '0 6 * * 1-5'
```

### 🔍 Monitoring ve Debug

**Çalışma Geçmişi:**
- GitHub → Actions → Check Task Deadlines
- Her çalışmanın detaylı logları görünür

**Email Bildirimi:**
- GitHub otomatik olarak başarısız çalışmalar için email gönderir
- Settings → Notifications → Actions'dan ayarlayabilirsiniz

**Slack Entegrasyonu:**
```yaml
- name: Notify Slack on Failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "⚠️ Task deadline check failed!"
      }
```

---

## 2️⃣ Supabase Cron (pg_cron)

### ✅ Avantajlar
- **Veritabanı içinde** - Harici servis gerekmez
- **Çok güvenilir** - PostgreSQL native extension
- **Otomatik retry** - Başarısız işleri tekrar dener
- **Düşük latency** - Aynı network içinde
- **Kolay yönetim** - SQL ile kontrol
- **Hassas zamanlama** - Saniye hassasiyetinde

### ❌ Dezavantajlar
- **Ücretli plan gerekli** - Pro plan ($25/ay) veya üzeri
- **SQL bilgisi gerekli** - Kurulum için SQL yazmalısınız
- **Monitoring zor** - Supabase logs'a bakmalısınız
- **Debug zor** - Hata mesajları sınırlı

### 📋 Kurulum Adımları

#### Adım 1: pg_cron Extension'ı Aktifleştir
Supabase Dashboard → **Database** → **Extensions**
- `pg_cron` extension'ını bulun ve **Enable** edin

#### Adım 2: Cron Job Oluştur
Supabase Dashboard → **SQL Editor** → **New query**

```sql
-- Cron job oluştur
SELECT cron.schedule(
  'check-task-deadlines',           -- Job adı
  '0 6 * * *',                      -- Schedule (her gün 06:00 UTC)
  $$
  SELECT
    net.http_post(
      url := 'https://your-project-ref.supabase.co/functions/v1/check-task-deadlines',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_ANON_KEY_HERE'
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);
```

**⚠️ ÖNEMLİ:** `YOUR_ANON_KEY_HERE` yerine gerçek anon key'inizi yazın.

#### Adım 3: Cron Job'ları Listele
```sql
-- Tüm cron job'ları göster
SELECT * FROM cron.job;

-- Çalışma geçmişi
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'check-task-deadlines')
ORDER BY start_time DESC 
LIMIT 10;
```

#### Adım 4: Test Et
```sql
-- Manuel çalıştır (test için)
SELECT cron.unschedule('check-task-deadlines');
SELECT cron.schedule(
  'check-task-deadlines-test',
  '* * * * *',  -- Her dakika (test için)
  $$
  SELECT net.http_post(
    url := 'https://your-project-ref.supabase.co/functions/v1/check-task-deadlines',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_ANON_KEY_HERE'
    )
  );
  $$
);

-- 5 dakika sonra test job'ı sil
SELECT cron.unschedule('check-task-deadlines-test');
```

### 🔍 Monitoring ve Debug

**Çalışma Geçmişi:**
```sql
-- Son 24 saatteki çalışmalar
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'check-task-deadlines')
  AND start_time > NOW() - INTERVAL '24 hours'
ORDER BY start_time DESC;
```

**Hata Kontrolü:**
```sql
-- Başarısız çalışmalar
SELECT * FROM cron.job_run_details
WHERE status = 'failed'
  AND jobid = (SELECT jobid FROM cron.job WHERE jobname = 'check-task-deadlines')
ORDER BY start_time DESC;
```

**Job Güncelleme:**
```sql
-- Mevcut job'ı sil
SELECT cron.unschedule('check-task-deadlines');

-- Yeni schedule ile tekrar oluştur
SELECT cron.schedule(
  'check-task-deadlines',
  '0 7 * * *',  -- Yeni saat
  $$ ... $$
);
```

---

## 3️⃣ Cron-job.org (Alternatif)

### ✅ Avantajlar
- **Tamamen ücretsiz**
- **Çok kolay kurulum** - Web UI ile 2 dakikada
- **Timezone desteği** - Türkiye saati direkt seçebilirsiniz
- **Email bildirimleri** - Başarısız çalışmalar için
- **Manuel tetikleme** - Tek tıkla test

### ❌ Dezavantajlar
- **Dış servise bağımlılık** - Cron-job.org çökerse çalışmaz
- **Sınırlı monitoring** - Basit web UI
- **Güvenlik riski** - API key'i 3. parti servise veriyorsunuz
- **Rate limiting** - Ücretsiz planda günde 1 çalışma

### 📋 Kurulum Adımları

#### Adım 1: Hesap Oluştur
1. https://cron-job.org/ adresine git
2. **Sign up** → Email ile kayıt ol
3. Email'i doğrula

#### Adım 2: Cronjob Oluştur
1. Dashboard → **Create cronjob**
2. Formu doldur:

**Title:** `Check Task Deadlines`

**URL:** 
```
https://your-project-ref.supabase.co/functions/v1/check-task-deadlines
```

**Schedule:**
- **Execution time:** `09:00` (Türkiye saati)
- **Days:** Every day
- **Timezone:** `Europe/Istanbul`

**Request settings:**
- **Request method:** `POST`
- **Request timeout:** `30 seconds`

**Headers:**
```
Authorization: Bearer YOUR_ANON_KEY_HERE
Content-Type: application/json
```

**Notifications:**
- ✅ Enable failure notifications
- Email: your-email@example.com

#### Adım 3: Test Et
1. Cronjob listesinde job'ı bul
2. **▶️ Run now** butonuna tıkla
3. **Execution history** sekmesinden sonucu kontrol et

### 🔍 Monitoring

**Execution History:**
- Dashboard → Cronjob seç → **History** sekmesi
- Son 100 çalışma görünür

**Email Bildirimleri:**
- Başarısız çalışmalar için otomatik email

---

## 🎯 Hangi Seçeneği Seçmeliyim?

### GitHub Actions Seç Eğer:
- ✅ Zaten GitHub kullanıyorsanız
- ✅ Ücretsiz çözüm istiyorsanız
- ✅ Güçlü monitoring istiyorsanız
- ✅ Versiyon kontrolü istiyorsanız
- ✅ CI/CD pipeline'ınız varsa

**→ ÇOK ÖNERİLİR** 🌟

### Supabase Cron Seç Eğer:
- ✅ Supabase Pro plan'ınız varsa ($25/ay)
- ✅ Maksimum güvenilirlik istiyorsanız
- ✅ Harici servise bağımlı olmak istemiyorsanız
- ✅ Saniye hassasiyetinde zamanlama gerekiyorsa

**→ Pro plan varsa ideal**

### Cron-job.org Seç Eğer:
- ✅ Hızlı prototip yapıyorsanız
- ✅ GitHub repo'nuz yoksa
- ✅ Basit bir çözüm yeterli ise
- ✅ Timezone yönetimi önemliyse

**→ Geçici çözüm için uygun**

---

## 🚀 Önerilen Kurulum Sırası

### 1. Geliştirme Aşaması
**Cron-job.org** kullanın:
- Hızlı kurulum
- Kolay test
- Ücretsiz

### 2. Production'a Geçiş
**GitHub Actions**'a geçin:
- Daha güvenilir
- Daha iyi monitoring
- Versiyon kontrolü

### 3. Scale Aşaması
**Supabase Cron**'a geçin (opsiyonel):
- Maksimum performans
- Minimum latency
- Enterprise-grade güvenilirlik

---

## 📞 Destek ve Troubleshooting

### GitHub Actions Sorunları
```bash
# Workflow syntax kontrolü
gh workflow view check-task-deadlines

# Manuel tetikleme
gh workflow run check-task-deadlines

# Son çalışmaları listele
gh run list --workflow=check-task-deadlines
```

### Supabase Cron Sorunları
```sql
-- Job çalışıyor mu?
SELECT * FROM cron.job WHERE jobname = 'check-task-deadlines';

-- Son hata neydi?
SELECT return_message FROM cron.job_run_details
WHERE status = 'failed'
ORDER BY start_time DESC
LIMIT 1;

-- Job'ı yeniden başlat
SELECT cron.unschedule('check-task-deadlines');
-- Sonra tekrar schedule edin
```

### Genel Sorunlar

**Bildirim Gelmiyor:**
1. Edge Function deploy edildi mi? → `supabase functions list`
2. Cron çalışıyor mu? → Monitoring kontrol et
3. API key doğru mu? → Test et
4. Timezone doğru mu? → UTC hesaplaması kontrol et

**Duplicate Bildirimler:**
- Edge Function aynı gün için tekrar bildirim göndermez
- Cron'un birden fazla kez çalışıp çalışmadığını kontrol edin

**Geç Bildirimler:**
- GitHub Actions 5-10 dakika gecikebilir
- Supabase Cron daha hassas
- Timezone ayarlarını kontrol edin
