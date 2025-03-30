export function ResultsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"></div>

      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-lg shadow overflow-hidden p-6 animate-pulse"
        >
          <div className="h-7 w-3/4 bg-gray-200 rounded mb-3"></div>
          <div className="h-4 w-1/2 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2 mb-4">
            <div className="h-4 w-full bg-gray-200 rounded"></div>
            <div className="h-4 w-full bg-gray-200 rounded"></div>
            <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
          </div>
          <div className="h-10 w-40 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  );
}
