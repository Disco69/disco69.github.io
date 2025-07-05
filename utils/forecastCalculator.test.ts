/**
 * Test cases for forecast calculator
 *
 * This file contains comprehensive tests to verify that the forecast calculation
 * fixes are working correctly, particularly for one-time expenses, installments,
 * and goal allocations.
 */

import {
  generateForecast,
  isExpenseActiveInMonth,
  calculateSmartGoalAllocations,
} from "./forecastCalculator";
import {
  UserPlan,
  Expense,
  Goal,
  Income,
  Frequency,
  ExpenseCategory,
  Priority,
  GoalCategory,
  GoalType,
} from "@/types";

/**
 * Test data for forecast calculations
 */
const createTestUserPlan = (): UserPlan => {
  const testIncome: Income[] = [
    {
      id: "income-1",
      name: "Monthly Salary",
      amount: 50000,
      frequency: Frequency.MONTHLY,
      startDate: "2024-01-01",
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
  ];

  const testExpenses: Expense[] = [
    // Recurring monthly expense
    {
      id: "expense-1",
      name: "Rent",
      amount: 15000,
      category: ExpenseCategory.HOUSING,
      dueDate: "2024-01-01",
      recurring: true,
      frequency: Frequency.MONTHLY,
      priority: Priority.HIGH,
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
    // One-time expense (should only appear in March)
    {
      id: "expense-2",
      name: "One-time Purchase",
      amount: 10000,
      category: ExpenseCategory.SHOPPING,
      dueDate: "2024-03-15",
      recurring: false,
      frequency: Frequency.ONE_TIME,
      priority: Priority.MEDIUM,
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
    // Installment expense (3 months starting February)
    {
      id: "expense-3",
      name: "Installment Purchase",
      amount: 6000,
      category: ExpenseCategory.MISCELLANEOUS,
      dueDate: "2024-02-01",
      recurring: false,
      priority: Priority.LOW,
      isActive: true,
      isInstallment: true,
      installmentMonths: 3,
      installmentStartMonth: "2024-02",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
  ];

  const testGoals: Goal[] = [
    {
      id: "goal-1",
      name: "Emergency Fund",
      targetAmount: 100000,
      currentAmount: 20000,
      targetDate: "2024-12-31",
      category: GoalCategory.EMERGENCY_FUND,
      priority: Priority.HIGH,
      isActive: true,
      goalType: GoalType.FIXED_AMOUNT,
      priorityOrder: 1,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
  ];

  return {
    id: "test-plan",
    income: testIncome,
    expenses: testExpenses,
    goals: testGoals,
    forecast: [],
    currentBalance: 10000,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  };
};

/**
 * Test: One-time expenses should only appear in their due month
 */
export function testOneTimeExpenses(): { passed: boolean; message: string } {
  const testPlan = createTestUserPlan();
  const oneTimeExpense = testPlan.expenses[1]; // One-time purchase in March

  // Test different months
  const january = new Date("2024-01-01");
  const february = new Date("2024-02-01");
  const march = new Date("2024-03-01");
  const april = new Date("2024-04-01");

  const januaryActive = isExpenseActiveInMonth(oneTimeExpense, january);
  const februaryActive = isExpenseActiveInMonth(oneTimeExpense, february);
  const marchActive = isExpenseActiveInMonth(oneTimeExpense, march);
  const aprilActive = isExpenseActiveInMonth(oneTimeExpense, april);

  if (!januaryActive && !februaryActive && marchActive && !aprilActive) {
    return {
      passed: true,
      message: "One-time expenses correctly appear only in their due month",
    };
  } else {
    return {
      passed: false,
      message: `One-time expense activity: Jan=${januaryActive}, Feb=${februaryActive}, Mar=${marchActive}, Apr=${aprilActive}. Expected: false, false, true, false`,
    };
  }
}

/**
 * Test: Installment expenses should appear in correct months
 */
export function testInstallmentExpenses(): {
  passed: boolean;
  message: string;
} {
  const testPlan = createTestUserPlan();
  const installmentExpense = testPlan.expenses[2]; // 3-month installment starting February

  // Test different months
  const january = new Date("2024-01-01");
  const february = new Date("2024-02-01");
  const march = new Date("2024-03-01");
  const april = new Date("2024-04-01");
  const may = new Date("2024-05-01");

  const januaryActive = isExpenseActiveInMonth(installmentExpense, january);
  const februaryActive = isExpenseActiveInMonth(installmentExpense, february);
  const marchActive = isExpenseActiveInMonth(installmentExpense, march);
  const aprilActive = isExpenseActiveInMonth(installmentExpense, april);
  const mayActive = isExpenseActiveInMonth(installmentExpense, may);

  if (
    !januaryActive &&
    februaryActive &&
    marchActive &&
    aprilActive &&
    !mayActive
  ) {
    return {
      passed: true,
      message:
        "Installment expenses correctly appear in their installment period",
    };
  } else {
    return {
      passed: false,
      message: `Installment expense activity: Jan=${januaryActive}, Feb=${februaryActive}, Mar=${marchActive}, Apr=${aprilActive}, May=${mayActive}. Expected: false, true, true, true, false`,
    };
  }
}

/**
 * Test: Balance calculation should decrease when expenses exceed income
 */
export function testBalanceCalculation(): { passed: boolean; message: string } {
  const testPlan = createTestUserPlan();

  // Modify to create a scenario where expenses exceed income in some months
  testPlan.expenses[0].amount = 60000; // Rent higher than income

  const forecast = generateForecast(testPlan, {
    months: 3,
    startingBalance: 50000,
    includeGoalContributions: false, // Disable goals to focus on income/expense balance
  });

  // Check if balance decreases
  const firstMonth = forecast.monthlyForecasts[0];
  const secondMonth = forecast.monthlyForecasts[1];

  if (
    firstMonth.netChange < 0 &&
    secondMonth.startingBalance < firstMonth.startingBalance
  ) {
    return {
      passed: true,
      message: "Balance correctly decreases when expenses exceed income",
    };
  } else {
    return {
      passed: false,
      message: `Expected decreasing balance. First month net: ${firstMonth.netChange}, Starting balances: ${firstMonth.startingBalance} -> ${secondMonth.startingBalance}`,
    };
  }
}

/**
 * Test: Goal allocation should only occur when there's surplus
 */
export function testGoalAllocation(): { passed: boolean; message: string } {
  const testGoals: Goal[] = [
    {
      id: "test-goal",
      name: "Test Goal",
      targetAmount: 50000,
      currentAmount: 0,
      targetDate: "2024-12-31",
      category: GoalCategory.OTHER,
      priority: Priority.MEDIUM,
      isActive: true,
      goalType: GoalType.FIXED_AMOUNT,
      priorityOrder: 1,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
  ];

  // Test with positive surplus
  const positiveAllocation = calculateSmartGoalAllocations(
    testGoals,
    10000,
    new Date("2024-01-01")
  );

  // Test with negative surplus
  const negativeAllocation = calculateSmartGoalAllocations(
    testGoals,
    -5000,
    new Date("2024-01-01")
  );

  if (positiveAllocation.length > 0 && negativeAllocation.length === 0) {
    return {
      passed: true,
      message: "Goal allocation correctly handles surplus vs deficit scenarios",
    };
  } else {
    return {
      passed: false,
      message: `Goal allocation failed. Positive surplus allocations: ${positiveAllocation.length}, Negative surplus allocations: ${negativeAllocation.length}`,
    };
  }
}

/**
 * Run all tests and return results
 */
export function runAllForecastTests(): {
  passed: number;
  failed: number;
  results: Array<{ test: string; passed: boolean; message: string }>;
} {
  const tests = [
    { name: "One-time Expenses", test: testOneTimeExpenses },
    { name: "Installment Expenses", test: testInstallmentExpenses },
    { name: "Balance Calculation", test: testBalanceCalculation },
    { name: "Goal Allocation", test: testGoalAllocation },
  ];

  const results = tests.map(({ name, test }) => {
    try {
      const result = test();
      return { test: name, ...result };
    } catch (error) {
      return {
        test: name,
        passed: false,
        message: `Test failed with error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  });

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return { passed, failed, results };
}

/**
 * Console-friendly test runner
 */
export function logTestResults(): void {
  console.log("🧪 Running Forecast Calculator Tests...\n");

  const { passed, failed, results } = runAllForecastTests();

  results.forEach(({ test, passed: testPassed, message }) => {
    const icon = testPassed ? "✅" : "❌";
    console.log(`${icon} ${test}: ${message}`);
  });

  console.log(`\n📊 Test Summary: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log(
      "🎉 All tests passed! Forecast calculations are working correctly."
    );
  } else {
    console.log(
      "⚠️  Some tests failed. Please review the forecast calculation logic."
    );
  }
}
