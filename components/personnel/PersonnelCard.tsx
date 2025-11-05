'use client';

import { useRouter } from 'next/navigation';
import { Personnel } from '@/lib/types';
import { capitalizeFirst } from '@/lib/utils/textFormat';

interface PersonnelCardProps {
  personnel: Personnel;
}

export default function PersonnelCard({ personnel }: PersonnelCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/personnel/${personnel.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="p-4 border-2 border-gray-200 bg-white rounded-lg hover:shadow-lg transition-all cursor-pointer"
    >
      <h3 className="text-lg font-semibold text-gray-900">
        {capitalizeFirst(personnel.name)}
      </h3>
    </div>
  );
}
