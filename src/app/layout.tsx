import type { Metadata } from "next";
import { RouteLoadingIndicator } from "@/components/layout/RouteLoadingIndicator";
import "./globals.css";
import { CustomerCellNavigation } from "@/components/customers/CustomerCellNavigation";
import { UnhandledRejectionDiagnostics } from "@/components/layout/UnhandledRejectionDiagnostics";

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
        {children}
        <CustomerCellNavigation />
        <UnhandledRejectionDiagnostics />
        <RouteLoadingIndicator />
      </body>
    </html>
  );
}
