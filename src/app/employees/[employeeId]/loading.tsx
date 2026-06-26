import { AppShell } from "@/components/layout/AppShell";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`mc-skeleton rounded ${className}`} />;
}

export default function EmployeeDetailLoading() {
  return (
    <AppShell>
      <div className="mc-animate-in flex flex-col gap-4">
        <Skeleton className="h-9 w-56" />
        <div className="mb-1 flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="mc-panel p-4 flex flex-wrap gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-28 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="mc-panel p-5">
            <Skeleton className="h-4 w-40 mb-4" />
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-3 w-20 mb-1" />
                  <Skeleton className="h-5 w-32" />
                </div>
              ))}
            </div>
          </div>
          <div className="mc-panel p-5">
            <Skeleton className="h-4 w-24 mb-4" />
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-3 w-20 mb-1" />
                  <Skeleton className="h-5 w-40" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
