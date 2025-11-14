'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import UserEditForm from './UserEditForm';
import UserDeleteConfirm from './UserDeleteConfirm';
import ManualPersonnelEditForm from './ManualPersonnelEditForm';
import ManualPersonnelDeleteConfirm from './ManualPersonnelDeleteConfirm';
import { useToast } from '@/lib/contexts/ToastContext';

interface User {
  id: string;
  name: string;
  surname: string;
  username: string;
  role: 'owner' | 'manager' | 'personnel';
}

interface UserOrPersonnel {
  id: string;
  name: string;
  surname?: string;
  username?: string;
  role: 'owner' | 'manager' | 'personnel';
  isRealUser: boolean;
  user_id?: string;
}

export default function UserManagementClient() {
  const supabase = createClient();
  const { showSuccess, showError } = useToast();
  const [usersAndPersonnel, setUsersAndPersonnel] = useState<UserOrPersonnel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [showUserEditModal, setShowUserEditModal] = useState(false);
  const [showPersonnelEditModal, setShowPersonnelEditModal] = useState(false);
  const [showUserDeleteModal, setShowUserDeleteModal] = useState(false);
  const [showPersonnelDeleteModal, setShowPersonnelDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserOrPersonnel | null>(null);

  useEffect(() => {
    fetchUsersAndPersonnel();
  }, []);

  const fetchUsersAndPersonnel = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      // Fetch real users (profiles)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, surname, username, role')
        .eq('organization_id', profile.organization_id)
        .order('role')
        .order('name');

      if (profilesError) throw profilesError;

      // Fetch manual personnel (personnel without user_id)
      const { data: personnel, error: personnelError } = await supabase
        .from('personnel')
        .select('id, name, metadata')
        .eq('organization_id', profile.organization_id)
        .is('metadata->user_id', null);

      if (personnelError) throw personnelError;

      // Combine real users and manual personnel
      const realUsers: UserOrPersonnel[] = (profiles || []).map((p) => ({
        id: p.id,
        name: p.name,
        surname: p.surname,
        username: p.username,
        role: p.role,
        isRealUser: true,
      }));

      const manualPersonnel: UserOrPersonnel[] = (personnel || []).map((p) => ({
        id: p.id,
        name: p.name,
        role: (p.metadata?.role as 'manager' | 'personnel') || 'personnel',
        isRealUser: false,
      }));

      setUsersAndPersonnel([...realUsers, ...manualPersonnel]);
    } catch (error) {
      console.error('Error fetching users and personnel:', error);
      showError('Kullanıcılar ve personeller yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (
    user: UserOrPersonnel,
    newRole: 'manager' | 'personnel'
  ) => {
    setUpdatingUserId(user.id);

    try {
      if (user.isRealUser) {
        // Calculate hierarchy_level based on role
        const hierarchyLevel = newRole === 'manager' ? 2 : 1;
        
        // Update real user role and hierarchy_level in profiles table
        const { error } = await supabase
          .from('profiles')
          .update({ 
            role: newRole,
            hierarchy_level: hierarchyLevel 
          })
          .eq('id', user.id);

        if (error) throw error;
      } else {
        // Update manual personnel role in personnel.metadata
        const { data: personnel, error: fetchError } = await supabase
          .from('personnel')
          .select('metadata')
          .eq('id', user.id)
          .single();

        if (fetchError) throw fetchError;

        const updatedMetadata = {
          ...(personnel?.metadata || {}),
          role: newRole,
        };

        const { error: updateError } = await supabase
          .from('personnel')
          .update({ metadata: updatedMetadata })
          .eq('id', user.id);

        if (updateError) throw updateError;
      }

      setUsersAndPersonnel((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
      );

      showSuccess('Rol başarıyla güncellendi');
    } catch (error) {
      console.error('Error updating role:', error);
      showError(error instanceof Error ? error.message : 'Rol güncellenemedi');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleEdit = (user: UserOrPersonnel) => {
    setSelectedUser(user);
    if (user.isRealUser) {
      setShowUserEditModal(true);
    } else {
      setShowPersonnelEditModal(true);
    }
  };

  const handleDelete = (user: UserOrPersonnel) => {
    setSelectedUser(user);
    if (user.isRealUser) {
      setShowUserDeleteModal(true);
    } else {
      setShowPersonnelDeleteModal(true);
    }
  };

  const handleEditSuccess = (updatedUser: any) => {
    setUsersAndPersonnel((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u))
    );
    setShowUserEditModal(false);
    setShowPersonnelEditModal(false);
    setSelectedUser(null);
    showSuccess('Başarıyla güncellendi');
  };

  const handleDeleteSuccess = (userId: string) => {
    setUsersAndPersonnel((prev) => prev.filter((u) => u.id !== userId));
    setShowUserDeleteModal(false);
    setShowPersonnelDeleteModal(false);
    setSelectedUser(null);
    showSuccess('Başarıyla silindi');
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return { text: 'Sahip', color: 'bg-purple-100 text-purple-800' };
      case 'manager':
        return { text: 'Yönetici', color: 'bg-blue-100 text-blue-800' };
      case 'personnel':
        return { text: 'Personel', color: 'bg-gray-100 text-gray-800' };
      default:
        return { text: role, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const getManualPersonnelBadge = () => ({
    text: 'Gerçek Kullanıcı Değil',
    color: 'bg-orange-100 text-orange-800',
    icon: '🔒',
  });

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
        <div className="space-y-3">
          {usersAndPersonnel.map((user) => (
            <div
              key={user.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="font-medium text-gray-900">
                    {user.isRealUser ? `${user.name} ${user.surname}` : user.name}
                  </h4>
                  {user.isRealUser ? (
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        getRoleBadge(user.role).color
                      }`}
                    >
                      {getRoleBadge(user.role).text}
                    </span>
                  ) : (
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded flex items-center gap-1 ${
                        getManualPersonnelBadge().color
                      }`}
                    >
                      <span>{getManualPersonnelBadge().icon}</span>
                      <span>{getManualPersonnelBadge().text}</span>
                    </span>
                  )}
                </div>
                {user.isRealUser && user.username && (
                  <p className="text-sm text-gray-600">@{user.username}</p>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                {/* Role Change Buttons */}
                {user.role !== 'owner' && (
                  <>
                    {user.role === 'personnel' ? (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleRoleChange(user, 'manager')}
                        isLoading={updatingUserId === user.id}
                        disabled={updatingUserId !== null}
                      >
                        Yönetici Yap
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleRoleChange(user, 'personnel')}
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

          {usersAndPersonnel.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Henüz kullanıcı veya personel bulunmuyor
            </div>
          )}
        </div>
      </Card>

      {/* User Edit Modal */}
      {showUserEditModal && selectedUser && selectedUser.isRealUser && (
        <Modal
          isOpen={showUserEditModal}
          onClose={() => {
            setShowUserEditModal(false);
            setSelectedUser(null);
          }}
          title="Kullanıcı Düzenle"
        >
          <UserEditForm
            user={selectedUser as User}
            onSuccess={handleEditSuccess}
            onCancel={() => {
              setShowUserEditModal(false);
              setSelectedUser(null);
            }}
          />
        </Modal>
      )}

      {/* Manual Personnel Edit Modal */}
      {showPersonnelEditModal && selectedUser && !selectedUser.isRealUser && (
        <Modal
          isOpen={showPersonnelEditModal}
          onClose={() => {
            setShowPersonnelEditModal(false);
            setSelectedUser(null);
          }}
          title="Personel Düzenle"
        >
          <ManualPersonnelEditForm
            personnel={{ id: selectedUser.id, name: selectedUser.name }}
            onSuccess={handleEditSuccess}
            onCancel={() => {
              setShowPersonnelEditModal(false);
              setSelectedUser(null);
            }}
          />
        </Modal>
      )}

      {/* User Delete Modal */}
      {showUserDeleteModal && selectedUser && selectedUser.isRealUser && (
        <Modal
          isOpen={showUserDeleteModal}
          onClose={() => {
            setShowUserDeleteModal(false);
            setSelectedUser(null);
          }}
          title="Kullanıcı Sil"
        >
          <UserDeleteConfirm
            user={selectedUser as User}
            onSuccess={handleDeleteSuccess}
            onCancel={() => {
              setShowUserDeleteModal(false);
              setSelectedUser(null);
            }}
          />
        </Modal>
      )}

      {/* Manual Personnel Delete Modal */}
      {showPersonnelDeleteModal && selectedUser && !selectedUser.isRealUser && (
        <Modal
          isOpen={showPersonnelDeleteModal}
          onClose={() => {
            setShowPersonnelDeleteModal(false);
            setSelectedUser(null);
          }}
          title="Personel Sil"
        >
          <ManualPersonnelDeleteConfirm
            personnel={{ id: selectedUser.id, name: selectedUser.name }}
            onSuccess={handleDeleteSuccess}
            onCancel={() => {
              setShowPersonnelDeleteModal(false);
              setSelectedUser(null);
            }}
          />
        </Modal>
      )}
    </>
  );
}
