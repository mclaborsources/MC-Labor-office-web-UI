import type { CustomerMenuTile } from "@/lib/customerMenu";

export const CUSTOMER_MENU_COLUMN_COUNT = 6;

/** Split customers down columns (column-major), matching Access fill order. */
export function splitCustomerMenuColumns(
  tiles: CustomerMenuTile[],
  columnCount = CUSTOMER_MENU_COLUMN_COUNT,
): CustomerMenuTile[][] {
  const columns: CustomerMenuTile[][] = Array.from({ length: columnCount }, () => []);
  if (tiles.length === 0) return columns;

  const base = Math.floor(tiles.length / columnCount);
  const extra = tiles.length % columnCount;
  let index = 0;

  for (let c = 0; c < columnCount; c++) {
    const size = base + (c < extra ? 1 : 0);
    columns[c] = tiles.slice(index, index + size);
    index += size;
  }

  return columns;
}

function tileWeight(tile: CustomerMenuTile): number {
  return tile.rowCount > 0 ? tile.rowCount : 1;
}

function columnWeight(column: CustomerMenuTile[]): number {
  return column.reduce((sum, tile) => sum + tileWeight(tile), 0);
}

/** Cumulative assignment % at each row in the gutter after `columnIndex`. */
export function gutterPercentAtRow(
  columns: CustomerMenuTile[][],
  columnIndex: number,
  rowIndex: number,
): string | null {
  const column = columns[columnIndex];
  if (!column || rowIndex >= column.length) return null;

  const totalWeight =
    columns.reduce((sum, col) => sum + columnWeight(col), 0) || columns.flat().length;

  let weight = 0;
  for (let c = 0; c < columnIndex; c++) {
    weight += columnWeight(columns[c]);
  }
  for (let r = 0; r <= rowIndex; r++) {
    weight += tileWeight(column[r]);
  }

  return `${((weight / totalWeight) * 100).toFixed(2)}%`;
}

export function gutterRowCount(columns: CustomerMenuTile[][], columnIndex: number): number {
  const left = columns[columnIndex]?.length ?? 0;
  const right = columns[columnIndex + 1]?.length ?? 0;
  return Math.max(left, right);
}
