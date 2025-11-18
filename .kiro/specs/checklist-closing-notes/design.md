# Design Document

## Overview

Bu özellik, checklist tamamlama sürecine opsiyonel yorum ekleme işlevselliği kazandıracaktır. Mevcut `ChecklistExecutionModal` component'i genişletilecek ve `ChecklistResult` veri modeli güncellenecektir. Yorum alanı tamamen opsiyonel olacak ve yorum varsa sonuç görüntüleme ekranında "Yorumu Gör" butonu ile gösterilecektir.

## Architecture

### Component Hierarchy

```
ChecklistExecutionModal (Güncellenecek)
├── Progress Bar (Mevcut)
├── Checklist Items (Mevcut)
├── Comment Textarea (Yeni - Opsiyonel)
└── Action Buttons (Mevcut)
```

### Data Flow

1. Kullanıcı checklist maddelerini tamamlar
2. Kullanıcı opsiyonel yorum ekler (textarea her zaman görünür)
3. "Tamamla" butonuna tıklar
4. `useChecklistExecution` hook güncellenir
5. Veriler `checklist_results` tablosuna kaydedilir (yorum varsa closing_note ile)
6. Personel atama ekranına geçilir (mevcut akış)

## Components and Interfaces

### 1. ChecklistExecutionModal Component (Güncellenecek)

**Mevcut Durum:**
- Checklist maddelerini gösterir
- Progress bar gösterir
- Tamamlama işlemini yönetir

**Yeni Özellikler:**
- Checklist items altına opsiyonel yorum textarea eklenmesi
- Yorum alanı her zaman görünür ama zorunlu değil
- Yorum varsa kaydetme, yoksa null olarak kaydetme

**Props (Değişmeyecek):**
```typescript
interface ChecklistExecutionModalProps {
  checklist: Checklist;
  onComplete: () => void;
  onCancel: () => void;
}
```

**State Eklemeleri:**
```typescript
const [closingNote, setClosingNote] = useState<string>('');
```

### 2. ChecklistResultCard Component (Güncellenecek)

Checklist sonuçlarını gösteren component'e yorum gösterme özelliği eklenecek.

**Yeni Özellikler:**
- Eğer `closing_note` varsa "Yorumu Gör" butonu göster
- Butona tıklandığında yorumu modal veya expanded view'da göster
- Eğer `closing_note` yoksa hiçbir buton gösterme

### 3. useChecklistExecution Hook (Güncellenecek)

**Mevcut Return Type:**
```typescript
interface UseChecklistExecutionReturn {
  completedItems: string[];
  score: number;
  progress: number;
  isSubmitting: boolean;
  error: string | null;
  toggleItem: (itemId: string) => void;
  submitResult: () => Promise<ChecklistResult | null>;
  assignToPersonnel: (resultId: string, personnelIds: string[]) => Promise<boolean>;
  reset: () => void;
}
```

**Güncellenmiş submitResult Fonksiyonu:**
```typescript
const submitResult = async (
  closingNote?: string
): Promise<ChecklistResult | null> => {
  // Insert data
  const resultData = {
    checklist_id: checklist.id,
    organization_id: profile.organization_id,
    completed_by: user.id,
    checklist_snapshot: checklist,
    completed_items: completedItems,
    total_items: checklist.items.length,
    score: parseFloat(score.toFixed(2)),
    closing_note: closingNote?.trim() || null,
  };

  // ... rest of the logic
};
```

## Data Models

### ChecklistResult Type (Güncellenecek)

**Mevcut:**
```typescript
export interface ChecklistResult {
  id: string;
  checklist_id: string;
  organization_id: string;
  completed_by: string;
  checklist_snapshot: Checklist;
  completed_items: string[];
  total_items: number;
  score: number;
  completed_at: string;
  created_at: string;
}
```

**Güncellenmiş:**
```typescript
export interface ChecklistResult {
  id: string;
  checklist_id: string;
  organization_id: string;
  completed_by: string;
  checklist_snapshot: Checklist;
  completed_items: string[];
  total_items: number;
  score: number;
  closing_note: string | null; // YENİ: Opsiyonel yorum
  completed_at: string;
  created_at: string;
}
```

### Database Schema Changes

**Migration: add_checklist_result_closing_note.sql**

```sql
-- Add closing_note column
ALTER TABLE checklist_results
ADD COLUMN closing_note TEXT;

-- Add comment
COMMENT ON COLUMN checklist_results.closing_note IS 'Optional comment when completing checklist';
```

**Rollback:**
```sql
-- Remove column
ALTER TABLE checklist_results DROP COLUMN IF EXISTS closing_note;
```

## UI/UX Design

### Single-Step Completion Flow

**Checklist Execution Modal (Güncellenmiş)**
```
┌─────────────────────────────────────┐
│ Checklist Tamamlama                 │
├─────────────────────────────────────┤
│ Progress: 5/10 - Puan: 2.50/5.00   │
│ ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░               │
├─────────────────────────────────────┤
│ ☑ Madde 1                           │
│ ☑ Madde 2                           │
│ ☐ Madde 3                           │
│ ...                                 │
├─────────────────────────────────────┤
│ Yorum (Opsiyonel)                   │
│ ┌─────────────────────────────────┐ │
│ │ Checklist hakkında not...       │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│ 0/500 karakter                      │
├─────────────────────────────────────┤
│           [İptal] [Tamamla]         │
└─────────────────────────────────────┘
```

### Result Display with Comment

**Yorum Varsa:**
```
┌─────────────────────────────────────┐
│ Checklist Sonucu                    │
├─────────────────────────────────────┤
│ Başlık: [Checklist Başlığı]        │
│ Tamamlanan: 5/10 madde              │
│ Puan: 2.50/5.00                     │
│ Tarih: 18.11.2025                   │
├─────────────────────────────────────┤
│         [Yorumu Gör]                │
└─────────────────────────────────────┘
```

**Yorum Yoksa:**
```
┌─────────────────────────────────────┐
│ Checklist Sonucu                    │
├─────────────────────────────────────┤
│ Başlık: [Checklist Başlığı]        │
│ Tamamlanan: 5/10 madde              │
│ Puan: 2.50/5.00                     │
│ Tarih: 18.11.2025                   │
└─────────────────────────────────────┘
```

**Yorumu Gör Modal:**
```
┌─────────────────────────────────────┐
│ Checklist Yorumu                    │
├─────────────────────────────────────┤
│ [Yorum içeriği buraya gelir]       │
│                                     │
│                                     │
├─────────────────────────────────────┤
│              [Kapat]                │
└─────────────────────────────────────┘
```

## Error Handling

### Validation Errors

1. **Comment Length Validation:**
   - Hata: Yorum 500 karakterden uzun
   - Mesaj: Textarea'da karakter sayacı gösterilir
   - Aksiyon: Textarea max-length ile sınırlanır

2. **Empty Checklist:**
   - Hata: Hiç madde seçilmemiş
   - Mesaj: "En az 1 madde tamamlanmalıdır"
   - Aksiyon: Submit engellenir (mevcut davranış)

### Database Errors

1. **Insert Error:**
   - Hata: Veritabanı kayıt hatası
   - Mesaj: "Checklist kaydedilirken bir hata oluştu"
   - Aksiyon: Error state gösterilir, retry mümkün

2. **Permission Error:**
   - Hata: Kullanıcı yetkisi yok
   - Mesaj: "Bu işlem için yetkiniz bulunmuyor"
   - Aksiyon: Modal kapatılır

## Testing Strategy

### Unit Tests

1. **useChecklistExecution Hook:**
   - submitResult fonksiyonu closing_note parametresi ile çalışır
   - closing_note parametresi opsiyoneldir
   - Null closing_note doğru handle edilir
   - Error handling doğru çalışır

2. **ChecklistExecutionModal Component:**
   - Comment textarea görünür
   - Comment state yönetimi doğru
   - Karakter sayacı çalışır
   - Submit işlemi closing_note ile çalışır

3. **ChecklistResultCard Component:**
   - Yorum varsa "Yorumu Gör" butonu gösterilir
   - Yorum yoksa buton gösterilmez
   - Butona tıklandığında yorum modal açılır

### Integration Tests

1. **Complete Flow:**
   - Checklist açma
   - Madde seçimi
   - Comment girişi (opsiyonel)
   - Kaydetme
   - Personel atama
   - Sonuç görüntüleme

2. **Database Integration:**
   - closing_note doğru kaydedilir
   - Null closing_note doğru handle edilir
   - Yorum varsa "Yorumu Gör" butonu gösterilir

### Manual Testing Checklist

- [ ] Checklist tamamlama akışı sorunsuz çalışıyor
- [ ] Comment textarea görünür ve çalışıyor
- [ ] Comment textarea 500 karakter sınırı çalışıyor
- [ ] Karakter sayacı doğru çalışıyor
- [ ] Yorum ile kaydetme başarılı
- [ ] Yorum olmadan kaydetme başarılı
- [ ] Personel atama ekranına geçiş çalışıyor
- [ ] Yorum varsa "Yorumu Gör" butonu gösteriliyor
- [ ] Yorum yoksa buton gösterilmiyor
- [ ] "Yorumu Gör" butonu yorumu gösteriyor
- [ ] Mobile responsive

## Performance Considerations

1. **Component Re-renders:**
   - Comment state değişikliği sadece textarea'yı re-render eder
   - Checklist items memoize edilmiş durumda kalır
   - "Yorumu Gör" modal lazy load edilebilir

2. **Database Operations:**
   - Single insert operation
   - No additional queries
   - No additional indexes needed

3. **Bundle Size:**
   - Yeni component eklenmedi
   - Minimal code addition (~50 lines)
   - Comment modal basit bir dialog component

## Migration Strategy

### Phase 1: Database Migration
1. Migration dosyası oluştur
2. Local'de test et
3. Staging'e deploy et
4. Production'a deploy et

### Phase 2: Type Updates
1. `lib/types/checklists.ts` güncelle
2. Type errors kontrol et
3. Commit

### Phase 3: Hook Update
1. `useChecklistExecution` güncelle
2. submitResult fonksiyonuna closing_note parametresi ekle
3. Test et

### Phase 4: Execution Modal Update
1. `ChecklistExecutionModal` güncelle
2. Comment textarea ekle
3. Karakter sayacı ekle
4. Submit işlemini güncelle
5. Test et

### Phase 5: Display Updates
1. Checklist result card component'i güncelle
2. "Yorumu Gör" butonu ekle (conditional)
3. Comment modal component oluştur
4. Test et

## Security Considerations

1. **Input Validation:**
   - Comment max 500 karakter (client side)
   - XSS prevention için comment sanitize edilir (display sırasında)

2. **Authorization:**
   - Sadece authenticated kullanıcılar checklist tamamlayabilir
   - RLS policies mevcut checklist_results tablosunda zaten var
   - Yeni kolon için ek policy gerekmez

3. **Data Integrity:**
   - closing_note nullable (opsiyonel)
   - Empty string yerine null kaydedilir

## Future Enhancements

1. **AI Analysis Integration:**
   - Closing note'ları AI analiz için kullan
   - Sentiment analysis
   - Keyword extraction

2. **Search & Filter:**
   - Yorumlarda arama
   - Yorum içeriğine göre filtreleme

3. **Rich Text:**
   - Markdown desteği
   - Formatting options

4. **Attachments:**
   - Yoruma dosya ekleme
   - Fotoğraf ekleme
