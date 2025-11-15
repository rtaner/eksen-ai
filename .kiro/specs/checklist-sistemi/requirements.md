# Requirements Document

## Introduction

Bu doküman, Vector PWA projesine eklenecek Checklist (Kontrol Listesi) sisteminin gereksinimlerini tanımlar. Sistem, organizasyon sahiplerinin (Owner) yeniden kullanılabilir checklist şablonları oluşturmasına, bu şablonları doldurarak otomatik puanlama yapmasına ve sonuçları personellere atamasına olanak sağlar. Checklist sonuçları, personel performans takibi ve AI destekli analizler için yapılandırılmış veri kaynağı oluşturur.

## Glossary

- **System**: Vector PWA uygulaması
- **Owner**: Organizasyon sahibi, tüm yetkilere sahip kullanıcı rolü
- **Manager**: Yönetici rolü, sınırlı yetkilere sahip kullanıcı
- **Personnel**: Personel rolü, en kısıtlı yetkilere sahip kullanıcı
- **Checklist Template**: Yeniden kullanılabilir kontrol listesi şablonu
- **Checklist Item**: Checklist içindeki tek bir kontrol maddesi
- **Checklist Result**: Tamamlanmış ve puanlanmış checklist kaydı
- **Score**: 0-5 arası otomatik hesaplanan puan
- **Assignment**: Checklist sonucunun bir veya birden fazla personele atanması
- **Tab Navigation**: Personel detay sayfasındaki sekme tabanlı gezinme sistemi

## Requirements

### Requirement 1: Checklist Şablonu Yönetimi

**User Story:** Owner olarak, yeniden kullanılabilir checklist şablonları oluşturup yönetebilmeliyim ki standart değerlendirme süreçlerini kolayca uygulayabileyim.

#### Acceptance Criteria

1. WHEN Owner "/settings" sayfasına eriştiğinde, THE System SHALL "Checklistlerim" sekmesini göstermelidir
2. WHEN Owner "Yeni Checklist" butonuna tıkladığında, THE System SHALL checklist oluşturma formunu açmalıdır
3. THE System SHALL checklist şablonunda başlık, açıklama ve madde listesi alanlarını içermelidir
4. WHEN Owner checklist şablonunu kaydederken, THE System SHALL en az 1 madde girişi yapılmasını zorunlu kılmalıdır
5. THE System SHALL mevcut checklist şablonlarını liste halinde görüntülemelidir
6. WHEN Owner bir checklist şablonunu düzenlediğinde, THE System SHALL değişiklikleri kaydetmelidir
7. WHEN Owner bir checklist şablonunu sildiğinde, THE System SHALL onay mesajı göstermelidir
8. THE System SHALL silinen checklist şablonunun mevcut sonuçlarını korumalıdır

### Requirement 2: Mobil Navigasyon Güncellemesi

**User Story:** Kullanıcı olarak, mobil menüden checklist'lere kolayca erişebilmeliyim ki hızlı bir şekilde değerlendirme yapabileyim.

#### Acceptance Criteria

1. THE System SHALL mobil alt menüde "Personel", "Checklistler", "Ayarlar" sırasında üç buton göstermelidir
2. WHEN kullanıcı "Checklistler" butonuna tıkladığında, THE System SHALL "/checklists" sayfasına yönlendirmelidir
3. THE System SHALL aktif sayfayı mobil menüde görsel olarak vurgulamalıdır
4. THE System SHALL mobil menü butonlarını 44x44px minimum dokunma alanıyla oluşturmalıdır
5. WHILE kullanıcı mobil cihazda gezinirken, THE System SHALL menü butonlarını ekranın alt kısmında sabit tutmalıdır

### Requirement 3: Checklist Listeleme ve Doldurma

**User Story:** Kullanıcı olarak, mevcut checklist şablonlarını görebilmeli ve seçtiğim şablonu doldurabilmeliyim ki değerlendirme sürecini tamamlayabileyim.

#### Acceptance Criteria

1. WHEN kullanıcı "/checklists" sayfasına eriştiğinde, THE System SHALL tüm aktif checklist şablonlarını listelemeli
2. THE System SHALL her checklist kartında başlık, açıklama ve madde sayısını göstermelidir
3. WHEN kullanıcı bir checklist'e tıkladığında, THE System SHALL checklist doldurma sayfasını açmalıdır
4. THE System SHALL her checklist maddesini checkbox ile göstermelidir
5. WHEN kullanıcı bir checkbox'ı işaretlediğinde, THE System SHALL değişikliği anında kaydetmelidir
6. THE System SHALL tamamlanan madde sayısını ve toplam madde sayısını görüntülemelidir
7. WHEN kullanıcı "Tamamla" butonuna tıkladığında, THE System SHALL checklist'i sonuçlandırmalıdır

### Requirement 4: Otomatik Puanlama Sistemi

**User Story:** Kullanıcı olarak, checklist'i tamamladığımda otomatik puan hesaplanmalı ki objektif bir değerlendirme yapabileyim.

#### Acceptance Criteria

1. WHEN kullanıcı checklist'i tamamladığında, THE System SHALL tamamlanan madde oranını hesaplamalıdır
2. THE System SHALL puanı 0-5 aralığında hesaplamalıdır
3. THE System SHALL puanlama formülünü (tamamlanan_madde / toplam_madde) * 5 olarak uygulamalıdır
4. THE System SHALL hesaplanan puanı ondalık iki basamakla göstermelidir
5. WHEN checklist 10 maddeden 8'i tamamlanmışsa, THE System SHALL 4.00/5.00 puan hesaplamalıdır
6. THE System SHALL puan hesaplamasını checklist_results tablosuna kaydetmelidir

### Requirement 5: Personele Atama

**User Story:** Kullanıcı olarak, tamamlanmış checklist sonucunu bir veya birden fazla personele atayabilmeliyim ki performans takibi yapabileyim.

#### Acceptance Criteria

1. WHEN checklist tamamlandığında, THE System SHALL personel seçim arayüzünü göstermelidir
2. THE System SHALL organizasyondaki tüm aktif personelleri listelemeli
3. THE System SHALL çoklu personel seçimine izin vermelidir
4. WHEN kullanıcı personel seçip "Ata" butonuna tıkladığında, THE System SHALL atama kaydını oluşturmalıdır
5. THE System SHALL her atama için benzersiz kayıt oluşturmalıdır
6. THE System SHALL atama işleminden sonra başarı mesajı göstermelidir
7. THE System SHALL aynı checklist sonucunun birden fazla personele atanmasına izin vermelidir

### Requirement 6: Personel Detay Sayfası Sekme Yapısı

**User Story:** Kullanıcı olarak, personel detay sayfasında notlar, görevler ve checklist sonuçları arasında sekme ile geçiş yapabilmeliyim ki bilgilere organize şekilde erişebileyim.

#### Acceptance Criteria

1. THE System SHALL personel detay sayfasında "Notlar", "Görevler", "Checklistler" sekmelerini göstermelidir
2. WHEN personel detay sayfası açıldığında, THE System SHALL varsayılan olarak "Notlar" sekmesini aktif etmelidir
3. THE System SHALL aktif sekmeyi görsel olarak vurgulamalıdır
4. WHEN kullanıcı bir sekmeye tıkladığında, THE System SHALL ilgili içeriği yüklemeli ve göstermelidir
5. THE System SHALL sekme değişimini sayfa yenilemeden gerçekleştirmelidir
6. THE System SHALL sekme tasarımını minimal ve kullanışlı tutmalıdır
7. THE System SHALL mobil cihazlarda sekmeleri dokunma dostu boyutta göstermelidir

### Requirement 7: Checklist Sonuçlarını Görüntüleme

**User Story:** Kullanıcı olarak, personel detay sayfasının "Checklistler" sekmesinde o personele atanmış tüm checklist sonuçlarını görebilmeliyim ki performans geçmişini takip edebileyim.

#### Acceptance Criteria

1. WHEN kullanıcı "Checklistler" sekmesine tıkladığında, THE System SHALL personele atanmış tüm checklist sonuçlarını listelemeli
2. THE System SHALL her checklist sonucunda başlık, puan, tamamlanma tarihi ve kim tarafından yapıldığını göstermelidir
3. THE System SHALL checklist sonuçlarını tarih sırasına göre (en yeni üstte) sıralamalıdır
4. WHEN personele hiç checklist atanmamışsa, THE System SHALL "Henüz checklist sonucu yok" mesajı göstermelidir
5. WHEN kullanıcı bir checklist sonucuna tıkladığında, THE System SHALL detaylı görünümü açmalıdır
6. THE System SHALL detaylı görünümde tüm maddeleri ve hangilerinin tamamlandığını göstermelidir
7. THE System SHALL checklist sonuçlarını sayfalama ile göstermelidir (10 sonuç/sayfa)

### Requirement 8: Yetki Kontrolü

**User Story:** Sistem yöneticisi olarak, checklist işlemlerinin doğru yetki seviyelerinde gerçekleştirilmesini sağlamalıyım ki veri güvenliği korunabilsin.

#### Acceptance Criteria

1. THE System SHALL checklist şablonu oluşturma yetkisini sadece Owner rolüne vermelidir
2. THE System SHALL checklist şablonu düzenleme yetkisini sadece Owner rolüne vermelidir
3. THE System SHALL checklist şablonu silme yetkisini sadece Owner rolüne vermelidir
4. THE System SHALL checklist doldurma yetkisini tüm rollere vermelidir
5. THE System SHALL checklist sonucu görüntüleme yetkisini yetki sistemine göre kontrol etmelidir
6. THE System SHALL RLS (Row Level Security) policy'lerini checklist tabloları için uygulamalıdır
7. WHEN yetkisiz bir kullanıcı korumalı işlem yapmaya çalıştığında, THE System SHALL 403 hatası döndürmelidir

### Requirement 9: Veritabanı Yapısı

**User Story:** Geliştirici olarak, checklist verilerini güvenli ve performanslı şekilde saklayabilmeliyim ki sistem ölçeklenebilir olsun.

#### Acceptance Criteria

1. THE System SHALL "checklists" tablosunu organization_id, title, description, items (JSONB) alanlarıyla oluşturmalıdır
2. THE System SHALL "checklist_results" tablosunu checklist_id, completed_by, score, completed_items (JSONB), completed_at alanlarıyla oluşturmalıdır
3. THE System SHALL "checklist_assignments" tablosunu checklist_result_id, personnel_id, assigned_at alanlarıyla oluşturmalıdır
4. THE System SHALL tüm tablolara uygun foreign key constraint'leri eklemelidir
5. THE System SHALL organization_id ve personnel_id alanlarına index eklemelidir
6. THE System SHALL created_at ve updated_at alanlarını tüm tablolara eklemelidir
7. THE System SHALL soft delete için deleted_at alanını checklists tablosuna eklemelidir

### Requirement 10: Real-time Güncellemeler

**User Story:** Kullanıcı olarak, checklist sonuçları güncellendiğinde sayfa yenilemeden değişiklikleri görebilmeliyim ki güncel bilgiye erişebileyim.

#### Acceptance Criteria

1. THE System SHALL checklist_results tablosunda INSERT event'lerini dinlemelidir
2. THE System SHALL checklist_assignments tablosunda INSERT event'lerini dinlemelidir
3. WHEN yeni bir checklist sonucu atandığında, THE System SHALL personel detay sayfasını otomatik güncellemelidir
4. THE System SHALL Supabase Real-time subscription kullanmalıdır
5. WHEN component unmount olduğunda, THE System SHALL subscription'ı temizlemelidir
6. THE System SHALL real-time güncellemelerde optimistic update uygulamalıdır

### Requirement 11: AI Analiz Entegrasyonu (Gelecek)

**User Story:** Sistem yöneticisi olarak, checklist sonuçlarının AI analizlerine dahil edilebilmesini sağlamalıyım ki daha kapsamlı performans değerlendirmesi yapılabilsin.

#### Acceptance Criteria

1. THE System SHALL checklist sonuçlarını AI analiz prompt'una dahil edebilecek şekilde yapılandırmalıdır
2. THE System SHALL checklist verilerini JSON formatında AI servisine gönderebilmelidir
3. THE System SHALL checklist skorlarını zaman serisi olarak analiz edebilmelidir
4. THE System SHALL farklı checklist türlerini kategorize edebilmelidir
5. THE System SHALL checklist trendlerini hesaplayabilmelidir
