"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

type SavedWidths = { widths: number[]; id: string };
const saved = new Map<string, SavedWidths>();
let nextId = 0;

/** Delegated column-edge dragging also covers tables mounted after a fetch. */
export function TableColumnResizing() {
  const pathname = usePathname();
  useEffect(() => {
    const sheet = document.createElement("style");
    document.head.appendChild(sheet);
    let drag: { table: HTMLTableElement; index: number; x: number; widths: number[]; state: SavedWidths } | null = null;
    const attached = new Map<HTMLTableElement, SavedWidths>();
    let trackingWidths: Record<string,number> = {};
    try {
      const stored=JSON.parse(localStorage.getItem("tracking-shared-column-widths") ?? "{}");
      trackingWidths=Object.fromEntries(Object.entries(stored).filter(([,value])=>typeof value === "number" && Number.isFinite(value) && value>=32 && value<=2000)) as Record<string,number>;
    } catch { /* Width persistence is optional. */ }
    const signatures=new WeakMap<HTMLTableElement,string>();
    function trackingKeys(table:HTMLTableElement) {
      return Array.from(table.querySelectorAll<HTMLTableColElement>(":scope > colgroup > col")).map(col=>col.dataset.columnKey ?? "");
    }

    function tableKey(table: HTMLTableElement) {
      const tables = Array.from(document.querySelectorAll("table"));
      const headers = Array.from(table.tHead?.rows ?? []).map(row => Array.from(row.cells).map(cell => cell.textContent?.trim()).join("|")).join(";");
      return `${pathname}:${tables.indexOf(table)}:${headers}`;
    }
    function headerColumns(table: HTMLTableElement) {
      const occupied: boolean[][] = [];
      const cells: { cell: HTMLTableCellElement; start: number; span: number; row: number; index: number }[] = [];
      Array.from(table.tHead?.rows ?? []).forEach((row, r) => {
        occupied[r] ??= [];
        let column = 0;
        Array.from(row.cells).forEach((cell, index) => {
          while (occupied[r][column]) column++;
          cells.push({ cell, start: column, span: cell.colSpan, row: r, index });
          for (let y = r; y < r + cell.rowSpan; y++) {
            occupied[y] ??= [];
            for (let x = column; x < column + cell.colSpan; x++) occupied[y][x] = true;
          }
          column += cell.colSpan;
        });
      });
      return cells;
    }
    function renderStyles() {
      sheet.textContent = Array.from(attached.entries()).map(([table, { id, widths }]) => {
        const selector = `table[data-column-resize-id="${id}"]`;
        return `${selector}{table-layout:fixed!important;width:${widths.reduce((a, b) => a + b, 0)}px!important;min-width:${widths.reduce((a, b) => a + b, 0)}px!important;max-width:none!important}` +
          widths.map((width, index) => `${selector}>colgroup>col:nth-child(${index + 1}){width:${width}px!important;min-width:0!important}`).join("") +
          headerColumns(table).map(({ start, span, row, index }) => `${selector}>thead>tr:nth-child(${row + 1})>:nth-child(${index + 1}){width:${widths.slice(start, start + span).reduce((a,b)=>a+b,0)}px!important;min-width:0!important;box-sizing:border-box}`).join("") +
          `${selector} th,${selector} td{overflow:hidden;text-overflow:ellipsis}`;
      }).join("\n");
    }
    function restore() {
      let changed = false;
      for (const table of attached.keys()) if (!table.isConnected) { attached.delete(table); changed = true; }
      document.querySelectorAll<HTMLTableElement>("table").forEach(table => {
        if(table.dataset.sharedWidths === "tracking") {
          const keys=trackingKeys(table), signature=JSON.stringify(keys);
          if(attached.has(table) && signatures.get(table)===signature)return;
          signatures.set(table,signature);
          const cols=Array.from(table.querySelectorAll<HTMLTableColElement>(":scope > colgroup > col"));
          const widths=keys.map((key,index)=>trackingWidths[key] ?? (Number.parseFloat(cols[index].style.width)||80));
          if(keys.some(key=>trackingWidths[key]!==undefined)) {
            const state={id:`resize-${++nextId}`,widths};
            table.dataset.columnResizeId=state.id; attached.set(table,state); changed=true;
          } else if(attached.delete(table)) {delete table.dataset.columnResizeId; changed=true;}
          return;
        }
        if (attached.has(table)) return;
        const state = saved.get(tableKey(table));
        if (state) { table.dataset.columnResizeId = state.id; attached.set(table, state); changed = true; }
      });
      if (changed) renderStyles();
    }
    function edge(event: MouseEvent) {
      if (!(event.target instanceof Element)) return null;
      const cell = event.target.closest<HTMLTableCellElement>("th");
      const table = cell?.closest("table");
      if (!cell || !table || !table.tHead?.contains(cell)) return null;
      if (cell.querySelector(' [role="separator"][aria-label^="Resize "]')) return null;
      const columns = headerColumns(table);
      const column = columns.find(item => item.cell === cell);
      if (!column) return null;
      const rect = cell.getBoundingClientRect();
      if (Math.abs(event.clientX - rect.right) > 6) return null;
      return { cell, table, columns, column };
    }
    function move(event: PointerEvent) {
      if (drag) {
        const widths = [...drag.widths];
        widths[drag.index] = Math.max(32, Math.min(2000, Math.round(drag.widths[drag.index] + event.clientX - drag.x)));
        drag.state.widths = widths;
        renderStyles();
      } else document.documentElement.classList.toggle("mc-column-edge", !!edge(event));
    }
    function down(event: PointerEvent) {
      if (event.button !== 0) return;
      const target = edge(event);
      if (!target) return;
      event.preventDefault(); event.stopPropagation();
      const { table, columns, column } = target;
      const count = Math.max(...columns.map(item => item.start + item.span));
      const widths = Array<number>(count).fill(80);
      for (const item of [...columns].sort((a,b) => b.span - a.span)) {
        const width = item.cell.getBoundingClientRect().width / item.span;
        for (let i = item.start; i < item.start + item.span; i++) widths[i] = width;
      }
      const state = attached.get(table) ?? { id: `resize-${++nextId}`, widths };
      state.widths = widths;
      attached.set(table, state); saved.set(tableKey(table), state);
      table.dataset.columnResizeId = state.id;
      drag = { table, index: column.start + column.span - 1, x: event.clientX, widths, state };
      document.documentElement.classList.add("mc-column-dragging");
      renderStyles();
    }
    function end() {
      if(drag?.table.dataset.sharedWidths === "tracking") {
        const key=trackingKeys(drag.table)[drag.index];
        if(key) {
          trackingWidths[key]=drag.state.widths[drag.index];
          try {localStorage.setItem("tracking-shared-column-widths",JSON.stringify(trackingWidths));} catch { /* Keep session widths. */ }
          for(const table of attached.keys())if(table.dataset.sharedWidths === "tracking") {attached.delete(table); signatures.delete(table);}
          restore();
        }
      }
      drag = null;
      document.documentElement.classList.remove("mc-column-dragging", "mc-column-edge");
    }
    function click(event: MouseEvent) { if (edge(event)) { event.preventDefault(); event.stopPropagation(); } }
    function reset(event: MouseEvent) {
      const target = edge(event);
      if (!target) return;
      event.preventDefault(); event.stopPropagation();
      if(target.table.dataset.sharedWidths === "tracking") {
        delete trackingWidths[trackingKeys(target.table)[target.column.start]];
        try {localStorage.setItem("tracking-shared-column-widths",JSON.stringify(trackingWidths));} catch { /* Keep session widths. */ }
        signatures.delete(target.table);
      }
      saved.delete(tableKey(target.table)); attached.delete(target.table);
      delete target.table.dataset.columnResizeId;
      drag=null; renderStyles(); end(); restore();
    }
    restore();
    const observer = new MutationObserver(restore);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerdown", down, true);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    window.addEventListener("blur", end);
    document.addEventListener("click", click, true);
    document.addEventListener("dblclick", reset, true);
    return () => {
      observer.disconnect(); sheet.remove(); end();
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerdown", down, true);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      window.removeEventListener("blur", end);
      document.removeEventListener("click", click, true);
      document.removeEventListener("dblclick", reset, true);
    };
  }, [pathname]);
  return null;
}
