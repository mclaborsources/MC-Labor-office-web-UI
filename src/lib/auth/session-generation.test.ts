import assert from "node:assert/strict";
import test from "node:test";
import { currentSessionGeneration, sessionGenerationMatches } from "./session-generation";

test("old cookies and cookies from a previous server launch require a new login", () => {
  const previous = process.env.MC_LABOR_SESSION_GENERATION;
  try {
    process.env.MC_LABOR_SESSION_GENERATION = "launch-one";
    assert.equal(sessionGenerationMatches(undefined), false);
    assert.equal(sessionGenerationMatches("legacy-session"), false);
    const generation = currentSessionGeneration();
    assert.equal(sessionGenerationMatches(generation), true);
    process.env.MC_LABOR_SESSION_GENERATION = "launch-two";
    assert.equal(sessionGenerationMatches(generation), false);
    assert.equal(sessionGenerationMatches("launch-two"), true);
    delete process.env.MC_LABOR_SESSION_GENERATION;
    assert.equal(sessionGenerationMatches(undefined), false);
    assert.equal(sessionGenerationMatches(currentSessionGeneration()), true);
  } finally {
    if (previous === undefined) delete process.env.MC_LABOR_SESSION_GENERATION;
    else process.env.MC_LABOR_SESSION_GENERATION = previous;
  }
});
