export default function ABTestDetailLoading() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <div className="h-10 w-24 rounded-md bg-gray-200 animate-pulse mr-4"></div>
        <div>
          <div className="h-8 w-64 rounded-md bg-gray-200 animate-pulse"></div>
          <div className="h-4 w-96 rounded-md bg-gray-200 animate-pulse mt-2"></div>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Test Overview Card */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex justify-between">
              <div className="h-5 w-32 rounded-md bg-gray-200 animate-pulse"></div>
              <div className="h-5 w-20 rounded-md bg-gray-200 animate-pulse"></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-24 rounded-md bg-gray-200 animate-pulse"></div>
                  <div className="h-4 w-32 rounded-md bg-gray-200 animate-pulse"></div>
                </div>
              ))}
            </div>
            <div className="h-10 w-48 rounded-md bg-gray-200 animate-pulse"></div>
          </div>
          
          {/* Variants Card */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="h-5 w-32 rounded-md bg-gray-200 animate-pulse"></div>
            <div className="h-4 w-64 rounded-md bg-gray-200 animate-pulse"></div>
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <div className="space-y-2">
                      <div className="h-5 w-32 rounded-md bg-gray-200 animate-pulse"></div>
                      <div className="h-4 w-48 rounded-md bg-gray-200 animate-pulse"></div>
                    </div>
                    <div className="h-8 w-20 rounded-md bg-gray-200 animate-pulse"></div>
                  </div>
                  <div className="h-16 w-full rounded-md bg-gray-200 animate-pulse"></div>
                  <div className="h-2 w-full rounded-full bg-gray-200 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Performance Card */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="h-5 w-32 rounded-md bg-gray-200 animate-pulse"></div>
            <div className="h-20 w-full rounded-md bg-gray-200 animate-pulse"></div>
          </div>
          
          {/* Campaign Details Card */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="h-5 w-40 rounded-md bg-gray-200 animate-pulse"></div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-24 rounded-md bg-gray-200 animate-pulse"></div>
                  <div className="h-4 w-40 rounded-md bg-gray-200 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Actions Card */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="h-5 w-24 rounded-md bg-gray-200 animate-pulse"></div>
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 w-full rounded-md bg-gray-200 animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 