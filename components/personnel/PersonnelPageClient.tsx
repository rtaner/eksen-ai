'use client';

import { useState } from 'react';
import { Personnel } from '@/lib/types';
import FeedComposer from '@/components/feed/FeedComposer';
import SocialFeedStream from '@/components/feed/SocialFeedStream';

interface PersonnelPageClientProps {
  initialPersonnel: Personnel[];
}

export default function PersonnelPageClient({
  initialPersonnel,
}: PersonnelPageClientProps) {
  const [personnel] = useState<Personnel[]>(initialPersonnel);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefreshStream = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Quick Post Composer */}
      <FeedComposer
        personnelList={personnel}
        onPostSuccess={handleRefreshStream}
      />

      {/* Social Stream */}
      <SocialFeedStream
        personnelList={personnel}
        refreshTrigger={refreshTrigger}
        onRefresh={handleRefreshStream}
      />
    </div>
  );
}
