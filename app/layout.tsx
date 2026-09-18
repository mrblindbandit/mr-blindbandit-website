import type { Metadata } from "next";
import "./globals.css";
import {ClerkProvider} from '@clerk/nextjs';

export const metadata: Metadata = {
  title: "Mr. Blindbandit",
  description: "The official Mr. Blindbandit artist and label website.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/assets/favicon.svg",
    shortcut: "/assets/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased"><ClerkProvider>{children}</ClerkProvider></body>
    </html>
  );
}
