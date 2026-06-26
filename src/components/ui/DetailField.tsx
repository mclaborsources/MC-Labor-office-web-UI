interface DetailFieldProps {
  label: string;
  value?: string | null;
  span?: 1 | 2;
  mono?: boolean;
}

function isPhone(v: string): boolean {
  return /^[\d(+]/.test(v) && /\d{3}/.test(v);
}

function isEmail(v: string): boolean {
  return v.includes("@") && v.includes(".");
}

export function DetailField({ label, value, span = 1, mono = false }: DetailFieldProps) {
  const display = value && value.trim() !== "" ? value : "—";
  const isMissing = display === "—";

  let content: React.ReactNode = display;
  if (!isMissing) {
    if (isEmail(display)) {
      content = (
        <a href={`mailto:${display}`} className="text-blue-700 hover:underline">
          {display}
        </a>
      );
    } else if (isPhone(display)) {
      content = (
        <a href={`tel:${display}`} className="text-blue-700 hover:underline">
          {display}
        </a>
      );
    }
  }

  return (
    <div className={span === 2 ? "col-span-2" : ""}>
      <dt className="text-xs font-medium text-slate-500 mb-0.5">{label}</dt>
      <dd
        className={`text-sm font-medium ${
          isMissing ? "text-slate-300" : "text-slate-800"
        } ${mono ? "font-mono" : ""}`}
      >
        {content}
      </dd>
    </div>
  );
}
