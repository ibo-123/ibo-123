import "./globals.css";
import Navbar from "@/components/UI/Navbar";
import { Analytics } from "@vercel/analytics/next";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white min-h-screen">
        <Navbar />
        <main className="p-4 md:p-6 min-h-[calc(100vh-64px)]">{children}</main>

        {/* Animated background elements */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute font-mono text-green-900/10 text-xl animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDuration: `${3 + Math.random() * 5}s`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            >
              {Math.random() > 0.5 ? "1" : "0"}
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="border-t border-green-900/30 bg-gray-900/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-900/30 to-emerald-800/30 rounded-lg flex items-center justify-center mr-3 border border-green-700/30">
                    <span className="font-bold text-green-400">NCC</span>
                  </div>
                  <span className="text-lg font-bold text-white">
                    NCC_MSJ Tech Platform
                  </span>
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  Secure • Professional • Modern
                </p>
              </div>

              <div className="text-center md:text-right">
                <p className="text-gray-400 text-sm">
                  © {new Date().getFullYear()} NCC MSJ. All rights reserved.
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Version 2.4.1 • Powered by Next.js
                </p>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
