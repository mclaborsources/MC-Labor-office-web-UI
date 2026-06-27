import Link from "next/link";
import { Fragment } from "react";
import { AccessButton } from "@/components/access/AccessButton";
import type { CustomerMenuResult } from "@/lib/customerMenu";
import {
  CUSTOMER_MENU_COLUMN_COUNT,
  gutterPercentAtRow,
  gutterRowCount,
  splitCustomerMenuColumns,
} from "@/lib/customerMenuLayout";

interface CustomerMenuScreenProps {
  menu: CustomerMenuResult;
  ipgCount: number;
  isgCount: number;
}

export function CustomerMenuScreen({
  menu,
  ipgCount,
  isgCount,
}: CustomerMenuScreenProps) {
  const weekQuery = `week=${menu.assignWeek}&year=${menu.assignYear}`;
  const columns = splitCustomerMenuColumns(menu.tiles, CUSTOMER_MENU_COLUMN_COUNT);

  return (
    <div className="ac-customer-menu-page flex min-h-0 flex-1 flex-col">
      <div className="ac-customer-menu-toolbar shrink-0">
        <div className="ac-customer-menu-toolbar-left">
          <span className="ac-customer-menu-placeholders">
            <span className="ac-customer-menu-placeholders-all">All</span> Placeholders:{" "}
            <strong>None</strong>
          </span>
        </div>
        <div className="ac-customer-menu-toolbar-center">
          <AccessButton xs disabled>
            Refresh from Tracking
          </AccessButton>
          <span className="ac-customer-menu-entity ac-customer-menu-entity--ipg">IPG {ipgCount}</span>
          <span className="ac-customer-menu-entity ac-customer-menu-entity--isg">ISG {isgCount}</span>
        </div>
        <div className="ac-customer-menu-toolbar-right">
          <AccessButton xs disabled>
            Reset Customer Colors
          </AccessButton>
        </div>
      </div>

      {menu.fallback && (
        <p className="ac-customer-menu-fallback shrink-0">
          No customers for week {menu.requestedWeek}/{menu.requestedYear} — showing week{" "}
          {menu.assignWeek}/{menu.assignYear}.
        </p>
      )}

      <div className="ac-customer-menu-board min-h-0 flex-1 overflow-auto">
        {menu.tiles.length === 0 ? (
          <div className="ac-empty-state ac-customer-menu-empty">
            <p>No customers found in tracking for week {menu.assignWeek}/{menu.assignYear}.</p>
            <p className="text-[11px] text-[#64748b]">
              Confirm SQL is connected and tblTracking has rows for this work week.
            </p>
          </div>
        ) : (
          <div className="ac-customer-menu-columns">
            {columns.map((column, columnIndex) => (
              <Fragment key={columnIndex}>
                <div className="ac-customer-menu-col">
                  {column.map((tile) => (
                    <Link
                      key={tile.customerId}
                      href={`/tracking?${weekQuery}&customerId=${tile.customerId}`}
                      className="ac-cust-tile ac-customer-menu-tile"
                      style={
                        tile.tileColor
                          ? { background: tile.tileColor, borderColor: tile.tileColor }
                          : undefined
                      }
                      title={`${tile.rowCount} assignment row(s)`}
                    >
                      <span
                        className="ac-cust-tile-badge"
                        style={{ background: tile.entityColor }}
                      >
                        {tile.entityCode}
                      </span>
                      <span className="ac-cust-tile-name">{tile.label}</span>
                    </Link>
                  ))}
                </div>

                {columnIndex < CUSTOMER_MENU_COLUMN_COUNT - 1 && (
                  <div className="ac-customer-menu-pct-rail" aria-hidden>
                    {Array.from({ length: gutterRowCount(columns, columnIndex) }, (_, rowIndex) => {
                      const pct = gutterPercentAtRow(columns, columnIndex, rowIndex);
                      return (
                        <span key={rowIndex} className="ac-customer-menu-pct">
                          {pct ?? ""}
                        </span>
                      );
                    })}
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
