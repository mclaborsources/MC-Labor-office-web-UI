interface DashboardRichTextProps {
  html: string;
  emptyMessage?: string;
}

/** Renders memo/HTML fields stored by Access (tblCompanyPolicies, SettingsBE). */
export function DashboardRichText({
  html,
  emptyMessage = "No text configured.",
}: DashboardRichTextProps) {
  if (!html.trim()) {
    return <p className="ac-dash-empty">{emptyMessage}</p>;
  }

  return (
    <div
      className="ac-rich-html"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
