import Card from '@/components/ui/Card';

export default function TimelineCardSkeleton() {
  return (
    <Card>
      <div className="h-7 w-48 bg-gray-200 rounded animate-pulse mb-4" />

      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse flex-shrink-0" />
              <div className="flex-1">
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
