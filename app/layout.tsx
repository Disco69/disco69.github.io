import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FinancialProvider } from "@/context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Finance Planner - Take Control of Your Financial Future",
  description:
    "A comprehensive financial planning tool to manage income, expenses, goals, and forecast your financial future with personalized insights and recommendations.",
  keywords: [
    "finance",
    "budgeting",
    "financial planning",
    "expense tracking",
    "income management",
    "financial goals",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100`}
      >
        <FinancialProvider>
          <div className="min-h-screen flex flex-col">
            <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                  <div className="flex items-center">
                    <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      Finance Planner
                    </h1>
                  </div>
                  <nav className="hidden md:flex space-x-8">
                    <a
                      href="#"
                      className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      Dashboard
                    </a>
                    <a
                      href="#"
                      className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      Income
                    </a>
                    <a
                      href="#"
                      className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      Expenses
                    </a>
                    <a
                      href="#"
                      className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      Goals
                    </a>
                    <a
                      href="#"
                      className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      Forecast
                    </a>
                  </nav>
                </div>
              </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
              {children}
            </main>

            <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                  <p>
                    &copy; 2024 Finance Planner. Take control of your financial
                    future.
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </FinancialProvider>
      </body>
    </html>
  );
}
