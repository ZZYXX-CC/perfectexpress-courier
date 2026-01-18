import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

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
        {children}
        <Toaster />
      </body>
    </html>
  );
}
