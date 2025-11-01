'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import UserEditForm from './UserEditForm';
import UserDeleteConfirm from './UserDeleteConfirm';

interface User {
  id: string;
  name: string;
  surname: string;
  username: string;
  role: 'owner' | 'manager' | 'personnel';
}

export default function UserManagementClient() {
  const supabase = createClient();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

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
      setMessage({ type: 'error', text: 'Kullanıcılar yüklenemedi' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'manager' | 'personnel') => {
    setUpdatingUserId(userId);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );

      setMessage({ type: 'success', text: 'Rol başarıyla güncellendi' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error updating role:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Rol güncellenemedi',
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleEditSuccess = (updatedUser: User) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    );
    setShowEditModal(false);
    setSelectedUser(null);
    setMessage({ type: 'success', text: 'Kullanıcı başarıyla güncellendi' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDeleteSuccess = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    setShowDeleteModal(false);
    setSelectedUser(null);
    setMessage({ type: 'success', text: 'Kullanıcı başarıyla silindi' });
    setTimeout(() => setMessage(null), 3000);
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
    <>
      <Card>
        {message && (
          <div
            className={`mb-4 p-3 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

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

              <div className="flex gap-2 flex-wrap">
                {/* Role Change Buttons */}
                {user.role !== 'owner' && (
                  <>
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
                  </>
                )}

                {/* Edit Button */}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleEdit(user)}
                  disabled={updatingUserId !== null}
                >
                  Düzenle
                </Button>

                {/* Delete Button (not for owner) */}
                {user.role !== 'owner' && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(user)}
                    disabled={updatingUserId !== null}
                  >
                    Sil
                  </Button>
                )}
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Henüz kullanıcı bulunmuyor
            </div>
          )}
        </div>
      </Card>

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          title="Kullanıcı Düzenle"
        >
          <UserEditForm
            user={selectedUser}
            onSuccess={handleEditSuccess}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedUser(null);
            }}
          />
        </Modal>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedUser && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedUser(null);
          }}
          title="Kullanıcı Sil"
        >
          <UserDeleteConfirm
            user={selectedUser}
            onSuccess={handleDeleteSuccess}
            onCancel={() => {
              setShowDeleteModal(false);
              setSelectedUser(null);
            }}
          />
        </Modal>
      )}
    </>
  );
}
