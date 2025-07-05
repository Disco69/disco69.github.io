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
  GoalType,
} from "@/types";
import { formatCurrency } from "@/utils/currency";

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
    goalType: GoalType;
    averageMonthlyAllocation: number;
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
 * Check if an expense is active in a specific month
 */
export function isExpenseActiveInMonth(
  expense: Expense,
  monthDate: Date
): boolean {
  // Check if the expense is active
  if (!expense.isActive) return false;

  // Handle installment expenses
  if (
    expense.isInstallment &&
    expense.installmentStartMonth &&
    expense.installmentMonths
  ) {
    const startDate = new Date(expense.installmentStartMonth + "-01");
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + expense.installmentMonths);

    const currentMonthStart = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth(),
      1
    );

    return currentMonthStart >= startDate && currentMonthStart < endDate;
  }

  // For recurring expenses, they are active every month after their start date
  if (expense.recurring) {
    // Check if expense has started (based on dueDate as start reference)
    const expenseStartDate = new Date(expense.dueDate);
    const monthStart = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth(),
      1
    );

    // Recurring expenses are active if the month is at or after the expense start month
    return (
      monthStart >=
      new Date(expenseStartDate.getFullYear(), expenseStartDate.getMonth(), 1)
    );
  }

  // For one-time expenses, they are only active in the month they are due
  if (expense.frequency === Frequency.ONE_TIME || !expense.recurring) {
    const dueDate = new Date(expense.dueDate);
    const monthStart = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth(),
      1
    );
    const monthEnd = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth() + 1,
      0
    );

    // One-time expenses only appear in the month they are due
    return dueDate >= monthStart && dueDate <= monthEnd;
  }

  // For other frequency-based expenses, check if they should occur in this month
  if (expense.frequency && expense.frequency !== Frequency.MONTHLY) {
    const dueDate = new Date(expense.dueDate);
    const monthStart = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth(),
      1
    );

    // Calculate if this expense should occur in this month based on frequency
    const monthsSinceStart =
      (monthDate.getFullYear() - dueDate.getFullYear()) * 12 +
      (monthDate.getMonth() - dueDate.getMonth());

    switch (expense.frequency) {
      case Frequency.QUARTERLY:
        return monthsSinceStart >= 0 && monthsSinceStart % 3 === 0;
      case Frequency.YEARLY:
        return monthsSinceStart >= 0 && monthsSinceStart % 12 === 0;
      case Frequency.WEEKLY:
      case Frequency.BIWEEKLY:
      case Frequency.DAILY:
        // For sub-monthly frequencies, they effectively occur every month
        return (
          monthStart >= new Date(dueDate.getFullYear(), dueDate.getMonth(), 1)
        );
      default:
        return false;
    }
  }

  // Default case: if recurring and no specific frequency, treat as monthly
  return expense.recurring;
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
 * Calculate smart goal allocations based on priority and surplus cash
 */
export function calculateSmartGoalAllocations(
  goals: Goal[],
  availableSurplus: number,
  currentMonth: Date
): Array<{ id: string; name: string; amount: number }> {
  // Filter active goals and sort by priority order
  const activeGoals = goals
    .filter((goal) => goal.isActive)
    .sort((a, b) => (a.priorityOrder || 999) - (b.priorityOrder || 999));

  const allocations: Array<{ id: string; name: string; amount: number }> = [];
  let remainingSurplus = availableSurplus;

  for (const goal of activeGoals) {
    if (remainingSurplus <= 0) break;

    // Check if goal is already complete (for fixed amount goals)
    if (
      goal.goalType === GoalType.FIXED_AMOUNT &&
      goal.currentAmount >= goal.targetAmount
    ) {
      continue;
    }

    // Calculate required amount for this goal
    let requiredAmount = 0;

    if (goal.goalType === GoalType.FIXED_AMOUNT) {
      // For fixed amount goals, calculate remaining amount needed
      const remainingAmount = goal.targetAmount - goal.currentAmount;
      if (remainingAmount <= 0) continue;

      // Calculate months until target
      const targetDate = new Date(goal.targetDate);
      const monthsUntilTarget = Math.max(
        1,
        Math.ceil(
          (targetDate.getTime() - currentMonth.getTime()) /
            (1000 * 60 * 60 * 24 * 30.44)
        )
      );

      // Calculate required monthly contribution
      requiredAmount = Math.min(
        remainingAmount,
        remainingAmount / monthsUntilTarget
      );
    } else {
      // For open-ended goals, allocate based on priority and available surplus
      // Use a percentage of remaining surplus based on priority
      const priorityMultiplier = getPriorityMultiplier(goal.priority);
      requiredAmount = remainingSurplus * 0.2 * priorityMultiplier; // Base 20% allocation
    }

    // Don't allocate more than available surplus
    const allocation = Math.min(requiredAmount, remainingSurplus);

    if (allocation > 0) {
      allocations.push({
        id: goal.id,
        name: goal.name,
        amount: allocation,
      });
      remainingSurplus -= allocation;
    }
  }

  return allocations;
}

/**
 * Get priority multiplier for goal allocation
 */
function getPriorityMultiplier(priority: Priority): number {
  switch (priority) {
    case Priority.CRITICAL:
      return 1.5;
    case Priority.HIGH:
      return 1.2;
    case Priority.MEDIUM:
      return 1.0;
    case Priority.LOW:
      return 0.7;
    default:
      return 1.0;
  }
}

/**
 * Calculate forecast completion date for a goal
 */
export function calculateGoalCompletionForecast(
  goal: Goal,
  monthlyAllocation: number
): { estimatedCompletionMonth?: string; isAchievable: boolean } {
  if (goal.goalType === GoalType.OPEN_ENDED) {
    return { isAchievable: true }; // Open-ended goals are always "achievable"
  }

  const remainingAmount = goal.targetAmount - goal.currentAmount;
  if (remainingAmount <= 0) {
    return { isAchievable: true }; // Already completed
  }

  if (monthlyAllocation <= 0) {
    return { isAchievable: false }; // No allocation means not achievable
  }

  // Calculate months needed to complete
  const monthsNeeded = Math.ceil(remainingAmount / monthlyAllocation);

  // Calculate estimated completion date
  const currentDate = new Date();
  const completionDate = new Date(currentDate);
  completionDate.setMonth(completionDate.getMonth() + monthsNeeded);

  const estimatedCompletionMonth = `${completionDate.getFullYear()}-${(
    completionDate.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}`;

  // Check if achievable by target date
  const targetDate = new Date(goal.targetDate);
  const isAchievable = completionDate <= targetDate;

  return { estimatedCompletionMonth, isAchievable };
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

  // Always start from January of the current year (or specified year)
  const baseDate = finalConfig.startDate || new Date();
  const startDate = new Date(baseDate.getFullYear(), 0, 1); // January 1st of the year

  const monthlyForecasts: MonthlyForecast[] = [];
  let currentBalance = finalConfig.startingBalance;

  // Generate forecasts for each month
  for (let monthIndex = 0; monthIndex < finalConfig.months; monthIndex++) {
    const currentDate = new Date(startDate);
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
        let monthlyAmount: number;

        // Handle installment expenses
        if (expense.isInstallment && expense.installmentMonths) {
          monthlyAmount = expense.amount / expense.installmentMonths;
        } else {
          monthlyAmount = calculateMonthlyAmount(
            expense.amount,
            expense.frequency || Frequency.MONTHLY
          );
        }

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
      // Calculate surplus cash available for goals
      const surplusAfterExpenses = totalIncome - totalExpenses;

      if (surplusAfterExpenses > 0) {
        // Use smart goal allocation based on priority
        const smartAllocations = calculateSmartGoalAllocations(
          userPlan.goals,
          surplusAfterExpenses,
          currentDate
        );

        goalBreakdown.push(...smartAllocations);
        totalGoalContributions = smartAllocations.reduce(
          (sum, allocation) => sum + allocation.amount,
          0
        );
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

    // Calculate average monthly allocation for completion forecast
    const averageMonthlyAllocation = totalContributions / finalConfig.months;
    const completionForecast = calculateGoalCompletionForecast(
      goal,
      averageMonthlyAllocation
    );

    // Find estimated completion month from actual allocations
    let estimatedCompletionMonth: string | undefined;
    let accumulatedContributions = goal.currentAmount;

    for (const month of monthlyForecasts) {
      const contribution = month.goalBreakdown.find((g) => g.id === goal.id);
      if (contribution) {
        accumulatedContributions += contribution.amount;
        if (
          goal.goalType === GoalType.FIXED_AMOUNT &&
          accumulatedContributions >= goal.targetAmount
        ) {
          estimatedCompletionMonth = month.month;
          break;
        }
      }
    }

    // Use completion forecast if no specific month found
    if (
      !estimatedCompletionMonth &&
      completionForecast.estimatedCompletionMonth
    ) {
      estimatedCompletionMonth = completionForecast.estimatedCompletionMonth;
    }

    const onTrack = completionForecast.isAchievable;

    return {
      id: goal.id,
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      projectedAmount,
      projectedProgress,
      estimatedCompletionMonth,
      onTrack,
      goalType: goal.goalType,
      averageMonthlyAllocation,
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

/**
 * Generate a detailed monthly goal allocation schedule
 */
export function generateMonthlyGoalAllocationSchedule(
  userPlan: UserPlan,
  config: Partial<ForecastConfig> = {}
): {
  monthlySchedule: Array<{
    month: string;
    totalSurplus: number;
    goalAllocations: Array<{
      goalId: string;
      goalName: string;
      amount: number;
      priority: Priority;
      priorityOrder: number;
      isOnTrack: boolean;
      remainingAmount: number;
      targetDate: string;
    }>;
    guidance: string;
  }>;
  summary: {
    totalAllocated: number;
    goalsOnTrack: number;
    goalsBehindSchedule: number;
    averageMonthlyAllocation: number;
  };
} {
  // Ensure the forecast starts from January by setting the config
  const januaryConfig = {
    ...config,
    startDate: config.startDate
      ? new Date(config.startDate.getFullYear(), 0, 1)
      : new Date(new Date().getFullYear(), 0, 1),
  };

  // Generate full forecast to get monthly surplus data
  const forecast = generateForecast(userPlan, januaryConfig);

  const monthlySchedule = forecast.monthlyForecasts.map((month) => {
    const surplus = month.income - month.expenses;
    const goalAllocations = month.goalBreakdown.map((allocation) => {
      const goal = userPlan.goals.find((g) => g.id === allocation.id);
      if (!goal) {
        return {
          goalId: allocation.id,
          goalName: allocation.name,
          amount: allocation.amount,
          priority: Priority.MEDIUM,
          priorityOrder: 1,
          isOnTrack: true,
          remainingAmount: 0,
          targetDate: "",
        };
      }

      const remainingAmount = Math.max(
        0,
        goal.targetAmount - goal.currentAmount
      );
      const goalProgress = forecast.goalProgress.find(
        (gp) => gp.id === goal.id
      );

      return {
        goalId: allocation.id,
        goalName: allocation.name,
        amount: allocation.amount,
        priority: goal.priority,
        priorityOrder: goal.priorityOrder,
        isOnTrack: goalProgress?.onTrack || false,
        remainingAmount,
        targetDate: goal.targetDate,
      };
    });

    // Generate guidance message
    let guidance = "";
    if (surplus <= 0) {
      guidance = "No surplus available for goal contributions this month.";
    } else if (goalAllocations.length === 0) {
      guidance = "Surplus available but no active goals to allocate to.";
    } else {
      const topAllocation = goalAllocations.reduce((max, current) =>
        current.amount > max.amount ? current : max
      );

      if (goalAllocations.length === 1) {
        guidance = `Allocate ${formatCurrency(topAllocation.amount)} to ${
          topAllocation.goalName
        }.`;
      } else {
        const totalAllocated = goalAllocations.reduce(
          (sum, g) => sum + g.amount,
          0
        );
        guidance = `Allocate ${formatCurrency(totalAllocated)} across ${
          goalAllocations.length
        } goals. Focus on ${topAllocation.goalName} (${formatCurrency(
          topAllocation.amount
        )}).`;
      }
    }

    return {
      month: month.month,
      totalSurplus: surplus,
      goalAllocations,
      guidance,
    };
  });

  // Calculate summary
  const totalAllocated = monthlySchedule.reduce(
    (sum, month) =>
      sum +
      month.goalAllocations.reduce(
        (monthSum, goal) => monthSum + goal.amount,
        0
      ),
    0
  );

  const goalsOnTrack = monthlySchedule
    .flatMap((month) => month.goalAllocations)
    .filter((g) => g.isOnTrack).length;

  const goalsBehindSchedule = monthlySchedule
    .flatMap((month) => month.goalAllocations)
    .filter((g) => !g.isOnTrack).length;

  const averageMonthlyAllocation =
    totalAllocated / Math.max(monthlySchedule.length, 1);

  return {
    monthlySchedule,
    summary: {
      totalAllocated,
      goalsOnTrack,
      goalsBehindSchedule,
      averageMonthlyAllocation,
    },
  };
}
