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

export default function SuggestionsPage() {
  const state = useFinancialState();
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | "income" | "expense" | "goal" | "general"
  >("all");
  const [showOnlyHighPriority, setShowOnlyHighPriority] = useState(false);

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
