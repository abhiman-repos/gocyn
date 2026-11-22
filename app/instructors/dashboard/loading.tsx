export default function DashboardLoading() {
  return (
    <div className="w-full space-y-6">
      
      {/* Page Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700"></div>
          <div className="h-4 w-64 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700"></div>
        </div>
        <div className="h-10 w-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"></div>
      </div>

      {/* 3-Column Stat Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-600"></div>
                <div className="h-6 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-600"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content/Table Skeleton */}
      <div className="mt-8 rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-800">
        <div className="border-b border-gray-100 p-6 dark:border-gray-700">
          <div className="h-6 w-1/4 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700"></div>
        </div>
        <div className="p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-4 w-1/2">
                <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"></div>
                <div className="space-y-2 w-full">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-600"></div>
                  <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100 dark:bg-gray-700"></div>
                </div>
              </div>
              <div className="h-8 w-24 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700"></div>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}