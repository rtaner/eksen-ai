'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import type { RegisterFormData } from '@/lib/types';

export default function RegisterForm() {
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    surname: '',
    username: '',
    password: '',
    inviteCode: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof RegisterFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Ad gereklidir';
    }

    if (!formData.surname.trim()) {
      newErrors.surname = 'Soyad gereklidir';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Kullanıcı adı gereklidir';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Kullanıcı adı en az 3 karakter olmalıdır';
    }

    if (!formData.password) {
      newErrors.password = 'Şifre gereklidir';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalıdır';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateInviteCode = (): string => {
    // Generate a truly unique code using crypto.randomUUID
    // Remove hyphens and take first 12 characters
    return crypto.randomUUID().replace(/-/g, '').substring(0, 12).toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Check if username already exists
      const { data: existingProfiles, error: checkError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', formData.username)
        .limit(1);

      // Ignore RLS errors during username check (user not authenticated yet)
      if (existingProfiles && existingProfiles.length > 0) {
        setErrors({ username: 'Bu kullanıcı adı zaten kullanılıyor' });
        setIsLoading(false);
        return;
      }

      // Create auth user with email format (username@vector.app)
      const email = `${formData.username}@vector.app`;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: formData.password,
        options: {
          emailRedirectTo: undefined,
          data: {
            username: formData.username,
            name: formData.name,
            surname: formData.surname,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Kullanıcı oluşturulamadı');

      let organizationId: string | undefined;

      // If invite code provided, join existing organization
      if (formData.inviteCode?.trim()) {
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('id')
          .eq('invite_code', formData.inviteCode.trim().toUpperCase())
          .single();

        if (orgError || !org) {
          throw new Error('Geçersiz davet kodu');
        }

        organizationId = org.id;
      } else {
        // Create new organization with unique invite code
        const inviteCode = generateInviteCode();
        
        const { data: newOrg, error: createOrgError } = await supabase
          .from('organizations')
          .insert({
            name: `${formData.name} ${formData.surname}'nin Organizasyonu`,
            invite_code: inviteCode,
          })
          .select()
          .single();

        if (createOrgError) {
          console.error('Organization creation error:', createOrgError);
          throw new Error(`Organizasyon oluşturulamadı: ${createOrgError.message}`);
        }

        organizationId = newOrg.id;
      }

      if (!organizationId) {
        throw new Error('Organizasyon ID bulunamadı');
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          organization_id: organizationId,
          role: formData.inviteCode ? 'personnel' : 'owner',
          name: formData.name,
          surname: formData.surname,
          username: formData.username,
        });

      if (profileError) throw profileError;

      // Personnel record is now created automatically via database trigger
      // Name sync is also handled automatically when profile is updated

      // Default permissions are created automatically via database trigger

      // Redirect based on whether user created new org or joined existing
      if (formData.inviteCode?.trim()) {
        // Joined existing organization - go to personnel page
        router.push('/personnel');
      } else {
        // Created new organization - go to setup page
        router.push('/setup-organization');
      }
      router.refresh();
    } catch (error) {
      console.error('Registration error:', error);
      setGeneralError(
        error instanceof Error ? error.message : 'Kayıt sırasında bir hata oluştu'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {generalError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{generalError}</p>
        </div>
      )}

      <Input
        label="Ad"
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        error={errors.name}
        disabled={isLoading}
        autoComplete="given-name"
      />

      <Input
        label="Soyad"
        type="text"
        value={formData.surname}
        onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
        error={errors.surname}
        disabled={isLoading}
        autoComplete="family-name"
      />

      <Input
        label="Kullanıcı Adı"
        type="text"
        value={formData.username}
        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        error={errors.username}
        disabled={isLoading}
        autoComplete="username"
      />

      <Input
        label="Şifre"
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        error={errors.password}
        disabled={isLoading}
        autoComplete="new-password"
      />

      <Input
        label="Davet Kodu (Opsiyonel)"
        type="text"
        value={formData.inviteCode}
        onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value.toUpperCase() })}
        error={errors.inviteCode}
        helperText="Bir organizasyona katılmak için davet kodu girin. Boş bırakırsanız yeni bir organizasyon oluşturulur."
        disabled={isLoading}
        placeholder="XXXXXXXX"
      />

      <Button
        type="submit"
        isLoading={isLoading}
        className="w-full"
      >
        Kayıt Ol
      </Button>
    </form>
  );
}
