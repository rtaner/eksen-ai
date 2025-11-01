import Card from '@/components/ui/Card';

export default function UncompletedTasksCardSkeleton() {
  return (
    <Card>
      <div className="mb-4">
        <div className="h-7 w-64 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="flex gap-2 border-b border-gray-200">
          <div className="h-9 w-32 bg-gray-200 rounded-t animate-pulse" />
          <div className="h-9 w-32 bg-gray-200 rounded-t animate-pulse" />
        </div>
      </div>

      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="flex gap-3">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
