'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import PermissionToggle from './PermissionToggle';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useToast } from '@/lib/contexts/ToastContext';

interface PermissionRow {
  id: string;
  role: 'manager' | 'personnel';
  resource_type: 'personnel' | 'notes' | 'tasks';
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export default function PermissionMatrix() {
  const supabase = createClient();
  const { showSuccess, showError } = useToast();
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const roles: Array<'manager' | 'personnel'> = ['manager', 'personnel'];
  const resources: Array<'personnel' | 'notes' | 'tasks'> = ['personnel', 'notes', 'tasks'];
  const actions: Array<'can_view' | 'can_create' | 'can_edit' | 'can_delete'> = [
    'can_view',
    'can_create',
    'can_edit',
    'can_delete',
  ];

  const actionLabels = {
    can_view: 'Görüntüle',
    can_create: 'Oluştur',
    can_edit: 'Düzenle',
    can_delete: 'Sil',
  };

  const resourceLabels = {
    personnel: 'Personel',
    notes: 'Notlar',
    tasks: 'Görevler',
  };

  const roleLabels = {
    manager: 'Yönetici',
    personnel: 'Personel',
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      setOrganizationId(profile.organization_id);

      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('role')
        .order('resource_type');

      if (error) throw error;

      setPermissions(data || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      showError('Yetkiler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (
    role: 'manager' | 'personnel',
    resource: 'personnel' | 'notes' | 'tasks',
    action: 'can_view' | 'can_create' | 'can_edit' | 'can_delete',
    value: boolean
  ) => {
    setPermissions((prev) =>
      prev.map((perm) =>
        perm.role === role && perm.resource_type === resource
          ? { ...perm, [action]: value }
          : perm
      )
    );
  };

  const handleSave = async () => {
    if (!organizationId) return;

    setIsSaving(true);

    try {
      // Update all permissions
      const updates = permissions.map((perm) =>
        supabase
          .from('permissions')
          .update({
            can_view: perm.can_view,
            can_create: perm.can_create,
            can_edit: perm.can_edit,
            can_delete: perm.can_delete,
          })
          .eq('id', perm.id)
      );

      await Promise.all(updates);

      showSuccess('Yetkiler başarıyla kaydedildi');
    } catch (error) {
      console.error('Error saving permissions:', error);
      showError('Yetkiler kaydedilemedi');
    } finally {
      setIsSaving(false);
    }
  };

  const getPermission = (
    role: 'manager' | 'personnel',
    resource: 'personnel' | 'notes' | 'tasks'
  ) => {
    return permissions.find((p) => p.role === role && p.resource_type === resource);
  };

  if (isLoading) {
    return (
      <Card>
        <div className="text-center text-gray-600">Yükleniyor...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {roles.map((role) => (
        <Card key={role} padding="none">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">{roleLabels[role]}</h3>
          </div>
          <div className="p-4 space-y-4">
            {resources.map((resource) => {
              const perm = getPermission(role, resource);
              if (!perm) return null;

              return (
                <div key={resource} className="space-y-3">
                  <h4 className="font-medium text-gray-900">{resourceLabels[resource]}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {actions.map((action) => (
                      <div
                        key={action}
                        className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="text-sm text-gray-700">{actionLabels[action]}</span>
                        <PermissionToggle
                          label={`${roleLabels[role]} - ${resourceLabels[resource]} - ${actionLabels[action]}`}
                          checked={perm[action]}
                          onChange={(value) => handleToggle(role, resource, action, value)}
                          disabled={isSaving}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button onClick={handleSave} isLoading={isSaving}>
          Değişiklikleri Kaydet
        </Button>
      </div>
    </div>
  );
}
