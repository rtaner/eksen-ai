'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useToast } from '@/lib/contexts/ToastContext';

interface OrganizationSettingsFormProps {
  onSuccess?: () => void;
}

export default function OrganizationSettingsForm({ onSuccess }: OrganizationSettingsFormProps = {}) {
  const supabase = createClient();
  const { showSuccess, showError } = useToast();

  const [organizationName, setOrganizationName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [errors, setErrors] = useState<{ name?: string; code?: string }>({});

  useEffect(() => {
    fetchOrganizationData();
  }, []);

  const fetchOrganizationData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

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
      showError('Organizasyon bilgileri yüklenemedi');
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

      showSuccess('Değişiklikler başarıyla kaydedildi');
      
      // Call onSuccess callback to close modal
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1500); // Wait 1.5 seconds to show success message
      }
    } catch (error) {
      console.error('Error updating organization:', error);
      showError(error instanceof Error ? error.message : 'Organizasyon güncellenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <Card>
        <div className="text-center text-gray-600">Yükleniyor...</div>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Organizasyon Adı"
          type="text"
          value={organizationName}
          onChange={(e) => setOrganizationName(e.target.value)}
          error={errors.name}
          disabled={isLoading}
          placeholder="Şirket Adı"
        />

        <div>
          <Input
            label="Davet Kodu"
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            error={errors.code}
            helperText="Ekip üyelerinizin organizasyonunuza katılması için kullanacakları benzersiz kod"
            disabled={isLoading}
            placeholder="MYCOMPANY"
            maxLength={20}
          />
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-blue-800 mb-1">
                  <strong>Paylaşım Linki:</strong>
                </p>
                <code className="text-xs bg-blue-100 px-2 py-1 rounded block truncate">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/register?code={inviteCode}
                </code>
              </div>
              <button
                type="button"
                onClick={() => {
                  const link = `${window.location.origin}/register?code=${inviteCode}`;
                  navigator.clipboard.writeText(link);
                  showSuccess('Link kopyalandı!');
                }}
                className="flex-shrink-0 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                📋 Kopyala
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" isLoading={isLoading}>
            Değişiklikleri Kaydet
          </Button>
        </div>
      </form>
    </Card>
  );
}
