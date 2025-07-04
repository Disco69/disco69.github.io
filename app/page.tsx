import Image from "next/image";

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 sm:text-5xl">
          Take Control of Your
          <span className="text-blue-600 dark:text-blue-400">
            {" "}
            Financial Future
          </span>
        </h1>
        <p className="mt-6 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Manage your income, track expenses, set goals, and forecast your
          financial future with personalized insights and actionable
          recommendations.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Get Started
          </button>
          <button className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-8 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium">
            Learn More
          </button>
        </div>
      </div>

      {/* Features Overview */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-4">
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
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Income Management
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Track all your income sources and manage your cash flow effectively.
          </p>
        </div>

        <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-4">
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Expense Tracking
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Monitor spending patterns and categorize expenses with due date
            tracking.
          </p>
        </div>

        <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-4">
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Financial Goals
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Set and track progress toward your financial goals with actionable
            insights.
          </p>
        </div>

        <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-orange-600 dark:text-orange-400"
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Smart Forecasting
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Get 12-month projections and personalized recommendations for your
            future.
          </p>
        </div>
      </div>

      {/* Quick Start Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Ready to Get Started?
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Begin your financial planning journey by setting up your first income
          source, tracking your expenses, or defining your financial goals.
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Add Income
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Start by adding your income sources
            </p>
          </button>
          <button className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Track Expenses
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Monitor your spending patterns
            </p>
          </button>
          <button className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Set Goals
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Define your financial objectives
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
