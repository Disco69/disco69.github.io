"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function Navigation() {
  const { t } = useLanguage();

  const navItems = [
    { href: "/", key: "nav.dashboard" },
    { href: "/income", key: "nav.income" },
    { href: "/expenses", key: "nav.expenses" },
    { href: "/goals", key: "nav.goals" },
    { href: "/forecast", key: "nav.forecast" },
    { href: "/suggestions", key: "nav.suggestions" },
    { href: "/import-export", key: "nav.importExport" },
  ];

  return (
    <nav className="hidden md:flex space-x-8">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          {t(item.key)}
        </Link>
      ))}
    </nav>
  );
}
