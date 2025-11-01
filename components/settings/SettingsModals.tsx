'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import OrganizationSettingsForm from '@/components/organization/OrganizationSettingsForm';

interface SettingsItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
}

interface SettingsModalsProps {
  item: SettingsItem;
}

export default function SettingsModals({ item }: SettingsModalsProps) {
  const [isOpen, setIsOpen] = useState(false);

  // If item has href, it's a link (not modal)
  if (item.href) {
    return null; // Will be handled by Link in parent
  }

  const renderModalContent = () => {
    switch (item.id) {
      case 'organization':
        return <OrganizationSettingsForm />;
      default:
        return null;
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="text-left w-full min-h-[44px]">
        <Card hover className="h-full">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {item.title}
              </h3>
              <p className="text-sm text-gray-600">{item.description}</p>
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
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={item.title}
        size="lg"
      >
        {renderModalContent()}
      </Modal>
    </>
  );
}
