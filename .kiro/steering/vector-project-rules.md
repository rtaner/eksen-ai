---
inclusion: always
---

# Vector Project Development Rules

Bu dosya, Vector PWA projesinin geliştirilmesi sırasında uyulması gereken kuralları içerir. Bu kurallar her task execution'da otomatik olarak uygulanır.

## Geliştirme Kuralları

### 1. Dosya Boyutu Limiti
- **Kural**: Hiçbir dosya 600 satırdan fazla kod içeremez
- **Uygulama**: 
  - Her dosya oluşturulduğunda veya düzenlendiğinde satır sayısını kontrol et
  - 500 satırı geçen dosyalar için refactoring planla
  - 600 satıra ulaşan dosyaları hemen böl
- **Çözüm**: Component splitting, custom hooks, utility modules, type definitions ayrımı

### 2. Syntax Kontrol
- **Kural**: Her önemli değişiklikten sonra syntax hataları kontrol edilmeli
- **Uygulama**:
  - Her dosya oluşturma/düzenleme sonrası `getDiagnostics` tool kullan
  - TypeScript errors'ı hemen düzelt
  - ESLint warnings'leri gözden geçir
- **Araçlar**: `getDiagnostics` tool, TypeScript compiler

### 3. Aşamalı Geliştirme
- **Kural**: Her özellik tek tek geliştirilecek, test edilecek ve onaylandıktan sonra bir sonraki özelliğe geçilecek
- **Uygulama**:
  - Bir task'ı tamamen bitir
  - Kullanıcıya göster ve onay al
  - Ancak onaydan sonra bir sonraki task'a geç
  - **ÖNEMLİ**: Asla otomatik olarak bir sonraki task'a geçme

### 4. Canlı Test
- **Kural**: Her özellik canlıya alınıp test edilecek
- **Uygulama**:
  - Development server'ı çalıştır (localhost:3000)
  - Özelliği manuel olarak test et
  - Farklı cihaz boyutlarında test et (mobile-first)
  - Kullanıcıya test sonuçlarını bildir

## Teknik Stack (Değiştirilemez)

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **State Management**: React hooks + Supabase client
- **PWA**: next-pwa paketi

### Backend
- **BaaS**: Supabase
  - Auth: Supabase Auth (JWT)
  - Database: PostgreSQL + Row Level Security
  - Real-time: Supabase Real-time subscriptions
  - Backend Logic: Edge Functions (Deno runtime)
- **AI**: Google Gemini API (sadece Edge Functions üzerinden)

### Deployment
- **Frontend**: Railway (geliştirme: localhost)
- **Backend**: Supabase Cloud
- **Version Control**: GitHub

## Mimari Prensipler

### 1. Serverless-First
- **Kural**: Geleneksel Node.js/Express backend YOK
- **Uygulama**:
  - Tüm backend logic Supabase Edge Functions'da
  - API routes sadece Edge Function proxy için
  - Client-side'dan direkt Gemini API çağrısı YOK

### 2. Mobile-First
- **Kural**: Tüm UI önce mobil için tasarlanmalı
- **Uygulama**:
  - Tailwind breakpoints: mobile → tablet → desktop
  - Touch targets minimum 44x44px
  - Responsive design her component'te
  - Test önce mobil cihazlarda

### 3. Security-First
- **Kural**: Güvenlik her adımda öncelik
- **Uygulama**:
  - API keys asla frontend'de (Supabase Secrets)
  - Row Level Security (RLS) her tablo için
  - JWT token validation her request'te
  - Permission checks her action'da

### 4. Real-time
- **Kural**: Veri değişiklikleri anlık yansımalı
- **Uygulama**:
  - Supabase Real-time subscriptions kullan
  - Component unmount'ta unsubscribe et
  - Optimistic updates uygula

## Kod Organizasyonu

### Klasör Yapısı
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages
│   ├── (dashboard)/       # Protected pages
│   └── layout.tsx
├── components/            # React components
│   ├── auth/
│   ├── personnel/
│   ├── notes/
│   ├── tasks/
│   ├── analysis/
│   ├── permissions/
│   └── ui/               # Reusable UI
├── lib/
│   ├── supabase/         # Supabase clients
│   ├── hooks/            # Custom hooks
│   ├── utils/            # Utility functions
│   └── types/            # TypeScript types
└── public/               # Static assets
```

### Component Kuralları
- Her component kendi dosyasında
- Props interface her zaman tanımla
- Default export kullan
- Dosya adı = Component adı (PascalCase)

### Hook Kuralları
- Custom hooks `use` prefix ile başlar
- Tek sorumluluk prensibi
- Return type her zaman tanımla
- Cleanup logic unutma

### Utility Kuralları
- Pure functions
- Type-safe
- Tek sorumluluk
- Test edilebilir

## Veritabanı Kuralları

### Tablo İsimlendirme
- Küçük harf, çoğul (organizations, profiles, notes)
- Snake_case (created_at, organization_id)

### Foreign Keys
- Her zaman tanımla
- ON DELETE CASCADE/SET NULL dikkatli kullan
- Index ekle

### RLS Policies
- Her tablo için SELECT, INSERT, UPDATE, DELETE
- Policy isimleri açıklayıcı
- Test et (farklı roller ile)

### Migrations
- Sıralı numaralandırma (001_, 002_)
- Geri alınabilir (DOWN migration)
- Açıklayıcı isimler

## Permission Sistemi

### Kontrol Noktaları
1. **UI Level**: Component render'da permission check
2. **API Level**: Edge Function'da permission check
3. **Database Level**: RLS policy

### Permission Check Pattern
```typescript
const { canCreate, canEdit, canDelete } = usePermissions('notes');

if (!canCreate) return null; // Hide UI

// API call
if (!canCreate) throw new Error('Unauthorized');

// RLS policy handles database level
```

## Error Handling

### Frontend
- User-friendly messages (Türkçe)
- Toast notifications
- Form validation errors inline
- Network errors → retry button

### Backend
- Structured error responses
- Log errors (console.error)
- Don't expose sensitive info
- HTTP status codes doğru kullan

## Testing Stratejisi

### Unit Tests
- Utility functions
- Custom hooks
- Permission logic

### Integration Tests
- Auth flow
- CRUD operations
- Permission enforcement

### E2E Tests
- Critical user journeys
- PWA functionality
- Mobile responsiveness

## Performance Kuralları

### Bundle Size
- Initial load < 200KB
- Code splitting kullan
- Dynamic imports for heavy components
- Tree shaking verify et

### Images
- Next.js Image component kullan
- WebP format
- Lazy loading
- Responsive images

### Database
- Index'leri unutma
- N+1 query'lerden kaçın
- Pagination uygula
- Cache where appropriate

## Git Workflow

### Commit Messages
- Türkçe veya İngilizce (tutarlı ol)
- Açıklayıcı (ne yaptığını anlat)
- Format: `feat: add user authentication`

### Branch Strategy
- main: production-ready
- develop: development
- feature/*: yeni özellikler
- fix/*: bug fixes

## Task Execution Kuralları

### Her Task İçin
1. Task'ı oku ve anla
2. İlgili requirements'ı kontrol et
3. Design dokümanına bak
4. Kodu yaz (max 600 satır/dosya)
5. Syntax kontrol et (`getDiagnostics`)
6. Test et (localhost)
7. Kullanıcıya göster ve onay al
8. **Asla otomatik olarak bir sonraki task'a geçme**

### Task Tamamlama Kriterleri
- [ ] Kod yazıldı
- [ ] Syntax hataları yok
- [ ] Dosya boyutu < 600 satır
- [ ] Localhost'ta test edildi
- [ ] Kullanıcı onayı alındı

## Özel Durumlar

### Dosya 600 Satırı Geçerse
1. Durdur
2. Refactoring planı yap
3. Kullanıcıya bildir
4. Dosyayı böl:
   - Component → Alt-componentler
   - Logic → Custom hooks
   - Types → Ayrı dosya
   - Utils → Utility modules

### Syntax Hatası Bulunursa
1. Hatayı logla
2. Düzelt
3. Tekrar kontrol et
4. Devam et

### Test Başarısız Olursa
1. Hatayı analiz et
2. Düzelt
3. Tekrar test et
4. Kullanıcıya bildir

## Önemli Hatırlatmalar

⚠️ **ASLA YAPMA:**
- Frontend'den direkt Gemini API çağrısı
- API keys'i frontend'e koy
- RLS policy'leri atla
- 600 satırı geç
- Syntax kontrolü yapma
- Kullanıcı onayı almadan devam et

✅ **HER ZAMAN YAP:**
- Mobile-first düşün
- Permission check yap
- Real-time subscriptions kullan
- Cleanup logic yaz
- Error handling ekle
- TypeScript types tanımla
- Dosya boyutunu kontrol et
- Syntax kontrol et
- Test et
- Kullanıcıdan onay al

## Yardımcı Komutlar

### Development
```bash
# Dev server
npm run dev

# Type check
npm run type-check

# Lint
npm run lint

# Build
npm run build
```

### Supabase
```bash
# Start local
supabase start

# Generate types
supabase gen types typescript --local > src/lib/types/database.types.ts

# Deploy functions
supabase functions deploy

# Run migrations
supabase db push
```

### Testing
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

---

**Bu kurallar her task execution'da otomatik olarak uygulanır. Herhangi bir kural ihlali durumunda execution durdurulur ve kullanıcıya bildirilir.**
