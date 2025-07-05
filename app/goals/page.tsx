"use client";

import { useState } from "react";
import { useFinancialContext } from "@/context";
import {
  Goal,
  GoalCategory,
  GoalType,
  Priority,
  CreateGoalInput,
} from "@/types";
import { formatCurrency } from "@/utils/currency";
import {
  generateForecast,
  generateMonthlyGoalAllocationSchedule,
} from "@/utils/forecastCalculator";

// Goal category icons mapping
const goalCategoryIcons = {
  [GoalCategory.EMERGENCY_FUND]: "🛡️",
  [GoalCategory.RETIREMENT]: "🏖️",
  [GoalCategory.EDUCATION]: "🎓",
  [GoalCategory.HOME_PURCHASE]: "🏠",
  [GoalCategory.VACATION]: "✈️",
  [GoalCategory.DEBT_PAYOFF]: "💳",
  [GoalCategory.MAJOR_PURCHASE]: "🛒",
  [GoalCategory.INVESTMENT]: "📈",
  [GoalCategory.OTHER]: "🎯",
};

// Goal category display names
const goalCategoryNames = {
  [GoalCategory.EMERGENCY_FUND]: "Emergency Fund",
  [GoalCategory.RETIREMENT]: "Retirement",
  [GoalCategory.EDUCATION]: "Education",
  [GoalCategory.HOME_PURCHASE]: "Home Purchase",
  [GoalCategory.VACATION]: "Vacation",
  [GoalCategory.DEBT_PAYOFF]: "Debt Payoff",
  [GoalCategory.MAJOR_PURCHASE]: "Major Purchase",
  [GoalCategory.INVESTMENT]: "Investment",
  [GoalCategory.OTHER]: "Other",
};

// Priority colors and display names
const priorityConfig = {
  [Priority.LOW]: { color: "text-gray-600", bg: "bg-gray-100", label: "Low" },
  [Priority.MEDIUM]: {
    color: "text-blue-600",
    bg: "bg-blue-100",
    label: "Medium",
  },
  [Priority.HIGH]: {
    color: "text-yellow-600",
    bg: "bg-yellow-100",
    label: "High",
  },
  [Priority.CRITICAL]: {
    color: "text-red-600",
    bg: "bg-red-100",
    label: "Critical",
  },
};

export default function GoalsPage() {
  const { state, addGoal, updateGoal, deleteGoal } = useFinancialContext();
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<
    GoalCategory | "all"
  >("all");
  const [sortBy, setSortBy] = useState<
    "name" | "targetDate" | "progress" | "priority"
  >("targetDate");
  const [showAllocationSchedule, setShowAllocationSchedule] = useState(false);
  const [allocationView, setAllocationView] = useState<"calendar" | "table">(
    "calendar"
  );

  // Form state
  const [formData, setFormData] = useState<CreateGoalInput>({
    name: "",
    targetAmount: 0,
    targetDate: "",
    currentAmount: 0,
    description: "",
    category: GoalCategory.OTHER,
    priority: Priority.MEDIUM,
    isActive: true,
    goalType: GoalType.FIXED_AMOUNT,
    priorityOrder: 1,
  });

  // Get goals from state
  const goals = state.userPlan?.goals || [];

  // Generate monthly allocation schedule
  const allocationSchedule = state.userPlan
    ? generateMonthlyGoalAllocationSchedule(state.userPlan)
    : null;

  // Filter and sort goals
  const filteredGoals = goals
    .filter(
      (goal) => selectedCategory === "all" || goal.category === selectedCategory
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "targetDate":
          return (
            new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
          );
        case "progress":
          const progressA = (a.currentAmount / a.targetAmount) * 100;
          const progressB = (b.currentAmount / b.targetAmount) * 100;
          return progressB - progressA;
        case "priority":
          const priorityOrder = {
            [Priority.CRITICAL]: 4,
            [Priority.HIGH]: 3,
            [Priority.MEDIUM]: 2,
            [Priority.LOW]: 1,
          };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        default:
          return 0;
      }
    });

  // Calculate total progress
  const totalGoalAmount = goals.reduce(
    (sum, goal) => sum + goal.targetAmount,
    0
  );
  const totalCurrentAmount = goals.reduce(
    (sum, goal) => sum + goal.currentAmount,
    0
  );
  const overallProgress =
    totalGoalAmount > 0 ? (totalCurrentAmount / totalGoalAmount) * 100 : 0;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingGoal) {
        await updateGoal({
          id: editingGoal.id,
          ...formData,
        });
      } else {
        await addGoal(formData);
      }

      // Reset form
      setFormData({
        name: "",
        targetAmount: 0,
        targetDate: "",
        currentAmount: 0,
        description: "",
        category: GoalCategory.OTHER,
        priority: Priority.MEDIUM,
        isActive: true,
        goalType: GoalType.FIXED_AMOUNT,
        priorityOrder: 1,
      });
      setIsAddingGoal(false);
      setEditingGoal(null);
    } catch (error) {
      console.error("Failed to save goal:", error);
    }
  };

  // Handle edit goal
  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      targetAmount: goal.targetAmount,
      targetDate: goal.targetDate,
      currentAmount: goal.currentAmount,
      description: goal.description || "",
      category: goal.category,
      priority: goal.priority,
      isActive: goal.isActive,
      goalType: goal.goalType,
      priorityOrder: goal.priorityOrder,
    });
    setIsAddingGoal(true);
  };

  // Handle delete goal
  const handleDelete = async (goalId: string) => {
    if (confirm("Are you sure you want to delete this goal?")) {
      try {
        await deleteGoal(goalId);
      } catch (error) {
        console.error("Failed to delete goal:", error);
      }
    }
  };

  // Calculate progress percentage
  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  // Get progress color
  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "bg-green-500";
    if (percentage >= 75) return "bg-blue-500";
    if (percentage >= 50) return "bg-yellow-500";
    if (percentage >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get days until target
  const getDaysUntilTarget = (targetDate: string) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Calculate goal completion forecast
  const getGoalForecast = (goal: Goal) => {
    const forecastResult = generateForecast(state.userPlan, { months: 12 });
    const goalProgress = forecastResult.goalProgress.find(
      (g) => g.id === goal.id
    );

    if (goalProgress) {
      return {
        estimatedCompletionMonth: goalProgress.estimatedCompletionMonth,
        onTrack: goalProgress.onTrack,
        averageMonthlyAllocation: goalProgress.averageMonthlyAllocation,
      };
    }

    return {
      estimatedCompletionMonth: undefined,
      onTrack: false,
      averageMonthlyAllocation: 0,
    };
  };

  // Format completion date
  const formatCompletionDate = (monthString?: string) => {
    if (!monthString) return "Not determined";

    const date = new Date(monthString + "-01");
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
    });
  };

  // Get goal type label
  const getGoalTypeLabel = (goalType: GoalType) => {
    return goalType === GoalType.FIXED_AMOUNT ? "Fixed Amount" : "Open-Ended";
  };

  // Export functions
  const exportToCSV = () => {
    if (!allocationSchedule) return;

    const headers = [
      "Month",
      "Surplus",
      "Goal",
      "Allocation Amount",
      "Priority",
      "On Track",
      "Guidance",
    ];
    const csvData = [headers];

    allocationSchedule.monthlySchedule.forEach((month) => {
      const monthName = new Date(month.month + "-01").toLocaleDateString(
        "en-US",
        {
          month: "long",
          year: "numeric",
        }
      );

      if (month.goalAllocations.length === 0) {
        csvData.push([
          monthName,
          formatCurrency(month.totalSurplus),
          "No allocations",
          "฿0",
          "-",
          "-",
          month.guidance,
        ]);
      } else {
        month.goalAllocations.forEach((allocation, index) => {
          csvData.push([
            index === 0 ? monthName : "", // Only show month name on first row
            index === 0 ? formatCurrency(month.totalSurplus) : "",
            allocation.goalName,
            formatCurrency(allocation.amount),
            allocation.priority,
            allocation.isOnTrack ? "Yes" : "No",
            index === 0 ? month.guidance : "",
          ]);
        });
      }
    });

    const csvContent = csvData
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `goal-allocation-schedule-${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const exportToPDF = () => {
    if (!allocationSchedule) return;

    // Create a simple HTML content for PDF
    const htmlContent = `
      <html>
        <head>
          <title>Goal Allocation Schedule</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
            .summary { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
            th { background: #f9fafb; font-weight: bold; }
            .on-track { color: #059669; }
            .behind { color: #dc2626; }
            .guidance { font-style: italic; color: #6b7280; max-width: 200px; }
          </style>
        </head>
        <body>
          <h1>📅 Goal Allocation Schedule</h1>
          <div class="summary">
            <h3>Summary</h3>
            <p><strong>Total Allocated:</strong> ${formatCurrency(
              allocationSchedule.summary.totalAllocated
            )}</p>
            <p><strong>Goals On Track:</strong> ${
              allocationSchedule.summary.goalsOnTrack
            }</p>
            <p><strong>Goals Behind Schedule:</strong> ${
              allocationSchedule.summary.goalsBehindSchedule
            }</p>
            <p><strong>Average Monthly Allocation:</strong> ${formatCurrency(
              allocationSchedule.summary.averageMonthlyAllocation
            )}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Surplus</th>
                <th>Goal</th>
                <th>Allocation</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Guidance</th>
              </tr>
            </thead>
            <tbody>
              ${allocationSchedule.monthlySchedule
                .map((month) => {
                  const monthName = new Date(
                    month.month + "-01"
                  ).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  });

                  if (month.goalAllocations.length === 0) {
                    return `
                    <tr>
                      <td>${monthName}</td>
                      <td>${formatCurrency(month.totalSurplus)}</td>
                      <td>No allocations</td>
                      <td>฿0</td>
                      <td>-</td>
                      <td>-</td>
                      <td class="guidance">${month.guidance}</td>
                    </tr>
                  `;
                  } else {
                    return month.goalAllocations
                      .map(
                        (allocation, index) => `
                    <tr>
                      <td>${index === 0 ? monthName : ""}</td>
                      <td>${
                        index === 0 ? formatCurrency(month.totalSurplus) : ""
                      }</td>
                      <td>${allocation.goalName}</td>
                      <td>${formatCurrency(allocation.amount)}</td>
                      <td>${allocation.priority}</td>
                      <td class="${
                        allocation.isOnTrack ? "on-track" : "behind"
                      }">${allocation.isOnTrack ? "On Track" : "Behind"}</td>
                      <td class="guidance">${
                        index === 0 ? month.guidance : ""
                      }</td>
                    </tr>
                  `
                      )
                      .join("");
                  }
                })
                .join("")}
            </tbody>
          </table>
          <p style="margin-top: 30px; color: #6b7280; font-size: 12px;">
            Generated on ${new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })} at ${new Date().toLocaleTimeString("en-US")}
          </p>
        </body>
      </html>
    `;

    // Open in new window for printing
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              🎯 Financial Goals
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Set, track, and achieve your financial objectives
            </p>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Overall Progress
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {overallProgress.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {formatCurrency(totalCurrentAmount)} of{" "}
              {formatCurrency(totalGoalAmount)}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Goals
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {goals.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Target Amount
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(totalGoalAmount)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Current Progress
              </p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(totalCurrentAmount)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Goals
              </p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {goals.filter((g) => g.isActive).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏆</span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Goal Allocation Schedule */}
      {goals.length > 0 && allocationSchedule && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                📅 Monthly Goal Allocation Schedule
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Detailed breakdown of when and how much to allocate to each goal
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setShowAllocationSchedule(!showAllocationSchedule)
                }
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z"
                  />
                </svg>
                {showAllocationSchedule ? "Hide Schedule" : "Show Schedule"}
              </button>

              {showAllocationSchedule && (
                <>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Export:
                  </span>
                  <button
                    onClick={exportToCSV}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors flex items-center gap-1"
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
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    CSV
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors flex items-center gap-1"
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
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    PDF
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                Total Allocated
              </div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {formatCurrency(allocationSchedule.summary.totalAllocated)}
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                Goals On Track
              </div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {allocationSchedule.summary.goalsOnTrack}
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                Behind Schedule
              </div>
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                {allocationSchedule.summary.goalsBehindSchedule}
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                Avg Monthly
              </div>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {formatCurrency(
                  allocationSchedule.summary.averageMonthlyAllocation
                )}
              </div>
            </div>
          </div>

          {/* Monthly Schedule */}
          {showAllocationSchedule && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Monthly Allocation Breakdown
                </h3>
                <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setAllocationView("calendar")}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      allocationView === "calendar"
                        ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    }`}
                  >
                    📅 Calendar
                  </button>
                  <button
                    onClick={() => setAllocationView("table")}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      allocationView === "table"
                        ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    }`}
                  >
                    📋 Table
                  </button>
                </div>
              </div>

              {/* Calendar View */}
              {allocationView === "calendar" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allocationSchedule.monthlySchedule.map((month) => (
                    <div
                      key={month.month}
                      className={`p-4 rounded-lg border-2 ${
                        month.goalAllocations.length > 0
                          ? "border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          {new Date(month.month + "-01").toLocaleDateString(
                            "en-US",
                            {
                              month: "long",
                              year: "numeric",
                            }
                          )}
                        </h4>
                        <div
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            month.totalSurplus > 0
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                          }`}
                        >
                          {month.totalSurplus > 0 ? "+" : ""}
                          {formatCurrency(month.totalSurplus)}
                        </div>
                      </div>

                      {month.goalAllocations.length > 0 ? (
                        <div className="space-y-2">
                          {month.goalAllocations.map((allocation) => (
                            <div
                              key={allocation.goalId}
                              className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-3 h-3 rounded-full ${
                                    allocation.isOnTrack
                                      ? "bg-green-500"
                                      : "bg-red-500"
                                  }`}
                                />
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {allocation.goalName}
                                </span>
                              </div>
                              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                {formatCurrency(allocation.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <span className="text-gray-500 dark:text-gray-400 text-sm">
                            No allocations
                          </span>
                        </div>
                      )}

                      {/* Guidance */}
                      <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          💡 {month.guidance}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Table View */}
              {allocationView === "table" && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                          Month
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                          Surplus
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                          Goal Allocations
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                          Total Allocated
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                          Guidance
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {allocationSchedule.monthlySchedule.map((month) => (
                        <tr
                          key={month.month}
                          className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <td className="py-4 px-4">
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {new Date(month.month + "-01").toLocaleDateString(
                                "en-US",
                                {
                                  month: "long",
                                  year: "numeric",
                                }
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`font-medium ${
                                month.totalSurplus > 0
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {month.totalSurplus > 0 ? "+" : ""}
                              {formatCurrency(month.totalSurplus)}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            {month.goalAllocations.length > 0 ? (
                              <div className="space-y-1">
                                {month.goalAllocations.map((allocation) => (
                                  <div
                                    key={allocation.goalId}
                                    className="flex items-center gap-2"
                                  >
                                    <div
                                      className={`w-2 h-2 rounded-full ${
                                        allocation.isOnTrack
                                          ? "bg-green-500"
                                          : "bg-red-500"
                                      }`}
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                      {allocation.goalName}:{" "}
                                      <span className="font-medium text-blue-600 dark:text-blue-400">
                                        {formatCurrency(allocation.amount)}
                                      </span>
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-500 dark:text-gray-400 text-sm">
                                No allocations
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {formatCurrency(
                                month.goalAllocations.reduce(
                                  (sum, g) => sum + g.amount,
                                  0
                                )
                              )}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs">
                              {month.guidance}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Goals
          </h2>
          <div className="flex items-center gap-3">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) =>
                setSelectedCategory(e.target.value as GoalCategory | "all")
              }
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="all">All Categories</option>
              {Object.entries(goalCategoryNames).map(([key, name]) => (
                <option key={key} value={key}>
                  {goalCategoryIcons[key as GoalCategory]} {name}
                </option>
              ))}
            </select>

            {/* Sort Options */}
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value as
                    | "name"
                    | "targetDate"
                    | "progress"
                    | "priority"
                )
              }
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="targetDate">Sort by Target Date</option>
              <option value="name">Sort by Name</option>
              <option value="progress">Sort by Progress</option>
              <option value="priority">Sort by Priority</option>
            </select>
          </div>
        </div>

        {/* Add Goal Button */}
        <button
          onClick={() => setIsAddingGoal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
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
          Add Goal
        </button>
      </div>

      {/* Add/Edit Goal Form */}
      {isAddingGoal && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {editingGoal ? "Edit Goal" : "Add New Goal"}
          </h3>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Goal Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as GoalCategory,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                required
              >
                {Object.entries(goalCategoryNames).map(([key, name]) => (
                  <option key={key} value={key}>
                    {goalCategoryIcons[key as GoalCategory]} {name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Amount (THB) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.targetAmount || ""}
                onFocus={(e) => e.target.value === "0" && (e.target.value = "")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    targetAmount: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Amount (THB)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.currentAmount || ""}
                onFocus={(e) => e.target.value === "0" && (e.target.value = "")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    currentAmount: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Date *
              </label>
              <input
                type="date"
                value={formData.targetDate}
                onChange={(e) =>
                  setFormData({ ...formData, targetDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: e.target.value as Priority,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              >
                {Object.entries(priorityConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Goal Type
              </label>
              <select
                value={formData.goalType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    goalType: e.target.value as GoalType,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              >
                <option value={GoalType.FIXED_AMOUNT}>Fixed Amount</option>
                <option value={GoalType.OPEN_ENDED}>Open-Ended</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Fixed amount goals stop receiving allocation once target is
                reached
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority Order
              </label>
              <input
                type="number"
                min="1"
                value={formData.priorityOrder}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priorityOrder: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                placeholder="1"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Lower numbers get higher priority for surplus allocation
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                placeholder="Optional description or notes about this goal..."
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddingGoal(false);
                  setEditingGoal(null);
                  setFormData({
                    name: "",
                    targetAmount: 0,
                    targetDate: "",
                    currentAmount: 0,
                    description: "",
                    category: GoalCategory.OTHER,
                    priority: Priority.MEDIUM,
                    isActive: true,
                    goalType: GoalType.FIXED_AMOUNT,
                    priorityOrder: 1,
                  });
                }}
                className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingGoal ? "Update Goal" : "Add Goal"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goals List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        {filteredGoals.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-4 text-gray-300 dark:text-gray-600">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No goals yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Start by adding your first financial goal to track your progress
            </p>
            <button
              onClick={() => setIsAddingGoal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Your First Goal
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredGoals.map((goal) => {
              const progress = getProgressPercentage(
                goal.currentAmount,
                goal.targetAmount
              );
              const daysUntilTarget = getDaysUntilTarget(goal.targetDate);
              const isOverdue = daysUntilTarget < 0;
              const isCompleted = progress >= 100;

              const forecast = getGoalForecast(goal);
              const completionDate = formatCompletionDate(
                forecast.estimatedCompletionMonth
              );
              const goalTypeLabel = getGoalTypeLabel(goal.goalType);

              return (
                <div key={goal.id} className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Goal Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">
                          {goalCategoryIcons[goal.category]}
                        </span>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {goal.name}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                priorityConfig[goal.priority].bg
                              } ${priorityConfig[goal.priority].color}`}
                            >
                              {priorityConfig[goal.priority].label}
                            </span>
                            <span>{goalCategoryNames[goal.category]}</span>
                          </div>
                        </div>
                      </div>

                      {goal.description && (
                        <p className="text-gray-600 dark:text-gray-300 mb-3">
                          {goal.description}
                        </p>
                      )}

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                          <span>Progress</span>
                          <span>{progress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(
                              progress
                            )}`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Goal Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Current
                          </p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(goal.currentAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Target
                          </p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(goal.targetAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Remaining
                          </p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(
                              goal.targetAmount - goal.currentAmount
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Target Date
                          </p>
                          <p
                            className={`font-semibold ${
                              isOverdue
                                ? "text-red-600 dark:text-red-400"
                                : "text-gray-900 dark:text-gray-100"
                            }`}
                          >
                            {formatDate(goal.targetDate)}
                          </p>
                          {!isCompleted && (
                            <p
                              className={`text-xs ${
                                isOverdue
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-gray-600 dark:text-gray-400"
                              }`}
                            >
                              {isOverdue
                                ? `${Math.abs(daysUntilTarget)} days overdue`
                                : `${daysUntilTarget} days left`}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Forecast Information */}
                      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                          📊 Forecast & Allocation
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">
                              Goal Type
                            </p>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {goalTypeLabel}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">
                              Priority Order
                            </p>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              #{goal.priorityOrder}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">
                              Monthly Allocation
                            </p>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {formatCurrency(
                                forecast.averageMonthlyAllocation
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">
                              Est. Completion
                            </p>
                            <p
                              className={`font-semibold ${
                                forecast.onTrack
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {completionDate}
                            </p>
                            {!isCompleted && (
                              <p
                                className={`text-xs ${
                                  forecast.onTrack
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                                }`}
                              >
                                {forecast.onTrack
                                  ? "On Track"
                                  : "Behind Schedule"}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {isCompleted && (
                        <span className="text-green-600 text-2xl">✅</span>
                      )}
                      <button
                        onClick={() => handleEdit(goal)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Edit goal"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete goal"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
