"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useFinancialContext } from "@/context";
import {
  generateForecast,
  ForecastConfig as UtilsForecastConfig,
  ForecastResult,
} from "@/utils/forecastCalculator";
import { useCurrency } from "@/context/CurrencyContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatDateWithTranslations } from "@/utils/dateFormatting";
import { ForecastConfig } from "@/types";

export default function ForecastPage() {
  const { state, updateForecastConfig } = useFinancialContext();
  const { formatCurrency } = useCurrency();
  const { t } = useLanguage();
  const [localConfig, setLocalConfig] = useState<ForecastConfig>(
    state.userPlan?.forecastConfig || {
      startingBalance: state.userPlan?.currentBalance || 0,
      startDate: new Date().toISOString().slice(0, 7),
      months: 12,
      includeGoalContributions: true,
      conservativeMode: false,
      updatedAt: new Date().toISOString(),
    }
  );
  const [selectedView, setSelectedView] = useState<"table" | "chart" | "goals">(
    "table"
  );
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [isAutoRecalculating, setIsAutoRecalculating] = useState(false);

  // Convert persistent config to utils config
  const convertToUtilsConfig = (
    config: ForecastConfig
  ): UtilsForecastConfig => {
    return {
      months: config.months,
      startingBalance: config.startingBalance,
      startDate: config.startDate
        ? new Date(config.startDate + "-01")
        : undefined,
      includeGoalContributions: config.includeGoalContributions,
      conservativeMode: config.conservativeMode,
    };
  };

  // Sync local config with context when userPlan changes
  useEffect(() => {
    if (state.userPlan?.forecastConfig) {
      setLocalConfig(state.userPlan.forecastConfig);
    }
  }, [state.userPlan?.forecastConfig]);

  // Update forecast configuration in context
  const updateConfig = async (newConfig: Partial<ForecastConfig>) => {
    const updatedConfig = { ...localConfig, ...newConfig };
    setLocalConfig(updatedConfig);

    try {
      setIsRecalculating(true);
      await updateForecastConfig(updatedConfig);
    } catch (error) {
      console.error("Failed to update forecast config:", error);
    } finally {
      setIsRecalculating(false);
    }
  };

  // Manual recalculate function
  const handleRecalculate = async () => {
    try {
      setIsRecalculating(true);
      await updateForecastConfig({
        ...localConfig,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to recalculate forecast:", error);
    } finally {
      setIsRecalculating(false);
    }
  };

  // Reset all forecast configuration to defaults
  const handleResetAll = async () => {
    try {
      setIsRecalculating(true);
      setShowResetConfirmation(false);
      const defaultConfig: ForecastConfig = {
        startingBalance: state.userPlan?.currentBalance || 0,
        startDate: new Date().toISOString().slice(0, 7),
        months: 12,
        includeGoalContributions: true,
        conservativeMode: false,
        updatedAt: new Date().toISOString(),
      };
      await updateForecastConfig(defaultConfig);
    } catch (error) {
      console.error("Failed to reset forecast config:", error);
    } finally {
      setIsRecalculating(false);
    }
  };

  // Generate forecast when data or config changes
  const forecastResult: ForecastResult = useMemo(() => {
    if (!state.userPlan)
      return {
        monthlyForecasts: [],
        summary: {
          totalIncome: 0,
          totalExpenses: 0,
          totalGoalContributions: 0,
          finalBalance: 0,
          averageMonthlyIncome: 0,
          averageMonthlyExpenses: 0,
          averageMonthlyNet: 0,
          lowestBalance: 0,
          highestBalance: 0,
          monthsWithNegativeBalance: 0,
        },
        goalProgress: [],
      };

    return generateForecast(state.userPlan, convertToUtilsConfig(localConfig));
  }, [state.userPlan, localConfig]);

  // Auto-recalculation effect
  useEffect(() => {
    setIsAutoRecalculating(true);
    const timer = setTimeout(() => setIsAutoRecalculating(false), 500);
    return () => clearTimeout(timer);
  }, [localConfig]);

  const formatMonth = (monthKey: string) => {
    return formatDateWithTranslations(monthKey + "-01", t, {
      includeYear: true,
      shortMonth: false,
      includeDate: false,
    });
  };

  const getForecastDateRange = () => {
    const startDate = new Date(localConfig.startDate + "-01");
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + localConfig.months - 1);

    return {
      start: formatMonth(localConfig.startDate),
      end: formatMonth(endDate.toISOString().slice(0, 7)),
    };
  };

  const getBalanceColor = (balance: number) => {
    if (balance >= 0) return "text-green-600 dark:text-green-400";
    return "text-red-600 dark:text-red-400";
  };

  const getBalanceBgColor = (balance: number) => {
    if (balance >= 0) return "bg-green-50 dark:bg-green-900/20";
    return "bg-red-50 dark:bg-red-900/20";
  };

  if (state.loading.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Loading forecast...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="space-y-6">
          {/* Title Section */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              📈 Financial Forecast
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Financial projections based on your current income, expenses, and
              goals. Choose your start date and forecast period.
            </p>
            <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
              Forecast period: {getForecastDateRange().start} to{" "}
              {getForecastDateRange().end}
              {isAutoRecalculating && (
                <span className="ml-2 inline-flex items-center">
                  <svg
                    className="animate-spin h-3 w-3 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Recalculating...
                </span>
              )}
            </p>
          </div>

          {/* Controls Section */}
          <div className="space-y-4">
            {/* Row 1: Starting Balance */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-fit">
                  Starting Balance (THB)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={localConfig.startingBalance || ""}
                    onFocus={(e) =>
                      e.target.value === "0" && (e.target.value = "")
                    }
                    onChange={(e) =>
                      updateConfig({
                        startingBalance: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 text-sm"
                    placeholder="0.00"
                  />
                  <button
                    onClick={() =>
                      updateConfig({
                        startingBalance: state.userPlan?.currentBalance || 0,
                      })
                    }
                    className="px-3 py-2 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                    title="Reset to current balance"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleRecalculate}
                  disabled={isRecalculating}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Recalculate forecast"
                >
                  {isRecalculating ? "Calculating..." : "Recalculate"}
                </button>
                <button
                  onClick={() => setShowResetConfirmation(true)}
                  className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  title="Reset all forecast settings to defaults"
                >
                  Reset All
                </button>
              </div>
            </div>

            {/* Row 2: Date and Period Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-fit">
                  Start Date
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="month"
                    value={localConfig.startDate}
                    onChange={(e) =>
                      updateConfig({
                        startDate: e.target.value,
                      })
                    }
                    className="flex-1 px-3 py-2 rounded-lg border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                    title="Select forecast start month"
                  />
                  <button
                    onClick={() =>
                      updateConfig({
                        startDate: new Date().toISOString().slice(0, 7),
                      })
                    }
                    className="px-3 py-2 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                    title="Reset to current month"
                  >
                    Now
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-fit">
                  Forecast Period
                </label>
                <select
                  value={localConfig.months}
                  onChange={(e) =>
                    updateConfig({
                      months: parseInt(e.target.value),
                    })
                  }
                  className="flex-1 px-3 py-2 rounded-lg border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                >
                  <option value={6}>6 months</option>
                  <option value={12}>1 year (12 months)</option>
                  <option value={18}>1.5 years (18 months)</option>
                  <option value={24}>2 years (24 months)</option>
                  <option value={36}>3 years (36 months)</option>
                  <option value={48}>4 years (48 months)</option>
                  <option value={60}>5 years (60 months)</option>
                </select>
              </div>
            </div>

            {/* Row 3: Toggle Options */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="conservativeMode"
                  checked={localConfig.conservativeMode}
                  onChange={(e) =>
                    updateConfig({
                      conservativeMode: e.target.checked,
                    })
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="conservativeMode"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Conservative Mode
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="includeGoals"
                  checked={localConfig.includeGoalContributions}
                  onChange={(e) =>
                    updateConfig({
                      includeGoalContributions: e.target.checked,
                    })
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="includeGoals"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Include Goals
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Final Balance
              </p>
              <p
                className={`text-2xl font-bold ${getBalanceColor(
                  forecastResult.summary.finalBalance
                )}`}
              >
                {formatCurrency(forecastResult.summary.finalBalance)}
              </p>
            </div>
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center ${getBalanceBgColor(
                forecastResult.summary.finalBalance
              )}`}
            >
              <svg
                className={`w-6 h-6 ${getBalanceColor(
                  forecastResult.summary.finalBalance
                )}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            After {localConfig.months} months
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Income
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(forecastResult.summary.totalIncome)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Avg: {formatCurrency(forecastResult.summary.averageMonthlyIncome)}
            /month
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Expenses
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(forecastResult.summary.totalExpenses)}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Avg: {formatCurrency(forecastResult.summary.averageMonthlyExpenses)}
            /month
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Goal Contributions
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(forecastResult.summary.totalGoalContributions)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Toward your goals
          </p>
        </div>
      </div>

      {/* View Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Forecast Details
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedView("table")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedView === "table"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setSelectedView("chart")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedView === "chart"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Chart View
            </button>
            <button
              onClick={() => setSelectedView("goals")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedView === "goals"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Goal Progress
            </button>
          </div>
        </div>
      </div>

      {/* Table View */}
      {selectedView === "table" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Month
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Starting Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Income
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Expenses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Goals
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Net Change
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ending Balance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {forecastResult.monthlyForecasts.map((month, index) => (
                  <tr
                    key={month.month}
                    className={
                      index % 2 === 0
                        ? "bg-white dark:bg-gray-800"
                        : "bg-gray-50 dark:bg-gray-700"
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatMonth(month.month)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {formatCurrency(month.startingBalance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                      <div className="flex items-center gap-2">
                        <span>+{formatCurrency(month.income)}</span>
                        {month.incomeBreakdown.length > 0 && (
                          <div className="relative group">
                            <svg
                              className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>

                            {/* Tooltip */}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                              <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-3 shadow-lg min-w-max max-w-xs border border-gray-600 dark:border-gray-500">
                                <div className="font-semibold mb-2 text-center">
                                  {formatMonth(month.month)} Income
                                </div>
                                <div className="space-y-1 max-h-40 overflow-y-auto">
                                  {month.incomeBreakdown.map((income, idx) => (
                                    <div
                                      key={idx}
                                      className="flex justify-between items-center gap-4"
                                    >
                                      <span className="text-gray-300 truncate">
                                        {income.name}
                                      </span>
                                      <span className="font-medium text-green-300 whitespace-nowrap">
                                        +{formatCurrency(income.amount)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                <div className="border-t border-gray-600 dark:border-gray-500 mt-2 pt-2">
                                  <div className="flex justify-between items-center font-semibold">
                                    <span>Total</span>
                                    <span className="text-green-300">
                                      +{formatCurrency(month.income)}
                                    </span>
                                  </div>
                                </div>

                                {/* Tooltip arrow pointing up */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900 dark:border-b-gray-700"></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">
                      <div className="flex items-center gap-2">
                        <span>-{formatCurrency(month.expenses)}</span>
                        {month.expenseBreakdown.length > 0 && (
                          <div className="relative group">
                            <svg
                              className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>

                            {/* Tooltip */}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                              <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-3 shadow-lg min-w-max max-w-xs border border-gray-600 dark:border-gray-500">
                                <div className="font-semibold mb-2 text-center">
                                  {formatMonth(month.month)} Expenses
                                </div>
                                <div className="space-y-1 max-h-40 overflow-y-auto">
                                  {month.expenseBreakdown.map(
                                    (expense, idx) => (
                                      <div
                                        key={idx}
                                        className="flex justify-between items-center gap-4"
                                      >
                                        <div className="text-gray-300 truncate">
                                          <span>{expense.name}</span>
                                          {expense.installmentInfo
                                            ?.isInstallment && (
                                            <span className="text-xs text-blue-300 ml-2">
                                              (
                                              {
                                                expense.installmentInfo
                                                  .currentMonth
                                              }
                                              /
                                              {
                                                expense.installmentInfo
                                                  .totalMonths
                                              }
                                              )
                                            </span>
                                          )}
                                        </div>
                                        <span className="font-medium text-red-300 whitespace-nowrap">
                                          -{formatCurrency(expense.amount)}
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                                <div className="border-t border-gray-600 dark:border-gray-500 mt-2 pt-2">
                                  <div className="flex justify-between items-center font-semibold">
                                    <span>Total</span>
                                    <span className="text-red-300">
                                      -{formatCurrency(month.expenses)}
                                    </span>
                                  </div>
                                </div>

                                {/* Tooltip arrow pointing up */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900 dark:border-b-gray-700"></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400">
                      <div className="flex items-center gap-2">
                        <span>-{formatCurrency(month.goalContributions)}</span>
                        {month.goalBreakdown.length > 0 && (
                          <div className="relative group">
                            <svg
                              className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>

                            {/* Tooltip */}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                              <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-3 shadow-lg min-w-max max-w-xs border border-gray-600 dark:border-gray-500">
                                <div className="font-semibold mb-2 text-center">
                                  {formatMonth(month.month)} Goal Contributions
                                </div>
                                <div className="space-y-1 max-h-40 overflow-y-auto">
                                  {month.goalBreakdown.map((goal, idx) => (
                                    <div
                                      key={idx}
                                      className="flex justify-between items-center gap-4"
                                    >
                                      <span className="text-gray-300 truncate">
                                        {goal.name}
                                      </span>
                                      <span className="font-medium text-blue-300 whitespace-nowrap">
                                        -{formatCurrency(goal.amount)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                <div className="border-t border-gray-600 dark:border-gray-500 mt-2 pt-2">
                                  <div className="flex justify-between items-center font-semibold">
                                    <span>Total</span>
                                    <span className="text-blue-300">
                                      -{formatCurrency(month.goalContributions)}
                                    </span>
                                  </div>
                                </div>

                                {/* Tooltip arrow pointing up */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900 dark:border-b-gray-700"></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getBalanceColor(
                        month.netChange
                      )}`}
                    >
                      {month.netChange >= 0 ? "+" : ""}
                      {formatCurrency(month.netChange)}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getBalanceColor(
                        month.endingBalance
                      )}`}
                    >
                      {formatCurrency(month.endingBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Chart View */}
      {selectedView === "chart" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Balance Trend
          </h3>
          <div className="h-64 flex items-end justify-between space-x-2">
            {forecastResult.monthlyForecasts.map((month) => {
              const maxBalance = Math.max(
                ...forecastResult.monthlyForecasts.map((m) => m.endingBalance),
                0 // Ensure we include zero as a reference point
              );
              const minBalance = Math.min(
                ...forecastResult.monthlyForecasts.map((m) => m.endingBalance),
                0 // Ensure we include zero as a reference point
              );

              // Calculate the range and ensure we have a reasonable scale
              const range = Math.max(maxBalance - minBalance, 1000); // Minimum range of 1000
              const zeroPoint = Math.abs(minBalance) / range; // Where zero line should be

              // Calculate height as percentage from bottom
              let height: number;
              if (month.endingBalance >= 0) {
                // Positive balance: height from zero line upward
                height = (month.endingBalance / range) * 100;
              } else {
                // Negative balance: height from bottom to zero line
                height =
                  ((Math.abs(minBalance) + month.endingBalance) / range) * 100;
              }

              // Ensure minimum visible height
              height = Math.max(height, 2);

              return (
                <div
                  key={month.month}
                  className="flex-1 flex flex-col items-center"
                >
                  <div
                    className="w-full bg-gray-200 dark:bg-gray-700 rounded-t relative"
                    style={{ height: "200px" }}
                  >
                    {/* Zero line indicator */}
                    {minBalance < 0 && (
                      <div
                        className="absolute w-full border-t-2 border-gray-400 dark:border-gray-500 border-dashed"
                        style={{ bottom: `${zeroPoint * 100}%` }}
                      />
                    )}

                    {/* Balance bar */}
                    <div
                      className={`absolute bottom-0 w-full rounded-t transition-all duration-300 ${
                        month.endingBalance >= 0
                          ? "bg-green-500 dark:bg-green-400"
                          : "bg-red-500 dark:bg-red-400"
                      }`}
                      style={{ height: `${height}%` }}
                      title={`${formatMonth(month.month)}: ${formatCurrency(
                        month.endingBalance
                      )}`}
                    />

                    {/* Net change indicator */}
                    <div
                      className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                        month.netChange >= 0
                          ? "bg-green-600 dark:bg-green-300"
                          : "bg-red-600 dark:bg-red-300"
                      }`}
                      title={`Net change: ${formatCurrency(month.netChange)}`}
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    {month.month.split("-")[1]}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>
              Low: {formatCurrency(forecastResult.summary.lowestBalance)}
            </span>
            <span>
              Avg Net:{" "}
              {formatCurrency(forecastResult.summary.averageMonthlyNet)}
            </span>
            <span>
              High: {formatCurrency(forecastResult.summary.highestBalance)}
            </span>
          </div>

          {/* Chart Legend */}
          <div className="mt-4 flex justify-center space-x-6 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 dark:bg-green-400 rounded mr-2"></div>
              <span className="text-gray-600 dark:text-gray-400">
                Positive Balance
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 dark:bg-red-400 rounded mr-2"></div>
              <span className="text-gray-600 dark:text-gray-400">
                Negative Balance
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-400 dark:bg-gray-500 rounded mr-2"></div>
              <span className="text-gray-600 dark:text-gray-400">
                Zero Line
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Goal Progress View */}
      {selectedView === "goals" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Goal Progress Projections
          </h3>
          {forecastResult.goalProgress.length > 0 ? (
            <div className="space-y-4">
              {forecastResult.goalProgress.map((goal) => (
                <div
                  key={goal.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {goal.name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatCurrency(goal.projectedAmount)} of{" "}
                        {formatCurrency(goal.targetAmount)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {goal.projectedProgress.toFixed(1)}%
                      </p>
                      <p
                        className={`text-xs ${
                          goal.onTrack
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {goal.onTrack ? "On Track" : "Behind Schedule"}
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        goal.projectedProgress >= 100
                          ? "bg-green-600 dark:bg-green-400"
                          : goal.onTrack
                          ? "bg-green-600 dark:bg-green-400"
                          : "bg-red-600 dark:bg-red-400"
                      }`}
                      style={{
                        width: `${Math.min(goal.projectedProgress, 100)}%`,
                      }}
                    />
                  </div>
                  {goal.estimatedCompletionMonth && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Estimated completion:{" "}
                      {formatMonth(goal.estimatedCompletionMonth)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No active goals to track
              </p>
            </div>
          )}
        </div>
      )}

      {/* Warnings */}
      {forecastResult.summary.monthsWithNegativeBalance > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-red-600 dark:text-red-400 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <div>
              <h4 className="font-medium text-red-800 dark:text-red-200">
                Cash Flow Warning
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300">
                Your forecast shows{" "}
                {forecastResult.summary.monthsWithNegativeBalance} months with
                negative balance. Consider adjusting your expenses or increasing
                income.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md mx-4">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Reset Forecast Configuration
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to reset all forecast settings to defaults?
              This will restore starting balance to current balance, reset start
              date to current month, and restore other settings to their default
              values.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowResetConfirmation(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetAll}
                disabled={isRecalculating}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isRecalculating ? "Resetting..." : "Reset All"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
