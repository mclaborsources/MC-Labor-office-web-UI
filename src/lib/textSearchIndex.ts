/** Small in-memory substring index for repeated searches over cached report/list rows. */
export interface TextSearchIndex {
  fields: string[][];
  postings: Map<string, number[]>;
}

function trigrams(value: string): string[] {
  if (value.length < 3) return [];
  const grams = new Set<string>();
  for (let index = 0; index <= value.length - 3; index += 1) grams.add(value.slice(index, index + 3));
  return [...grams];
}

export function buildTextSearchIndex(fields: string[][]): TextSearchIndex {
  const postings = new Map<string, number[]>();
  fields.forEach((rowFields, rowIndex) => {
    const uniqueGrams = new Set(rowFields.flatMap((field) => trigrams(field.toLocaleLowerCase())));
    for (const gram of uniqueGrams) {
      const rows = postings.get(gram);
      if (rows) rows.push(rowIndex);
      else postings.set(gram, [rowIndex]);
    }
  });
  return { fields, postings };
}

/** Returns original row indexes, preserving source ordering and substring semantics. */
export function searchTextIndex(index: TextSearchIndex, queryText: string): number[] {
  const query = queryText.trim().toLocaleLowerCase();
  if (!query) return index.fields.map((_, rowIndex) => rowIndex);

  const grams = trigrams(query);
  let candidates: number[];
  if (!grams.length) {
    candidates = index.fields.map((_, rowIndex) => rowIndex);
  } else {
    const lists = grams.map((gram) => index.postings.get(gram));
    if (lists.some((list) => !list)) return [];
    const available = lists.filter((list): list is number[] => list !== undefined);
    const shortest = available.reduce((best, list) => list.length < best.length ? list : best, available[0]!);
    const sets = available.filter((list) => list !== shortest).map((list) => new Set(list));
    candidates = shortest.filter((rowIndex) => sets.every((set) => set.has(rowIndex)));
  }

  return candidates.filter((rowIndex) => index.fields[rowIndex].some((field) => field.toLocaleLowerCase().includes(query)));
}
