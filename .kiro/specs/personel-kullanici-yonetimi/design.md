# Design Document

## Overview

Bu özellik, Vector PWA uygulamasında personel ve kullanıcı yönetimi sayfalarının kullanıcı deneyimini iyileştirir. Personel ana sayfası salt okunur hale getirilecek ve kullanıcı yönetimi sayfasında gerçek kullanıcılar ile manuel eklenen personeller arasında net bir ayrım sağlanacaktır.

## Architecture

### Mevcut Yapı

**Personel Ana Sayfası:**
- `app/(dashboard)/personnel/page.tsx`: Server component, verileri fetch eder
- `components/personnel/PersonnelPageClient.tsx`: Client component, CRUD işlemlerini yönetir
- `components/personnel/PersonnelCard.tsx`: Personel kartı, 3 nokta menüsü ile düzenle/sil seçenekleri içerir
- `components/personnel/PersonnelList.tsx`: Personel listesi ve "Yeni Personel Ekle" butonu

**Kullanıcı Yönetimi Sayfası:**
- `app/(dashboard)/settings/organization/page.tsx`: Organizasyon ayarları sayfası
- `components/organization/UserManagementClient.tsx`: Kullanıcı listesi ve yönetim işlemleri
- `components/organization/UserEditForm.tsx`: Kullanıcı düzenleme formu (Ad, Soyad, Kullanıcı Adı, Şifre)

### Değişiklikler

**1. Personel Ana Sayfası:**
- `PersonnelCard` component'inden 3 nokta menüsünü kaldır
- `PersonnelPageClient` component'inden düzenleme ve silme işlevlerini kaldır
- Kartlar sadece görüntüleme için kullanılacak (tıklandığında detay sayfasına yönlendirecek)

**2. Kullanıcı Yönetimi Sayfası:**
- `UserManagementClient` component'ini genişlet: hem gerçek kullanıcıları hem manuel personelleri göster
- Manuel personeller için "Gerçek Kullanıcı Değil" badge'i ekle
- Düzenleme modalını dinamik hale getir: gerçek kullanıcı için tam form, manuel personel için sadece isim alanı
- Yeni component: `ManualPersonnelEditForm.tsx` (sadece isim düzenleme)

## Components and Interfaces

### 1. PersonnelCard Component (Güncelleme)

**Değişiklikler:**
- `canEdit` ve `canDelete` props'larını kaldır veya her zaman `false` olarak ayarla
- 3 nokta menüsünü render etme
- Sadece kart tıklaması ile detay sayfasına yönlendirme

```typescript
interface PersonnelCardProps {
  personnel: Personnel;
}

export default function PersonnelCard({ personnel }: PersonnelCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/personnel/${personnel.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="p-4 border-2 border-gray-200 bg-white rounded-lg hover:shadow-lg transition-all cursor-pointer"
    >
      <h3 className="text-lg font-semibold text-gray-900">
        {capitalizeFirst(personnel.name)}
      </h3>
    </div>
  );
}
```

### 2. PersonnelPageClient Component (Güncelleme)

**Değişiklikler:**
- Düzenleme ve silme modal state'lerini kaldır
- `handleEdit` ve `handleDelete` fonksiyonlarını kaldır
- `PersonnelList` component'ine `canEdit` ve `canDelete` props'larını `false` olarak geçir

```typescript
export default function PersonnelPageClient({
  initialPersonnel,
}: PersonnelPageClientProps) {
  const [personnel, setPersonnel] = useState<Personnel[]>(initialPersonnel);

  return (
    <PersonnelList
      personnel={personnel}
      canCreate={false}
      canEdit={false}
      canDelete={false}
    />
  );
}
```

### 3. UserManagementClient Component (Genişletme)

**Yeni Interface:**
```typescript
interface UserOrPersonnel {
  id: string;
  name: string;
  surname?: string; // Sadece gerçek kullanıcılarda
  username?: string; // Sadece gerçek kullanıcılarda
  role: 'owner' | 'manager' | 'personnel';
  isRealUser: boolean; // user_id var mı?
  user_id?: string; // Manuel personellerde user_id
}
```

**Değişiklikler:**
- Hem `profiles` hem `personnel` tablolarından veri çek
- Manuel personelleri (user_id olmayan) listeye ekle
- Badge render logic'ini güncelle: gerçek kullanıcı için rol badge'i, manuel personel için "Gerçek Kullanıcı Değil"
- Düzenleme butonuna tıklandığında `isRealUser` kontrolü yap ve uygun formu aç

```typescript
const fetchUsersAndPersonnel = async () => {
  // Gerçek kullanıcıları çek
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, surname, username, role')
    .eq('organization_id', organizationId)
    .order('role')
    .order('name');

  // Manuel personelleri çek (user_id olmayan)
  const { data: personnel } = await supabase
    .from('personnel')
    .select('id, name, metadata')
    .eq('organization_id', organizationId)
    .is('metadata->user_id', null);

  // Birleştir
  const realUsers = profiles.map(p => ({
    id: p.id,
    name: p.name,
    surname: p.surname,
    username: p.username,
    role: p.role,
    isRealUser: true,
  }));

  const manualPersonnel = personnel.map(p => ({
    id: p.id,
    name: p.name,
    role: p.metadata?.role || 'personnel',
    isRealUser: false,
  }));

  setUsersAndPersonnel([...realUsers, ...manualPersonnel]);
};
```

### 4. ManualPersonnelEditForm Component (Yeni)

**Props:**
```typescript
interface ManualPersonnelEditFormProps {
  personnel: {
    id: string;
    name: string;
  };
  onSuccess: (updatedPersonnel: any) => void;
  onCancel: () => void;
}
```

**İşlev:**
- Sadece isim alanı içeren basit form
- `personnel` tablosunda güncelleme yap

```typescript
export default function ManualPersonnelEditForm({
  personnel,
  onSuccess,
  onCancel,
}: ManualPersonnelEditFormProps) {
  const [name, setName] = useState(personnel.name);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase
      .from('personnel')
      .update({ name: name.trim() })
      .eq('id', personnel.id);

    if (!error) {
      onSuccess({ ...personnel, name: name.trim() });
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>İsim</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <Button type="button" onClick={onCancel}>İptal</Button>
        <Button type="submit" isLoading={isLoading}>Güncelle</Button>
      </div>
    </form>
  );
}
```

### 5. Badge Component Logic

**Gerçek Kullanıcı:**
```typescript
const getRoleBadge = (role: string) => {
  switch (role) {
    case 'owner':
      return { text: 'Sahip', color: 'bg-purple-100 text-purple-800' };
    case 'manager':
      return { text: 'Yönetici', color: 'bg-blue-100 text-blue-800' };
    case 'personnel':
      return { text: 'Personel', color: 'bg-gray-100 text-gray-800' };
  }
};
```

**Manuel Personel:**
```typescript
const getManualPersonnelBadge = () => ({
  text: 'Gerçek Kullanıcı Değil',
  color: 'bg-orange-100 text-orange-800',
  icon: '🔒',
});
```

## Data Models

### Personnel Table (Mevcut)

```sql
CREATE TABLE personnel (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**metadata.user_id:**
- Eğer `null` ise → Manuel personel
- Eğer UUID ise → Gerçek kullanıcıya bağlı personel

**metadata.role:**
- Manuel personeller için rol bilgisi (personnel veya manager)

### Profiles Table (Mevcut)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'personnel')),
  name TEXT NOT NULL,
  surname TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Error Handling

### Frontend Errors

**Personel Ana Sayfası:**
- Veri yüklenemezse: "Personeller yüklenemedi" mesajı göster
- Boş liste: "Henüz personel bulunmuyor" mesajı

**Kullanıcı Yönetimi Sayfası:**
- Veri yüklenemezse: Toast notification ile hata mesajı
- Güncelleme başarısız: Form içinde hata mesajı göster
- Silme başarısız: Toast notification ile hata mesajı

### Backend Errors

**Supabase Errors:**
- RLS policy ihlali: "Yetkiniz yok" mesajı
- Unique constraint ihlali: "Bu kullanıcı adı zaten kullanılıyor"
- Foreign key ihlali: "İlişkili kayıtlar var, silinemez"

## Testing Strategy

### Unit Tests

**PersonnelCard:**
- 3 nokta menüsünün render edilmediğini test et
- Kart tıklamasının doğru route'a yönlendirdiğini test et

**ManualPersonnelEditForm:**
- Form submit'inin doğru veriyi gönderdiğini test et
- Validation'ın çalıştığını test et

### Integration Tests

**Personel Ana Sayfası:**
- Sayfa yüklendiğinde personellerin gösterildiğini test et
- Düzenleme/silme butonlarının olmadığını test et

**Kullanıcı Yönetimi Sayfası:**
- Gerçek kullanıcılar ve manuel personellerin birlikte gösterildiğini test et
- Badge'lerin doğru gösterildiğini test et
- Gerçek kullanıcı düzenleme modalının tam form gösterdiğini test et
- Manuel personel düzenleme modalının sadece isim alanı gösterdiğini test et

### E2E Tests

**Kullanıcı Yönetimi Flow:**
1. Kullanıcı yönetimi sayfasına git
2. Manuel personel için düzenle butonuna tıkla
3. İsim değiştir ve kaydet
4. Değişikliğin yansıdığını kontrol et

## UI/UX Considerations

### Personel Ana Sayfası

**Öncesi:**
- Personel kartlarında 3 nokta menüsü var
- Düzenle/Sil seçenekleri mevcut

**Sonrası:**
- Temiz, minimal kart tasarımı
- Sadece görüntüleme ve detaya gitme
- Daha hızlı ve basit kullanıcı deneyimi

### Kullanıcı Yönetimi Sayfası

**Badge Tasarımı:**
- Gerçek kullanıcılar: Mavi/Mor/Gri badge (role göre)
- Manuel personeller: Turuncu badge + 🔒 ikonu

**Modal Tasarımı:**
- Gerçek kullanıcı: 4 alan (Ad, Soyad, Kullanıcı Adı, Şifre)
- Manuel personel: 1 alan (İsim) - Daha basit ve hızlı

**Responsive Design:**
- Mobile-first yaklaşım
- Badge'ler mobilde de okunabilir
- Butonlar touch-friendly (min 44x44px)

## Performance Considerations

### Data Fetching

**Personel Ana Sayfası:**
- Server-side rendering ile ilk yükleme hızlı
- Client-side'da sadece görüntüleme, state yönetimi minimal

**Kullanıcı Yönetimi Sayfası:**
- İki tablo sorgusu (profiles + personnel)
- Sorguları paralel çalıştır (Promise.all)
- Sonuçları client-side'da birleştir

### Bundle Size

- Yeni component (ManualPersonnelEditForm) minimal boyutta
- Mevcut component'lerden kod kaldırılıyor (PersonnelCard, PersonnelPageClient)
- Net bundle size azalması bekleniyor

## Security Considerations

### RLS Policies

**Personnel Table:**
- SELECT: Organizasyon üyeleri görebilir
- UPDATE: Sadece yöneticiler güncelleyebilir
- DELETE: Sadece yöneticiler silebilir

**Profiles Table:**
- SELECT: Organizasyon üyeleri görebilir
- UPDATE: Sadece owner güncelleyebilir
- DELETE: Sadece owner silebilir

### Permission Checks

**Frontend:**
- Personel ana sayfasında düzenleme/silme butonları gösterilmez
- Kullanıcı yönetimi sayfasında rol kontrolü yapılır

**Backend:**
- RLS policies her zaman aktif
- Edge function'larda ek permission check'ler

## Migration Plan

### Phase 1: Personel Ana Sayfası
1. `PersonnelCard` component'ini güncelle (3 nokta menüsünü kaldır)
2. `PersonnelPageClient` component'ini güncelle (CRUD işlevlerini kaldır)
3. Test et

### Phase 2: Kullanıcı Yönetimi Sayfası
1. `ManualPersonnelEditForm` component'ini oluştur
2. `UserManagementClient` component'ini genişlet (personnel fetch ekle)
3. Badge logic'ini güncelle
4. Modal logic'ini güncelle (dinamik form seçimi)
5. Test et

### Phase 3: Testing & Deployment
1. Unit testler yaz
2. Integration testler yaz
3. E2E testler yaz
4. Staging'de test et
5. Production'a deploy et

## Rollback Plan

Eğer bir sorun çıkarsa:
1. Git'te önceki commit'e dön
2. Veritabanı değişikliği yok, rollback gerekmez
3. Frontend değişiklikleri geri al
4. Yeniden deploy et
