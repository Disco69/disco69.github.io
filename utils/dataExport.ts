import { UserPlan, Income, Expense, Goal, Frequency } from "@/types";

/**
 * Export format options
 */
export type ExportFormat = "json" | "csv";

/**
 * Export metadata
 */
export interface ExportMetadata {
  exportedAt: string;
  version: string;
  appName: string;
  dataTypes: string[];
}

/**
 * Complete export data structure
 */
export interface ExportData {
  metadata: ExportMetadata;
  userPlan: UserPlan;
}

/**
 * CSV export options
 */
export interface CSVExportOptions {
  includeHeaders: boolean;
  delimiter: string;
  dateFormat: "iso" | "us" | "eu";
}

/**
 * Default CSV export options
 */
export const DEFAULT_CSV_OPTIONS: CSVExportOptions = {
  includeHeaders: true,
  delimiter: ",",
  dateFormat: "iso",
};

/**
 * Serialize user plan data to JSON format
 */
export function serializeToJSON(userPlan: UserPlan): string {
  const exportData: ExportData = {
    metadata: {
      exportedAt: new Date().toISOString(),
      version: "1.0.0",
      appName: "Finance Planner",
      dataTypes: ["income", "expenses", "goals", "forecast"],
    },
    userPlan: {
      ...userPlan,
      // Ensure dates are properly serialized
      createdAt: userPlan.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Serialize user plan data to CSV format
 */
export function serializeToCSV(
  userPlan: UserPlan,
  options: CSVExportOptions = DEFAULT_CSV_OPTIONS
): string {
  const csvSections: string[] = [];

  // Add metadata section
  csvSections.push("# Finance Planner Export");
  csvSections.push(`# Exported: ${new Date().toISOString()}`);
  csvSections.push(`# Version: 1.0.0`);
  csvSections.push("");

  // Export Income data
  if (userPlan.income && userPlan.income.length > 0) {
    csvSections.push("## INCOME");
    csvSections.push(serializeIncomeToCSV(userPlan.income, options));
    csvSections.push("");
  }

  // Export Expenses data
  if (userPlan.expenses && userPlan.expenses.length > 0) {
    csvSections.push("## EXPENSES");
    csvSections.push(serializeExpensesToCSV(userPlan.expenses, options));
    csvSections.push("");
  }

  // Export Goals data
  if (userPlan.goals && userPlan.goals.length > 0) {
    csvSections.push("## GOALS");
    csvSections.push(serializeGoalsToCSV(userPlan.goals, options));
    csvSections.push("");
  }

  // Export Summary
  csvSections.push("## SUMMARY");
  csvSections.push(serializeSummaryToCSV(userPlan, options));

  return csvSections.join("\n");
}

/**
 * Serialize income data to CSV
 */
function serializeIncomeToCSV(
  income: Income[],
  options: CSVExportOptions
): string {
  const headers = [
    "ID",
    "Name",
    "Amount",
    "Frequency",
    "Description",
    "Start Date",
    "End Date",
    "Is Active",
    "Created At",
    "Updated At",
  ];

  const rows = income.map((item) => [
    item.id,
    escapeCSVValue(item.name),
    item.amount.toString(),
    item.frequency,
    escapeCSVValue(item.description || ""),
    formatDate(item.startDate, options.dateFormat),
    item.endDate ? formatDate(item.endDate, options.dateFormat) : "",
    item.isActive ? "Yes" : "No",
    formatDate(item.createdAt, options.dateFormat),
    formatDate(item.updatedAt, options.dateFormat),
  ]);

  return formatCSVSection(headers, rows, options);
}

/**
 * Serialize expenses data to CSV
 */
function serializeExpensesToCSV(
  expenses: Expense[],
  options: CSVExportOptions
): string {
  const headers = [
    "ID",
    "Name",
    "Amount",
    "Category",
    "Due Date",
    "Recurring",
    "Frequency",
    "Description",
    "Priority",
    "Is Active",
    "Created At",
    "Updated At",
  ];

  const rows = expenses.map((item) => [
    item.id,
    escapeCSVValue(item.name),
    item.amount.toString(),
    item.category,
    formatDate(item.dueDate, options.dateFormat),
    item.recurring ? "Yes" : "No",
    item.frequency || "",
    escapeCSVValue(item.description || ""),
    item.priority,
    item.isActive ? "Yes" : "No",
    formatDate(item.createdAt, options.dateFormat),
    formatDate(item.updatedAt, options.dateFormat),
  ]);

  return formatCSVSection(headers, rows, options);
}

/**
 * Serialize goals data to CSV
 */
function serializeGoalsToCSV(goals: Goal[], options: CSVExportOptions): string {
  const headers = [
    "ID",
    "Name",
    "Target Amount",
    "Current Amount",
    "Target Date",
    "Description",
    "Category",
    "Priority",
    "Is Active",
    "Progress %",
    "Created At",
    "Updated At",
  ];

  const rows = goals.map((item) => [
    item.id,
    escapeCSVValue(item.name),
    item.targetAmount.toString(),
    item.currentAmount.toString(),
    formatDate(item.targetDate, options.dateFormat),
    escapeCSVValue(item.description || ""),
    item.category,
    item.priority,
    item.isActive ? "Yes" : "No",
    ((item.currentAmount / item.targetAmount) * 100).toFixed(2) + "%",
    formatDate(item.createdAt, options.dateFormat),
    formatDate(item.updatedAt, options.dateFormat),
  ]);

  return formatCSVSection(headers, rows, options);
}

/**
 * Serialize summary data to CSV
 */
function serializeSummaryToCSV(
  userPlan: UserPlan,
  options: CSVExportOptions
): string {
  const totalIncome =
    userPlan.income?.reduce((sum, income) => {
      if (!income.isActive) return sum;
      return sum + calculateMonthlyAmount(income.amount, income.frequency);
    }, 0) || 0;

  const totalExpenses =
    userPlan.expenses?.reduce((sum, expense) => {
      if (!expense.isActive) return sum;
      return (
        sum +
        calculateMonthlyAmount(
          expense.amount,
          expense.frequency || Frequency.MONTHLY
        )
      );
    }, 0) || 0;

  const totalGoals =
    userPlan.goals?.reduce((sum, goal) => sum + goal.targetAmount, 0) || 0;
  const totalSaved =
    userPlan.goals?.reduce((sum, goal) => sum + goal.currentAmount, 0) || 0;

  const headers = ["Metric", "Value"];
  const rows = [
    ["Total Monthly Income", `$${totalIncome.toFixed(2)}`],
    ["Total Monthly Expenses", `$${totalExpenses.toFixed(2)}`],
    ["Monthly Net Income", `$${(totalIncome - totalExpenses).toFixed(2)}`],
    ["Total Goal Targets", `$${totalGoals.toFixed(2)}`],
    ["Total Saved Towards Goals", `$${totalSaved.toFixed(2)}`],
    ["Current Balance", `$${userPlan.currentBalance.toFixed(2)}`],
    [
      "Savings Rate",
      `${
        totalIncome > 0
          ? (((totalIncome - totalExpenses) / totalIncome) * 100).toFixed(2)
          : 0
      }%`,
    ],
    [
      "Active Income Sources",
      userPlan.income?.filter((i) => i.isActive).length.toString() || "0",
    ],
    [
      "Active Expenses",
      userPlan.expenses?.filter((e) => e.isActive).length.toString() || "0",
    ],
    [
      "Active Goals",
      userPlan.goals?.filter((g) => g.isActive).length.toString() || "0",
    ],
  ];

  return formatCSVSection(headers, rows, options);
}

/**
 * Calculate monthly amount based on frequency
 */
function calculateMonthlyAmount(amount: number, frequency: Frequency): number {
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
}

/**
 * Format CSV section with headers and rows
 */
function formatCSVSection(
  headers: string[],
  rows: string[][],
  options: CSVExportOptions
): string {
  const lines: string[] = [];

  if (options.includeHeaders) {
    lines.push(headers.join(options.delimiter));
  }

  rows.forEach((row) => {
    lines.push(row.join(options.delimiter));
  });

  return lines.join("\n");
}

/**
 * Escape CSV values that contain special characters
 */
function escapeCSVValue(value: string): string {
  if (!value) return "";

  // If value contains comma, newline, or quotes, wrap in quotes and escape internal quotes
  if (value.includes(",") || value.includes("\n") || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

/**
 * Format date according to specified format
 */
function formatDate(dateString: string, format: "iso" | "us" | "eu"): string {
  if (!dateString) return "";

  const date = new Date(dateString);

  switch (format) {
    case "us":
      return date.toLocaleDateString("en-US");
    case "eu":
      return date.toLocaleDateString("en-GB");
    case "iso":
    default:
      return date.toISOString().split("T")[0];
  }
}

/**
 * Generate filename for export
 */
export function generateExportFilename(
  format: ExportFormat,
  prefix: string = "financial-plan"
): string {
  const timestamp = new Date().toISOString().split("T")[0];
  return `${prefix}-${timestamp}.${format}`;
}

/**
 * Validate export data before serialization
 */
export function validateExportData(userPlan: UserPlan): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!userPlan) {
    errors.push("User plan is required");
    return { isValid: false, errors };
  }

  if (!userPlan.id) {
    errors.push("User plan ID is required");
  }

  // Validate income data
  if (userPlan.income) {
    userPlan.income.forEach((income, index) => {
      if (!income.id) errors.push(`Income item ${index + 1} is missing ID`);
      if (!income.name) errors.push(`Income item ${index + 1} is missing name`);
      if (income.amount < 0)
        errors.push(`Income item ${index + 1} has negative amount`);
    });
  }

  // Validate expenses data
  if (userPlan.expenses) {
    userPlan.expenses.forEach((expense, index) => {
      if (!expense.id) errors.push(`Expense item ${index + 1} is missing ID`);
      if (!expense.name)
        errors.push(`Expense item ${index + 1} is missing name`);
      if (expense.amount < 0)
        errors.push(`Expense item ${index + 1} has negative amount`);
    });
  }

  // Validate goals data
  if (userPlan.goals) {
    userPlan.goals.forEach((goal, index) => {
      if (!goal.id) errors.push(`Goal item ${index + 1} is missing ID`);
      if (!goal.name) errors.push(`Goal item ${index + 1} is missing name`);
      if (goal.targetAmount <= 0)
        errors.push(`Goal item ${index + 1} has invalid target amount`);
      if (goal.currentAmount < 0)
        errors.push(`Goal item ${index + 1} has negative current amount`);
    });
  }

  return { isValid: errors.length === 0, errors };
}
