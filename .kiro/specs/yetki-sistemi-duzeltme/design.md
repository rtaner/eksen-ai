# Yetki Sistemi Düzeltme - Design

## Overview

Bu tasarım, not görüntüleme yetki sistemini basitleştirerek, kullanıcıların kendileri hakkında yazılan notları görebilmelerini ve yöneticilerin operasyonel not tutabilmelerini sağlar. Personel rolü için mevcut sistem korunacak, Manager rolü için yeni mantık uygulanacak. Real-time güncelleme ile toggle değişiklikleri anında yansıyacak.

## Architecture

### Mevcut Sistem (Korunacak)
```
Frontend (React)
  ↓
usePermissions Hook → Supabase Client
  ↓
Supabase (PostgreSQL + RLS)
  ↓
permissions tablosu
```

### Yeni Eklemeler
```
Frontend (React)
  ↓
usePermissions Hook + Real-time Subscription
  ↓
Supabase (PostgreSQL + RLS + Real-time)
  ↓
permissions tablosu (değişiklik yok)
```

## Components and Interfaces

### 1. Database Schema Changes

**Mevcut yapı tamamen korunacak, hiçbir schema değişikliği yapılmayacak.**

Yeni sistem mevcut tablolar üzerinde çalışacak:
- `profiles` tablosu: role kolonu kullanılacak
- `notes` tablosu: author_id ve personnel_id kolonları kullanılacak
- `permissions` tablosu: can_view, can_create, can_edit, can_delete kolonları kullanılacak

### 2. RLS Policies Güncelleme

#### 2.1 Notes RLS Policy Güncelleme

**Yeni basitleştirilmiş policy:**

```sql
-- Migration: 20241110_001_update_notes_policies.sql

-- Eski policy'yi kaldır
DROP POLICY IF EXISTS "Notes visibility" ON notes;

-- Yeni basitleştirilmiş policy
CREATE POLICY "Notes simple visibility"
  ON notes FOR SELECT
  USING (
    -- Owner her şeyi görür
    get_user_role() = 'owner'
    
    OR
    
    -- Kendi yazdığı notları her zaman görür (tüm roller)
    author_id = auth.uid()
    
    OR
    
    -- Personnel: can_view true ise kendisi hakkındaki tüm notları görür
    (
      get_user_role() = 'personnel'
      AND has_permission('notes', 'view')
      AND personnel_id = auth.uid()
    )
    
    OR
    
    -- Manager: can_view true ise kendisi hakkındaki tüm notları görür
    (
      get_user_role() = 'manager'
      AND has_permission('notes', 'view')
      AND personnel_id = auth.uid()
    )
  );

-- Diğer note policies (INSERT, UPDATE, DELETE) KORUNACAK
```

**Mantık:**
- **Owner**: Her şeyi görür (değişiklik yok)
- **Herkes**: Kendi yazdığı notları görür (author_id = auth.uid())
- **Personnel + can_view:true**: Kendisi hakkındaki tüm notları görür (personnel_id = auth.uid())
- **Manager + can_view:true**: Kendisi hakkındaki tüm notları görür (personnel_id = auth.uid())
- **can_view:false**: Sadece kendi yazdığı notları görür

### 3. Frontend Updates

#### 3.1 usePermissions Hook Güncelleme

**Mevcut fonksiyonalite korunacak, real-time ekleme yapılacak:**

```typescript
// lib/hooks/usePermissions.ts

export interface UsePermissionsReturn {
  // Mevcut returns KORUNACAK
  permissions: ResourcePermissions | null;
  role: string | null;
  isLoading: boolean;
  isOwner: boolean;
  canView: (resource: ResourceType) => boolean;
  canCreate: (resource: ResourceType) => boolean;
  canEdit: (resource: ResourceType) => boolean;
  canDelete: (resource: ResourceType) => boolean;
  
  // YENİ: Not/Görev bazlı kontroller
  canEditNote: (note: Note) => boolean;
  canDeleteNote: (note: Note) => boolean;
}

export function usePermissions(): UsePermissionsReturn {
  // Mevcut state'ler KORUNACAK
  const [permissions, setPermissions] = useState<ResourcePermissions | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Mevcut fetchPermissions KORUNACAK
  const fetchPermissions = async () => {
    // ... mevcut kod ...
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, organization_id, id')
      .eq('id', user.id)
      .single();
    
    setOrganizationId(profile.organization_id);
    setUserId(profile.id);
    
    // ... mevcut kod devam eder ...
  };

  // YENİ: Real-time subscription
  useEffect(() => {
    if (!organizationId || !role || role === 'owner') return;

    const channel = supabase
      .channel('permissions-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'permissions',
          filter: `organization_id=eq.${organizationId}`,
        },
        () => {
          console.log('Permissions updated, refetching...');
          fetchPermissions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId, role]);

  // Mevcut canView, canCreate, canEdit, canDelete KORUNACAK
  
  // YENİ: Not bazlı kontroller
  const canEditNote = (note: Note): boolean => {
    if (role === 'owner') return true;
    return note.author_id === userId && canEdit('notes');
  };

  const canDeleteNote = (note: Note): boolean => {
    if (role === 'owner') return true;
    return note.author_id === userId && canDelete('notes');
  };

  return {
    // Mevcut returns KORUNACAK
    permissions,
    role,
    isLoading,
    isOwner: role === 'owner',
    canView,
    canCreate,
    canEdit,
    canDelete,
    
    // YENİ returns
    canEditNote,
    canDeleteNote,
  };
}
```

#### 3.2 Not Listesi Component'i

**Not listesinde görünürlük RLS tarafından kontrol edilecek:**

```typescript
// components/notes/NotesList.tsx

export default function NotesList({ personnelId }: Props) {
  const { canCreate, canEditNote, canDeleteNote } = usePermissions();
  
  // Notları fetch et (RLS otomatik filtreler)
  const { data: notes } = await supabase
    .from('notes')
    .select('*')
    .eq('personnel_id', personnelId)
    .order('created_at', { ascending: false });
  
  return (
    <div>
      {canCreate('notes') && <AddNoteButton />}
      
      {notes.map(note => (
        <NoteCard 
          key={note.id}
          note={note}
          canEdit={canEditNote(note)}
          canDelete={canDeleteNote(note)}
        />
      ))}
    </div>
  );
}
```

**Önemli:** RLS policy zaten doğru notları döndürüyor, frontend'de ekstra filtreleme yapmaya gerek yok.

## Data Models

### Mevcut Models (Değişiklik Yok)

Tüm mevcut interface'ler korunacak:
- Profile
- Note
- Task
- Permission

Hiçbir model değişikliği yapılmayacak.

## Error Handling

### Frontend Errors

```typescript
// usePermissions hook'unda
try {
  await fetchPermissions();
} catch (error) {
  console.error('Error fetching permissions:', error);
  // Mevcut davranış korunuyor: default permissions kullanılıyor
}
```

### Backend Errors

RLS policy'ler başarısız olursa:
- Frontend'de buton zaten gizli olacak
- Backend 403 Forbidden dönecek
- Kullanıcı hata mesajı görecek

## Testing Strategy

### Integration Tests

1. **Personnel Not Görüntüleme Testi**:
   - Personnel can_view:true → Kendisi hakkındaki tüm notları görür
   - Personnel can_view:false → Sadece kendi yazdığı notları görür
   - Personnel başkasının sayfasında → Hiçbir not görmez

2. **Manager Not Görüntüleme Testi**:
   - Manager can_view:true + kendi sayfası → Herkesin yazdığı notları görür
   - Manager can_view:true + başkasının sayfası → Sadece kendi yazdığı notları görür
   - Manager can_view:false + kendi sayfası → Sadece kendi yazdığı notları görür
   - Manager can_view:false + başkasının sayfası → Sadece kendi yazdığı notları görür

3. **Owner Not Görüntüleme Testi**:
   - Owner her sayfada tüm notları görür

4. **Real-time Güncelleme Testi**:
   - Owner yetki değiştirir
   - Manager'ın ekranında notlar ve butonlar güncellenir
   - Sayfa yenilenmeden çalışır

### Manual Testing

1. Farklı roller ile giriş yap
2. Toggle butonlarını değiştir
3. Not görünürlüğünü kontrol et
4. Buton görünürlüğünü kontrol et

## Migration Strategy

### Adım 1: RLS Policies Güncelleme (Dikkatli)
- Mevcut notes policy'yi yedekle
- Yeni basitleştirilmiş policy'yi uygula
- Test et

### Adım 2: Frontend Updates (Aşamalı)
- usePermissions hook'una real-time ekle
- canEditNote ve canDeleteNote fonksiyonları ekle
- Not listesi component'lerini güncelle

### Adım 3: Testing
- Her adımda test et
- Farklı rollerle test et
- Real-time güncellemeleri test et

## Rollback Plan

Eğer bir şeyler ters giderse:

```sql
-- Eski RLS policy'yi geri yükle
-- (Yedeklenmiş SQL dosyasından)

-- Frontend'i önceki commit'e geri al
git revert <commit-hash>
```

## Performance Considerations

- Real-time subscription sadece Owner olmayan kullanıcılar için aktif
- RLS policy basitleştirildi, daha hızlı çalışacak
- Frontend'de gereksiz re-render yok
- Mevcut index'ler yeterli

## Security Considerations

- RLS policies her durumda güvenliği sağlıyor
- Frontend bypass edilse bile backend korumalı
- Owner yetkisi asla azaltılamıyor
- Kullanıcılar sadece kendi yazdıkları notları düzenleyebilir/silebilir
- Personnel başkalarının notlarını asla göremez
