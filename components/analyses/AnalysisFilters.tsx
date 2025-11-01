'use client';

import { AnalysisType } from '@/lib/types/analyses';
import Card from '@/components/ui/Card';

interface AnalysisFiltersProps {
  filters: {
    personnelId: string;
    analysisType: AnalysisType | '';
  };
  onFiltersChange: (filters: any) => void;
  personnel: { id: string; name: string }[];
  stats: {
    total: number;
    yetkinlik: number;
    egilim: number;
    butunlesik: number;
  };
}

export default function AnalysisFilters({
  filters,
  onFiltersChange,
  personnel,
  stats,
}: AnalysisFiltersProps) {
  const handlePersonnelChange = (value: string) => {
    onFiltersChange({ ...filters, personnelId: value });
  };

  const handleAnalysisTypeChange = (value: AnalysisType | '') => {
    onFiltersChange({ ...filters, analysisType: value });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      personnelId: '',
      analysisType: '',
    });
  };

  const hasActiveFilters = filters.personnelId || filters.analysisType;

  const analysisTypeButtons = [
    { value: '', label: 'Tümü', count: stats.total, color: 'blue' },
    { value: 'yetkinlik', label: 'Yetkinlik', count: stats.yetkinlik, color: 'green' },
    { value: 'egilim', label: 'Eğilim', count: stats.egilim, color: 'purple' },
    { value: 'butunlesik', label: 'Bütünleşik', count: stats.butunlesik, color: 'orange' },
  ];

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filtreler</h3>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Temizle
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Personnel Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Personel
          </label>
          <select
            value={filters.personnelId}
            onChange={(e) => handlePersonnelChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tümü</option>
            {personnel.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Analysis Type Filter - Button Style */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Analiz Tipi
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {analysisTypeButtons.map((btn) => {
              const isActive = filters.analysisType === btn.value;
              const colorClasses = {
                blue: isActive
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50',
                green: isActive
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-green-600 border-green-300 hover:bg-green-50',
                purple: isActive
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-purple-600 border-purple-300 hover:bg-purple-50',
                orange: isActive
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'bg-white text-orange-600 border-orange-300 hover:bg-orange-50',
              };

              return (
                <button
                  key={btn.value}
                  onClick={() => handleAnalysisTypeChange(btn.value as AnalysisType | '')}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    colorClasses[btn.color as keyof typeof colorClasses]
                  }`}
                >
                  <div className="text-2xl font-bold">{btn.count}</div>
                  <div className="text-xs font-medium mt-1">{btn.label}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
