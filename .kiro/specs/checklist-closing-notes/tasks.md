# Implementation Plan

- [x] 1. Database migration oluştur ve uygula



  - `supabase/migrations` klasöründe yeni migration dosyası oluştur
  - `checklist_results` tablosuna `closing_note TEXT` kolonu ekle
  - Migration'ı local'de test et
  - Rollback script'i test et
  - _Requirements: 3.1, 3.2, 3.4_


- [x] 2. TypeScript type tanımlarını güncelle

  - `lib/types/checklists.ts` dosyasını aç
  - `ChecklistResult` interface'ine `closing_note: string | null` ekle
  - Type errors kontrol et
  - _Requirements: 3.3_

- [x] 3. useChecklistExecution hook'unu güncelle


  - `lib/hooks/useChecklistExecution.ts` dosyasını aç
  - `submitResult` fonksiyonuna `closingNote?: string` parametresi ekle
  - `resultData` objesine `closing_note: closingNote?.trim() || null` ekle
  - Empty string kontrolü yap (trim sonrası boşsa null kaydet)
  - _Requirements: 1.5, 1.6, 1.7, 3.4_


- [x] 4. ChecklistExecutionModal component'ini güncelle

  - `components/checklists/ChecklistExecutionModal.tsx` dosyasını aç
  - Component state'ine `closingNote` ekle
  - Checklist items altına yorum textarea ekle
  - Textarea için label ekle: "Yorum (Opsiyonel)"
  - Placeholder text ekle: "Checklist hakkında not ekleyebilirsiniz..."
  - Karakter sayacı ekle (0/500 format)
  - maxLength={500} attribute ekle
  - `handleComplete` fonksiyonunu güncelle, `submitResult(closingNote)` çağır
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5. Checklist result görüntüleme component'i oluştur veya güncelle


  - Checklist result card component'ini bul veya oluştur
  - `closing_note` varsa "Yorumu Gör" butonu ekle
  - `closing_note` yoksa buton gösterme (conditional rendering)
  - Buton styling: secondary variant, küçük boyut
  - _Requirements: 2.1, 2.2_

- [x] 6. Yorum görüntüleme modal component'i oluştur

  - `components/checklists/ChecklistCommentModal.tsx` oluştur
  - Props: `comment: string`, `onClose: () => void`
  - Modal başlığı: "Checklist Yorumu"
  - Comment içeriğini göster (whitespace preserve)
  - "Kapat" butonu ekle
  - Modal overlay ve backdrop ekle
  - _Requirements: 2.3, 2.4_

- [x] 7. Personel detay sayfasında checklist yorumlarını göster

  - Personel detay sayfasında checklist results bölümünü bul
  - Her result için yorum varsa "Yorumu Gör" butonu ekle
  - Modal entegrasyonu yap
  - _Requirements: 2.5_


- [x] 8. Test ve validation


  - Checklist tamamlama akışını test et (yorum ile)
  - Checklist tamamlama akışını test et (yorum olmadan)
  - "Yorumu Gör" butonunun conditional rendering'ini test et
  - Karakter sayacının çalıştığını test et
  - 500 karakter sınırını test et
  - Empty string yerine null kaydedildiğini test et
  - Mobile responsive test et
  - _Requirements: Tüm requirements_
