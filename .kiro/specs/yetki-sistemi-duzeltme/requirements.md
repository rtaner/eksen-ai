# Yetki Sistemi Düzeltme - Requirements

## Introduction

Vector PWA uygulamasındaki yetki yönetimi sisteminin hiyerarşik yetki kontrolü ile çalışması ve real-time güncelleme yapması için düzeltilmesi gerekiyor. Mevcut sistemde toggle butonları değiştirildiğinde bazı yetkiler uygulamada yansımıyor.

## Glossary

- **System**: Vector PWA uygulaması
- **Owner**: Organizasyonun sahibi, tüm yetkilere sahip rol (seviye 3)
- **Manager**: Yönetici rolü, orta seviye yetkiler (seviye 2)
- **Personnel**: Personel rolü, temel yetkiler (seviye 1)
- **RLS**: Row Level Security - PostgreSQL veritabanı seviyesinde güvenlik
- **Real-time**: Supabase real-time subscriptions ile anlık veri güncelleme
- **Hierarchy Level**: Rol hiyerarşi seviyesi (1: Personnel, 2: Manager, 3: Owner)
- **Resource**: Yetki kontrolü yapılan kaynak (personnel, notes, tasks)
- **Permission Toggle**: Yetki yönetimi sayfasındaki açma/kapama butonları

## Requirements

### Requirement 1: Personel Not Görüntüleme Sistemi

**User Story:** Personnel olarak, yetki ayarlarına göre kendim hakkında yazılan notları görmek istiyorum, böylece gizlilik kontrolüm olsun.

#### Acceptance Criteria

1. WHEN Personnel'in can_view yetkisi true ise ve personel sayfasında kendisi seçili ise, THE System SHALL kendisi hakkında herkes tarafından yazılan tüm notları gösterir
2. WHEN Personnel'in can_view yetkisi true ise ve personel sayfasında başkası seçili ise, THE System SHALL hiçbir not göstermez
3. WHEN Personnel'in can_view yetkisi false ise ve personel sayfasında kendisi seçili ise, THE System SHALL sadece kendi kendine yazdığı notları gösterir
4. WHEN Personnel'in can_view yetkisi false ise ve personel sayfasında başkası seçili ise, THE System SHALL hiçbir not göstermez
5. THE System SHALL Personnel rolünün başkaları hakkındaki notları asla görmemesini sağlar

### Requirement 2: Yönetici Not Görüntüleme Sistemi

**User Story:** Manager olarak, yetki ayarlarına göre hangi notları görebileceğimi bilmek istiyorum, böylece hem kendim hakkındaki notları hem de başkaları hakkında yazdığım notları görebilirim.

#### Acceptance Criteria

1. WHEN Manager'ın can_view yetkisi true ise ve personel sayfasında kendisi seçili ise, THE System SHALL kendisi hakkında herkes tarafından yazılan tüm notları gösterir
2. WHEN Manager'ın can_view yetkisi true ise ve personel sayfasında başkası seçili ise, THE System SHALL sadece kendi yazdığı notları gösterir
3. WHEN Manager'ın can_view yetkisi false ise ve personel sayfasında kendisi seçili ise, THE System SHALL sadece kendi kendine yazdığı notları gösterir
4. WHEN Manager'ın can_view yetkisi false ise ve personel sayfasında başkası seçili ise, THE System SHALL sadece kendi yazdığı notları gösterir
5. THE System SHALL Manager rolünün her zaman kendi yazdığı notları görmesini sağlar

### Requirement 3: Owner Not Görüntüleme Sistemi

**User Story:** Owner olarak, organizasyondaki tüm notları görmek istiyorum, böylece tam kontrol sahibi olabilirim.

#### Acceptance Criteria

1. WHEN Owner herhangi bir personel sayfasını görüntülediğinde, THE System SHALL o personel hakkında yazılan tüm notları gösterir
2. WHEN Owner herhangi bir personel sayfasını görüntülediğinde, THE System SHALL kimin yazdığına bakılmaksızın tüm notları gösterir
3. THE System SHALL Owner rolünün can_view ayarından bağımsız olarak her zaman tüm notları görmesini sağlar
4. THE System SHALL Owner rolünün tüm personeller hakkında not ekleyebilmesini sağlar
5. THE System SHALL Owner rolünün tüm notları düzenleyebilmesini ve silebilmesini sağlar

### Requirement 4: Not Ekleme Yetkileri

**User Story:** Kullanıcı olarak, yetki ayarlarına göre not ekleyebilmek istiyorum, böylece sadece yetkili olduğum durumlarda not ekleyebilirim.

#### Acceptance Criteria

1. WHEN Owner herhangi bir personel sayfasına girdiğinde, THE System SHALL her zaman "Not Ekle" butonunu gösterir
2. WHEN Manager'ın can_create yetkisi true ise, THE System SHALL herhangi bir personel sayfasında "Not Ekle" butonunu gösterir
3. WHEN Manager'ın can_create yetkisi false ise, THE System SHALL "Not Ekle" butonunu gizler
4. WHEN Personnel'in can_create yetkisi true ise ve personel sayfasında kendisi seçili ise, THE System SHALL "Not Ekle" butonunu gösterir
5. WHEN Personnel'in can_create yetkisi false ise veya başkası seçili ise, THE System SHALL "Not Ekle" butonunu gizler

### Requirement 5: Not Düzenleme ve Silme Yetkileri

**User Story:** Kullanıcı olarak, sadece kendi yazdığım notları düzenleyebilmek ve silebilmek istiyorum, böylece başkalarının notlarına müdahale edemeyeyim.

#### Acceptance Criteria

1. WHEN Owner herhangi bir notu görüntülediğinde, THE System SHALL düzenle ve sil butonlarını gösterir
2. WHEN Manager veya Personnel kendi yazdığı bir notu görüntülediğinde ve can_edit yetkisi true ise, THE System SHALL düzenle butonunu gösterir
3. WHEN Manager veya Personnel kendi yazdığı bir notu görüntülediğinde ve can_delete yetkisi true ise, THE System SHALL sil butonunu gösterir
4. WHEN Manager veya Personnel başkasının yazdığı bir notu görüntülediğinde, THE System SHALL düzenle ve sil butonlarını gizler
5. THE System SHALL sadece not yazarının ve Owner'ın notu düzenleyebilmesini ve silebilmesini sağlar

### Requirement 6: Real-time Yetki Güncellemesi

**User Story:** Kullanıcı olarak, Owner yetkileri değiştirdiğinde değişikliklerin anında yansımasını istiyorum, böylece sayfayı yenilemeden güncel yetkileri görebilirim.

#### Acceptance Criteria

1. WHEN Owner bir yetki toggle'ını değiştirip kaydeder, THE System SHALL permissions tablosunu günceller
2. WHEN permissions tablosu güncellendiğinde, THE System SHALL tüm aktif kullanıcılara real-time bildirim gönderir
3. WHEN kullanıcı real-time bildirim aldığında, THE System SHALL usePermissions hook'unu yeniden çalıştırır
4. WHEN usePermissions hook yeniden çalıştığında, THE System SHALL güncel yetkileri fetch eder
5. WHEN güncel yetkiler alındığında, THE System SHALL UI'daki butonları ve not görünürlüğünü günceller

### Requirement 7: RLS Policy Güncellemeleri

**User Story:** Sistem yöneticisi olarak, veritabanı seviyesinde yetki kontrolünün çalışmasını istiyorum, böylece frontend bypass edilse bile güvenlik sağlanır.

#### Acceptance Criteria

1. WHEN Personnel notes tablosuna SELECT sorgusu yapar ve can_view true ise, THE System SHALL personnel_id kendi id'si olan tüm notları döndürür
2. WHEN Personnel notes tablosuna SELECT sorgusu yapar ve can_view false ise, THE System SHALL sadece author_id kendi id'si olan notları döndürür
3. WHEN Manager notes tablosuna SELECT sorgusu yapar ve can_view true ise ve personnel_id kendisi ise, THE System SHALL tüm notları döndürür
4. WHEN Manager notes tablosuna SELECT sorgusu yapar ve can_view true ise ve personnel_id başkası ise, THE System SHALL sadece author_id kendi id'si olan notları döndürür
5. WHEN Owner notes tablosuna SELECT sorgusu yapar, THE System SHALL tüm notları döndürür

### Requirement 8: Frontend Yetki Kontrolleri

**User Story:** Kullanıcı olarak, yetkisi olmadığım butonların görünmemesini istiyorum, böylece sadece yapabileceğim işlemleri görebilirim.

#### Acceptance Criteria

1. WHEN PersonnelPageClient render edildiğinde, THE System SHALL canCreate, canEdit ve canDelete fonksiyonlarını usePermissions hook'undan alır
2. WHEN kullanıcının create yetkisi yoksa, THE System SHALL "Not Ekle" butonunu gizler
3. WHEN kullanıcının edit yetkisi yoksa veya not başkasına aitse, THE System SHALL düzenle butonunu gizler
4. WHEN kullanıcının delete yetkisi yoksa veya not başkasına aitse, THE System SHALL sil butonunu gizler
5. WHEN notlar yüklendiğinde, THE System SHALL RLS policy'lere göre filtrelenmiş notları gösterir
