# Eksen AI - Personel Yönetim ve Analiz Sistemi

Modern, AI destekli personel yönetim ve performans analiz platformu.

## 🎯 Özellikler

### 📊 Personel Yönetimi
- Personel profilleri ve organizasyon yapısı
- Rol bazlı yetkilendirme (Owner, Manager, Personnel)
- Davet kodu sistemi ile organizasyon yönetimi

### 📝 Not ve Görev Takibi
- Metin ve sesli not ekleme
- Görev atama ve takip
- Yıldız bazlı değerlendirme sistemi
- Real-time bildirimler

### 🤖 AI Analiz
- Google Gemini entegrasyonu
- Personel performans analizi
- Güçlü yönler ve gelişim alanları tespiti
- Üç farklı analiz türü (Bütünleşik, Eğilim, Yetkinlik)

### ⏰ Zamanlanmış Görevler
- Tekrarlayan görev oluşturma (günlük, haftalık, aylık)
- İzin ve atlama tarihleri yönetimi
- Otomatik görev oluşturma (Cron jobs)

### 🔔 Bildirim Sistemi
- Real-time bildirimler (Supabase)
- Push notifications (OneSignal)
- PWA desteği

### 📱 Progressive Web App (PWA)
- Offline çalışma desteği
- Home screen'e ekleme
- Native app deneyimi

## 🛠️ Teknoloji Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks

### Backend
- **BaaS**: Supabase
  - Authentication (JWT)
  - PostgreSQL Database
  - Row Level Security (RLS)
  - Real-time Subscriptions
  - Edge Functions (Deno)
  - Cron Jobs

### AI
- **Google Gemini API** (Edge Functions üzerinden)

### Notifications
- **OneSignal** (Push notifications)
- **Supabase Real-time** (In-app notifications)

### Deployment
- **Frontend**: Vercel
- **Backend**: Supabase Cloud

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+
- npm veya yarn
- Supabase hesabı
- Google Gemini API key
- OneSignal hesabı (opsiyonel)

### 1. Repository'yi Klonlayın
```bash
git clone https://github.com/your-username/eksen-ai.git
cd eksen-ai
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Environment Variables
`.env.local` dosyası oluşturun:
```bash
cp .env.example .env.local
```

Gerekli değerleri doldurun:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
NEXT_PUBLIC_ONESIGNAL_APP_ID=your_onesignal_app_id
ONESIGNAL_REST_API_KEY=your_onesignal_rest_api_key
```

### 4. Supabase Setup
```bash
# Supabase CLI kurulumu
npm install -g supabase

# Migrations çalıştır
supabase db push

# Edge Functions deploy et
supabase functions deploy
```

### 5. Development Server
```bash
npm run dev
```

Tarayıcıda açın: http://localhost:3000

## 📦 Production Deployment

### Vercel Deployment
1. GitHub'a push edin
2. Vercel'e import edin
3. Environment variables ekleyin
4. Deploy!

Detaylı adımlar için: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

## 🏗️ Proje Yapısı

```
eksen-ai/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth sayfaları
│   ├── (dashboard)/       # Dashboard sayfaları
│   └── layout.tsx
├── components/            # React componentleri
│   ├── auth/
│   ├── personnel/
│   ├── notes/
│   ├── tasks/
│   ├── analyses/
│   └── ui/
├── lib/                   # Utilities ve hooks
│   ├── supabase/
│   ├── hooks/
│   ├── utils/
│   └── types/
├── supabase/             # Supabase config
│   ├── functions/        # Edge Functions
│   └── migrations/       # Database migrations
└── public/               # Static assets
```

## 🔐 Güvenlik

- Row Level Security (RLS) her tabloda aktif
- JWT token authentication
- Permission-based access control
- API keys Supabase Secrets'ta
- HTTPS zorunlu (production)

## 📄 Lisans

MIT License - Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📞 İletişim

Proje Sahibi - [@your-username](https://github.com/your-username)

Proje Linki: [https://github.com/your-username/eksen-ai](https://github.com/your-username/eksen-ai)

## 🙏 Teşekkürler

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Vercel](https://vercel.com/)
- [Google Gemini](https://ai.google.dev/)
- [OneSignal](https://onesignal.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Eksen AI** ile personel yönetimini kolaylaştırın! 🚀
