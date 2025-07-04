"use client";

import { useFinancialState, useFinancialActions } from "@/context";
import { Frequency, ExpenseCategory, Priority } from "@/types";

export default function TestContextPage() {
  const state = useFinancialState();
  const { addIncome, addExpense, saveUserPlan, loadUserPlan } =
    useFinancialActions();

  const handleAddTestIncome = async () => {
    try {
      await addIncome({
        name: "Test Salary",
        amount: 5000,
        frequency: Frequency.MONTHLY,
        description: "Monthly salary for testing",
        startDate: new Date().toISOString(),
        isActive: true,
      });
    } catch (error) {
      console.error("Failed to add income:", error);
    }
  };

  const handleAddTestExpense = async () => {
    try {
      await addExpense({
        name: "Test Rent",
        amount: 1200,
        category: ExpenseCategory.HOUSING,
        dueDate: new Date().toISOString(),
        recurring: true,
        frequency: Frequency.MONTHLY,
        description: "Monthly rent for testing",
        priority: Priority.HIGH,
        isActive: true,
      });
    } catch (error) {
      console.error("Failed to add expense:", error);
    }
  };

  const handleSave = async () => {
    try {
      await saveUserPlan();
      alert("User plan saved successfully!");
    } catch (error) {
      console.error("Failed to save:", error);
      alert("Failed to save user plan");
    }
  };

  const handleLoad = async () => {
    try {
      await loadUserPlan();
      alert("User plan loaded successfully!");
    } catch (error) {
      console.error("Failed to load:", error);
      alert("Failed to load user plan");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          🧪 Financial Context Test Page
        </h1>

        <div className="grid md:grid-cols-2 gap-6">
          {/* State Display */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Current State
            </h2>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Loading States
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <div>
                  General Loading: {state.loading.isLoading ? "✅" : "❌"}
                </div>
                <div>
                  Income Loading: {state.loading.isLoadingIncome ? "✅" : "❌"}
                </div>
                <div>
                  Expense Loading:{" "}
                  {state.loading.isLoadingExpenses ? "✅" : "❌"}
                </div>
                <div>Saving: {state.loading.isSaving ? "✅" : "❌"}</div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                User Plan Data
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <div>Income Count: {state.userPlan.income.length}</div>
                <div>Expense Count: {state.userPlan.expenses.length}</div>
                <div>Goal Count: {state.userPlan.goals.length}</div>
                <div>
                  Current Balance: ${state.userPlan.currentBalance.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Financial Summary
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <div>
                  Monthly Income: $
                  {state.financialSummary.totalMonthlyIncome.toFixed(2)}
                </div>
                <div>
                  Monthly Expenses: $
                  {state.financialSummary.totalMonthlyExpenses.toFixed(2)}
                </div>
                <div>
                  Savings Rate: {state.financialSummary.savingsRate.toFixed(1)}%
                </div>
                <div>
                  Projected Balance: $
                  {state.financialSummary.projectedBalance.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Test Actions
            </h2>

            <div className="space-y-3">
              <button
                onClick={handleAddTestIncome}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Test Income
              </button>

              <button
                onClick={handleAddTestExpense}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Add Test Expense
              </button>

              <button
                onClick={handleSave}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Save to Storage
              </button>

              <button
                onClick={handleLoad}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Load from Storage
              </button>
            </div>
          </div>
        </div>

        {/* Income List */}
        {state.userPlan.income.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Income Sources
            </h3>
            <div className="space-y-2">
              {state.userPlan.income.map((income) => (
                <div
                  key={income.id}
                  className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {income.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        ${income.amount} {income.frequency.toLowerCase()}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {income.isActive ? "✅ Active" : "❌ Inactive"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expense List */}
        {state.userPlan.expenses.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Expenses
            </h3>
            <div className="space-y-2">
              {state.userPlan.expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {expense.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        ${expense.amount} - {expense.category} -{" "}
                        {expense.priority} priority
                      </p>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {expense.isActive ? "✅ Active" : "❌ Inactive"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
