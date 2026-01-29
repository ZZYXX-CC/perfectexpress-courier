import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import LiveChat from "@/components/LiveChat";
import RouteLoadingIndicator from "@/components/RouteLoadingIndicator";

export const metadata: Metadata = {
  title: "Perfectexpress Courier",
  description: "Premium shipping and tracking solution",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className="antialiased bg-background text-foreground min-h-screen font-sans"
      >
        <Suspense fallback={null}>
          <RouteLoadingIndicator />
        </Suspense>
        {children}
        <Toaster />
        <LiveChat />
      </body>
    </html>
  );
}
