"use client";

import React, { useState, useMemo } from "react";
import { useFinancialState } from "@/context";
import {
  generateSuggestions,
  getSuggestionsByCategory,
  getHighPrioritySuggestions,
  DEFAULT_SUGGESTION_CONFIG,
} from "@/utils/suggestionGenerator";
import { Priority } from "@/types";
import { formatCurrency } from "@/utils/currency";
import {
  generateForecast,
  ForecastResult,
  ForecastConfig as UtilsForecastConfig,
} from "@/utils/forecastCalculator";
import { ForecastConfig } from "@/types";

export default function SuggestionsPage() {
  const state = useFinancialState();
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | "income" | "expense" | "goal" | "general"
  >("all");
  const [showOnlyHighPriority, setShowOnlyHighPriority] = useState(false);
  const [showGoalAllocation, setShowGoalAllocation] = useState(true);
  const [allocationViewMode, setAllocationViewMode] = useState<
    "calendar" | "table"
  >("calendar");

  // Generate suggestions based on current filters
  const suggestions = useMemo(() => {
    if (!state.userPlan) return [];

    if (showOnlyHighPriority) {
      return getHighPrioritySuggestions(
        state.userPlan,
        DEFAULT_SUGGESTION_CONFIG
      );
    }

    if (selectedCategory === "all") {
      return generateSuggestions(state.userPlan, DEFAULT_SUGGESTION_CONFIG);
    }

    return getSuggestionsByCategory(
      state.userPlan,
      selectedCategory,
      DEFAULT_SUGGESTION_CONFIG
    );
  }, [state.userPlan, selectedCategory, showOnlyHighPriority]);

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

  // Generate forecast for goal allocation breakdown using the same config as forecast page
  const forecastResult: ForecastResult | null = useMemo(() => {
    if (!state.userPlan) return null;

    // Use the same forecast configuration as the forecast page
    const forecastConfig = state.userPlan.forecastConfig || {
      startingBalance: state.userPlan.currentBalance || 0,
      startDate: new Date().toISOString().slice(0, 7),
      months: 12,
      includeGoalContributions: true,
      conservativeMode: false,
      updatedAt: new Date().toISOString(),
    };

    return generateForecast(
      state.userPlan,
      convertToUtilsConfig(forecastConfig)
    );
  }, [state.userPlan]);

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.CRITICAL:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case Priority.HIGH:
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case Priority.MEDIUM:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case Priority.LOW:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getPriorityIcon = (priority: Priority) => {
    switch (priority) {
      case Priority.CRITICAL:
        return "🚨";
      case Priority.HIGH:
        return "⚠️";
      case Priority.MEDIUM:
        return "📋";
      case Priority.LOW:
        return "💡";
      default:
        return "📝";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "income":
        return "💰";
      case "expense":
        return "💳";
      case "goal":
        return "🎯";
      case "general":
        return "📊";
      default:
        return "💡";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "income":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      case "expense":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      case "goal":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
      case "general":
        return "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800";
      default:
        return "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800";
    }
  };

  // Format month for display
  const formatMonth = (monthKey: string) => {
    const date = new Date(monthKey + "-01");
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
    });
  };

  // Get goal allocation data for calendar view with percentage progress
  const getGoalAllocationData = () => {
    if (!forecastResult || !state.userPlan?.goals) return [];

    // Create a map to track cumulative allocations for each goal
    const goalTracker = new Map<string, number>();
    state.userPlan.goals.forEach((goal) => {
      goalTracker.set(goal.id, goal.currentAmount);
    });

    return forecastResult.monthlyForecasts.map((month) => {
      // Calculate percentage progress for each goal allocation in this month
      const enhancedGoalBreakdown = month.goalBreakdown.map(
        (goalAllocation) => {
          // Find the corresponding goal
          const goal = state.userPlan!.goals.find(
            (g) => g.id === goalAllocation.id
          );
          if (!goal)
            return {
              ...goalAllocation,
              progressPercent: 0,
              newTotal: 0,
              targetAmount: 0,
              goalType: "fixed_amount" as const,
              isCompleted: false,
            };

          // Update the tracker with this month's allocation
          const currentAmount = goalTracker.get(goal.id) || 0;
          const newTotal = currentAmount + goalAllocation.amount;
          goalTracker.set(goal.id, newTotal);

          // Calculate percentage progress
          const progressPercent =
            goal.goalType === "fixed_amount"
              ? Math.min(100, (newTotal / goal.targetAmount) * 100)
              : 0; // Open-ended goals don't have a percentage

          return {
            ...goalAllocation,
            progressPercent: Math.round(progressPercent * 10) / 10, // Round to 1 decimal
            newTotal: newTotal,
            targetAmount: goal.targetAmount,
            goalType: goal.goalType,
            isCompleted:
              goal.goalType === "fixed_amount" && newTotal >= goal.targetAmount,
          };
        }
      );

      return {
        month: month.month,
        monthLabel: formatMonth(month.month),
        goalBreakdown: enhancedGoalBreakdown,
        totalAllocation: month.goalContributions,
        surplus: month.income - month.expenses,
      };
    });
  };

  if (state.loading.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Loading suggestions...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              💡 Financial Suggestions
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Personalized recommendations to improve your financial health
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                High Priority Only
              </label>
              <input
                type="checkbox"
                checked={showOnlyHighPriority}
                onChange={(e) => setShowOnlyHighPriority(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Filter by Category
        </h3>
        <div className="flex flex-wrap gap-3">
          {[
            { key: "all", label: "All Suggestions", icon: "📋" },
            { key: "income", label: "Income", icon: "💰" },
            { key: "expense", label: "Expenses", icon: "💳" },
            { key: "goal", label: "Goals", icon: "🎯" },
            { key: "general", label: "General", icon: "📊" },
          ].map((category) => (
            <button
              key={category.key}
              onClick={() =>
                setSelectedCategory(
                  category.key as
                    | "all"
                    | "income"
                    | "expense"
                    | "goal"
                    | "general"
                )
              }
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category.key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Suggestions Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Suggestions
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {suggestions.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💡</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                High Priority
              </p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {
                  suggestions.filter(
                    (s) =>
                      s.priority === Priority.HIGH ||
                      s.priority === Priority.CRITICAL
                  ).length
                }
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Potential Impact
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(
                  suggestions.reduce(
                    (sum, s) => sum + Math.abs(s.estimatedImpact),
                    0
                  )
                )}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Per month if all implemented
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Actionable Items
              </p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {suggestions.filter((s) => s.actionable).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Goal Allocation Breakdown */}
      {showGoalAllocation && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                📅 Monthly Goal Allocation Schedule
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Detailed month-by-month breakdown of recommended goal
                allocations based on your financial forecast
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Show Allocation
                </label>
                <input
                  type="checkbox"
                  checked={showGoalAllocation}
                  onChange={(e) => setShowGoalAllocation(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setAllocationViewMode("calendar")}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      allocationViewMode === "calendar"
                        ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                  >
                    📅 Calendar
                  </button>
                  <button
                    onClick={() => setAllocationViewMode("table")}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      allocationViewMode === "table"
                        ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                  >
                    📊 Table
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          {!forecastResult ||
          !state.userPlan?.goals ||
          state.userPlan.goals.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No Goals Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Add some financial goals to see your personalized monthly
                allocation schedule
              </p>
              <a
                href="/goals"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                🎯 Add Goals
              </a>
            </div>
          ) : (
            <>
              {/* Calendar View */}
              {allocationViewMode === "calendar" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {getGoalAllocationData().map((monthData) => (
                    <div
                      key={monthData.month}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                    >
                      <div className="text-center mb-3">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {monthData.monthLabel}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Total: {formatCurrency(monthData.totalAllocation)}
                        </p>
                      </div>

                      {monthData.goalBreakdown.length > 0 ? (
                        <div className="space-y-2">
                          {monthData.goalBreakdown.map((goal) => (
                            <div
                              key={goal.id}
                              className={`bg-white dark:bg-gray-800 rounded p-2 border ${
                                goal.isCompleted
                                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                  : "border-gray-200 dark:border-gray-600"
                              }`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {goal.name}
                                </span>
                                <span className="text-xs text-green-600 dark:text-green-400 font-semibold ml-2">
                                  {formatCurrency(goal.amount)}
                                </span>
                              </div>

                              {/* Progress information */}
                              <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                {goal.goalType === "fixed_amount" ? (
                                  <div className="flex items-center justify-between">
                                    <span>
                                      {formatCurrency(goal.newTotal)} /{" "}
                                      {formatCurrency(goal.targetAmount)}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <span
                                        className={`font-semibold ${
                                          goal.isCompleted
                                            ? "text-green-600 dark:text-green-400"
                                            : "text-blue-600 dark:text-blue-400"
                                        }`}
                                      >
                                        {goal.progressPercent}%
                                      </span>
                                      {goal.isCompleted && (
                                        <span className="text-green-600 dark:text-green-400">
                                          ✅
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between">
                                    <span>Open-ended goal</span>
                                    <span className="text-blue-600 dark:text-blue-400">
                                      {formatCurrency(goal.newTotal)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}

                          {monthData.surplus > monthData.totalAllocation && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded p-2">
                              💡{" "}
                              {formatCurrency(
                                monthData.surplus - monthData.totalAllocation
                              )}{" "}
                              remaining surplus
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            No allocations
                          </span>
                          {monthData.surplus > 0 && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              {formatCurrency(monthData.surplus)} surplus
                              available
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Table View */}
              {allocationViewMode === "table" && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Month
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Goal Allocations
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Total Allocation
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Remaining Surplus
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Guidance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      {getGoalAllocationData().map((monthData, index) => (
                        <tr
                          key={monthData.month}
                          className={
                            index % 2 === 0
                              ? "bg-white dark:bg-gray-800"
                              : "bg-gray-50 dark:bg-gray-700"
                          }
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {monthData.monthLabel}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {monthData.goalBreakdown.length > 0 ? (
                              <div className="space-y-2">
                                {monthData.goalBreakdown.map((goal) => (
                                  <div
                                    key={goal.id}
                                    className={`text-sm p-2 rounded ${
                                      goal.isCompleted
                                        ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700"
                                        : "bg-gray-50 dark:bg-gray-700"
                                    }`}
                                  >
                                    <div className="flex justify-between items-start">
                                      <span className="text-gray-900 dark:text-gray-100 font-medium">
                                        {goal.name}
                                      </span>
                                      <span className="text-green-600 dark:text-green-400 font-semibold">
                                        {formatCurrency(goal.amount)}
                                      </span>
                                    </div>

                                    {/* Progress information */}
                                    <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                      {goal.goalType === "fixed_amount" ? (
                                        <div className="flex items-center justify-between">
                                          <span>
                                            {formatCurrency(goal.newTotal)} /{" "}
                                            {formatCurrency(goal.targetAmount)}
                                          </span>
                                          <div className="flex items-center gap-1">
                                            <span
                                              className={`font-semibold ${
                                                goal.isCompleted
                                                  ? "text-green-600 dark:text-green-400"
                                                  : "text-blue-600 dark:text-blue-400"
                                              }`}
                                            >
                                              {goal.progressPercent}%
                                            </span>
                                            {goal.isCompleted && (
                                              <span className="text-green-600 dark:text-green-400">
                                                ✅
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-between">
                                          <span>Open-ended</span>
                                          <span className="text-blue-600 dark:text-blue-400">
                                            Total:{" "}
                                            {formatCurrency(goal.newTotal)}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                No allocations
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                              {formatCurrency(monthData.totalAllocation)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900 dark:text-gray-100">
                              {formatCurrency(
                                Math.max(
                                  0,
                                  monthData.surplus - monthData.totalAllocation
                                )
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              {monthData.goalBreakdown.length > 0 ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-green-600 dark:text-green-400">
                                    ✅
                                  </span>
                                  <span>Goals funded</span>
                                </div>
                              ) : monthData.surplus > 0 ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-blue-600 dark:text-blue-400">
                                    💡
                                  </span>
                                  <span>Surplus available</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <span className="text-red-600 dark:text-red-400">
                                    ⚠️
                                  </span>
                                  <span>No surplus</span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Actionable Guidance Summary */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  💡 Action Plan Summary
                </h3>
                <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  {forecastResult!.goalProgress.map((goal) => (
                    <div key={goal.id}>
                      <strong>{goal.name}:</strong> Allocate an average of{" "}
                      <span className="font-semibold">
                        {formatCurrency(goal.averageMonthlyAllocation)}
                      </span>{" "}
                      per month
                      {goal.estimatedCompletionMonth && (
                        <span>
                          {" "}
                          (estimated completion:{" "}
                          {formatMonth(goal.estimatedCompletionMonth)})
                        </span>
                      )}
                      {!goal.onTrack && (
                        <span className="text-red-600 dark:text-red-400 ml-2">
                          ⚠️ Behind schedule
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Suggestions List */}
      <div className="space-y-6">
        {suggestions.length > 0 ? (
          suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className={`rounded-lg border-2 p-6 transition-all duration-200 hover:shadow-md ${getCategoryColor(
                suggestion.category
              )}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center text-2xl shadow-sm">
                      {getCategoryIcon(suggestion.category)}
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {suggestion.title}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                          suggestion.priority
                        )}`}
                      >
                        <span className="mr-1">
                          {getPriorityIcon(suggestion.priority)}
                        </span>
                        {suggestion.priority.toUpperCase()}
                      </span>
                      {suggestion.actionable && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          ✅ Actionable
                        </span>
                      )}
                    </div>

                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      {suggestion.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-medium">Category:</span>{" "}
                          {suggestion.category.charAt(0).toUpperCase() +
                            suggestion.category.slice(1)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-medium">Impact:</span>{" "}
                          {formatCurrency(suggestion.estimatedImpact)}/month
                        </div>
                      </div>

                      {suggestion.actionable && (
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                          Take Action
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🎉</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Great Job!
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              No suggestions at the moment. Your financial plan looks solid!
            </p>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {selectedCategory !== "all" && (
                <p>
                  Try viewing all categories or check back later as your
                  financial situation changes.
                </p>
              )}
              {showOnlyHighPriority && (
                <p>
                  Try viewing all priority levels to see additional
                  recommendations.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tips Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          💡 How to Use These Suggestions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              Priority Levels
            </h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-center space-x-2">
                <span>🚨</span>
                <span>
                  <strong>Critical:</strong> Address immediately to avoid
                  financial stress
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <span>⚠️</span>
                <span>
                  <strong>High:</strong> Important for long-term financial
                  health
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <span>📋</span>
                <span>
                  <strong>Medium:</strong> Good opportunities for improvement
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <span>💡</span>
                <span>
                  <strong>Low:</strong> Nice-to-have optimizations
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              Categories
            </h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-center space-x-2">
                <span>💰</span>
                <span>
                  <strong>Income:</strong> Ways to increase your earnings
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <span>💳</span>
                <span>
                  <strong>Expense:</strong> Opportunities to reduce spending
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <span>🎯</span>
                <span>
                  <strong>Goal:</strong> Help with achieving financial
                  objectives
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <span>📊</span>
                <span>
                  <strong>General:</strong> Overall financial health
                  improvements
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
