"use client";

import React, { useState } from "react";
import { useFinancialState, useFinancialActions } from "@/context";
import {
  Frequency,
  ExpenseCategory,
  Priority,
  CreateExpenseInput,
  UpdateExpenseInput,
} from "@/types";
import { formatCurrency } from "@/utils/currency";

export default function ExpensesPage() {
  const state = useFinancialState();
  const { addExpense, updateExpense, deleteExpense } = useFinancialActions();

  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<
    ExpenseCategory | "all"
  >("all");
  const [formData, setFormData] = useState<CreateExpenseInput>({
    name: "",
    amount: 0,
    category: ExpenseCategory.MISCELLANEOUS,
    dueDate: "",
    recurring: false,
    frequency: Frequency.MONTHLY,
    description: "",
    priority: Priority.MEDIUM,
    isActive: true,
    isInstallment: false,
    installmentMonths: 1,
    installmentStartMonth: "",
  });

  const handleInputChange = (
    field: keyof CreateExpenseInput,
    value: string | number | boolean | Frequency | ExpenseCategory | Priority
  ) => {
    setFormData((prev) => {
      const newData = {
        ...prev,
        [field]: value,
      };

      // Auto-populate installment start month when installment is enabled
      if (
        field === "isInstallment" &&
        value === true &&
        !prev.installmentStartMonth
      ) {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        newData.installmentStartMonth = nextMonth.toISOString().slice(0, 7); // YYYY-MM format
      }

      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingExpense) {
        // Update existing expense
        const updateData: UpdateExpenseInput = {
          id: editingExpense,
          ...formData,
        };
        await updateExpense(updateData);
        setEditingExpense(null);
      } else {
        // Add new expense
        await addExpense(formData);
        setIsAddFormOpen(false);
      }

      // Reset form
      setFormData({
        name: "",
        amount: 0,
        category: ExpenseCategory.MISCELLANEOUS,
        dueDate: "",
        recurring: false,
        frequency: Frequency.MONTHLY,
        description: "",
        priority: Priority.MEDIUM,
        isActive: true,
        isInstallment: false,
        installmentMonths: 1,
        installmentStartMonth: "",
      });
    } catch (error) {
      console.error("Failed to save expense:", error);
    }
  };

  const handleEdit = (expense: {
    id: string;
    name: string;
    amount: number;
    category: ExpenseCategory;
    frequency?: Frequency;
    description?: string;
    dueDate: string;
    recurring: boolean;
    priority: Priority;
    isActive: boolean;
    isInstallment?: boolean;
    installmentMonths?: number;
    installmentStartMonth?: string;
  }) => {
    setFormData({
      name: expense.name,
      amount: expense.amount,
      category: expense.category,
      frequency: expense.frequency || Frequency.MONTHLY,
      description: expense.description || "",
      dueDate: expense.dueDate ? expense.dueDate.split("T")[0] : "",
      recurring: expense.recurring,
      priority: expense.priority,
      isActive: expense.isActive,
      isInstallment: expense.isInstallment || false,
      installmentMonths: expense.installmentMonths || 1,
      installmentStartMonth: expense.installmentStartMonth || "",
    });
    setEditingExpense(expense.id);
    setIsAddFormOpen(true);
  };

  const handleDelete = async (expenseId: string) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      try {
        await deleteExpense(expenseId);
      } catch (error) {
        console.error("Failed to delete expense:", error);
      }
    }
  };

  const handleCancel = () => {
    setIsAddFormOpen(false);
    setEditingExpense(null);
    setFormData({
      name: "",
      amount: 0,
      category: ExpenseCategory.MISCELLANEOUS,
      dueDate: "",
      recurring: false,
      frequency: Frequency.MONTHLY,
      description: "",
      priority: Priority.MEDIUM,
      isActive: true,
      isInstallment: false,
      installmentMonths: 1,
      installmentStartMonth: "",
    });
  };

  const getCategoryLabel = (category: ExpenseCategory) => {
    return category
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const getFrequencyLabel = (frequency: Frequency) => {
    return (
      frequency.charAt(0).toUpperCase() +
      frequency.slice(1).toLowerCase().replace("_", " ")
    );
  };

  const calculateMonthlyAmount = (expense: {
    amount: number;
    frequency?: Frequency;
    isInstallment?: boolean;
    installmentMonths?: number;
  }) => {
    // Handle installment expenses
    if (expense.isInstallment && expense.installmentMonths) {
      return expense.amount / expense.installmentMonths;
    }

    if (!expense.frequency) return 0;

    switch (expense.frequency) {
      case Frequency.DAILY:
        return expense.amount * 30.44;
      case Frequency.WEEKLY:
        return expense.amount * 4.33;
      case Frequency.BIWEEKLY:
        return expense.amount * 2.17;
      case Frequency.MONTHLY:
        return expense.amount;
      case Frequency.QUARTERLY:
        return expense.amount / 3;
      case Frequency.YEARLY:
        return expense.amount / 12;
      case Frequency.ONE_TIME:
        return 0; // One-time expenses don't contribute to monthly
      default:
        return expense.amount;
    }
  };

  const filteredExpenses =
    selectedCategory === "all"
      ? state.userPlan.expenses
      : state.userPlan.expenses.filter(
          (expense) => expense.category === selectedCategory
        );

  const totalMonthlyExpenses = state.userPlan.expenses
    .filter((expense) => expense.isActive)
    .reduce((total, expense) => total + calculateMonthlyAmount(expense), 0);

  const expensesByCategory = Object.values(ExpenseCategory)
    .map((category) => ({
      category,
      count: state.userPlan.expenses.filter(
        (expense) => expense.category === category && expense.isActive
      ).length,
      total: state.userPlan.expenses
        .filter((expense) => expense.category === category && expense.isActive)
        .reduce((sum, expense) => sum + calculateMonthlyAmount(expense), 0),
    }))
    .filter((item) => item.count > 0);

  const recurringExpenses = state.userPlan.expenses.filter(
    (expense) => expense.recurring && expense.isActive
  );

  const getCategoryIcon = (category: ExpenseCategory) => {
    switch (category) {
      case ExpenseCategory.HOUSING:
        return "🏠";
      case ExpenseCategory.FOOD:
        return "🍽️";
      case ExpenseCategory.TRANSPORTATION:
        return "🚗";
      case ExpenseCategory.UTILITIES:
        return "⚡";
      case ExpenseCategory.HEALTHCARE:
        return "🏥";
      case ExpenseCategory.ENTERTAINMENT:
        return "🎬";
      case ExpenseCategory.PERSONAL_CARE:
        return "💄";
      case ExpenseCategory.EDUCATION:
        return "📚";
      case ExpenseCategory.SAVINGS:
        return "💰";
      case ExpenseCategory.DEBT_PAYMENTS:
        return "💳";
      case ExpenseCategory.INSURANCE:
        return "🛡️";
      case ExpenseCategory.TRAVEL:
        return "✈️";
      case ExpenseCategory.SHOPPING:
        return "🛍️";
      case ExpenseCategory.KIDS:
        return "👶";
      case ExpenseCategory.MISCELLANEOUS:
        return "📦";
      default:
        return "📦";
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              💳 Expense Tracking
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Track your spending, categorize expenses, and manage your budget
            </p>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total Monthly Expenses
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(totalMonthlyExpenses)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              from {state.userPlan.expenses.filter((e) => e.isActive).length}{" "}
              active expenses
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
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
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Total Expenses
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {state.userPlan.expenses.length}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <div className="ml-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Recurring
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {recurringExpenses.length}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Categories
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {expensesByCategory.length}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <svg
                className="w-6 h-6 text-purple-600 dark:text-purple-400"
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
            <div className="ml-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Yearly Total
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(totalMonthlyExpenses * 12)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Expenses
          </h2>
          <select
            value={selectedCategory}
            onChange={(e) =>
              setSelectedCategory(e.target.value as ExpenseCategory | "all")
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="all">All Categories</option>
            {Object.values(ExpenseCategory).map((category) => (
              <option key={category} value={category}>
                {getCategoryIcon(category)} {getCategoryLabel(category)}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setIsAddFormOpen(true)}
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
          Add Expense
        </button>
      </div>

      {/* Add/Edit Form */}
      {isAddFormOpen && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {editingExpense ? "Edit Expense" : "Add New Expense"}
          </h3>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expense Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                placeholder="e.g., Rent, Groceries, Gas"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount (THB) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.amount === 0 ? "" : formData.amount}
                onChange={(e) =>
                  handleInputChange("amount", parseFloat(e.target.value) || 0)
                }
                onFocus={(e) => {
                  if (e.target.value === "0") {
                    e.target.value = "";
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) =>
                  handleInputChange(
                    "category",
                    e.target.value as ExpenseCategory
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              >
                {Object.values(ExpenseCategory).map((category) => (
                  <option key={category} value={category}>
                    {getCategoryIcon(category)} {getCategoryLabel(category)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Due Date *
              </label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => handleInputChange("dueDate", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  handleInputChange("priority", e.target.value as Priority)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              >
                {Object.values(Priority).map((priority) => (
                  <option key={priority} value={priority}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.recurring}
                  onChange={(e) =>
                    handleInputChange("recurring", e.target.checked)
                  }
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Recurring expense
                </span>
              </label>
            </div>

            {formData.recurring && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Frequency
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) =>
                    handleInputChange("frequency", e.target.value as Frequency)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                >
                  {Object.values(Frequency).map((freq) => (
                    <option key={freq} value={freq}>
                      {getFrequencyLabel(freq)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isInstallment}
                  onChange={(e) =>
                    handleInputChange("isInstallment", e.target.checked)
                  }
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Pay in installments
                </span>
              </label>
            </div>

            {formData.isInstallment && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Number of Months
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formData.installmentMonths}
                    onChange={(e) =>
                      handleInputChange(
                        "installmentMonths",
                        parseInt(e.target.value) || 1
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                    placeholder="12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Starting Month
                  </label>
                  <input
                    type="month"
                    value={formData.installmentStartMonth}
                    onChange={(e) =>
                      handleInputChange("installmentStartMonth", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              </>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                placeholder="Additional details about this expense..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    handleInputChange("isActive", e.target.checked)
                  }
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Active expense
                </span>
              </label>
            </div>

            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={state.loading.isLoadingExpenses}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {state.loading.isLoadingExpenses
                  ? "Saving..."
                  : editingExpense
                  ? "Update Expense"
                  : "Add Expense"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Expenses List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-4 text-gray-300 dark:text-gray-600">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {selectedCategory === "all"
                ? "No expenses yet"
                : `No ${getCategoryLabel(
                    selectedCategory as ExpenseCategory
                  ).toLowerCase()} expenses`}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {selectedCategory === "all"
                ? "Start by adding your first expense to track your spending"
                : `Add your first ${getCategoryLabel(
                    selectedCategory as ExpenseCategory
                  ).toLowerCase()} expense`}
            </p>
            <button
              onClick={() => setIsAddFormOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Your First Expense
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredExpenses.map((expense) => (
              <div key={expense.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">
                        {getCategoryIcon(expense.category)}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {expense.name}
                      </h3>
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {getCategoryLabel(expense.category)}
                      </span>
                      {expense.recurring && (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Recurring
                        </span>
                      )}
                      {expense.isInstallment && (
                        <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          Installment ({expense.installmentMonths} months)
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          expense.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                        }`}
                      >
                        {expense.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Amount
                        </div>
                        <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          {formatCurrency(expense.amount)}{" "}
                          {expense.frequency && (
                            <span className="text-sm text-gray-500">
                              / {getFrequencyLabel(expense.frequency)}
                            </span>
                          )}
                        </div>
                        {expense.isInstallment && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {formatCurrency(
                              expense.amount / (expense.installmentMonths || 1)
                            )}{" "}
                            per month
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Monthly Equivalent
                        </div>
                        <div className="text-lg font-medium text-red-600 dark:text-red-400">
                          {formatCurrency(calculateMonthlyAmount(expense))}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {expense.isInstallment ? "Start Date" : "Due Date"}
                        </div>
                        <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          {expense.isInstallment &&
                          expense.installmentStartMonth
                            ? new Date(
                                expense.installmentStartMonth + "-01"
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                              })
                            : expense.dueDate
                            ? new Date(expense.dueDate).toLocaleDateString()
                            : "Not set"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Type
                        </div>
                        <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          {expense.isInstallment
                            ? `Installment (${expense.installmentMonths} months)`
                            : expense.recurring
                            ? "Recurring"
                            : "One-time"}
                        </div>
                      </div>
                    </div>

                    {expense.description && (
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        {expense.description}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(expense)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit expense"
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete expense"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error Display */}
      {state.error.expenseError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <svg
              className="w-5 h-5 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {state.error.expenseError}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
