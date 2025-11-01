# Implementation Plan

- [ ] 1. DashboardLayout component'ine organization state ve data fetching ekle
  - DashboardLayout.tsx dosyasında `organizationName` state'i ekle
  - `fetchUserProfile` fonksiyonunu güncelle: profiles tablosundan organizations ile JOIN yaparak tek sorguda hem profile hem organization bilgisini çek
  - Organization name'i state'e set et (array veya object kontrolü ile)
  - Error handling'i koru, organization yüklenemezse diğer fonksiyonlar çalışmaya devam etsin
  - _Requirements: 1.1, 1.4, 4.1, 4.2_

- [ ] 2. Header bölümüne organization name display ekle
  - Header JSX yapısını güncelle: Logo ile User Section arasına organization badge ekle
  - Organization badge için Tailwind CSS stilleri uygula (bg-gray-50, rounded-lg, text-sm, font-medium)
  - Desktop'ta (md:block) organization name'i göster, mobile'da (hidden md:block) gizle
  - Loading state'de organization badge'i gösterme
  - _Requirements: 1.1, 1.2, 3.1, 3.2, 3.3_

- [ ] 3. Responsive davranış ve mobile optimization
  - Organization name için responsive class'ları ekle (hidden md:block)
  - Profile name için mevcut responsive davranışı koru (hidden sm:block)
  - Touch target boyutlarını kontrol et (min-h-[44px])
  - Farklı ekran boyutlarında test et (mobile, tablet, desktop)
  - _Requirements: 1.3, 2.2, 3.2, 3.3, 3.5_

- [ ] 4. Syntax kontrol ve final testing
  - getDiagnostics tool ile TypeScript hatalarını kontrol et
  - Dosya satır sayısını kontrol et (max 600 satır)
  - Development server'da test et (localhost:3000)
  - Login flow'u test et: organization name doğru yükleniyor mu?
  - Logout test et: state temizleniyor mu?
  - Farklı cihaz boyutlarında responsive davranışı test et
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4_
