# Implementation Plan

- [x] 1. Veritabanı Yapısını Oluştur



  - checklists, checklist_results, checklist_assignments tablolarını oluştur
  - Foreign key constraint'leri ekle
  - Index'leri ekle (organization_id, personnel_id, completed_at)
  - RLS policy'leri uygula (Owner için CRUD, tüm roller için SELECT)
  - Migration dosyalarını test et
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 8.6_

- [x] 2. TypeScript Type Tanımlarını Ekle



  - lib/types/checklists.ts dosyasını oluştur
  - ChecklistItem, Checklist, ChecklistResult, ChecklistAssignment interface'lerini tanımla
  - Extended types ekle (ChecklistResultWithDetails)
  - lib/types/index.ts'e export ekle
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 3. Custom Hook'ları Oluştur



  - [x] 3.1 useChecklists hook'unu yaz


    - Checklist CRUD operasyonları
    - Real-time subscription (INSERT, UPDATE, DELETE)
    - Loading ve error state yönetimi
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 10.1_
  
  - [x] 3.2 useChecklistExecution hook'unu yaz


    - Item toggle fonksiyonu
    - Real-time score hesaplama
    - Result submit fonksiyonu
    - Personnel assignment fonksiyonu
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  
  - [x] 3.3 useChecklistResults hook'unu yaz


    - Personnel için checklist sonuçlarını çek
    - Real-time subscription (INSERT)
    - Pagination (10 sonuç/sayfa)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 10.2, 10.3_

- [x] 4. Checklist Yönetim Component'lerini Oluştur (Owner)



  - [x] 4.1 ChecklistManagement component'ini yaz


    - Checklist listesini göster
    - "Yeni Checklist" butonu ekle
    - Edit/Delete butonları ekle (Owner kontrolü)
    - _Requirements: 1.1, 1.5, 8.1, 8.2, 8.3_
  
  - [x] 4.2 ChecklistForm component'ini yaz (Modal)


    - Başlık, açıklama input'ları
    - Dinamik item ekleme/çıkarma
    - Minimum 1 item validasyonu
    - Save/Cancel butonları
    - Toast notifications
    - _Requirements: 1.2, 1.3, 1.4, 1.6_
  
  - [x] 4.3 ChecklistCard component'ini yaz


    - Başlık, açıklama, item sayısı göster
    - Edit/Delete butonları (Owner için)
    - Soft delete confirmation modal
    - _Requirements: 1.5, 1.7, 1.8_


- [x] 5. Settings Sayfasına Checklist Sekmesi Ekle



  - Settings sayfasına "Checklistlerim" sekmesi ekle
  - ChecklistManagement component'ini render et
  - Owner olmayan kullanıcılar için sekmeyi gizle
  - _Requirements: 1.1, 8.1_

- [x] 6. Mobil Navigasyon Menüsünü Güncelle


  - DashboardLayout'a "Checklistler" butonu ekle
  - Sıralama: Personel | Checklistler | Ayarlar
  - Aktif sayfa vurgulama
  - 44x44px minimum touch target
  - Fixed bottom position
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 7. Checklists Sayfasını Oluştur



  - [x] 7.1 app/(dashboard)/checklists/page.tsx oluştur


    - Auth kontrolü
    - Aktif checklist'leri listele
    - Loading state
    - Empty state ("Henüz checklist yok")
    - _Requirements: 3.1, 3.2_
  
  - [x] 7.2 ChecklistTemplateCard component'ini yaz


    - Başlık, açıklama, item sayısı
    - "Başla" butonu
    - Modal açma fonksiyonu
    - _Requirements: 3.2, 3.3_

- [x] 8. Checklist Execution Modal'ını Oluştur



  - [x] 8.1 ChecklistExecutionModal component'ini yaz


    - Modal header (başlık, close button)
    - Progress indicator (3/5 tamamlandı)
    - Real-time score display (3.00/5.00)
    - Item listesi (checkbox'lar)
    - "Tamamla" butonu (disabled if 0 items)
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.7, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  
  - [x] 8.2 PersonnelAssignmentForm component'ini yaz


    - Personnel listesi (multi-select)
    - Search input (debounce 300ms)
    - Selected count indicator
    - "Ata" butonu (disabled if no selection)
    - Success toast
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 9. Personel Detay Sayfasına Sekme Yapısı Ekle



  - [x] 9.1 TabNavigation component'ini oluştur


    - 3 sekme: Notlar | Görevler | Checklistler
    - Aktif sekme vurgulama (blue underline)
    - Smooth transition (300ms)
    - Mobile-friendly (44x44px touch target)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
  
  - [x] 9.2 PersonnelDetailClient'ı sekme yapısına dönüştür


    - TabNavigation component'ini ekle
    - Varsayılan "Notlar" sekmesi aktif
    - Sekme değişiminde içerik güncelleme
    - Mevcut notlar ve görevler kodunu koru
    - _Requirements: 6.1, 6.2, 6.5_


- [x] 10. Checklistler Sekmesini Oluştur



  - [x] 10.1 ChecklistsTab component'ini yaz


    - useChecklistResults hook'unu kullan
    - Sonuçları tarih sırasına göre listele (en yeni üstte)
    - Pagination (10 sonuç/sayfa)
    - Loading state
    - Empty state ("Henüz checklist sonucu yok")
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.7_
  
  - [x] 10.2 ChecklistResultCard component'ini yaz


    - Başlık, puan (color-coded), tarih, kim tarafından
    - Tamamlanan madde sayısı
    - "Detayları Gör" butonu
    - Expandable detail view
    - _Requirements: 7.2, 7.5, 7.6_
  
  - [x] 10.3 Real-time subscription ekle


    - checklist_assignments tablosunu dinle
    - Yeni atama geldiğinde listeyi güncelle
    - Optimistic update
    - _Requirements: 10.2, 10.3, 10.4, 10.5, 10.6_

- [x] 11. Utility Fonksiyonları Ekle


  - calculateChecklistScore(completed, total) fonksiyonu
  - formatChecklistDate(date) fonksiyonu
  - validateChecklistItems(items) fonksiyonu
  - getColorForScore(score) fonksiyonu (green/yellow/red)
  - lib/utils/checklist.ts dosyasına ekle
  - _Requirements: 4.2, 4.3, 4.4, 4.5_

- [x] 12. Error Handling ve Toast Notifications

  - Checklist oluşturma hatası → Toast
  - Checklist execution hatası → Toast + localStorage backup
  - Personnel assignment hatası → Toast + retry
  - Real-time subscription hatası → Fallback to polling
  - RLS policy violation → 403 toast
  - _Requirements: Error handling için tüm requirements_

- [x] 13. Yetki Kontrollerini Uygula

  - Owner kontrolü (checklist CRUD)
  - RLS policy test et (farklı rollerle)
  - Frontend'de yetki bazlı UI göster/gizle
  - Backend'de yetki kontrolü (RLS)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [ ] 14. Test ve Doğrulama
  - [ ] 14.1 Unit testler
    - calculateChecklistScore testi
    - validateChecklistItems testi
    - Custom hook testleri
  
  - [ ] 14.2 Integration testler
    - Checklist template CRUD flow
    - Checklist execution flow
    - Personnel assignment flow
  
  - [ ] 14.3 E2E testler
    - Owner creates checklist → User completes → Assigns to personnel
    - Mobile navigation test
    - Tab navigation test
    - Real-time update test

- [x] 15. AI Analiz Entegrasyonu Hazırlığı (Opsiyonel)


  - Checklist verilerini AI prompt formatına dönüştür
  - Analysis sayfasına checklist verilerini ekle
  - Trend analizi için helper fonksiyonlar
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

