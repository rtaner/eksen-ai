# Migration Talimatları

Kayıt sırasında aldığın hataları düzeltmek için aşağıdaki adımları takip et:

## Adım 1: Supabase Dashboard'a Git
1. https://supabase.com/dashboard adresine git
2. Projenizi seç
3. Sol menüden **SQL Editor**'ü aç

## Adım 2: Migration'ı Uygula

Aşağıdaki SQL kodunu SQL Editor'e yapıştır ve **RUN** butonuna tıkla:

```sql
-- ============================================
-- FIX: Default Permissions Trigger
-- Add ON CONFLICT handling and remove owner permissions
-- ============================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_organization_created ON organizations;
DROP FUNCTION IF EXISTS trigger_create_default_permissions();
DROP FUNCTION IF EXISTS create_default_permissions(UUID);

-- Recreate function with ON CONFLICT handling
-- Note: Owner role doesn't need permissions entries as they have full access by default
CREATE OR REPLACE FUNCTION create_default_permissions(org_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Manager default permissions
  INSERT INTO permissions (organization_id, role, resource_type, can_view, can_create, can_edit, can_delete)
  VALUES
    (org_id, 'manager', 'personnel', true, true, true, true),
    (org_id, 'manager', 'notes', true, true, true, true),
    (org_id, 'manager', 'tasks', true, true, true, false)
  ON CONFLICT (organization_id, role, resource_type) DO NOTHING;
  
  -- Personnel default permissions (minimal)
  INSERT INTO permissions (organization_id, role, resource_type, can_view, can_create, can_edit, can_delete)
  VALUES
    (org_id, 'personnel', 'personnel', true, false, false, false),
    (org_id, 'personnel', 'notes', false, false, false, false),
    (org_id, 'personnel', 'tasks', true, false, false, false)
  ON CONFLICT (organization_id, role, resource_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger function
CREATE OR REPLACE FUNCTION trigger_create_default_permissions()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_default_permissions(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_organization_created
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_create_default_permissions();
```

## Adım 3: Test Et

Migration başarılı olduktan sonra:
1. Tarayıcıda `/register` sayfasına git
2. Yeni bir kullanıcı kaydı yap
3. Artık hata almamalısın!

## Sorun Neydi?

1. **permissions_role_check constraint**: Permissions tablosu sadece 'manager' ve 'personnel' rollerini kabul ediyordu, ama trigger 'owner' için de kayıt oluşturmaya çalışıyordu.

2. **Çözüm**: Owner rolü için permissions tablosunda kayıt tutmaya gerek yok çünkü owner zaten her şeye tam erişime sahip. Trigger'dan owner permissions'larını kaldırdık.

3. **ON CONFLICT DO NOTHING**: Duplicate key hatalarını önlemek için eklendi.

4. **SECURITY DEFINER**: Trigger'ın RLS policy'lerini bypass etmesini sağlar, böylece henüz profile oluşturulmamış olsa bile permissions oluşturabilir.
