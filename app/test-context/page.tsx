"use client";

import React from "react";
import { useFinancialState } from "@/context";
import runForecastTests from "@/utils/forecastCalculator.test";

export default function TestContextPage() {
  const state = useFinancialState();

  const runTests = () => {
    console.clear();
    console.log("🚀 Running Finance Planner Tests...\n");

    // Run forecast calculator tests
    runForecastTests();

    console.log(
      "✅ All tests completed! Check the console for detailed results."
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          🧪 Test Context & Validation
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Test and validate the financial planning system components
        </p>
      </div>

      {/* Test Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Forecast Calculator Tests
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Run comprehensive tests to validate forecast calculation accuracy
          including installments, negative balances, goal allocations, and edge
          cases.
        </p>

        <button
          onClick={runTests}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          Run Forecast Tests
        </button>

        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2"
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
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                Test Results in Console
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Open browser developer tools (F12) and check the Console tab to
                see detailed test results.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Current State Display */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Current Financial State
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              Income Sources
            </h3>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {state.userPlan?.income.length || 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Active income sources
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              Expenses
            </h3>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {state.userPlan?.expenses.length || 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total expenses
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              Goals
            </h3>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {state.userPlan?.goals.length || 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Financial goals
            </p>
          </div>
        </div>
      </div>

      {/* Test Scenarios */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Test Scenarios Covered
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              Basic Calculations
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Positive cash flow scenarios</li>
              <li>• Negative cash flow scenarios</li>
              <li>• Zero balance edge cases</li>
              <li>• Frequency conversions</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              Advanced Features
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Installment expense calculations</li>
              <li>• Smart goal allocations</li>
              <li>• Priority-based distribution</li>
              <li>• Conservative mode adjustments</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              Goal Management
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Multiple goal prioritization</li>
              <li>• Completion date estimation</li>
              <li>• Progress tracking</li>
              <li>• On-track status validation</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              Expense Types
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Recurring expenses</li>
              <li>• One-time expenses</li>
              <li>• Installment payments</li>
              <li>• Date-based activation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
