'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Personnel } from '@/lib/types';
import { capitalizeFirst } from '@/lib/utils/textFormat';

interface PersonnelCardProps {
  personnel: Personnel;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (personnel: Personnel) => void;
  onDelete?: (personnel: Personnel) => void;
}

export default function PersonnelCard({
  personnel,
  canEdit = false,
  canDelete = false,
  onEdit,
  onDelete,
}: PersonnelCardProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleCardClick = () => {
    router.push(`/personnel/${personnel.id}`);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    onEdit?.(personnel);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    onDelete?.(personnel);
  };

  return (
    <div
      onClick={handleCardClick}
      className="p-4 border-2 border-gray-200 bg-white rounded-lg hover:shadow-lg transition-all cursor-pointer relative"
    >
      {/* Three dots menu */}
      {(canEdit || canDelete) && (
        <div className="absolute top-3 right-3">
          <button
            onClick={handleMenuClick}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Menü"
          >
            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {/* Dropdown menu */}
          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                }}
              />
              <div className="absolute right-0 top-12 z-20 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                {canEdit && onEdit && (
                  <button
                    onClick={handleEdit}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                    Düzenle
                  </button>
                )}
                {canDelete && onDelete && (
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    Sil
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Personnel info */}
      <div className="pr-8">
        <h3 className="text-lg font-semibold text-gray-900">
          {capitalizeFirst(personnel.name)}
        </h3>
      </div>
    </div>
  );
}
