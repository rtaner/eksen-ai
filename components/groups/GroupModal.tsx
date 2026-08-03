'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { GroupWithMembers, Personnel } from '@/lib/types';
import { getGroups, createGroup, updateGroup, deleteGroup } from '@/lib/services/group-service';
import Button from '@/components/ui/Button';

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupChange?: () => void;
}

export default function GroupModal({ isOpen, onClose, onGroupChange }: GroupModalProps) {
  const supabase = createClient();
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [allPersonnel, setAllPersonnel] = useState<Personnel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithMembers | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPersonnelIds, setSelectedPersonnelIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [groupsData, { data: personnelData }] = await Promise.all([
        getGroups(),
        supabase.from('personnel').select('*').order('name', { ascending: true }),
      ]);
      setGroups(groupsData);
      setAllPersonnel(personnelData || []);
    } catch (err: any) {
      console.error('Error loading group data:', err);
      setError('Veriler yüklenirken hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewGroup = () => {
    setSelectedGroup(null);
    setName('');
    setDescription('');
    setSelectedPersonnelIds([]);
    setIsEditing(true);
    setError(null);
  };

  const handleEditGroup = (group: GroupWithMembers) => {
    setSelectedGroup(group);
    setName(group.name);
    setDescription(group.description || '');
    setSelectedPersonnelIds(group.members?.map((m) => m.id) || []);
    setIsEditing(true);
    setError(null);
  };

  const handleTogglePersonnel = (personnelId: string) => {
    setSelectedPersonnelIds((prev) =>
      prev.includes(personnelId)
        ? prev.filter((id) => id !== personnelId)
        : [...prev, personnelId]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Grup adı zorunludur');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (selectedGroup) {
        const res = await updateGroup(selectedGroup.id, name.trim(), description.trim() || null, selectedPersonnelIds);
        if (!res.success) throw new Error(res.error);
      } else {
        const res = await createGroup(name.trim(), description.trim() || null, selectedPersonnelIds);
        if (!res.success) throw new Error(res.error);
      }

      setIsEditing(false);
      await loadData();
      onGroupChange?.();
    } catch (err: any) {
      setError(err.message || 'Grup kaydedilemedi');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (groupId: string) => {
    if (!confirm('Bu grubu silmek istediğinizden emin misiniz? Gruba ait notlar silinecektir.')) {
      return;
    }

    try {
      const res = await deleteGroup(groupId);
      if (!res.success) throw new Error(res.error);
      if (selectedGroup?.id === groupId) {
        setIsEditing(false);
        setSelectedGroup(null);
      }
      await loadData();
      onGroupChange?.();
    } catch (err: any) {
      setError(err.message || 'Grup silinemedi');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Personel Grupları / Roller</h2>
            <p className="text-sm text-gray-500">Ekip ve departman bazlı notlar ve görevler tanımlayın</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            {error}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
          ) : isEditing ? (
            /* Form View */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grup Adı *</label>
                <input
                  type="text"
                  placeholder="Örn: Görsel Tasarımcılar, Kasiyerler..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama (İsteğe bağlı)</label>
                <input
                  type="text"
                  placeholder="Örn: Mağaza vitrin ve manken düzenleme ekibi"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gruba Dahil Personeller ({selectedPersonnelIds.length} seçildi)
                </label>
                {allPersonnel.length === 0 ? (
                  <p className="text-sm text-gray-500">Henüz personel bulunmuyor.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-xl bg-gray-50">
                    {allPersonnel.map((p) => {
                      const isSelected = selectedPersonnelIds.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-50 border border-blue-200 text-blue-900 font-medium' : 'hover:bg-white text-gray-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleTogglePersonnel(p.id)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">{p.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  İptal
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Kaydediliyor...' : selectedGroup ? 'Grubu Güncelle' : 'Grup Oluştur'}
                </Button>
              </div>
            </div>
          ) : (
            /* List View */
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-600">Mevcut Gruplar ({groups.length})</span>
                <Button onClick={handleNewGroup} size="sm">
                  + Yeni Grup Ekle
                </Button>
              </div>

              {groups.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-gray-500 text-sm">Henüz oluşturulmuş bir grup bulunmuyor.</p>
                  <p className="text-xs text-gray-400 mt-1">Örn: "Görsel Tasarımcılar" veya "Kasiyer Ekibi" grubu ekleyebilirsiniz.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {groups.map((group) => (
                    <div
                      key={group.id}
                      className="p-4 border border-gray-200 rounded-xl bg-white hover:border-gray-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900">{group.name}</h3>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-medium text-xs rounded-full">
                            {group.member_count} Personel
                          </span>
                        </div>
                        {group.description && (
                          <p className="text-xs text-gray-500 mt-1">{group.description}</p>
                        )}
                        {group.members && group.members.length > 0 && (
                          <p className="text-xs text-gray-400 mt-1">
                            Üyeler: {group.members.map((m) => m.name).join(', ')}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-auto">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEditGroup(group)}
                        >
                          Düzenle
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(group.id)}
                        >
                          Sil
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isEditing && (
          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <Button variant="secondary" onClick={onClose}>
              Kapat
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
