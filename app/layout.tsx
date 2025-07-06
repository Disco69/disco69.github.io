import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FinancialProvider } from "@/context";
import { ThemeProvider } from "@/context/ThemeContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { LanguageProvider } from "@/context/LanguageContext";
import ThemeToggle from "@/components/ThemeToggle";
import CurrencySelector from "@/components/CurrencySelector";
import Navigation from "@/components/Navigation";

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
        <ThemeProvider>
          <CurrencyProvider>
            <LanguageProvider>
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
                        <div className="flex items-center space-x-8">
                          <Navigation />

                          {/* Settings and Social Media Icons */}
                          <div className="flex items-center space-x-4">
                            {/* Currency Selector */}
                            <CurrencySelector />

                            {/* Theme Toggle */}
                            <ThemeToggle />

                            {/* GitHub Icon - Now with correct link */}
                            <a
                              href="https://github.com/oofangoo/personal-finance-planner"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              title="GitHub"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                              </svg>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </header>

                  <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                    {children}
                  </main>

                  <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                      <div className="flex flex-col md:flex-row items-center justify-between">
                        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                          <p>
                            2025 Personal Finance Planner by Fang (Thunyut
                            Chienpairoj)
                          </p>
                        </div>
                        <div className="flex items-center space-x-4 mt-2 md:mt-0">
                          {/* LinkedIn Icon */}
                          <a
                            href="https://www.linkedin.com/in/thunyut/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            title="LinkedIn"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  </footer>
                </div>
              </FinancialProvider>
            </LanguageProvider>
          </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
