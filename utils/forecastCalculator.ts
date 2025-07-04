/**
 * Financial Forecast Calculator
 *
 * This utility calculates financial projections based on current income, expenses, and goals.
 * It generates month-by-month forecasts considering recurring transactions and goal contributions.
 */

import {
  Income,
  Expense,
  Goal,
  Frequency,
  Forecast,
  UserPlan,
  Priority,
} from "@/types";

/**
 * Configuration for forecast calculation
 */
export interface ForecastConfig {
  /** Number of months to project (default: 12) */
  months: number;
  /** Starting balance (default: 0) */
  startingBalance: number;
  /** Starting date for projection (default: current date) */
  startDate?: Date;
  /** Whether to include goal contributions in projections */
  includeGoalContributions: boolean;
  /** Conservative mode reduces income by 10% and increases expenses by 10% */
  conservativeMode: boolean;
}

/**
 * Detailed monthly forecast data
 */
export interface MonthlyForecast {
  /** Month identifier (YYYY-MM) */
  month: string;
  /** Starting balance for the month */
  startingBalance: number;
  /** Total income for the month */
  income: number;
  /** Total expenses for the month */
  expenses: number;
  /** Goal contributions for the month */
  goalContributions: number;
  /** Net change (income - expenses - goal contributions) */
  netChange: number;
  /** Ending balance for the month */
  endingBalance: number;
  /** Breakdown by income sources */
  incomeBreakdown: Array<{
    id: string;
    name: string;
    amount: number;
  }>;
  /** Breakdown by expense categories */
  expenseBreakdown: Array<{
    id: string;
    name: string;
    amount: number;
  }>;
  /** Breakdown by goal contributions */
  goalBreakdown: Array<{
    id: string;
    name: string;
    amount: number;
  }>;
}

/**
 * Complete forecast result
 */
export interface ForecastResult {
  /** Monthly forecasts */
  monthlyForecasts: MonthlyForecast[];
  /** Summary statistics */
  summary: {
    totalIncome: number;
    totalExpenses: number;
    totalGoalContributions: number;
    finalBalance: number;
    averageMonthlyIncome: number;
    averageMonthlyExpenses: number;
    averageMonthlyNet: number;
    lowestBalance: number;
    highestBalance: number;
    monthsWithNegativeBalance: number;
  };
  /** Goal progress projections */
  goalProgress: Array<{
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    projectedAmount: number;
    projectedProgress: number;
    estimatedCompletionMonth?: string;
    onTrack: boolean;
  }>;
}

/**
 * Convert frequency to monthly multiplier
 */
export function getMonthlyMultiplier(frequency: Frequency): number {
  switch (frequency) {
    case Frequency.DAILY:
      return 30.44; // Average days per month
    case Frequency.WEEKLY:
      return 4.33; // Average weeks per month
    case Frequency.BIWEEKLY:
      return 2.17; // Average bi-weeks per month
    case Frequency.MONTHLY:
      return 1;
    case Frequency.QUARTERLY:
      return 1 / 3;
    case Frequency.YEARLY:
      return 1 / 12;
    case Frequency.ONE_TIME:
      return 0; // Handled separately
    default:
      return 1;
  }
}

/**
 * Calculate monthly amount from frequency
 */
export function calculateMonthlyAmount(
  amount: number,
  frequency: Frequency
): number {
  return amount * getMonthlyMultiplier(frequency);
}

/**
 * Check if an income is active for a given month
 */
export function isIncomeActiveInMonth(
  income: Income,
  monthDate: Date
): boolean {
  const startDate = new Date(income.startDate);
  const endDate = income.endDate ? new Date(income.endDate) : null;

  // Check if the income is active
  if (!income.isActive) return false;

  // Check if the month is after the start date
  if (monthDate < startDate) return false;

  // Check if the month is before the end date (if exists)
  if (endDate && monthDate > endDate) return false;

  return true;
}

/**
 * Check if an expense is active for a given month
 */
export function isExpenseActiveInMonth(
  expense: Expense,
  monthDate: Date
): boolean {
  // Check if the expense is active
  if (!expense.isActive) return false;

  // For expenses, we consider them active if they are recurring or if the due date is in the future
  if (expense.recurring) {
    return true; // Recurring expenses are always active once created
  }

  // For one-time expenses, check if the due date is in the current month or future
  const dueDate = new Date(expense.dueDate);
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const monthEnd = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() + 1,
    0
  );

  return dueDate >= monthStart && dueDate <= monthEnd;
}

/**
 * Calculate goal contribution for a month based on target date and remaining amount
 */
export function calculateGoalContribution(
  goal: Goal,
  currentMonth: Date
): number {
  if (!goal.isActive) return 0;

  const targetDate = new Date(goal.targetDate);
  const remainingAmount = goal.targetAmount - goal.currentAmount;

  // If goal is already completed
  if (remainingAmount <= 0) return 0;

  // If target date has passed
  if (targetDate < currentMonth) return 0;

  // Calculate months until target
  const monthsUntilTarget = Math.max(
    1,
    Math.ceil(
      (targetDate.getTime() - currentMonth.getTime()) /
        (1000 * 60 * 60 * 24 * 30.44)
    )
  );

  // Calculate required monthly contribution
  const requiredMonthlyContribution = remainingAmount / monthsUntilTarget;

  // Apply priority multiplier (higher priority gets more aggressive saving)
  let priorityMultiplier = 1;
  switch (goal.priority) {
    case Priority.CRITICAL:
      priorityMultiplier = 1.2;
      break;
    case Priority.HIGH:
      priorityMultiplier = 1.1;
      break;
    case Priority.MEDIUM:
      priorityMultiplier = 1;
      break;
    case Priority.LOW:
      priorityMultiplier = 0.8;
      break;
  }

  return Math.max(0, requiredMonthlyContribution * priorityMultiplier);
}

/**
 * Generate financial forecast
 */
export function generateForecast(
  userPlan: UserPlan,
  config: Partial<ForecastConfig> = {}
): ForecastResult {
  const defaultConfig: ForecastConfig = {
    months: 12,
    startingBalance: userPlan.currentBalance || 0,
    startDate: new Date(),
    includeGoalContributions: true,
    conservativeMode: false,
  };

  const finalConfig = { ...defaultConfig, ...config };
  const monthlyForecasts: MonthlyForecast[] = [];
  let currentBalance = finalConfig.startingBalance;

  // Generate forecasts for each month
  for (let monthIndex = 0; monthIndex < finalConfig.months; monthIndex++) {
    const currentDate = new Date(finalConfig.startDate || new Date());
    currentDate.setMonth(currentDate.getMonth() + monthIndex);
    currentDate.setDate(1); // Set to first day of month

    const monthKey = `${currentDate.getFullYear()}-${(
      currentDate.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}`;

    // Calculate income for this month
    const incomeBreakdown: Array<{ id: string; name: string; amount: number }> =
      [];
    let totalIncome = 0;

    for (const income of userPlan.income) {
      if (isIncomeActiveInMonth(income, currentDate)) {
        let monthlyAmount = calculateMonthlyAmount(
          income.amount,
          income.frequency
        );

        // Apply conservative mode adjustment
        if (finalConfig.conservativeMode) {
          monthlyAmount *= 0.9; // Reduce income by 10%
        }

        incomeBreakdown.push({
          id: income.id,
          name: income.name,
          amount: monthlyAmount,
        });
        totalIncome += monthlyAmount;
      }
    }

    // Calculate expenses for this month
    const expenseBreakdown: Array<{
      id: string;
      name: string;
      amount: number;
    }> = [];
    let totalExpenses = 0;

    for (const expense of userPlan.expenses) {
      if (isExpenseActiveInMonth(expense, currentDate)) {
        let monthlyAmount = calculateMonthlyAmount(
          expense.amount,
          expense.frequency || Frequency.MONTHLY
        );

        // Apply conservative mode adjustment
        if (finalConfig.conservativeMode) {
          monthlyAmount *= 1.1; // Increase expenses by 10%
        }

        expenseBreakdown.push({
          id: expense.id,
          name: expense.name,
          amount: monthlyAmount,
        });
        totalExpenses += monthlyAmount;
      }
    }

    // Calculate goal contributions for this month
    const goalBreakdown: Array<{ id: string; name: string; amount: number }> =
      [];
    let totalGoalContributions = 0;

    if (finalConfig.includeGoalContributions) {
      for (const goal of userPlan.goals) {
        const contribution = calculateGoalContribution(goal, currentDate);

        if (contribution > 0) {
          goalBreakdown.push({
            id: goal.id,
            name: goal.name,
            amount: contribution,
          });
          totalGoalContributions += contribution;
        }
      }
    }

    // Calculate net change and ending balance
    const netChange = totalIncome - totalExpenses - totalGoalContributions;
    const endingBalance = currentBalance + netChange;

    // Create monthly forecast
    const monthlyForecast: MonthlyForecast = {
      month: monthKey,
      startingBalance: currentBalance,
      income: totalIncome,
      expenses: totalExpenses,
      goalContributions: totalGoalContributions,
      netChange,
      endingBalance,
      incomeBreakdown,
      expenseBreakdown,
      goalBreakdown,
    };

    monthlyForecasts.push(monthlyForecast);
    currentBalance = endingBalance;
  }

  // Calculate summary statistics
  const totalIncome = monthlyForecasts.reduce(
    (sum, month) => sum + month.income,
    0
  );
  const totalExpenses = monthlyForecasts.reduce(
    (sum, month) => sum + month.expenses,
    0
  );
  const totalGoalContributions = monthlyForecasts.reduce(
    (sum, month) => sum + month.goalContributions,
    0
  );
  const finalBalance =
    monthlyForecasts[monthlyForecasts.length - 1]?.endingBalance || 0;

  const balances = monthlyForecasts.map((month) => month.endingBalance);
  const lowestBalance = Math.min(...balances);
  const highestBalance = Math.max(...balances);
  const monthsWithNegativeBalance = balances.filter(
    (balance) => balance < 0
  ).length;

  const summary = {
    totalIncome,
    totalExpenses,
    totalGoalContributions,
    finalBalance,
    averageMonthlyIncome: totalIncome / finalConfig.months,
    averageMonthlyExpenses: totalExpenses / finalConfig.months,
    averageMonthlyNet:
      (totalIncome - totalExpenses - totalGoalContributions) /
      finalConfig.months,
    lowestBalance,
    highestBalance,
    monthsWithNegativeBalance,
  };

  // Calculate goal progress projections
  const goalProgress = userPlan.goals.map((goal) => {
    const totalContributions = monthlyForecasts.reduce((sum, month) => {
      const contribution = month.goalBreakdown.find((g) => g.id === goal.id);
      return sum + (contribution?.amount || 0);
    }, 0);

    const projectedAmount = goal.currentAmount + totalContributions;
    const projectedProgress =
      goal.targetAmount > 0 ? (projectedAmount / goal.targetAmount) * 100 : 0;

    // Find estimated completion month
    let estimatedCompletionMonth: string | undefined;
    let accumulatedContributions = goal.currentAmount;

    for (const month of monthlyForecasts) {
      const contribution = month.goalBreakdown.find((g) => g.id === goal.id);
      if (contribution) {
        accumulatedContributions += contribution.amount;
        if (accumulatedContributions >= goal.targetAmount) {
          estimatedCompletionMonth = month.month;
          break;
        }
      }
    }

    const targetDate = new Date(goal.targetDate);
    const onTrack =
      projectedProgress >= 100 ||
      (estimatedCompletionMonth &&
        new Date(estimatedCompletionMonth + "-01") <= targetDate) ||
      false;

    return {
      id: goal.id,
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      projectedAmount,
      projectedProgress,
      estimatedCompletionMonth,
      onTrack,
    };
  });

  return {
    monthlyForecasts,
    summary,
    goalProgress,
  };
}

/**
 * Convert forecast result to legacy Forecast format for compatibility
 */
export function convertToLegacyForecast(
  forecastResult: ForecastResult
): Forecast[] {
  return forecastResult.monthlyForecasts.map((month) => ({
    id: `forecast-${month.month}`,
    month: month.month,
    projectedBalance: month.endingBalance,
    projectedIncome: month.income,
    projectedExpenses: month.expenses,
    projectedGoalContributions: month.goalContributions,
    startingBalance: month.startingBalance,
    netChange: month.netChange,
    generatedAt: new Date().toISOString(),
  }));
}

/**
 * Default forecast configuration
 */
export const DEFAULT_FORECAST_CONFIG: ForecastConfig = {
  months: 12,
  startingBalance: 0,
  includeGoalContributions: true,
  conservativeMode: false,
};
