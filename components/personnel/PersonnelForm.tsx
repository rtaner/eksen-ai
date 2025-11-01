'use client';

import { useState, useEffect } from 'react';
import { Personnel, PersonnelFormData } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface PersonnelFormProps {
  personnel?: Personnel | null;
  onSuccess: (personnel: Personnel) => void;
  onCancel: () => void;
}

export default function PersonnelForm({
  personnel,
  onSuccess,
  onCancel,
}: PersonnelFormProps) {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState(personnel?.name || '');
  const [metadataFields, setMetadataFields] = useState<Array<{ key: string; value: string }>>([]);

  // Initialize metadata fields from existing personnel
  useEffect(() => {
    if (personnel?.metadata && Object.keys(personnel.metadata).length > 0) {
      const fields = Object.entries(personnel.metadata).map(([key, value]) => ({
        key,
        value: String(value),
      }));
      setMetadataFields(fields);
    }
  }, [personnel]);

  const handleAddMetadataField = () => {
    setMetadataFields([...metadataFields, { key: '', value: '' }]);
  };

  const handleRemoveMetadataField = (index: number) => {
    setMetadataFields(metadataFields.filter((_, i) => i !== index));
  };

  const handleMetadataChange = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...metadataFields];
    updated[index][field] = value;
    setMetadataFields(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validate name
      if (!name.trim()) {
        throw new Error('Personel adı zorunludur');
      }

      // Get current user and organization
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı oturumu bulunamadı');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Profil bulunamadı');

      // Build metadata object
      const metadata: Record<string, string> = {};
      metadataFields.forEach(({ key, value }) => {
        if (key.trim() && value.trim()) {
          metadata[key.trim()] = value.trim();
        }
      });

      const formData: PersonnelFormData = {
        name: name.trim(),
        metadata: Object.keys(metadata).length > 0 ? metadata : {},
      };

      let result;

      if (personnel) {
        // Update existing personnel
        const { data, error: updateError } = await supabase
          .from('personnel')
          .update(formData)
          .eq('id', personnel.id)
          .select()
          .single();

        if (updateError) throw updateError;
        result = data;
      } else {
        // Create new personnel
        const { data, error: insertError } = await supabase
          .from('personnel')
          .insert({
            ...formData,
            organization_id: profile.organization_id,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        result = data;
      }

      onSuccess(result);
    } catch (err: any) {
      console.error('Error saving personnel:', err);
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Name field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Personel Adı *
        </label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Örn: Ahmet Yılmaz"
          required
          disabled={isLoading}
        />
      </div>

      {/* Metadata fields */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Ek Bilgiler (Opsiyonel)
          </label>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddMetadataField}
            disabled={isLoading}
          >
            + Alan Ekle
          </Button>
        </div>

        {metadataFields.length > 0 && (
          <div className="space-y-2">
            {metadataFields.map((field, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  type="text"
                  value={field.key}
                  onChange={(e) => handleMetadataChange(index, 'key', e.target.value)}
                  placeholder="Alan adı (örn: Departman)"
                  disabled={isLoading}
                  className="flex-1"
                />
                <Input
                  type="text"
                  value={field.value}
                  onChange={(e) => handleMetadataChange(index, 'value', e.target.value)}
                  placeholder="Değer (örn: Satış)"
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => handleRemoveMetadataField(index)}
                  disabled={isLoading}
                  className="px-3"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}

        {metadataFields.length === 0 && (
          <p className="text-sm text-gray-500 italic">
            Henüz ek bilgi eklenmedi. "Alan Ekle" butonuna tıklayarak ekleyebilirsiniz.
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1"
        >
          İptal
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          className="flex-1"
        >
          {personnel ? 'Güncelle' : 'Ekle'}
        </Button>
      </div>
    </form>
  );
}
