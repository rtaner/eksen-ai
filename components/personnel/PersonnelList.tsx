'use client';

import { useState } from 'react';
import { Personnel } from '@/lib/types';
import PersonnelCard from './PersonnelCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface PersonnelListProps {
  personnel: Personnel[];
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  onAdd?: () => void;
  onManageGroups?: () => void;
}

export default function PersonnelList({
  personnel,
  canCreate = false,
  canEdit = false,
  canDelete = false,
  onAdd,
  onManageGroups,
}: PersonnelListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter personnel based on search query
  const filteredPersonnel = personnel.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div>
        <Input
          type="text"
          placeholder="Personel ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Personnel count */}
      <div className="text-sm text-gray-600">
        {filteredPersonnel.length} personel bulundu
        {searchQuery && ` (${personnel.length} toplam)`}
      </div>

      {/* Personnel grid/list */}
      {filteredPersonnel.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">
            {searchQuery
              ? 'Arama kriterlerine uygun personel bulunamadı.'
              : 'Henüz personel eklenmemiş.'}
          </p>
          {canCreate && onAdd && !searchQuery && (
            <Button variant="primary" onClick={onAdd}>
              İlk Personeli Ekle
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPersonnel.map((p) => (
            <PersonnelCard key={p.id} personnel={p} />
          ))}
        </div>
      )}
    </div>
  );
}
