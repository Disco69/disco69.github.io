"use client";

import React, { useState, useMemo } from "react";
import { useFinancialState, useFinancialContext } from "@/context";
import {
  generateForecast,
  ForecastConfig,
  ForecastResult,
  DEFAULT_FORECAST_CONFIG,
} from "@/utils/forecastCalculator";
import { formatCurrency } from "@/utils/currency";

export default function ForecastPage() {
  const state = useFinancialState();
  const { updateForecastStartingBalance, updateForecastSelectedYear } =
    useFinancialContext();
  const [config, setConfig] = useState<ForecastConfig>({
    ...DEFAULT_FORECAST_CONFIG,
    startingBalance:
      state.forecastConfig?.startingBalance ||
      state.userPlan?.currentBalance ||
      0,
  });
  const [selectedView, setSelectedView] = useState<"table" | "chart" | "goals">(
    "table"
  );

  // Handle starting balance update
  const handleStartingBalanceChange = async (newBalance: number) => {
    setConfig((prev) => ({ ...prev, startingBalance: newBalance }));
    try {
      await updateForecastStartingBalance(newBalance);
    } catch (error) {
      console.error("Failed to save starting balance:", error);
    }
  };

  // Handle year selection change
  const handleYearChange = async (newYear: number) => {
    setConfig((prev) => ({
      ...prev,
      startDate: new Date(newYear, 0, 1), // January 1st of selected year
    }));
    try {
      await updateForecastSelectedYear(newYear);
    } catch (error) {
      console.error("Failed to save selected year:", error);
    }
  };

  // Handle reset to defaults
  const handleResetToDefaults = async () => {
    const defaultConfig = {
      ...DEFAULT_FORECAST_CONFIG,
      startingBalance: state.userPlan?.currentBalance || 0,
    };
    setConfig(defaultConfig);

    try {
      await updateForecastStartingBalance(defaultConfig.startingBalance);
      await updateForecastSelectedYear(new Date().getFullYear());
    } catch (error) {
      console.error("Failed to reset configuration:", error);
    }
  };

  // Get available years (current year and next 2 years)
  const currentYear = new Date().getFullYear();
  const availableYears = [currentYear, currentYear + 1, currentYear + 2];
  const selectedYear = config.startDate
    ? config.startDate.getFullYear()
    : currentYear;

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

    return generateForecast(state.userPlan, config);
  }, [state.userPlan, config]);

  const formatMonth = (monthKey: string) => {
    const date = new Date(monthKey + "-01");
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
    });
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
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              📈 Financial Forecast
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              12-month financial projections based on your current income,
              expenses, and goals
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Starting Balance (THB)
              </label>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={config.startingBalance || ""}
                  onFocus={(e) =>
                    e.target.value === "0" && (e.target.value = "")
                  }
                  onChange={(e) =>
                    handleStartingBalanceChange(parseFloat(e.target.value) || 0)
                  }
                  className="w-32 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 text-sm"
                  placeholder="0.00"
                />
                <button
                  onClick={() =>
                    handleStartingBalanceChange(
                      state.userPlan?.currentBalance || 0
                    )
                  }
                  className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  title="Reset to current balance"
                >
                  Reset
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Conservative Mode
              </label>
              <input
                type="checkbox"
                checked={config.conservativeMode}
                onChange={(e) =>
                  setConfig({ ...config, conservativeMode: e.target.checked })
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Include Goals
              </label>
              <input
                type="checkbox"
                checked={config.includeGoalContributions}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    includeGoalContributions: e.target.checked,
                  })
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(parseInt(e.target.value))}
                className="rounded border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year} {year === currentYear && "(Current)"}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Months
              </label>
              <select
                value={config.months}
                onChange={(e) =>
                  setConfig({ ...config, months: parseInt(e.target.value) })
                }
                className="rounded border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              >
                <option value={6}>6 months</option>
                <option value={12}>12 months</option>
                <option value={24}>24 months</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleResetToDefaults}
                className="px-4 py-2 text-sm bg-gray-500 dark:bg-gray-600 text-white rounded hover:bg-gray-600 dark:hover:bg-gray-500 transition-colors flex items-center gap-2"
                title="Reset all forecast settings to defaults"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Reset
              </button>
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
            After {config.months} months
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
                      +{formatCurrency(month.income)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">
                      -{formatCurrency(month.expenses)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400">
                      -{formatCurrency(month.goalContributions)}
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
                ...forecastResult.monthlyForecasts.map((m) => m.endingBalance)
              );
              const minBalance = Math.min(
                ...forecastResult.monthlyForecasts.map((m) => m.endingBalance)
              );
              const range = maxBalance - minBalance;
              const height =
                range > 0
                  ? ((month.endingBalance - minBalance) / range) * 100
                  : 50;

              return (
                <div
                  key={month.month}
                  className="flex-1 flex flex-col items-center"
                >
                  <div
                    className="w-full bg-gray-200 dark:bg-gray-700 rounded-t relative"
                    style={{ height: "200px" }}
                  >
                    <div
                      className={`absolute bottom-0 w-full rounded-t transition-all duration-300 ${
                        month.endingBalance >= 0
                          ? "bg-green-500 dark:bg-green-400"
                          : "bg-red-500 dark:bg-red-400"
                      }`}
                      style={{ height: `${Math.max(height, 5)}%` }}
                      title={`${formatMonth(month.month)}: ${formatCurrency(
                        month.endingBalance
                      )}`}
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
              High: {formatCurrency(forecastResult.summary.highestBalance)}
            </span>
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
                        goal.onTrack
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
    </div>
  );
}
