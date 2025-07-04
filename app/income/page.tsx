"use client";

import React, { useState } from "react";
import { useFinancialState, useFinancialActions } from "@/context";
import { Frequency, CreateIncomeInput, UpdateIncomeInput } from "@/types";

export default function IncomePage() {
  const state = useFinancialState();
  const { addIncome, updateIncome, deleteIncome } = useFinancialActions();

  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateIncomeInput>({
    name: "",
    amount: 0,
    frequency: Frequency.MONTHLY,
    description: "",
    startDate: new Date().toISOString().split("T")[0],
    isActive: true,
  });

  const handleInputChange = (
    field: keyof CreateIncomeInput,
    value: string | number | boolean | Frequency
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingIncome) {
        // Update existing income
        const updateData: UpdateIncomeInput = {
          id: editingIncome,
          ...formData,
        };
        await updateIncome(updateData);
        setEditingIncome(null);
      } else {
        // Add new income
        await addIncome(formData);
        setIsAddFormOpen(false);
      }

      // Reset form
      setFormData({
        name: "",
        amount: 0,
        frequency: Frequency.MONTHLY,
        description: "",
        startDate: new Date().toISOString().split("T")[0],
        isActive: true,
      });
    } catch (error) {
      console.error("Failed to save income:", error);
    }
  };

  const handleEdit = (income: {
    id: string;
    name: string;
    amount: number;
    frequency: Frequency;
    description?: string;
    startDate?: string;
    isActive: boolean;
  }) => {
    setFormData({
      name: income.name,
      amount: income.amount,
      frequency: income.frequency,
      description: income.description || "",
      startDate: income.startDate
        ? income.startDate.split("T")[0]
        : new Date().toISOString().split("T")[0],
      isActive: income.isActive,
    });
    setEditingIncome(income.id);
    setIsAddFormOpen(true);
  };

  const handleDelete = async (incomeId: string) => {
    if (window.confirm("Are you sure you want to delete this income source?")) {
      try {
        await deleteIncome(incomeId);
      } catch (error) {
        console.error("Failed to delete income:", error);
      }
    }
  };

  const handleCancel = () => {
    setIsAddFormOpen(false);
    setEditingIncome(null);
    setFormData({
      name: "",
      amount: 0,
      frequency: Frequency.MONTHLY,
      description: "",
      startDate: new Date().toISOString().split("T")[0],
      isActive: true,
    });
  };

  const getFrequencyLabel = (frequency: Frequency) => {
    return (
      frequency.charAt(0).toUpperCase() +
      frequency.slice(1).toLowerCase().replace("_", " ")
    );
  };

  const calculateMonthlyAmount = (amount: number, frequency: Frequency) => {
    switch (frequency) {
      case Frequency.DAILY:
        return amount * 30.44; // Average days per month
      case Frequency.WEEKLY:
        return amount * 4.33; // Average weeks per month
      case Frequency.BIWEEKLY:
        return amount * 2.17; // Average bi-weeks per month
      case Frequency.MONTHLY:
        return amount;
      case Frequency.QUARTERLY:
        return amount / 3;
      case Frequency.YEARLY:
        return amount / 12;
      case Frequency.ONE_TIME:
        return 0; // One-time payments don't contribute to monthly
      default:
        return amount;
    }
  };

  const totalMonthlyIncome = state.userPlan.income
    .filter((income) => income.isActive)
    .reduce(
      (total, income) =>
        total + calculateMonthlyAmount(income.amount, income.frequency),
      0
    );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              �� Income Management
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Manage your income sources and track your earning potential
            </p>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total Monthly Income
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              $${totalMonthlyIncome.toFixed(2)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              from ${state.userPlan.income.filter((i) => i.isActive).length}{" "}
              active sources
            </div>
          </div>
        </div>
      </div>

      {/* Add Income Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Income Sources
        </h2>
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
          Add Income Source
        </button>
      </div>

      {/* Add/Edit Form */}
      {isAddFormOpen && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {editingIncome ? "Edit Income Source" : "Add New Income Source"}
          </h3>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Income Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                placeholder="e.g., Salary, Freelance, Investment"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  handleInputChange("amount", parseFloat(e.target.value) || 0)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Frequency *
              </label>
              <select
                required
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

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange("startDate", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

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
                placeholder="Additional details about this income source..."
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
                  Active income source
                </span>
              </label>
            </div>

            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={state.loading.isLoadingIncome}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {state.loading.isLoadingIncome
                  ? "Saving..."
                  : editingIncome
                  ? "Update Income"
                  : "Add Income"}
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

      {/* Income List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        {state.userPlan.income.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-4 text-gray-300 dark:text-gray-600">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No income sources yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Start by adding your first income source to track your earnings
            </p>
            <button
              onClick={() => setIsAddFormOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Your First Income
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {state.userPlan.income.map((income) => (
              <div key={income.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {income.name}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          income.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                        }`}
                      >
                        {income.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Amount
                        </div>
                        <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          $${income.amount.toFixed(2)}{" "}
                          <span className="text-sm text-gray-500">
                            / {getFrequencyLabel(income.frequency)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Monthly Equivalent
                        </div>
                        <div className="text-lg font-medium text-green-600 dark:text-green-400">
                          $$
                          {calculateMonthlyAmount(
                            income.amount,
                            income.frequency
                          ).toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Start Date
                        </div>
                        <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          {income.startDate
                            ? new Date(income.startDate).toLocaleDateString()
                            : "Not set"}
                        </div>
                      </div>
                    </div>

                    {income.description && (
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        {income.description}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(income)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit income"
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
                      onClick={() => handleDelete(income.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete income"
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
      {state.error.incomeError && (
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
                {state.error.incomeError}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
