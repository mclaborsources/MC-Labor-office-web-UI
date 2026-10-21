/** A launcher restart invalidates cookies without changing database encryption keys. */
export function currentSessionGeneration(): string {
  return process.env.MC_LABOR_SESSION_GENERATION || "office-login-v2";
}

export function sessionGenerationMatches(generation: string | undefined): boolean {
  return generation === currentSessionGeneration();
}
