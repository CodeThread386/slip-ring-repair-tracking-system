import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppHeader } from "@/components/AppHeader";
import { TrackerProvider } from "@/components/TrackerProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Slip Ring Tracker",
    template: "%s · Slip Ring Tracker",
  },
  description: "Workshop order tracking and slip ring drum stock",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full font-sans text-sm text-slate-900">
        <TrackerProvider>
          <AppHeader />
          <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
            {children}
          </main>
        </TrackerProvider>
      </body>
    </html>
  );
}
