import { AppShell } from "@/components/layout/AppShell";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`mc-skeleton rounded ${className}`} />;
}

export default function DashboardLoading() {
  return (
    <AppShell>
      <div className="mc-animate-in">
        <div className="mb-5 flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="mc-panel p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <Skeleton className="h-11 w-11 rounded-xl" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <div>
                <Skeleton className="h-5 w-28 mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
