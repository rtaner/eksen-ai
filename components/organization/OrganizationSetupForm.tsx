'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function OrganizationSetupForm() {
  const router = useRouter();
  const supabase = createClient();

  const [organizationName, setOrganizationName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [errors, setErrors] = useState<{ name?: string; code?: string }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrganizationData();
  }, []);

  const fetchOrganizationData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Get user's profile to find organization
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id, role')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Only owners can setup organization
      if (profile.role !== 'owner') {
        router.push('/personnel');
        return;
      }

      // Get organization details
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id, name, invite_code')
        .eq('id', profile.organization_id)
        .single();

      if (orgError) throw orgError;

      setOrganizationId(org.id);
      setOrganizationName(org.name);
      setInviteCode(org.invite_code);
    } catch (error) {
      console.error('Error fetching organization:', error);
      setGeneralError('Organizasyon bilgileri yüklenemedi');
    } finally {
      setIsFetching(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { name?: string; code?: string } = {};

    if (!organizationName.trim()) {
      newErrors.name = 'Organizasyon adı gereklidir';
    }

    if (!inviteCode.trim()) {
      newErrors.code = 'Davet kodu gereklidir';
    } else if (inviteCode.length < 4) {
      newErrors.code = 'Davet kodu en az 4 karakter olmalıdır';
    } else if (!/^[A-Z0-9]+$/.test(inviteCode)) {
      newErrors.code = 'Davet kodu sadece büyük harf ve rakam içerebilir';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validateForm() || !organizationId) {
      return;
    }

    setIsLoading(true);

    try {
      // Check if invite code is already taken (by another organization)
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('invite_code', inviteCode.toUpperCase())
        .neq('id', organizationId)
        .limit(1);

      if (existingOrg && existingOrg.length > 0) {
        setErrors({ code: 'Bu davet kodu zaten kullanılıyor' });
        setIsLoading(false);
        return;
      }

      // Update organization
      const { error: updateError } = await supabase
        .from('organizations')
        .update({
          name: organizationName.trim(),
          invite_code: inviteCode.toUpperCase(),
        })
        .eq('id', organizationId);

      if (updateError) throw updateError;

      // Redirect to personnel page
      router.push('/personnel');
      router.refresh();
    } catch (error) {
      console.error('Error updating organization:', error);
      setGeneralError(
        error instanceof Error ? error.message : 'Organizasyon güncellenemedi'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/personnel');
  };

  if (isFetching) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {generalError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{generalError}</p>
          </div>
        )}

        <Input
          label="Organizasyon Adı"
          type="text"
          value={organizationName}
          onChange={(e) => setOrganizationName(e.target.value)}
          error={errors.name}
          disabled={isLoading}
          placeholder="Şirket Adı"
        />

        <Input
          label="Davet Kodu"
          type="text"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          error={errors.code}
          helperText="Ekip üyelerinizin organizasyonunuza katılması için kullanacakları benzersiz kod"
          disabled={isLoading}
          placeholder="MYCOMPANY123"
          maxLength={20}
        />

        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleSkip}
            disabled={isLoading}
            className="flex-1"
          >
            Şimdilik Atla
          </Button>
          <Button
            type="submit"
            isLoading={isLoading}
            className="flex-1"
          >
            Kaydet ve Devam Et
          </Button>
        </div>
      </form>
    </div>
  );
}
