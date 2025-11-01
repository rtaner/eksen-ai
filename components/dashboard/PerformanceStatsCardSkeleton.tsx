import Card from '@/components/ui/Card';

export default function PerformanceStatsCardSkeleton() {
  return (
    <Card>
      <div className="h-7 w-64 bg-gray-200 rounded animate-pulse mb-4" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-lg bg-gray-50 border border-gray-200">
            <div className="text-center">
              <div className="h-8 w-8 bg-gray-200 rounded mx-auto mb-2 animate-pulse" />
              <div className="h-8 w-16 bg-gray-200 rounded mx-auto mb-1 animate-pulse" />
              <div className="h-4 w-20 bg-gray-200 rounded mx-auto animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
