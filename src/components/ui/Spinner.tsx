interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
}

const sizes = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function Spinner({ size = "md", label = "Loading…" }: SpinnerProps) {
  return (
    <div className="flex items-center justify-center gap-3 text-slate-500 py-12">
      <span
        className={`${sizes[size]} animate-spin rounded-full border-2 border-slate-200 border-t-blue-600`}
        aria-hidden
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}
