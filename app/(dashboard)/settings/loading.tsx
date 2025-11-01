import Card from '@/components/ui/Card';

export default function Loading() {
  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <div className="h-8 sm:h-10 bg-gray-200 rounded w-32 mb-2 animate-pulse" />
        <div className="h-4 sm:h-5 bg-gray-200 rounded w-64 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Loading skeletons for 7 cards */}
        {[...Array(7)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-lg" />
              <div className="flex-1 min-w-0">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-full" />
              </div>
              <div className="flex-shrink-0 w-5 h-5 bg-gray-200 rounded" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
