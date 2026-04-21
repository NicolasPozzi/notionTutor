import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "NotionTutor - Révisez vos notes Notion avec l'IA",
    template: "%s | NotionTutor",
  },
  description:
    "Transformez vos notes Notion en sessions de révision interactives. Questions générées par IA, digests quotidiens, spaced repetition.",
  keywords: ["notion", "revision", "learning", "AI", "spaced repetition", "flashcards"],
  authors: [{ name: "NotionTutor" }],
  creator: "NotionTutor",
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
