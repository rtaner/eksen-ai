# Requirements Document

## Introduction

Bu doküman, Vector PWA uygulamasının header bileşeninde organizasyon isminin ve kullanıcı profil bilgilerinin görüntülenmesi özelliğinin gereksinimlerini tanımlar. Mevcut header'da sadece "Vector" logosu ve kullanıcı adı ile çıkış butonu bulunmaktadır. Bu özellik ile kullanıcılar hangi organizasyonda çalıştıklarını ve profil bilgilerini header'da görebileceklerdir.

## Glossary

- **DashboardLayout**: Uygulamanın ana layout component'i, header ve navigation içerir
- **Header**: Uygulamanın üst kısmında yer alan sabit bileşen
- **Organization**: Kullanıcıların bağlı olduğu kuruluş/şirket
- **Profile**: Kullanıcının ad, soyad ve rol bilgilerini içeren profil kaydı
- **Supabase Client**: Veritabanı işlemleri için kullanılan client kütüphanesi

## Requirements

### Requirement 1

**User Story:** Bir kullanıcı olarak, hangi organizasyonda çalıştığımı görmek istiyorum, böylece doğru organizasyonda olduğumdan emin olabilirim.

#### Acceptance Criteria

1. WHEN DashboardLayout component render edildiğinde, THE Header SHALL kullanıcının bağlı olduğu Organization ismini görüntüler
2. THE Header SHALL Organization ismini logo ile çıkış butonu arasında, merkezde veya sağ tarafta konumlandırır
3. WHILE kullanıcı mobil cihazda uygulamayı kullanırken, THE Header SHALL Organization ismini responsive şekilde görüntüler
4. IF Organization bilgisi yüklenirken hata oluşursa, THEN THE Header SHALL Organization ismini göstermez ancak diğer fonksiyonlar çalışmaya devam eder

### Requirement 2

**User Story:** Bir kullanıcı olarak, çıkış butonunun yanında profil ismimi görmek istiyorum, böylece hangi hesapla giriş yaptığımı kolayca görebilirim.

#### Acceptance Criteria

1. THE Header SHALL kullanıcının tam adını (name + surname) çıkış butonunun yanında görüntüler
2. WHILE kullanıcı mobil cihazda uygulamayı kullanırken, THE Header SHALL profil ismini responsive şekilde görüntüler veya gizler
3. WHEN kullanıcı profil bilgisi yüklendiğinde, THE Header SHALL profil ismini ve Organization ismini eşzamanlı olarak görüntüler
4. THE Header SHALL profil ismini ve çıkış butonunu görsel olarak birbirine yakın konumlandırır

### Requirement 3

**User Story:** Bir kullanıcı olarak, header'ın temiz ve düzenli görünmesini istiyorum, böylece uygulama profesyonel görünür.

#### Acceptance Criteria

1. THE Header SHALL Organization ismini ve profil bilgilerini mevcut tasarım diline uygun şekilde stillendirir
2. THE Header SHALL mobil cihazlarda (768px altı) Organization ismini gizleyebilir veya kısaltabilir
3. THE Header SHALL desktop cihazlarda tüm bilgileri (logo, Organization ismi, profil ismi, çıkış) görüntüler
4. THE Header SHALL yükleme durumunda skeleton veya loading state gösterir
5. THE Header SHALL minimum 44px yüksekliğinde touch target alanları sağlar (mobile-first prensibine uygun)

### Requirement 4

**User Story:** Bir geliştirici olarak, header component'inin performanslı çalışmasını istiyorum, böylece kullanıcı deneyimi olumsuz etkilenmez.

#### Acceptance Criteria

1. THE DashboardLayout SHALL Organization bilgisini profiles tablosundan JOIN ile tek sorguda çeker
2. THE DashboardLayout SHALL gereksiz re-render'ları önlemek için state yönetimini optimize eder
3. WHEN component unmount olduğunda, THE DashboardLayout SHALL tüm subscription'ları temizler
4. THE DashboardLayout SHALL Organization ve profil bilgilerini cache'leyerek tekrar eden sorguları azaltır
