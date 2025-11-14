'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useToast } from '@/lib/contexts/ToastContext';

interface User {
  id: string;
  name: string;
  surname: string;
  username: string;
  role: 'owner' | 'manager' | 'personnel';
}

export default function UserRoleManagement() {
  const supabase = createClient();
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, surname, username, role')
        .eq('organization_id', profile.organization_id)
        .order('role')
        .order('name');

      if (error) throw error;

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      showError('Kullanıcılar yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'manager' | 'personnel') => {
    setUpdatingUserId(userId);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );

      showSuccess('Rol başarıyla güncellendi');
    } catch (error) {
      console.error('Error updating role:', error);
      showError(error instanceof Error ? error.message : 'Rol güncellenemedi');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'personnel':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Sahip';
      case 'manager':
        return 'Yönetici';
      case 'personnel':
        return 'Personel';
      default:
        return role;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <div className="text-center text-gray-600">Yükleniyor...</div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 rounded-lg"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-gray-900">
                  {user.name} {user.surname}
                </h4>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${getRoleBadgeColor(
                    user.role
                  )}`}
                >
                  {getRoleLabel(user.role)}
                </span>
              </div>
              <p className="text-sm text-gray-600">@{user.username}</p>
            </div>

            {user.role !== 'owner' && (
              <div className="flex gap-2">
                {user.role === 'personnel' ? (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleRoleChange(user.id, 'manager')}
                    isLoading={updatingUserId === user.id}
                    disabled={updatingUserId !== null}
                  >
                    Yönetici Yap
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleRoleChange(user.id, 'personnel')}
                    isLoading={updatingUserId === user.id}
                    disabled={updatingUserId !== null}
                  >
                    Personel Yap
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}

        {users.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Henüz kullanıcı bulunmuyor
          </div>
        )}
      </div>
    </Card>
  );
}
