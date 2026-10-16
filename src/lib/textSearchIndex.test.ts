import assert from "node:assert/strict";
import test from "node:test";
import { buildTextSearchIndex, searchTextIndex } from "./textSearchIndex";

test("trigram search returns case-insensitive substring matches in source order", () => {
  const index = buildTextSearchIndex([
    ["Aelson Luon", "781-555-1234"],
    ["Ray Mc Veigh", "617-555-0000"],
    ["McVeigh Labor", ""],
  ]);

  assert.deepEqual(searchTextIndex(index, "MC V"), [1]);
  assert.deepEqual(searchTextIndex(index, "555"), [0, 1]);
  assert.deepEqual(searchTextIndex(index, "x"), []);
});

test("short searches and empty searches preserve expected behavior", () => {
  const index = buildTextSearchIndex([["Ray Mc Veigh"], ["Mary Ray"], [""]]);
  assert.deepEqual(searchTextIndex(index, "ra"), [0, 1]);
  assert.deepEqual(searchTextIndex(index, ""), [0, 1, 2]);
});
