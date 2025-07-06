"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

// Supported languages
export const SUPPORTED_LANGUAGES = {
  en: { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  th: { code: "th", name: "Thai", nativeName: "ไทย", flag: "🇹🇭" },
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;
export type Language = (typeof SUPPORTED_LANGUAGES)[LanguageCode];

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  getLanguageInfo: () => Language;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("en"); // Default to English
  const [mounted, setMounted] = useState(false);

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem(
      "finance-planner-language"
    ) as LanguageCode;
    if (savedLanguage && SUPPORTED_LANGUAGES[savedLanguage]) {
      setLanguageState(savedLanguage);
    }
    setMounted(true);
  }, []);

  // Save language to localStorage when it changes
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("finance-planner-language", language);
  }, [language, mounted]);

  const setLanguage = (newLanguage: LanguageCode) => {
    setLanguageState(newLanguage);
  };

  const getLanguageInfo = (): Language => {
    return SUPPORTED_LANGUAGES[language];
  };

  // Translation function
  const t = (key: string, params?: Record<string, string | number>): string => {
    const translations = getTranslations(language);
    let translation = translations[key] || key;

    // Replace parameters in translation
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        translation = translation.replace(`{{${paramKey}}}`, String(value));
      });
    }

    return translation;
  };

  const value = {
    language,
    setLanguage,
    t,
    getLanguageInfo,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

// Translation data
const translations = {
  en: {
    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.income": "Income",
    "nav.expenses": "Expenses",
    "nav.goals": "Goals",
    "nav.forecast": "Forecast",
    "nav.suggestions": "Suggestions",
    "nav.importExport": "Import/Export",

    // Dashboard
    "dashboard.title": "Finance Planner",
    "dashboard.monthlyIncome": "Monthly Income",
    "dashboard.monthlyExpenses": "Monthly Expenses",
    "dashboard.netIncome": "Net Income",
    "dashboard.goalProgress": "Goal Progress",
    "dashboard.upcomingGoals": "Upcoming Goals",
    "dashboard.quickActions": "Quick Actions",

    // Common
    "common.amount": "Amount",
    "common.name": "Name",
    "common.category": "Category",
    "common.priority": "Priority",
    "common.status": "Status",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.edit": "Edit",
    "common.delete": "Delete",
    "common.add": "Add",
    "common.loading": "Loading...",
    "common.error": "Error",

    // Goals
    "goals.targetAmount": "Target Amount",
    "goals.currentAmount": "Current Amount",
    "goals.targetDate": "Target Date",
    "goals.progress": "Progress",

    // Currencies
    "currency.selector.title": "Select Currency",

    // Languages
    "language.selector.title": "Select Language",

    // Months
    "month.january": "January",
    "month.february": "February",
    "month.march": "March",
    "month.april": "April",
    "month.may": "May",
    "month.june": "June",
    "month.july": "July",
    "month.august": "August",
    "month.september": "September",
    "month.october": "October",
    "month.november": "November",
    "month.december": "December",
  },
  th: {
    // Navigation
    "nav.dashboard": "แดชบอร์ด",
    "nav.income": "รายได้",
    "nav.expenses": "รายจ่าย",
    "nav.goals": "เป้าหมาย",
    "nav.forecast": "พยากรณ์",
    "nav.suggestions": "คำแนะนำ",
    "nav.importExport": "นำเข้า/ส่งออก",

    // Dashboard
    "dashboard.title": "วางแผนการเงิน",
    "dashboard.monthlyIncome": "รายได้รายเดือน",
    "dashboard.monthlyExpenses": "รายจ่ายรายเดือน",
    "dashboard.netIncome": "รายได้สุทธิ",
    "dashboard.goalProgress": "ความคืบหน้าเป้าหมาย",
    "dashboard.upcomingGoals": "เป้าหมายที่จะมาถึง",
    "dashboard.quickActions": "การดำเนินการด่วน",

    // Common
    "common.amount": "จำนวนเงิน",
    "common.name": "ชื่อ",
    "common.category": "หมวดหมู่",
    "common.priority": "ความสำคัญ",
    "common.status": "สถานะ",
    "common.save": "บันทึก",
    "common.cancel": "ยกเลิก",
    "common.edit": "แก้ไข",
    "common.delete": "ลบ",
    "common.add": "เพิ่ม",
    "common.loading": "กำลังโหลด...",
    "common.error": "ข้อผิดพลาด",

    // Goals
    "goals.targetAmount": "จำนวนเป้าหมาย",
    "goals.currentAmount": "จำนวนปัจจุบัน",
    "goals.targetDate": "วันที่เป้าหมาย",
    "goals.progress": "ความคืบหน้า",

    // Currencies
    "currency.selector.title": "เลือกสกุลเงิน",

    // Languages
    "language.selector.title": "เลือกภาษา",

    // Months
    "month.january": "มกราคม",
    "month.february": "กุมภาพันธ์",
    "month.march": "มีนาคม",
    "month.april": "เมษายน",
    "month.may": "พฤษภาคม",
    "month.june": "มิถุนายน",
    "month.july": "กรกฎาคม",
    "month.august": "สิงหาคม",
    "month.september": "กันยายน",
    "month.october": "ตุลาคม",
    "month.november": "พฤศจิกายน",
    "month.december": "ธันวาคม",
  },
};

function getTranslations(language: LanguageCode): Record<string, string> {
  return translations[language];
}
