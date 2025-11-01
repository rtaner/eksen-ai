'use client';

import Card from '@/components/ui/Card';
import { formatNumber, getSentimentColor, getRatingColor } from '@/lib/utils/stats';

interface PerformanceStats {
  notesCount: number;
  completedTasksCount: number;
  positiveRatio: number; // 0-100
  averageRating: number; // 0-5
}

interface PerformanceStatsCardProps {
  stats: PerformanceStats;
}

export default function PerformanceStatsCard({ stats }: PerformanceStatsCardProps) {
  const statItems = [
    {
      icon: '📝',
      label: 'Eklenen Notlar',
      value: formatNumber(stats.notesCount),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: '✅',
      label: 'Tamamlanan Görevler',
      value: formatNumber(stats.completedTasksCount),
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: '😊',
      label: 'Olumlu Oran',
      value: `${Math.round(stats.positiveRatio)}%`,
      color: getSentimentColor(stats.positiveRatio),
      bgColor: 'bg-purple-50',
    },
    {
      icon: '⭐',
      label: 'Ortalama Puan',
      value: stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'Veri yok',
      color: stats.averageRating > 0 ? getRatingColor(stats.averageRating) : 'text-gray-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <Card>
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
        📊 <span className="hidden sm:inline">Performans Özeti (Son 7 Gün)</span><span className="sm:hidden">Performans</span>
      </h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((item, index) => (
          <div
            key={index}
            className={`p-3 sm:p-4 rounded-lg ${item.bgColor} border border-gray-200`}
          >
            <div className="text-center">
              <div className="text-2xl sm:text-3xl mb-2">{item.icon}</div>
              <div className={`text-xl sm:text-2xl font-bold ${item.color} mb-1`}>
                {item.value}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 font-medium">
                {item.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
