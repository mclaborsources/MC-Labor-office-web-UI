import assert from "node:assert/strict";
import { test } from "node:test";
import { clockSeconds, officeClock, loginNoteDecision } from "./login-prompts";

test("login prompts use New York office time across daylight saving changes", () => {
  assert.equal(officeClock(new Date("2026-10-20T12:00:00Z")).seconds, 8 * 3600);
  assert.equal(officeClock(new Date("2026-12-20T13:00:00Z")).seconds, 8 * 3600);
  assert.equal(officeClock(new Date("2026-10-21T02:00:00Z")).date, "2026-10-20");
});
test("late notes follow the Access 8AM cutoff, configured window and daily-note check", () => {
  const decide = (seconds: number, exists = false) => loginNoteDecision(seconds, 6 * 3600, 18 * 3600, exists);
  assert.equal(decide(5 * 3600), "none");
  assert.equal(decide(8 * 3600), "early");
  assert.equal(decide(8 * 3600 + 1), "late");
  assert.equal(decide(18 * 3600), "late");
  assert.equal(decide(18 * 3600 + 1), "none");
  assert.equal(decide(12 * 3600, true), "none");
});
test("configured login times accept Access AM/PM and 24-hour formats", () => {
  assert.equal(clockSeconds("6:00 AM", 0), 21600);
  assert.equal(clockSeconds("6:00:00 PM", 0), 64800);
  assert.equal(clockSeconds("12:00 AM", -1), 0);
  assert.equal(clockSeconds("18:30", 0), 66600);
  assert.equal(clockSeconds(null, 21600), 21600);
});
