"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessButton } from "@/components/access/AccessButton";
import type { OfficeStaffNoteRow } from "@/types/officeStaffNotes";

type NoteFilter = "incomplete" | "complete" | "all";

const CALCULATOR_FIELDS = [
  "Site State", "Contract With", "Wcc Desc", "Wcc Tracking¹", "Pay Rate", "Health²",
  "Travel", "Vacation", "Sick Time", "Other 2", "Schooling", "Tools", "Per Diem",
  "Spare 2", "Parking", "Weekly Per Diem", "Bill Rate Reg Hr", "Margin %", "Margin $",
  "Markup", "Hrs Vac", "Wk Hrs = 1 Hr Vac",
];

function MarginCalculator({ number }: { number: number }) {
  return (
    <section className="ac-margin-calc">
      <div className="ac-margin-calc-title">
        <h2>Margin Calculator {number}</h2>
        <AccessButton>Clear</AccessButton>
        <AccessButton className="ac-margin-adjust">+</AccessButton>
        <AccessButton className="ac-margin-adjust">-</AccessButton>
      </div>
      <div className="ac-margin-calc-grid">
        {CALCULATOR_FIELDS.map((field) => (
          <label key={field} className={field === "Wcc Desc" ? "ac-margin-wide" : ""}>
            <span className={field.startsWith("Margin") ? "ac-margin-red" : ""}>{field}</span>
            {field === "Site State" || field === "Contract With" || field === "Wcc Desc" ? (
              <select aria-label={`${field} calculator ${number}`} defaultValue=""><option value="" /></select>
            ) : (
              <input
                aria-label={`${field} calculator ${number}`}
                className={field === "Pay Rate" || field === "Bill Rate Reg Hr" ? "ac-margin-yellow" : ""}
              />
            )}
          </label>
        ))}
      </div>
    </section>
  );
}

export function OfficeStaffNotesScreen({ notes, loadError }: { notes: OfficeStaffNoteRow[]; loadError?: string }) {
  const router = useRouter();
  const [filter, setFilter] = useState<NoteFilter>("incomplete");
  const visibleNotes = useMemo(() => notes.filter((note) =>
    filter === "all" || (filter === "complete" ? note.completed : !note.completed),
  ), [filter, notes]);

  return (
    <main className="ac-office-notes-page">
      <AccessButton
        className="ac-office-notes-close"
        aria-label="Close Office Staff Notes"
        onClick={() => router.push("/tracking")}
      >
        Close
      </AccessButton>
      <div className="ac-office-notes-calculators">
        {[1, 2, 3].map((number) => <MarginCalculator key={number} number={number} />)}
      </div>
      <p className="ac-office-note-help">¹ Double-click the WCC Tracking text box to edit the list of Wcc values (requires permissions).</p>
      <p className="ac-office-note-help">² Double-click the Health text box to launch the Health Insurance Calculator.</p>

      <header className="ac-office-notes-header">
        <h1>Office Staff Notes</h1>
        <fieldset>
          <legend>Show:</legend>
          {(["incomplete", "complete", "all"] as const).map((value) => (
            <label key={value}><input type="radio" name="note-filter" checked={filter === value} onChange={() => setFilter(value)} /> {value[0].toUpperCase() + value.slice(1)}</label>
          ))}
        </fieldset>
        <AccessButton onClick={() => window.location.reload()}>Refresh</AccessButton>
      </header>

      {loadError && <div className="ac-office-notes-error">Database error: {loadError}</div>}
      <div className="ac-office-notes-table-wrap">
        <table className="ac-office-notes-table">
          <thead><tr><th>Note</th><th>From</th><th>To</th><th>Created At</th><th>Completed</th><th>Completed By</th><th>Completed At</th></tr></thead>
          <tbody>
            {visibleNotes.map((note) => (
              <tr key={note.id}>
                <td>{note.note}</td><td>{note.from}</td><td>{note.to}</td><td>{note.createdAt}</td>
                <td className="text-center"><input type="checkbox" checked={note.completed} readOnly aria-label={`Completed: ${note.note}`} /></td>
                <td>{note.completedBy}</td><td>{note.completedAt}</td>
              </tr>
            ))}
            {!loadError && visibleNotes.length === 0 && <tr><td colSpan={7} className="ac-office-notes-empty">No {filter === "all" ? "" : `${filter} `}office staff notes found.</td></tr>}
          </tbody>
        </table>
      </div>
    </main>
  );
}
