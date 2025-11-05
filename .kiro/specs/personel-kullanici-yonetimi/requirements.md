# Requirements Document

## Introduction

Bu özellik, Vector PWA uygulamasında personel ve kullanıcı yönetimi sayfalarının kullanıcı deneyimini iyileştirmeyi amaçlamaktadır. Personel ana sayfası salt okunur hale getirilecek ve kullanıcı yönetimi sayfasında gerçek kullanıcılar ile manuel eklenen personeller arasında görsel ve işlevsel ayrım sağlanacaktır.

## Glossary

- **System**: Vector PWA uygulaması
- **Personel Ana Sayfası**: Organizasyondaki tüm personellerin listelendiği sayfa
- **Kullanıcı Yönetimi Sayfası**: Organizasyon yöneticilerinin kullanıcıları ve personelleri yönetebildiği ayarlar sayfası
- **Gerçek Kullanıcı**: Supabase Auth sisteminde kayıtlı, user_id değeri olan kullanıcı
- **Manuel Personel**: Sadece personnel tablosunda kayıtlı, user_id değeri olmayan personel kaydı
- **Düzenleme Modal**: Kullanıcı veya personel bilgilerini düzenlemek için açılan dialog penceresi
- **Badge**: Kullanıcı veya personel tipini gösteren görsel etiket
- **Rol Toggle Butonu**: Kullanıcının rolünü personel ve yönetici arasında değiştiren buton

## Requirements

### Requirement 1

**User Story:** Organizasyon yöneticisi olarak, personel ana sayfasında personelleri sadece görüntülemek istiyorum, böylece yanlışlıkla düzenleme veya silme işlemi yapmamı önleyebilirim.

#### Acceptance Criteria

1. WHEN THE yönetici Personel Ana Sayfasını görüntüler, THE System SHALL personel kartlarını 3 nokta menüsü olmadan gösterir
2. WHEN THE yönetici Personel Ana Sayfasındaki bir personel kartına tıklar, THE System SHALL düzenleme veya silme seçeneği sunmaz
3. WHEN THE yönetici Personel Ana Sayfasını görüntüler, THE System SHALL tüm personel bilgilerini salt okunur formatta gösterir

### Requirement 2

**User Story:** Organizasyon yöneticisi olarak, kullanıcı yönetimi sayfasında gerçek kullanıcıları manuel personellerden ayırt edebilmek istiyorum, böylece hangi personellerin sisteme giriş yapabileceğini kolayca görebilirim.

#### Acceptance Criteria

1. WHEN THE System Kullanıcı Yönetimi Sayfasında manuel personel gösterir, THE System SHALL "Gerçek Kullanıcı Değil" badge'ini gösterir
2. WHEN THE System Kullanıcı Yönetimi Sayfasında gerçek kullanıcı gösterir, THE System SHALL "Yönetici" veya "Personel" badge'ini gösterir
3. WHEN THE yönetici Kullanıcı Yönetimi Sayfasını görüntüler, THE System SHALL her kullanıcı ve personel için badge'i görsel olarak farklılaştırır

### Requirement 3

**User Story:** Organizasyon yöneticisi olarak, gerçek kullanıcıların bilgilerini düzenlerken tüm detayları görmek istiyorum, böylece kullanıcı hesabını tam olarak yönetebilirim.

#### Acceptance Criteria

1. WHEN THE yönetici gerçek kullanıcı için Düzenle butonuna tıklar, THE System SHALL Ad, Soyad, Kullanıcı Adı ve Yeni Şifre alanlarını içeren modal açar
2. WHEN THE yönetici düzenleme modalında değişiklik yapar ve kaydeder, THE System SHALL tüm değişiklikleri Supabase veritabanına kaydeder
3. WHEN THE yönetici düzenleme modalında İptal butonuna tıklar, THE System SHALL değişiklikleri kaydetmeden modalı kapatır

### Requirement 4

**User Story:** Organizasyon yöneticisi olarak, manuel personellerin bilgilerini düzenlerken sadece isim alanını görmek istiyorum, böylece basit ve hızlı bir şekilde isim güncellemesi yapabilirim.

#### Acceptance Criteria

1. WHEN THE yönetici manuel personel için Düzenle butonuna tıklar, THE System SHALL sadece İsim alanını içeren basit modal açar
2. WHEN THE yönetici manuel personel düzenleme modalında isim değiştirir ve kaydeder, THE System SHALL yeni ismi personnel tablosuna kaydeder
3. WHEN THE yönetici manuel personel düzenleme modalında İptal butonuna tıklar, THE System SHALL değişiklikleri kaydetmeden modalı kapatır

### Requirement 5

**User Story:** Organizasyon yöneticisi olarak, kullanıcıların ve manuel personellerin rollerini değiştirebilmek istiyorum, böylece organizasyon yapısını dinamik olarak yönetebilirim.

#### Acceptance Criteria

1. WHEN THE System personel rolüne sahip kullanıcı veya manuel personel gösterir, THE System SHALL "Yönetici Yap" butonunu gösterir
2. WHEN THE System yönetici rolüne sahip kullanıcı veya manuel personel gösterir, THE System SHALL "Personel Yap" butonunu gösterir
3. WHEN THE yönetici rol toggle butonuna tıklar, THE System SHALL kullanıcının veya manuel personelin rolünü günceller ve sayfayı yeniler

### Requirement 6

**User Story:** Organizasyon yöneticisi olarak, gerçek kullanıcıları ve manuel personelleri silebilmek istiyorum, böylece organizasyondan ayrılan kişileri sistemden kaldırabilirim.

#### Acceptance Criteria

1. WHEN THE yönetici gerçek kullanıcı için Sil butonuna tıklar, THE System SHALL onay dialogu gösterir
2. WHEN THE yönetici manuel personel için Sil butonuna tıklar, THE System SHALL onay dialogu gösterir
3. WHEN THE yönetici silme işlemini onaylar, THE System SHALL ilgili kaydı veritabanından siler ve sayfayı günceller
4. WHEN THE yönetici silme işlemini iptal eder, THE System SHALL hiçbir değişiklik yapmadan dialogu kapatır
