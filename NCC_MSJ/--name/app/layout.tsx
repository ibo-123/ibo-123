import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/UI/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#1a1a1a",
};

export const metadata: Metadata = {
  title: "NCC_MSJ Tech Platform",
  description:
    "Professional system for managing NCC members, attendance, achievements, and courses",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' font-size='75' font-weight='bold' fill='%2310b981'>N</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased bg-background text-foreground`}>
        <Navbar />
        <main className="min-h-[calc(100vh-64px-140px)]">{children}</main>

        {/* Footer */}
        <footer className="border-t border-border bg-card backdrop-blur-sm mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-bold text-sm">
                    NCC
                  </div>
                  <span className="font-semibold text-foreground">
                    NCC MSJ Platform
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">
                  Professional club management system
                </p>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>© {new Date().getFullYear()} NCC MSJ. All rights reserved.</p>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
