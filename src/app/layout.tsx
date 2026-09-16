import type { Metadata } from "next";
import { RouteLoadingIndicator } from "@/components/layout/RouteLoadingIndicator";
import "./globals.css";

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
        <RouteLoadingIndicator />
      </body>
    </html>
  );
}
