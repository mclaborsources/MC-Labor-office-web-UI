import type { Metadata } from "next";
import { Suspense } from "react";
import { RouteLoadingIndicator } from "@/components/layout/RouteLoadingIndicator";
import "./globals.css";
import { CustomerCellNavigation } from "@/components/customers/CustomerCellNavigation";
import { UnhandledRejectionDiagnostics } from "@/components/layout/UnhandledRejectionDiagnostics";
import { VisitSessionGuard } from "@/components/layout/VisitSessionGuard";
import { isOfficeStaffMode } from "@/lib/auth/mode";
import { TableColumnResizing } from "@/components/layout/TableColumnResizing";
import { ViewButtonToggleBehavior } from "@/components/layout/ViewButtonToggleBehavior";

export const metadata: Metadata = {
  title: "MC Labor — Office Portal",
  description: "MC Labor Access replacement — read-only Phase 1",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <VisitSessionGuard enabled={isOfficeStaffMode()}>{children}</VisitSessionGuard>
        <CustomerCellNavigation />
        <TableColumnResizing />
        <ViewButtonToggleBehavior />
        <UnhandledRejectionDiagnostics />
        <Suspense fallback={null}><RouteLoadingIndicator /></Suspense>
      </body>
    </html>
  );
}
