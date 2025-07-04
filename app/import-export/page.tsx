"use client";

import { useState } from "react";
import { useFinancialContext } from "@/context";
import { FinancialActionType } from "@/context/types";
import {
  serializeToJSON,
  serializeToCSV,
  validateExportData,
  ExportFormat,
} from "@/utils/dataExport";
import { importFinancialData, ImportResult } from "@/utils/dataImport";
import {
  downloadJSON,
  downloadCSV,
  uploadFinancialData,
  isBrowserCompatible,
} from "@/utils/fileOperations";

export default function ImportExportPage() {
  const { state, dispatch } = useFinancialContext();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("json");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [exportValidation, setExportValidation] = useState<{
    isValid: boolean;
    errors: string[];
  } | null>(null);

  const browserSupport = isBrowserCompatible();

  // Handle export functionality
  const handleExport = async () => {
    if (!state.userPlan) {
      alert("No financial data available to export");
      return;
    }

    setIsExporting(true);
    setExportValidation(null);

    try {
      // Validate data before export
      const validation = validateExportData(state.userPlan);
      setExportValidation(validation);

      if (!validation.isValid) {
        setIsExporting(false);
        return;
      }

      // Generate export data
      let exportData: string;

      if (exportFormat === "json") {
        exportData = serializeToJSON(state.userPlan);
        downloadJSON(exportData);
      } else {
        exportData = serializeToCSV(state.userPlan);
        downloadCSV(exportData);
      }

      // Show success message
      alert(
        `Financial plan exported successfully as ${exportFormat.toUpperCase()}!`
      );
    } catch (error) {
      console.error("Export failed:", error);
      alert(
        `Export failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsExporting(false);
    }
  };

  // Handle import functionality
  const handleImport = async () => {
    setIsImporting(true);
    setImportResult(null);

    try {
      // Upload and read file
      const fileData = await uploadFinancialData();

      // Parse the imported data
      const result = importFinancialData(fileData.content);
      setImportResult(result);

      if (result.success && result.userPlan) {
        // Ask user for confirmation before replacing data
        const hasExistingData =
          state.userPlan &&
          ((state.userPlan.income && state.userPlan.income.length > 0) ||
            (state.userPlan.expenses && state.userPlan.expenses.length > 0) ||
            (state.userPlan.goals && state.userPlan.goals.length > 0));

        if (hasExistingData) {
          const confirmReplace = confirm(
            "This will replace your current financial data. Are you sure you want to continue?"
          );

          if (!confirmReplace) {
            setIsImporting(false);
            return;
          }
        }

        // Update the financial context with imported data
        dispatch({
          type: FinancialActionType.LOAD_SUCCESS,
          payload: result.userPlan,
        });

        alert("Financial plan imported successfully!");

        // Clear import result after successful import
        setTimeout(() => setImportResult(null), 5000);
      }
    } catch (error) {
      console.error("Import failed:", error);
      setImportResult({
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
        warnings: [],
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Calculate current data stats
  const dataStats = {
    income: state.userPlan?.income?.length || 0,
    expenses: state.userPlan?.expenses?.length || 0,
    goals: state.userPlan?.goals?.length || 0,
    totalRecords:
      (state.userPlan?.income?.length || 0) +
      (state.userPlan?.expenses?.length || 0) +
      (state.userPlan?.goals?.length || 0),
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              📁 Import & Export
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Backup your financial data or import from existing files
            </p>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total Records
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {dataStats.totalRecords}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {dataStats.income} income, {dataStats.expenses} expenses,{" "}
              {dataStats.goals} goals
            </div>
          </div>
        </div>
      </div>

      {/* Browser Compatibility Check */}
      {(!browserSupport.download || !browserSupport.upload) && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Browser Compatibility Warning
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>Some features may not work properly in your browser:</p>
                <ul className="list-disc list-inside mt-1">
                  {!browserSupport.download && (
                    <li>File download not supported</li>
                  )}
                  {!browserSupport.upload && <li>File upload not supported</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Income Sources
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {dataStats.income}
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
                Expenses
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {dataStats.expenses}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💳</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Goals
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {dataStats.goals}
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
                Total Records
              </p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {dataStats.totalRecords}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Export Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            📤 Export Data
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Download your financial data as a backup file
          </p>

          {/* Export Format Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Export Format
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="exportFormat"
                  value="json"
                  checked={exportFormat === "json"}
                  onChange={(e) =>
                    setExportFormat(e.target.value as ExportFormat)
                  }
                  className="mr-2"
                />
                <span className="text-sm">JSON (Recommended)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="exportFormat"
                  value="csv"
                  checked={exportFormat === "csv"}
                  onChange={(e) =>
                    setExportFormat(e.target.value as ExportFormat)
                  }
                  className="mr-2"
                />
                <span className="text-sm">CSV (Spreadsheet)</span>
              </label>
            </div>
          </div>

          {/* Export Validation Errors */}
          {exportValidation && !exportValidation.isValid && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <h4 className="text-sm font-medium text-red-800 mb-2">
                Export Validation Errors:
              </h4>
              <ul className="text-sm text-red-700 list-disc list-inside">
                {exportValidation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Format Information */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              {exportFormat === "json" ? "JSON Format" : "CSV Format"}
            </h4>
            <p className="text-sm text-blue-700">
              {exportFormat === "json"
                ? "Complete data with metadata, perfect for backup and restore. Maintains all data relationships and structure."
                : "Spreadsheet-compatible format with separate sections for income, expenses, and goals. Great for data analysis."}
            </p>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={
              isExporting ||
              dataStats.totalRecords === 0 ||
              !browserSupport.download
            }
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isExporting
              ? "Exporting..."
              : `Export as ${exportFormat.toUpperCase()}`}
          </button>

          {dataStats.totalRecords === 0 && (
            <p className="text-sm text-gray-500 mt-2 text-center">
              No data available to export
            </p>
          )}
        </div>

        {/* Import Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            📥 Import Data
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Upload a financial data file to restore or import data
          </p>

          {/* Import Information */}
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <h4 className="text-sm font-medium text-green-800 mb-2">
              Supported Formats
            </h4>
            <ul className="text-sm text-green-700 list-disc list-inside">
              <li>JSON files exported from Finance Planner</li>
              <li>CSV files with proper structure</li>
              <li>Maximum file size: 10MB</li>
            </ul>
          </div>

          {/* Import Result */}
          {importResult && (
            <div
              className={`mb-4 p-3 rounded-md ${
                importResult.success
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <h4
                className={`text-sm font-medium mb-2 ${
                  importResult.success ? "text-green-800" : "text-red-800"
                }`}
              >
                {importResult.success ? "Import Successful!" : "Import Failed"}
              </h4>

              {importResult.errors.length > 0 && (
                <div className="mb-2">
                  <p className="text-sm text-red-700 font-medium">Errors:</p>
                  <ul className="text-sm text-red-700 list-disc list-inside">
                    {importResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {importResult.warnings.length > 0 && (
                <div>
                  <p className="text-sm text-yellow-700 font-medium">
                    Warnings:
                  </p>
                  <ul className="text-sm text-yellow-700 list-disc list-inside">
                    {importResult.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Import Button */}
          <button
            onClick={handleImport}
            disabled={isImporting || !browserSupport.upload}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isImporting ? "Importing..." : "Import Data File"}
          </button>

          {/* Data Warning */}
          {dataStats.totalRecords > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                ⚠️ Importing will replace your current data. Make sure to export
                your current data first if you want to keep it.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          💡 Tips
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              Export Tips
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Use JSON format for complete backup</li>
              <li>• Use CSV format for spreadsheet analysis</li>
              <li>• Export regularly to prevent data loss</li>
              <li>• Files are named with current date</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              Import Tips
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Only import files you trust</li>
              <li>• Check validation errors before importing</li>
              <li>• Backup current data before importing</li>
              <li>• Large files may take time to process</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
