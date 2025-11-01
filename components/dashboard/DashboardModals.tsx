'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import UncompletedTasksCard from './UncompletedTasksCard';
import PerformanceStatsCard from './PerformanceStatsCard';
import TimelineCard from './TimelineCard';

interface DashboardItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  count?: number;
}

interface DashboardModalsProps {
  item: DashboardItem;
  tasks: any[];
  stats: any;
  activities: any[];
}

export default function DashboardModals({
  item,
  tasks,
  stats,
  activities,
}: DashboardModalsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const renderModalContent = () => {
    switch (item.id) {
      case 'tasks':
        return <UncompletedTasksCard tasks={tasks} />;
      case 'performance':
        return <PerformanceStatsCard stats={stats} />;
      case 'timeline':
        return <TimelineCard activities={activities} />;
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
                {item.count !== undefined && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({item.count})
                  </span>
                )}
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
        size="xl"
      >
        <div className="max-h-[70vh] overflow-y-auto">
          {renderModalContent()}
        </div>
      </Modal>
    </>
  );
}
