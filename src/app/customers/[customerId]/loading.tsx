import { AppShell } from "@/components/layout/AppShell";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`mc-skeleton rounded ${className}`} />;
}

export default function CustomerDetailLoading() {
  return (
    <AppShell>
      <div className="mc-animate-in flex flex-col gap-4">
        <Skeleton className="h-9 w-64" />
        <div className="mb-1 flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-72" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="mc-panel p-4 flex flex-wrap gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-32 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="mc-panel p-5">
              <Skeleton className="h-4 w-40 mb-4" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j}>
                    <Skeleton className="h-3 w-20 mb-1" />
                    <Skeleton className="h-5 w-36" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mc-panel p-5">
          <Skeleton className="h-4 w-36 mb-4" />
          <div className="flex gap-6 mb-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-16" />
            ))}
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-6 py-3 border-b border-slate-100">
              {Array.from({ length: 6 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-16" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
