interface DetailFieldProps {
  label: string;
  value?: string | null;
  span?: 1 | 2;
  mono?: boolean;
}

export function DetailField({ label, value, span = 1, mono = false }: DetailFieldProps) {
  const display = value && value.trim() !== "" ? value : "—";
  const isMissing = display === "—";

  return (
    <div className={span === 2 ? "col-span-2" : ""}>
      <dt className="text-xs font-medium text-slate-500 mb-0.5">{label}</dt>
      <dd
        className={`text-sm font-medium ${
          isMissing ? "text-slate-300" : "text-slate-800"
        } ${mono ? "font-mono" : ""}`}
      >
        {display}
      </dd>
    </div>
  );
}
