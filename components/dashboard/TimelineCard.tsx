'use client';

import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import { timeAgo } from '@/lib/utils/date';

interface Activity {
  id: string;
  type: 'note' | 'task' | 'analysis' | 'checklist';
  personnelId: string;
  personnelName: string;
  date: string;
  metadata?: {
    analysisType?: string;
    checklistTitle?: string;
    score?: number;
  };
}

interface TimelineCardProps {
  activities: Activity[];
}



function getActivityIcon(type: string): string {
  switch (type) {
    case 'note':
      return '📝';
    case 'task':
      return '✅';
    case 'analysis':
      return '🤖';
    case 'checklist':
      return '📋';
    default:
      return '📌';
  }
}

function getActivityText(activity: Activity): string {
  switch (activity.type) {
    case 'note':
      return `${activity.personnelName}'na not eklendi`;
    case 'task':
      return `${activity.personnelName} için görev tamamlandı`;
    case 'analysis':
      const analysisTypeMap: Record<string, string> = {
        yetkinlik: 'Yetkinlik',
        egilim: 'Eğilim',
        butunlesik: 'Bütünleşik',
      };
      const analysisType = activity.metadata?.analysisType
        ? analysisTypeMap[activity.metadata.analysisType] || activity.metadata.analysisType
        : '';
      return `${activity.personnelName} için ${analysisType} analizi oluşturuldu`;
    case 'checklist':
      const title = activity.metadata?.checklistTitle || 'Checklist';
      const scoreText = activity.metadata?.score !== undefined 
        ? ` (${activity.metadata.score.toFixed(2)}/5.00 Puan)` 
        : '';
      return `${activity.personnelName}'na ${title} atandı${scoreText}`;
    default:
      return 'Aktivite';
  }
}

export default function TimelineCard({ activities }: TimelineCardProps) {
  const router = useRouter();

  const handleActivityClick = (activity: Activity) => {
    router.push(`/personnel/${activity.personnelId}`);
  };

  return (
    <Card>
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
        🕐 <span className="hidden sm:inline">Son Hareketler</span><span className="sm:hidden">Hareketler</span>
      </h2>

      <div className="space-y-2">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Henüz aktivite yok</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={`${activity.type}-${activity.id}`}
              onClick={() => handleActivityClick(activity)}
              className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all active:scale-98 min-h-[44px]"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {getActivityText(activity)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {timeAgo(activity.date)}
                  </p>
                </div>
                <svg
                  className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1"
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
          ))
        )}
      </div>
    </Card>
  );
}
