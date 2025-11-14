# Implementation Plan

- [x] 1. RLS Policy Güncellemesi


  - Mevcut notes RLS policy'yi yedekle
  - Yeni basitleştirilmiş policy'yi oluştur (Personnel ve Manager için ayrı kontroller)
  - Policy'yi test et (farklı rollerle)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 2. usePermissions Hook Güncelleme


  - [x] 2.1 Real-time subscription ekle

    - organizationId ve userId state'lerini ekle
    - permissions tablosundaki UPDATE event'lerini dinle
    - Owner olmayan kullanıcılar için subscription aktif et
    - Cleanup fonksiyonu ekle (unsubscribe)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  

  - [ ] 2.2 Not bazlı yetki kontrol fonksiyonları ekle
    - canEditNote fonksiyonu: Owner veya not yazarı kontrolü
    - canDeleteNote fonksiyonu: Owner veya not yazarı kontrolü
    - userId state'ini kullan (author_id karşılaştırması için)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 8.3, 8.4_

- [x] 3. Not Listesi Component'lerini Güncelle


  - [x] 3.1 NotesList component'ini güncelle

    - canEditNote ve canDeleteNote fonksiyonlarını kullan
    - Her not için düzenle/sil butonlarının görünürlüğünü kontrol et
    - RLS'in otomatik filtreleme yaptığını varsay (frontend'de ekstra filtreleme yok)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  

  - [ ] 3.2 NoteCard component'ini güncelle
    - canEdit ve canDelete prop'larını al
    - Butonları prop'lara göre göster/gizle
    - Owner için her zaman butonları göster
    - _Requirements: 8.3, 8.4_

- [x] 4. Not Ekleme Buton Kontrolü



  - PersonnelPageClient'ta canCreate kontrolü ekle
  - Personnel için: sadece kendi sayfasında "Not Ekle" butonu göster
  - Manager için: can_create true ise her sayfada göster
  - Owner için: her zaman göster
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 5. Test ve Doğrulama
  - [ ] 5.1 Personnel rolü testleri
    - can_view:true ile kendisi hakkındaki tüm notları görebildiğini test et
    - can_view:false ile sadece kendi yazdığı notları görebildiğini test et
    - Başkasının sayfasında not göremediğini test et
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [ ] 5.2 Manager rolü testleri
    - can_view:true + kendi sayfası: herkesin notlarını görebildiğini test et
    - can_view:true + başkasının sayfası: sadece kendi notlarını görebildiğini test et
    - can_view:false: her yerde sadece kendi notlarını görebildiğini test et
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [ ] 5.3 Owner rolü testleri
    - Her sayfada tüm notları görebildiğini test et
    - Tüm butonların görünür olduğunu test et
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ] 5.4 Real-time güncelleme testleri
    - İki tarayıcıda farklı kullanıcılarla giriş yap
    - Owner yetki değiştirdiğinde diğer kullanıcının ekranında güncelleme olduğunu test et
    - Sayfa yenilenmeden çalıştığını doğrula
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ] 5.5 Buton görünürlük testleri
    - Düzenle butonu: sadece not yazarı ve Owner için görünür
    - Sil butonu: sadece not yazarı ve Owner için görünür
    - Not Ekle butonu: yetkilere göre görünür/gizli
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
