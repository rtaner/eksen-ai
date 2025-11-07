'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AssignmentSelector({ value, onChange }: any) {
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadPersonnel();
  }, []);

  const loadPersonnel = async () => {
    try {
      const { data, error } = await supabase
        .from('personnel')
        .select('id, name, metadata')
        .order('name');

      if (error) {
        console.error('Personel yükleme hatası:', error);
        return;
      }

      // Format personnel data
      const formattedData = (data || []).map(p => ({
        id: p.id,
        full_name: p.name,
        role: p.metadata?.role || 'personnel',
        has_user: !!p.metadata?.user_id
      }));

      setPersonnel(formattedData);
    } catch (error) {
      console.error('Personel yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePersonnel = (personnelId: string) => {
    const currentIds = value.assignment_config?.personnel_ids || [];
    const newIds = currentIds.includes(personnelId)
      ? currentIds.filter((id: string) => id !== personnelId)
      : [...currentIds, personnelId];
    
    onChange({
      ...value,
      assignment_config: { personnel_ids: newIds }
    });
  };

  const handleTypeChange = (newType: string) => {
    // Type değiştiğinde config'i de güncelle
    const newConfig = newType === 'role' 
      ? { role: 'manager' }
      : { personnel_ids: [] };
    
    console.log('🔄 Assignment type changed:', {
      newType,
      newConfig,
      fullValue: { ...value, assignment_type: newType, assignment_config: newConfig }
    });
    
    onChange({ 
      ...value, 
      assignment_type: newType,
      assignment_config: newConfig
    });
  };

  return (
    <div className="space-y-3">
      <select
        value={value.assignment_type}
        onChange={(e) => handleTypeChange(e.target.value)}
        className="w-full px-4 py-3 border rounded-lg"
      >
        <option value="specific">Belirli Personeller</option>
        <option value="role">Rol Bazlı</option>
      </select>

      {value.assignment_type === 'specific' && (
        <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
          {loading ? (
            <p className="text-gray-500 text-sm">Yükleniyor...</p>
          ) : personnel.length === 0 ? (
            <p className="text-gray-500 text-sm">Personel bulunamadı</p>
          ) : (
            <div className="space-y-2">
              {personnel.map((person) => (
                <label key={person.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(value.assignment_config?.personnel_ids || []).includes(person.id)}
                    onChange={() => togglePersonnel(person.id)}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{person.full_name}</p>
                    <p className="text-xs text-gray-500">
                      {person.role === 'owner' ? 'Sahip' : person.role === 'manager' ? 'Yönetici' : 'Personel'}
                      {!person.has_user && ' • Manuel Eklendi'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {value.assignment_type === 'role' && (
        <select
          value={value.assignment_config.role || 'manager'}
          onChange={(e) => {
            const newConfig = { role: e.target.value };
            console.log('👥 Role changed:', {
              newRole: e.target.value,
              newConfig,
              fullValue: { ...value, assignment_config: newConfig }
            });
            onChange({ ...value, assignment_config: newConfig });
          }}
          className="w-full px-4 py-3 border rounded-lg"
        >
          <option value="owner">Tüm Sahipler</option>
          <option value="manager">Tüm Yöneticiler</option>
          <option value="personnel">Tüm Personel</option>
        </select>
      )}
    </div>
  );
}
