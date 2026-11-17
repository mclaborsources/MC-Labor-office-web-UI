# UI conventions

For every new table page and whenever updating an existing table footer, use `src/components/tables/TableRecordBar.tsx`. The user requires the compact Access-style footer: Record label, disabled navigation for empty tables, blank record box, filter indicator, small Search field, and horizontal scrollbar on one 19px row directly under the grid. Keep the footer outside the scrollable grid; its immediate previous sibling must be the scrollable grid container so horizontal scrolling stays synchronized. Apply this standard to future report items too.
