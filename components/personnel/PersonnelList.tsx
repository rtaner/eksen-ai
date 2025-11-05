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
}

export default function PersonnelList({
  personnel,
  canCreate = false,
  canEdit = false,
  canDelete = false,
  onAdd,
}: PersonnelListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter personnel based on search query
  const filteredPersonnel = personnel.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Title and Add button */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Personel Listesi</h1>
        {canCreate && onAdd && (
          <Button variant="primary" onClick={onAdd}>
            + Personel Ekle
          </Button>
        )}
      </div>

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
