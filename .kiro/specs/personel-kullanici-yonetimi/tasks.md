# Implementation Plan

- [x] 1. Personel Ana Sayfası - Salt Okunur Hale Getirme





  - PersonnelCard component'inden 3 nokta menüsünü ve düzenleme/silme işlevlerini kaldır
  - PersonnelPageClient component'inden CRUD modal state'lerini ve işlevlerini kaldır
  - Kartların sadece detay sayfasına yönlendirme yapmasını sağla
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Manuel Personel Düzenleme Formu Oluşturma



  - ManualPersonnelEditForm component'ini oluştur (sadece isim alanı)
  - Form validation ekle (isim boş olamaz)
  - Supabase personnel tablosuna güncelleme logic'i yaz
  - Success ve error handling ekle
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 3. Kullanıcı Yönetimi - Veri Yapısını Genişletme


  - UserManagementClient component'inde UserOrPersonnel interface'ini tanımla
  - fetchUsersAndPersonnel fonksiyonunu yaz (profiles + personnel sorguları)
  - Manuel personelleri (user_id olmayan) filtrele ve listeye ekle
  - State yönetimini güncelle (users yerine usersAndPersonnel)
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 4. Badge Sistemi - Gerçek Kullanıcı vs Manuel Personel Ayrımı


  - getRoleBadge fonksiyonunu güncelle (mevcut rol badge'leri)
  - getManualPersonnelBadge fonksiyonunu ekle (turuncu badge + 🔒 ikonu)
  - Badge render logic'ini güncelle (isRealUser kontrolü)
  - Badge stillerini responsive hale getir (mobile-first)
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 5. Dinamik Düzenleme Modal Sistemi


  - handleEdit fonksiyonunu güncelle (isRealUser kontrolü ekle)
  - Gerçek kullanıcı için UserEditForm modalını aç
  - Manuel personel için ManualPersonnelEditForm modalını aç
  - Modal state yönetimini güncelle (iki ayrı modal state)
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3_

- [x] 6. Rol Değiştirme - Manuel Personeller İçin Destek


  - handleRoleChange fonksiyonunu güncelle (isRealUser kontrolü)
  - Gerçek kullanıcı için profiles tablosunu güncelle
  - Manuel personel için personnel.metadata.role'ü güncelle
  - Rol toggle butonlarının doğru gösterilmesini sağla
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 7. Silme İşlevi - Manuel Personeller İçin Destek



  - handleDelete fonksiyonunu güncelle (isRealUser kontrolü)
  - Gerçek kullanıcı için mevcut UserDeleteConfirm component'ini kullan
  - Manuel personel için personnel tablosundan silme logic'i ekle
  - Onay dialogunu her iki tip için göster
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 8. UI/UX İyileştirmeleri ve Responsive Design
  - Tüm butonların touch-friendly olduğunu kontrol et (min 44x44px)
  - Badge'lerin mobilde okunabilir olduğunu doğrula
  - Modal'ların mobilde düzgün göründüğünü test et
  - Loading state'lerini ekle (skeleton screens)
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [ ] 9. Error Handling ve Kullanıcı Geri Bildirimi
  - Tüm API çağrılarına try-catch ekle
  - Toast notification sistemi ekle (success/error mesajları)
  - Form validation error'larını inline göster
  - Network error'ları için retry mekanizması ekle
  - _Requirements: 3.2, 4.2, 6.3_

- [x] 10. Syntax Kontrol ve Final Test



  - getDiagnostics ile tüm değişen dosyaları kontrol et
  - TypeScript error'larını düzelt
  - ESLint warning'lerini gözden geçir
  - Localhost'ta tüm flow'ları test et
  - _Requirements: Tüm requirements_
