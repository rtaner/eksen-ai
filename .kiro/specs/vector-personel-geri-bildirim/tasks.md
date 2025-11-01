# Implementation Plan

- [x] 1. Proje kurulumu ve temel yapılandırma



  - Next.js 14+ projesi oluştur (App Router, TypeScript)
  - Tailwind CSS yapılandırması
  - Supabase client kurulumu ve environment variables
  - Proje klasör yapısını oluştur (app, components, lib, public)
  - _Requirements: 19.1, 19.2_

- [x] 2. Supabase veritabanı şeması ve RLS politikaları





  - [x] 2.1 Veritabanı tablolarını oluştur

    - organizations, profiles, permissions, personnel, notes, tasks, ai_analyses tablolarını SQL migration ile oluştur
    - Foreign key ilişkilerini tanımla


    - Index'leri ekle
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7_
  - [x] 2.2 Row Level Security (RLS) politikalarını uygula


    - Her tablo için SELECT, INSERT, UPDATE, DELETE politikaları
    - Organizasyon bazlı veri izolasyonu
    - Rol ve permission bazlı erişim kontrolü
    - _Requirements: 18.8, 3.3, 3.4, 3.5_
  - [x] 2.3 TypeScript type definitions oluştur

    - Supabase CLI ile database types generate et
    - Custom type definitions ekle (Role, ResourceType, TaskStatus)
    - _Requirements: 19.1_

- [x] 3. Authentication sistemi



  - [x] 3.1 Supabase Auth yapılandırması


    - Auth provider ayarları
    - JWT token yönetimi
    - Session persistence
    - _Requirements: 2.2, 2.4_
  - [x] 3.2 Kayıt (Register) sayfası ve fonksiyonalitesi


    - RegisterForm component (ad, soyad, kullanıcı adı, şifre, opsiyonel davet kodu)
    - Username uniqueness validation
    - Davet kodu yoksa yeni organizasyon oluşturma logic
    - Davet kodu varsa mevcut organizasyona katılma logic
    - Benzersiz invite_code generation
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.1_

  - [x] 3.3 Giriş (Login) sayfası ve fonksiyonalitesi

    - LoginForm component (kullanıcı adı, şifre)
    - Supabase Auth ile authentication
    - Başarılı giriş sonrası redirect
    - Error handling
    - _Requirements: 2.1, 2.3, 2.5_

  - [x] 3.4 Auth middleware ve protected routes

    - Next.js middleware ile route protection
    - Unauthenticated kullanıcıları login'e yönlendirme
    - useAuth custom hook
    - _Requirements: 2.3_

- [x] 4. Temel UI bileşenleri



  - Button, Input, Modal, Card, StarRating gibi reusable components
  - Tailwind CSS ile mobile-first styling
  - Touch-optimized sizing (min 44x44px)
  - _Requirements: 16.1, 16.2, 16.3_

- [x] 5. Dashboard layout ve navigation



  - Dashboard layout component (header, sidebar/bottom nav, content area)
  - Rol bazlı navigation items (Owner için settings, Personnel için My Tasks)
  - Responsive navigation (mobile: bottom nav, desktop: sidebar)
  - _Requirements: 16.4_

- [x] 6. Yetki (Permission) sistemi



  - [x] 6.1 Default permission seeding

    - Organizasyon oluşturulduğunda default permissions oluştur
    - Owner: tüm yetkiler, Manager: sınırlı yetkiler, Personnel: minimal yetkiler
    - _Requirements: 4.5_
  - [x] 6.2 Permission management sayfası (Owner only)


    - PermissionMatrix component (rol x kaynak x aksiyon grid)
    - PermissionToggle component (toggle switches)
    - Permission güncelleme API calls
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 6.3 usePermissions custom hook


    - Kullanıcının mevcut rolü ve permissions'ını fetch et
    - Permission check utility functions (canView, canCreate, canEdit, canDelete)
    - _Requirements: 4.4, 3.3_
  - [x] 6.4 Permission-based UI rendering

    - Component'lerde permission check'lere göre UI elementlerini göster/gizle
    - Unauthorized action attempts için error handling
    - _Requirements: 4.4_

- [x] 7. Organizasyon yönetimi (Owner only)



  - [x] 7.1 Organization settings sayfası


    - Organizasyon adını düzenleme formu
    - Mevcut invite code görüntüleme
    - Invite code özelleştirme (uniqueness validation)
    - _Requirements: 5.2, 5.3, 5.4, 5.5_
  - [x] 7.2 Kullanıcı rol atama


    - Organizasyondaki kullanıcıları listeleme
    - Manager rolü atama/kaldırma
    - _Requirements: 5.6_

- [x] 8. Personel yönetimi

  - [x] 8.1 Personel listesi sayfası



    - PersonnelList component
    - PersonnelCard component (grid/list view)
    - Search ve filter fonksiyonalitesi
    - "Add Personnel" button (permission-based visibility)
    - _Requirements: 6.1_
  - [x] 8.2 Personel ekleme/düzenleme



    - PersonnelForm component (modal veya separate page)
    - Name ve optional metadata fields
    - Create/Update API calls
    - Permission check (can_create, can_edit)
    - _Requirements: 6.2, 6.4_
  - [x] 8.3 Personel silme


    - Delete confirmation modal
    - Permission check (can_delete)
    - _Requirements: 6.5_

- [x] 9. Personel detay sayfası


  - [x] 9.1 Personel bilgileri ve layout



    - Personel adı ve metadata görüntüleme
    - Tab/section layout (Notlar, Görevler, Analiz)
    - _Requirements: 6.4_
  - [x] 9.2 Real-time subscriptions setup


    - useRealtime custom hook
    - Notes tablosu için real-time subscription
    - Tasks tablosu için real-time subscription
    - Cleanup on unmount
    - _Requirements: 12.1, 12.3, 12.5_

- [ ] 10. Not yönetimi
  - [x] 10.1 Not listesi görüntüleme


    - NoteList component
    - NoteItem component
    - Kronolojik sıralama (notlar + kapalı görevler mixed)
    - Author bilgisi görüntüleme
    - Permission-based visibility (Owner tümünü görür, diğerleri sadece kendilerininkileri)
    - _Requirements: 7.3, 7.7_
  - [x] 10.2 Metin notu ekleme



    - NoteForm component (text input)
    - Author_id tracking
    - Create API call
    - Permission check (can_create)
    - Real-time update
    - _Requirements: 7.1, 7.2_
  - [x] 10.3 Sesli not ekleme



    - VoiceRecorder component
    - Web Speech API integration
    - Real-time transcription display
    - Browser support check
    - Error handling (microphone access, recognition failure)
    - is_voice_note flag
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  - [x] 10.4 Not düzenleme ve silme



    - Edit inline veya modal
    - Delete confirmation
    - Permission check (can_edit, can_delete)
    - Owner tüm notları düzenleyebilir/silebilir
    - _Requirements: 7.5, 7.6, 7.7_

- [ ] 11. Görev yönetimi
  - [x] 11.1 ActivityFeed component (notlar + görevler birleşik görünüm)


    - Notlar ve görevleri kronolojik sıralama (created_at/completed_at)
    - TaskItem component (açık/kapalı görevler için)
    - NoteItem component (mevcut, tekrar kullan)
    - Açık görevler için "Kapat" butonu (permission-based)
    - Kapalı görevler için star rating gösterimi
    - _Requirements: 7.3, 9.6, 11.5_
  - [x] 11.2 Görev oluşturma modal (AddTaskModal)

    - Modal component (not ekleme ile aynı pattern)
    - Görev metni textarea
    - Sesli dikte için mikrofon butonu (VoiceRecorder component tekrar kullan)
    - Opsiyonel termin tarihi seçici (default: bugün)
    - "Görev Ata" ve "İptal" butonları
    - Create API call
    - Permission check (can_create)
    - Real-time update
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  - [x] 11.3 Görev düzenleme

    - Edit modal veya inline (sadece open tasks)
    - Description ve deadline değiştirme
    - Permission check (can_edit)
    - _Requirements: 9.5_
  - [x] 11.4 Görev kapatma ve değerlendirme


    - TaskCloseModal component
    - Star rating selector (1-5) - StarRating component kullan
    - Completion timestamp otomatik
    - Status update (open → closed)
    - Permission check (can_edit - task close permission can_edit'in parçası)
    - Real-time update
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 12. "İşlerim" (My Tasks) sayfası (Personnel için)
  - [x] 12.1 Açık görevleri listeleme

    - Sadece mevcut kullanıcıya atanan open tasks
    - Deadline'a göre sıralama
    - Overdue tasks highlighting
    - _Requirements: 10.1, 10.2, 10.3_
  - [x] 12.2 Real-time task updates



    - Yeni görev atandığında otomatik ekleme
    - Görev kapatıldığında otomatik kaldırma
    - _Requirements: 10.4, 10.5, 12.4_

- [ ] 13. AI analiz sistemi (Backend - Supabase Edge Function)
  - [x] 13.1 analyze-personnel Edge Function oluştur


    - Function boilerplate ve Supabase client setup
    - JWT token validation
    - Permission check (Manager veya Owner)
    - _Requirements: 13.2, 14.1_
  - [x] 13.2 Veri toplama ve formatlama

    - Personnel'e ait tüm notları fetch et
    - Personnel'e ait tüm closed tasks'ları (star_rating ile) fetch et
    - Gemini için structured prompt oluştur
    - _Requirements: 14.1, 14.2_
  - [x] 13.3 Gemini API integration



    - Google Generative AI SDK kurulumu
    - API key Supabase Secrets'dan al
    - Gemini API call (gemini-pro model)
    - Response parsing (JSON format)
    - Error handling (rate limit, timeout, API errors)
    - _Requirements: 14.3_
  - [x] 13.4 Analiz sonucunu kaydetme ve döndürme



    - ai_analyses tablosuna INSERT
    - Frontend'e JSON response
    - _Requirements: 14.4, 14.5_

- [ ] 14. AI analiz sistemi (Frontend)
  - [x] 14.1 Analiz tetikleme



    - AnalysisButton component
    - Minimum data validation (en az 1 note veya closed task)
    - Edge Function invoke
    - Loading state
    - Permission check
    - _Requirements: 13.1, 13.3, 13.4_
  - [x] 14.2 Analiz sonuçlarını görüntüleme


    - AnalysisDisplay component
    - Strengths section (güçlü yönler)
    - Development areas section (gelişim alanları)
    - Timestamp display
    - Refresh button
    - _Requirements: 15.1, 15.2, 15.3, 15.4_
  - [x] 14.3 Analiz geçmişi


    - AnalysisHistory component
    - Önceki analizleri listeleme
    - _Requirements: 15.5_

- [ ] 15. Progressive Web App (PWA) yapılandırması
  - [ ] 15.1 Manifest.json oluşturma
    - App metadata (name, short_name, description)
    - Icons (72x72, 192x192, 512x512)
    - Display mode (standalone)
    - Theme color ve background color
    - _Requirements: 17.1, 17.4_
  - [ ] 15.2 Service Worker implementasyonu
    - next-pwa paketi kurulumu ve yapılandırması
    - Caching strategies (app shell: cache-first, API: network-first)
    - Offline fallback
    - _Requirements: 17.2, 17.5_
  - [ ] 15.3 Install prompt
    - beforeinstallprompt event handling
    - Custom install button
    - _Requirements: 17.3_

- [ ] 16. Performans optimizasyonu ve final touches
  - [ ] 16.1 Image optimization
    - Next.js Image component kullanımı
    - Icon'ları optimize et
    - _Requirements: 16.5_
  - [ ] 16.2 Code splitting ve lazy loading
    - Dynamic imports for heavy components
    - Route-based code splitting (Next.js automatic)
    - _Requirements: 16.5_
  - [ ] 16.3 Bundle size optimization
    - Unused dependencies temizleme
    - Tree shaking verification
    - Target: < 200KB initial load
    - _Requirements: 16.5_
  - [ ] 16.4 Dosya boyutu kontrolü
    - Pre-commit hook ekle (600 satır kontrolü)
    - Gerekirse büyük dosyaları refactor et
    - _Requirements: 19.1, 19.2, 19.3, 19.4_

- [ ] 17. Testing ve deployment hazırlığı
  - [ ] 17.1 Unit tests
    - Permission utility functions test
    - Component rendering tests
    - Form validation tests
    - _Requirements: 19.1_
  - [ ] 17.2 Integration tests
    - Auth flow tests
    - CRUD operation tests
    - Permission enforcement tests
    - _Requirements: 19.1_
  - [ ] 17.3 Environment variables ve secrets yapılandırması
    - Supabase URL ve anon key
    - Gemini API key (Supabase Secrets)
    - Railway environment variables
    - _Requirements: 2.2_
  - [ ] 17.4 Deployment scripts
    - Railway deployment yapılandırması
    - Supabase functions deploy script
    - GitHub Actions CI/CD (optional)
    - _Requirements: 19.1_

- [ ] 18. İlk deployment ve test
  - [ ] 18.1 Supabase production setup
    - Production database oluştur
    - Migrations çalıştır
    - Edge Functions deploy et
    - Secrets yapılandır
    - _Requirements: 18.8_
  - [ ] 18.2 Railway deployment
    - Next.js production build
    - Environment variables set et
    - Custom domain (optional)
    - _Requirements: 16.5_
  - [ ] 18.3 End-to-end test
    - Tüm kritik user journey'leri test et
    - PWA install test et
    - Mobile cihazlarda test et
    - _Requirements: 16.1, 16.2, 17.3, 17.4_

