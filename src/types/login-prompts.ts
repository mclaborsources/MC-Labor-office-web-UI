export interface LoginPrompts {
  displayName: string;
  greeting: string;
  noteDate?: string;
  reasons: string[];
  showReminders: boolean;
  reminders: { id: number; item: string; days: number | null }[];
}
