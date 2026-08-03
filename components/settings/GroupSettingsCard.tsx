'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import GroupModal from '@/components/groups/GroupModal';

export default function GroupSettingsCard() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        <Card hover className="h-full cursor-pointer">
          <div className="flex items-start gap-4 p-1">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center bg-indigo-100 text-indigo-600 text-2xl">
              👥
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Grup ve Ekip Yönetimi
              </h3>
              <p className="text-sm text-gray-600">
                Personel grupları (Kasiyerler, Görsel Tasarımcılar vb.) oluşturun ve yönetin
              </p>
            </div>
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {isOpen && (
        <GroupModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
