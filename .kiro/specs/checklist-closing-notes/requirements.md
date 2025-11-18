# Requirements Document

## Introduction

Bu özellik, checklist tamamlama sürecine opsiyonel yorum ekleme işlevselliği kazandıracaktır. Kullanıcılar checklist'i tamamlarken isteğe bağlı olarak yorum ekleyebileceklerdir. Yorum varsa sonuç görüntüleme ekranında "Yorumu Gör" butonu ile gösterilecektir.

## Glossary

- **Checklist**: Kullanıcıların tamamlaması gereken maddelerin listesi
- **ChecklistResult**: Tamamlanmış bir checklist'in sonuç kaydı
- **System**: Vector PWA uygulaması
- **User**: Checklist'i tamamlayan kullanıcı (owner, manager veya personnel)
- **ClosingNote**: Checklist tamamlanırken eklenen opsiyonel yorum

## Requirements

### Requirement 1

**User Story:** Bir kullanıcı olarak, checklist'i tamamlarken opsiyonel yorum eklemek istiyorum, böylece tamamlama süreci hakkında detaylı bilgi verebilirim.

#### Acceptance Criteria

1. WHEN kullanıcı checklist tamamlama ekranındayken, THE System SHALL kullanıcıya yorum yazabileceği bir textarea alanı gösterir
2. THE System SHALL yorum alanını opsiyonel olarak işaretler
3. THE System SHALL yorum alanında maksimum 500 karakter sınırı uygular
4. WHILE kullanıcı yorum yazar, THE System SHALL yazılan karakter sayısını gösterir
5. WHEN kullanıcı yorum ekler ve kaydeder, THE System SHALL yorumu checklist_results tablosuna closing_note alanına kaydeder
6. WHEN kullanıcı yorum eklemeden kaydeder, THE System SHALL closing_note alanını null olarak kaydeder
7. THE System SHALL boş string yerine null değeri kaydeder

### Requirement 2

**User Story:** Bir kullanıcı olarak, tamamlanmış checklist sonuçlarını görüntülerken yorumları görmek istiyorum, böylece tamamlama süreci hakkında detaylı bilgi edinebilirim.

#### Acceptance Criteria

1. WHEN kullanıcı checklist sonuçlarını görüntüler ve closing_note varsa, THE System SHALL "Yorumu Gör" butonunu gösterir
2. WHEN bir checklist sonucunda closing_note yoksa, THE System SHALL hiçbir yorum butonu göstermez
3. WHEN kullanıcı "Yorumu Gör" butonuna tıklar, THE System SHALL yorumu modal veya expanded view'da gösterir
4. THE System SHALL yorumları okunabilir bir formatta gösterir
5. WHEN kullanıcı personel detay sayfasındayken, THE System SHALL o personele atanmış checklist sonuçlarının yorumlarını gösterir

### Requirement 3

**User Story:** Bir sistem yöneticisi olarak, checklist yorumlarının veritabanında doğru saklandığından emin olmak istiyorum, böylece veri bütünlüğü korunur.

#### Acceptance Criteria

1. THE System SHALL checklist_results tablosuna closing_note kolonu ekler (text, nullable)
2. THE System SHALL database migration'ı geri alınabilir şekilde oluşturur
3. THE System SHALL TypeScript type tanımlarını günceller
4. THE System SHALL empty string yerine null değeri kaydeder
5. THE System SHALL mevcut checklist_results kayıtlarını etkilemez (closing_note null olarak kalır)

### Requirement 4

**User Story:** Bir kullanıcı olarak, checklist tamamlama sürecinin basit ve anlaşılır olmasını istiyorum, böylece hızlıca tamamlayabilirim.

#### Acceptance Criteria

1. THE System SHALL yorum alanını checklist items altında gösterir
2. THE System SHALL yorum alanını her zaman görünür tutar
3. THE System SHALL yorum alanını zorunlu kılmaz
4. THE System SHALL yorum alanında placeholder text gösterir
5. THE System SHALL kullanıcı yorum eklemeden de checklist'i tamamlamasına izin verir
