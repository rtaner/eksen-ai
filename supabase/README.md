# Supabase Database Setup

Bu klasör Vector PWA için Supabase veritabanı migration dosyalarını içerir.

## Migrations

### 001_initial_schema.sql
- Tüm veritabanı tablolarını oluşturur
- Foreign key ilişkilerini tanımlar
- Performance için index'leri ekler
- updated_at trigger'larını oluşturur

**Tablolar:**
- `organizations` - Organizasyon bilgileri
- `profiles` - Kullanıcı profilleri (auth.users'a bağlı)
- `permissions` - Rol bazlı yetki ayarları
- `personnel` - Personel kayıtları
- `notes` - Personel notları
- `tasks` - Görevler
- `ai_analyses` - AI analiz sonuçları

### 002_rls_policies.sql
- Row Level Security (RLS) politikalarını uygular
- Organizasyon bazlı veri izolasyonu
- Rol ve permission bazlı erişim kontrolü
- Helper functions (get_user_organization_id, get_user_role, has_permission)

**Güvenlik Kuralları:**
- Kullanıcılar sadece kendi organizasyonlarının verilerini görebilir
- Owner tüm verilere erişebilir
- Manager ve Personnel rolleri permission ayarlarına göre erişir
- Notlar: Owner hepsini görür, diğerleri sadece kendilerininkileri
- Görevler: Herkes görebilir

### 003_default_permissions.sql
- Yeni organizasyon oluşturulduğunda default permission'ları ekler
- Manager için: personnel, notes, tasks yönetimi
- Personnel için: sadece görüntüleme

## Supabase CLI Kullanımı

### Local Development

1. Supabase CLI'yi yükleyin:
```bash
npm install -g supabase
```

2. Local Supabase'i başlatın:
```bash
supabase start
```

3. Migration'ları uygulayın:
```bash
supabase db push
```

4. TypeScript types generate edin:
```bash
supabase gen types typescript --local > ../lib/types/database.types.ts
```

### Production Deployment

1. Supabase projesine login olun:
```bash
supabase login
```

2. Projeyi link edin:
```bash
supabase link --project-ref your-project-ref
```

3. Migration'ları production'a push edin:
```bash
supabase db push
```

## Environment Variables

`.env.local` dosyanızda şu değişkenleri tanımlayın:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## RLS Policy Testing

RLS policy'leri test etmek için farklı roller ile giriş yapın:

1. **Owner testi**: Tüm verilere erişim
2. **Manager testi**: Permission'lara göre erişim
3. **Personnel testi**: Minimal erişim

## Troubleshooting

### Migration hatası alıyorsanız:
```bash
supabase db reset
supabase db push
```

### RLS policy çalışmıyorsa:
- Supabase Dashboard'da RLS'in enabled olduğunu kontrol edin
- Policy'lerin doğru tabloya uygulandığını kontrol edin
- auth.uid() fonksiyonunun çalıştığını test edin

### Permission'lar çalışmıyorsa:
- Default permission'ların oluşturulduğunu kontrol edin
- has_permission() fonksiyonunu test edin
- User'ın doğru role sahip olduğunu kontrol edin
