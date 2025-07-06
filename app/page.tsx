"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useFinancialState, useFinancialActions } from "@/context";
import { Frequency, ExpenseCategory, GoalCategory, Priority } from "@/types";
import { getHighPrioritySuggestions } from "@/utils/suggestionGenerator";
import { useCurrency } from "@/context/CurrencyContext";
import { isIncomeActiveInMonth } from "@/utils/forecastCalculator";
import { useLanguage } from "@/context/LanguageContext";
import { formatDateWithTranslations } from "@/utils/dateFormatting";
import IncomeVsExpensesChart from "@/components/charts/IncomeVsExpensesChart";
import GoalProgressChart from "@/components/charts/GoalProgressChart";
import ExpenseCategoryChart from "@/components/charts/ExpenseCategoryChart";
import AskAIButton from "@/components/AskAIButton";

export default function DashboardPage() {
  const state = useFinancialState();
  const { loadUserPlan } = useFinancialActions();
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    // Only load if we don't already have data
    if (!state.userPlan.id) {
      loadUserPlan();
    }
  }, []); // Empty dependency array since loadUserPlan is memoized

  // Calculate financial metrics
  const calculateMonthlyAmount = (amount: number, frequency: Frequency) => {
    switch (frequency) {
      case Frequency.DAILY:
        return amount * 30.44;
      case Frequency.WEEKLY:
        return amount * 4.33;
      case Frequency.BIWEEKLY:
        return amount * 2.17;
      case Frequency.MONTHLY:
        return amount;
      case Frequency.QUARTERLY:
        return amount / 3;
      case Frequency.YEARLY:
        return amount / 12;
      case Frequency.ONE_TIME:
        return 0;
      default:
        return amount;
    }
  };

  const currentDate = new Date();
  const totalMonthlyIncome = state.userPlan.income
    .filter((income) => isIncomeActiveInMonth(income, currentDate))
    .reduce(
      (total, income) =>
        total + calculateMonthlyAmount(income.amount, income.frequency),
      0
    );

  const totalMonthlyExpenses = state.userPlan.expenses
    .filter((expense) => expense.isActive)
    .reduce(
      (total, expense) =>
        total +
        calculateMonthlyAmount(
          expense.amount,
          expense.frequency || Frequency.MONTHLY
        ),
      0
    );

  const netMonthlyIncome = totalMonthlyIncome - totalMonthlyExpenses;

  const activeGoals = state.userPlan.goals.filter((goal) => goal.isActive);
  const totalGoalTarget = activeGoals.reduce(
    (total, goal) => total + goal.targetAmount,
    0
  );
  const totalGoalProgress = activeGoals.reduce(
    (total, goal) => total + goal.currentAmount,
    0
  );
  const overallGoalProgress =
    totalGoalTarget > 0 ? (totalGoalProgress / totalGoalTarget) * 100 : 0;

  const savingsRate =
    totalMonthlyIncome > 0 ? (netMonthlyIncome / totalMonthlyIncome) * 100 : 0;

  // Get category breakdowns
  const expensesByCategory = state.userPlan.expenses
    .filter((expense) => expense.isActive)
    .reduce((acc, expense) => {
      const monthlyAmount = calculateMonthlyAmount(
        expense.amount,
        expense.frequency || Frequency.MONTHLY
      );
      acc[expense.category] = (acc[expense.category] || 0) + monthlyAmount;
      return acc;
    }, {} as Record<ExpenseCategory, number>);

  // Get top expense categories
  const topExpenseCategories = Object.entries(expensesByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  // Get upcoming goals (next 6 months)
  const upcomingGoals = activeGoals
    .filter((goal) => {
      const targetDate = new Date(goal.targetDate);
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
      return targetDate <= sixMonthsFromNow;
    })
    .sort(
      (a, b) =>
        new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
    )
    .slice(0, 3);

  // Get high priority goals
  const highPriorityGoals = activeGoals
    .filter(
      (goal) =>
        goal.priority === Priority.HIGH || goal.priority === Priority.CRITICAL
    )
    .slice(0, 3);

  // Get high priority suggestions
  const highPrioritySuggestions = state.userPlan
    ? getHighPrioritySuggestions(state.userPlan).slice(0, 3)
    : [];

  const formatDate = (dateString: string) => {
    return formatDateWithTranslations(dateString, t, {
      includeYear: true,
      shortMonth: true,
    });
  };

  const getCategoryIcon = (category: ExpenseCategory) => {
    const icons = {
      [ExpenseCategory.HOUSING]: "🏠",
      [ExpenseCategory.TRANSPORTATION]: "🚗",
      [ExpenseCategory.FOOD]: "🍽️",
      [ExpenseCategory.UTILITIES]: "💡",
      [ExpenseCategory.INSURANCE]: "🛡️",
      [ExpenseCategory.HEALTHCARE]: "🏥",
      [ExpenseCategory.ENTERTAINMENT]: "🎬",
      [ExpenseCategory.PERSONAL_CARE]: "💅",
      [ExpenseCategory.EDUCATION]: "📚",
      [ExpenseCategory.DEBT_PAYMENTS]: "💳",
      [ExpenseCategory.SAVINGS]: "💰",
      [ExpenseCategory.TRAVEL]: "✈️",
      [ExpenseCategory.SHOPPING]: "🛍️",
      [ExpenseCategory.KIDS]: "👶",
      [ExpenseCategory.MISCELLANEOUS]: "📦",
    };
    return icons[category] || "📦";
  };

  const getGoalIcon = (category: GoalCategory) => {
    const icons = {
      [GoalCategory.EMERGENCY_FUND]: "🚨",
      [GoalCategory.RETIREMENT]: "🏖️",
      [GoalCategory.EDUCATION]: "🎓",
      [GoalCategory.HOME_PURCHASE]: "🏡",
      [GoalCategory.VACATION]: "✈️",
      [GoalCategory.DEBT_PAYOFF]: "💳",
      [GoalCategory.MAJOR_PURCHASE]: "🛒",
      [GoalCategory.INVESTMENT]: "📈",
      [GoalCategory.OTHER]: "🎯",
    };
    return icons[category] || "🎯";
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.CRITICAL:
        return "text-red-600 dark:text-red-400";
      case Priority.HIGH:
        return "text-orange-600 dark:text-orange-400";
      case Priority.MEDIUM:
        return "text-yellow-600 dark:text-yellow-400";
      case Priority.LOW:
        return "text-green-600 dark:text-green-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  if (state.loading.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Financial Dashboard
          </h1>
          <AskAIButton />
        </div>
        <p className="mt-2 text-xl text-gray-600 dark:text-gray-300">
          Your complete financial overview at a glance
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Monthly Income
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(totalMonthlyIncome)}
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
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            From {state.userPlan.income.filter((i) => i.isActive).length} active
            sources
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Monthly Expenses
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(totalMonthlyExpenses)}
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
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            From {state.userPlan.expenses.filter((e) => e.isActive).length}{" "}
            active expenses
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Net Monthly
              </p>
              <p
                className={`text-2xl font-bold ${
                  netMonthlyIncome >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {formatCurrency(netMonthlyIncome)}
              </p>
            </div>
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                netMonthlyIncome >= 0
                  ? "bg-green-100 dark:bg-green-900"
                  : "bg-red-100 dark:bg-red-900"
              }`}
            >
              <svg
                className={`w-6 h-6 ${
                  netMonthlyIncome >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    netMonthlyIncome >= 0
                      ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                  }
                />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Savings Rate: {savingsRate.toFixed(1)}%
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Goal Progress
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {overallGoalProgress.toFixed(1)}%
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
            {formatCurrency(totalGoalProgress)} of{" "}
            {formatCurrency(totalGoalTarget)}
          </p>
        </div>
      </div>

      {/* Advanced Charts Section */}
      <div className="space-y-8">
        {/* Income vs Expenses Trend Chart */}
        <IncomeVsExpensesChart
          userPlan={state.userPlan}
          className="shadow-sm"
        />

        {/* Goal Progress Chart */}
        <GoalProgressChart userPlan={state.userPlan} className="shadow-sm" />

        {/* Expense Category Chart */}
        <ExpenseCategoryChart userPlan={state.userPlan} className="shadow-sm" />
      </div>

      {/* Charts and Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Expense Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Top Expense Categories
          </h3>
          {topExpenseCategories.length > 0 ? (
            <div className="space-y-4">
              {topExpenseCategories.map(([category, amount]) => (
                <div
                  key={category}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">
                      {getCategoryIcon(category as ExpenseCategory)}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {category.charAt(0).toUpperCase() +
                          category.slice(1).toLowerCase().replace("_", " ")}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatCurrency(amount)} per month
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {((amount / totalMonthlyExpenses) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No expenses tracked yet
              </p>
              <Link
                href="/expenses"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Add your first expense
              </Link>
            </div>
          )}
        </div>

        {/* Goal Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            High Priority Goals
          </h3>
          {highPriorityGoals.length > 0 ? (
            <div className="space-y-4">
              {highPriorityGoals.map((goal) => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100;
                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">
                          {getGoalIcon(goal.category)}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {goal.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Due: {formatDate(goal.targetDate)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {progress.toFixed(1)}%
                        </p>
                        <p
                          className={`text-xs ${getPriorityColor(
                            goal.priority
                          )}`}
                        >
                          {goal.priority.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No high priority goals set
              </p>
              <Link
                href="/goals"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Create your first goal
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* High Priority Suggestions */}
      {highPrioritySuggestions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              💡 Priority Suggestions
            </h3>
            <Link
              href="/suggestions"
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
            >
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {highPrioritySuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                    <span className="text-orange-600 dark:text-orange-400">
                      ⚠️
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                      {suggestion.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      {suggestion.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Impact: {formatCurrency(suggestion.estimatedImpact)}
                        /month
                      </span>
                      {suggestion.actionable && (
                        <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded">
                          Actionable
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/income"
            className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Add Income
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Track new income sources
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/expenses"
            className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Add Expense
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Record new expenses
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/goals"
            className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Set Goal
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Create financial goals
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Upcoming Goals */}
      {upcomingGoals.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Upcoming Goals (Next 6 Months)
          </h3>
          <div className="space-y-4">
            {upcomingGoals.map((goal) => {
              const daysUntilTarget = Math.ceil(
                (new Date(goal.targetDate).getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24)
              );
              const progress = (goal.currentAmount / goal.targetAmount) * 100;

              return (
                <div
                  key={goal.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">
                      {getGoalIcon(goal.category)}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {goal.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatCurrency(goal.currentAmount)} of{" "}
                        {formatCurrency(goal.targetAmount)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {daysUntilTarget > 0
                        ? `${daysUntilTarget} days left`
                        : "Overdue"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {progress.toFixed(1)}% complete
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
