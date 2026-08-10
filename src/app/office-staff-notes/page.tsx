import { AppShell } from "@/components/layout/AppShell";
import { OfficeStaffNotesScreen } from "@/components/office-staff-notes/OfficeStaffNotesScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getOfficeStaffNotes } from "@/lib/officeStaffNotes";

export default async function OfficeStaffNotesPage() {
  const session = await getSessionOrDefault();
  let notes: Awaited<ReturnType<typeof getOfficeStaffNotes>> = [];
  let loadError = "";

  try {
    notes = await getOfficeStaffNotes();
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Unable to load office staff notes.";
  }

  return (
    <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth>
      <OfficeStaffNotesScreen notes={notes} loadError={loadError} />
    </AppShell>
  );
}
