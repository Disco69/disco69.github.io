"use client";

import React, { useState, useEffect } from "react";
import { useFinancialState } from "@/context";
import { aiAnalysisService } from "@/services/ai/aiAnalysisService";
import type {
  AIAnalysisResult,
  AIServiceStatus,
} from "@/services/ai/aiAnalysisService";

interface AskAIButtonProps {
  className?: string;
}

export default function AskAIButton({ className = "" }: AskAIButtonProps) {
  const state = useFinancialState();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [selectedModel, setSelectedModel] = useState("");
  const [serviceStatus, setServiceStatus] = useState<AIServiceStatus | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<"custom" | "quick">("quick");

  // Quick analysis options
  const quickOptions = [
    {
      id: "overview",
      title: "📊 Financial Overview",
      description: "Get a comprehensive view of your financial situation",
      icon: "📊",
    },
    {
      id: "savings",
      title: "💰 Savings Strategy",
      description: "Tips to improve your savings rate and emergency fund",
      icon: "💰",
    },
    {
      id: "expenses",
      title: "💸 Expense Optimization",
      description: "Find areas to reduce spending and optimize your budget",
      icon: "💸",
    },
    {
      id: "goals",
      title: "🎯 Goal Planning",
      description: "Review progress and prioritize your financial goals",
      icon: "🎯",
    },
    {
      id: "budget",
      title: "📋 Budget Analysis",
      description: "Check if your budget is balanced and sustainable",
      icon: "📋",
    },
    {
      id: "investment",
      title: "📈 Investment Advice",
      description: "Get personalized investment recommendations",
      icon: "📈",
    },
  ];

  // Load service status on mount
  useEffect(() => {
    loadServiceStatus();
  }, []);

  // Subscribe to loading state changes
  useEffect(() => {
    const unsubscribe = aiAnalysisService.onLoadingChange(setIsLoading);
    return unsubscribe;
  }, []);

  const loadServiceStatus = async () => {
    const status = await aiAnalysisService.getServiceStatus();
    setServiceStatus(status);
    if (status?.defaultModel) {
      setSelectedModel(status.defaultModel);
    }
  };

  const handleQuickAnalysis = async (analysisType: string) => {
    if (!state.userPlan) return;

    try {
      setResult(null);
      const analysisResult = await aiAnalysisService.quickAnalysis(
        state.userPlan,
        analysisType
      );
      setResult(analysisResult);
    } catch (error) {
      console.error("Quick analysis failed:", error);
      setResult({
        success: false,
        error: "Failed to perform analysis. Please try again.",
      });
    }
  };

  const handleCustomQuery = async () => {
    if (!state.userPlan || !query.trim()) return;

    // Validate request
    const validationErrors = aiAnalysisService.validateRequest({
      userPlan: state.userPlan,
      query: query.trim(),
      model: selectedModel,
    });

    if (validationErrors.length > 0) {
      setResult({
        success: false,
        error: validationErrors.join(", "),
      });
      return;
    }

    try {
      setResult(null);
      const analysisResult = await aiAnalysisService.analyzeFinancialData({
        userPlan: state.userPlan,
        query: query.trim(),
        model: selectedModel,
        analysisType: "general",
      });
      setResult(analysisResult);
    } catch (error) {
      console.error("Custom analysis failed:", error);
      setResult({
        success: false,
        error: "Failed to analyze your question. Please try again.",
      });
    }
  };

  const handleClearResult = () => {
    setResult(null);
    setQuery("");
  };

  const formatAnalysis = (analysis: string) => {
    // Simple formatting to improve readability
    return analysis
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line, index) => (
        <p key={index} className="mb-2">
          {line.trim()}
        </p>
      ));
  };

  // Don't render if AI is not available
  if (!serviceStatus?.enabled || !serviceStatus?.connectionStatus) {
    return null;
  }

  return (
    <>
      {/* Ask AI Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 ${className}`}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            <span>Analyzing...</span>
          </>
        ) : (
          <>
            <span className="text-lg">🤖</span>
            <span>Ask AI</span>
          </>
        )}
      </button>

      {/* AI Analysis Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setIsOpen(false)}
            />

            {/* Modal */}
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🤖</span>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        AI Financial Advisor
                      </h3>
                      <p className="text-purple-100 text-sm">
                        Get personalized insights about your finances
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-4">
                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                  <button
                    onClick={() => setActiveTab("quick")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === "quick"
                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                  >
                    ⚡ Quick Analysis
                  </button>
                  <button
                    onClick={() => setActiveTab("custom")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === "custom"
                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                  >
                    💭 Custom Question
                  </button>
                </div>

                {/* Quick Analysis Tab */}
                {activeTab === "quick" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {quickOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleQuickAnalysis(option.id)}
                        disabled={isLoading}
                        className="p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{option.icon}</span>
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                              {option.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {option.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Custom Question Tab */}
                {activeTab === "custom" && (
                  <div className="space-y-4 mb-6">
                    {/* Model Selection */}
                    {serviceStatus?.availableModels &&
                      serviceStatus.availableModels.length > 1 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            AI Model
                          </label>
                          <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            {serviceStatus.availableModels.map((model) => (
                              <option key={model.id} value={model.id}>
                                {model.name} - {model.description}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                    {/* Question Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Ask your financial question
                      </label>
                      <textarea
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="e.g., 'Should I prioritize paying off debt or saving for retirement?' or 'How can I afford my dream vacation in 2 years?'"
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        disabled={isLoading}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {query.length}/5000 characters
                      </p>
                    </div>

                    {/* Ask Button */}
                    <button
                      onClick={handleCustomQuery}
                      disabled={isLoading || !query.trim()}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md font-medium transition-colors disabled:cursor-not-allowed"
                    >
                      {isLoading ? "Analyzing..." : "Get AI Analysis"}
                    </button>
                  </div>
                )}

                {/* Loading State */}
                {isLoading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-300">
                        AI is analyzing your financial data...
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        This may take a few moments
                      </p>
                    </div>
                  </div>
                )}

                {/* Results */}
                {result && !isLoading && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    {result.success ? (
                      <div className="space-y-6">
                        {/* Analysis */}
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                            <span>🔍</span>
                            Analysis
                          </h4>
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-gray-700 dark:text-gray-300">
                            {formatAnalysis(result.data?.analysis || "")}
                          </div>
                        </div>

                        {/* Suggestions */}
                        {result.data?.suggestions &&
                          result.data.suggestions.length > 0 && (
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                <span>💡</span>
                                Recommendations
                              </h4>
                              <ul className="space-y-2">
                                {result.data.suggestions
                                  .slice(0, 5)
                                  .map((suggestion, index) => (
                                    <li
                                      key={index}
                                      className="flex items-start gap-2"
                                    >
                                      <span className="text-green-500 mt-1">
                                        •
                                      </span>
                                      <span className="text-gray-700 dark:text-gray-300">
                                        {suggestion}
                                      </span>
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          )}

                        {/* Next Steps */}
                        {result.data?.nextSteps &&
                          result.data.nextSteps.length > 0 && (
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                <span>🚀</span>
                                Next Steps
                              </h4>
                              <ul className="space-y-2">
                                {result.data.nextSteps
                                  .slice(0, 4)
                                  .map((step, index) => (
                                    <li
                                      key={index}
                                      className="flex items-start gap-2"
                                    >
                                      <span className="text-blue-500 font-semibold mt-1">
                                        {index + 1}.
                                      </span>
                                      <span className="text-gray-700 dark:text-gray-300">
                                        {step}
                                      </span>
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          )}

                        {/* Metadata */}
                        {result.metadata && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-600 pt-3">
                            Analysis by {result.metadata.model} • Processing
                            time: {result.metadata.processingTime}ms •
                            {result.metadata.timestamp}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-2xl">⚠️</span>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          Analysis Failed
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                          {result.error ||
                            "Something went wrong. Please try again."}
                        </p>
                        <button
                          onClick={handleClearResult}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm"
                        >
                          Try Again
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    🔒 Your financial data is analyzed securely and privately
                  </div>
                  <div className="flex items-center gap-2">
                    {result && (
                      <button
                        onClick={handleClearResult}
                        className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
