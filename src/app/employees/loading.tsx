import { AppShell } from "@/components/layout/AppShell";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`mc-skeleton rounded ${className}`} />;
}

export default function EmployeesLoading() {
  return (
    <AppShell>
      <div className="mc-animate-in flex flex-col gap-4">
        {/* Page header skeleton */}
        <div className="mb-1 flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        {/* Filter bar skeleton */}
        <div className="mc-panel p-4 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="min-w-[140px]">
            <Skeleton className="h-4 w-12 mb-2" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="min-w-[140px]">
            <Skeleton className="h-4 w-14 mb-2" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
        {/* Table skeleton */}
        <div className="mc-panel overflow-hidden">
          <div className="bg-slate-800 px-4 py-3">
            <div className="flex gap-8">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-20 bg-slate-700" />
              ))}
            </div>
          </div>
          {Array.from({ length: 8 }).map((_, row) => (
            <div
              key={row}
              className={`flex gap-8 px-4 py-3 border-b border-slate-100 ${row % 2 ? "bg-slate-50/50" : ""}`}
            >
              {Array.from({ length: 7 }).map((_, col) => (
                <Skeleton key={col} className="h-4 w-20" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
