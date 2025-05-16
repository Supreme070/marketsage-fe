export default function ABTestingLoading() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 space-y-2">
        <div className="h-8 w-64 rounded-md bg-gray-200 animate-pulse"></div>
        <div className="h-4 w-96 rounded-md bg-gray-200 animate-pulse"></div>
      </div>
      
      <div className="flex justify-between mb-6">
        <div className="space-y-2">
          <div className="h-10 w-32 rounded-md bg-gray-200 animate-pulse"></div>
        </div>
        <div className="h-10 w-32 rounded-md bg-gray-200 animate-pulse"></div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <div className="h-5 w-40 rounded-md bg-gray-200 animate-pulse"></div>
              <div className="h-5 w-16 rounded-md bg-gray-200 animate-pulse"></div>
            </div>
            <div className="h-4 w-full rounded-md bg-gray-200 animate-pulse"></div>
            <div className="h-4 w-32 rounded-md bg-gray-200 animate-pulse"></div>
            <div className="flex justify-between">
              <div className="h-4 w-24 rounded-md bg-gray-200 animate-pulse"></div>
              <div className="h-8 w-24 rounded-md bg-gray-200 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 