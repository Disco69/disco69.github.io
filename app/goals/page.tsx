'use client';

import { useState } from 'react';
import { useFinancialContext } from '@/context';
import { Goal, GoalCategory, Priority, CreateGoalInput } from '@/types';

// Goal category icons mapping
const goalCategoryIcons = {
  [GoalCategory.EMERGENCY_FUND]: '🛡️',
  [GoalCategory.RETIREMENT]: '🏖️',
  [GoalCategory.EDUCATION]: '🎓',
  [GoalCategory.HOME_PURCHASE]: '🏠',
  [GoalCategory.VACATION]: '✈️',
  [GoalCategory.DEBT_PAYOFF]: '💳',
  [GoalCategory.MAJOR_PURCHASE]: '🛒',
  [GoalCategory.INVESTMENT]: '📈',
  [GoalCategory.OTHER]: '🎯'
};

// Goal category display names
const goalCategoryNames = {
  [GoalCategory.EMERGENCY_FUND]: 'Emergency Fund',
  [GoalCategory.RETIREMENT]: 'Retirement',
  [GoalCategory.EDUCATION]: 'Education',
  [GoalCategory.HOME_PURCHASE]: 'Home Purchase',
  [GoalCategory.VACATION]: 'Vacation',
  [GoalCategory.DEBT_PAYOFF]: 'Debt Payoff',
  [GoalCategory.MAJOR_PURCHASE]: 'Major Purchase',
  [GoalCategory.INVESTMENT]: 'Investment',
  [GoalCategory.OTHER]: 'Other'
};

// Priority colors and display names
const priorityConfig = {
  [Priority.LOW]: { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Low' },
  [Priority.MEDIUM]: { color: 'text-blue-600', bg: 'bg-blue-100', label: 'Medium' },
  [Priority.HIGH]: { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'High' },
  [Priority.CRITICAL]: { color: 'text-red-600', bg: 'bg-red-100', label: 'Critical' }
};

export default function GoalsPage() {
  const { state, addGoal, updateGoal, deleteGoal } = useFinancialContext();
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<GoalCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'targetDate' | 'progress' | 'priority'>('targetDate');

  // Form state
  const [formData, setFormData] = useState<CreateGoalInput>({
    name: '',
    targetAmount: 0,
    targetDate: '',
    currentAmount: 0,
    description: '',
    category: GoalCategory.OTHER,
    priority: Priority.MEDIUM,
    isActive: true
  });

  // Get goals from state
  const goals = state.userPlan?.goals || [];

  // Filter and sort goals
  const filteredGoals = goals
    .filter(goal => selectedCategory === 'all' || goal.category === selectedCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'targetDate':
          return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
        case 'progress':
          const progressA = (a.currentAmount / a.targetAmount) * 100;
          const progressB = (b.currentAmount / b.targetAmount) * 100;
          return progressB - progressA;
        case 'priority':
          const priorityOrder = { [Priority.CRITICAL]: 4, [Priority.HIGH]: 3, [Priority.MEDIUM]: 2, [Priority.LOW]: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        default:
          return 0;
      }
    });

  // Calculate total progress
  const totalGoalAmount = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalCurrentAmount = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const overallProgress = totalGoalAmount > 0 ? (totalCurrentAmount / totalGoalAmount) * 100 : 0;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingGoal) {
        await updateGoal({
          id: editingGoal.id,
          ...formData
        });
      } else {
        await addGoal(formData);
      }
      
      // Reset form
      setFormData({
        name: '',
        targetAmount: 0,
        targetDate: '',
        currentAmount: 0,
        description: '',
        category: GoalCategory.OTHER,
        priority: Priority.MEDIUM,
        isActive: true
      });
      setIsAddingGoal(false);
      setEditingGoal(null);
    } catch (error) {
      console.error('Failed to save goal:', error);
    }
  };

  // Handle edit goal
  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      targetAmount: goal.targetAmount,
      targetDate: goal.targetDate,
      currentAmount: goal.currentAmount,
      description: goal.description || '',
      category: goal.category,
      priority: goal.priority,
      isActive: goal.isActive
    });
    setIsAddingGoal(true);
  };

  // Handle delete goal
  const handleDelete = async (goalId: string) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      try {
        await deleteGoal(goalId);
      } catch (error) {
        console.error('Failed to delete goal:', error);
      }
    }
  };

  // Calculate progress percentage
  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  // Get progress color
  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get days until target
  const getDaysUntilTarget = (targetDate: string) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎯 Financial Goals
          </h1>
          <p className="text-gray-600">
            Set, track, and achieve your financial objectives
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Goals</p>
                <p className="text-2xl font-bold text-blue-600">{goals.length}</p>
              </div>
              <div className="text-3xl">🎯</div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Target Amount</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalGoalAmount)}</p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Progress</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalCurrentAmount)}</p>
              </div>
              <div className="text-3xl">📈</div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overall Progress</p>
                <p className="text-2xl font-bold text-orange-600">{overallProgress.toFixed(1)}%</p>
              </div>
              <div className="text-3xl">🏆</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as GoalCategory | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {Object.entries(goalCategoryNames).map(([key, name]) => (
                <option key={key} value={key}>
                  {goalCategoryIcons[key as GoalCategory]} {name}
                </option>
              ))}
            </select>

            {/* Sort Options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'targetDate' | 'progress' | 'priority')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="targetDate">Sort by Target Date</option>
              <option value="name">Sort by Name</option>
              <option value="progress">Sort by Progress</option>
              <option value="priority">Sort by Priority</option>
            </select>
          </div>

          {/* Add Goal Button */}
          <button
            onClick={() => setIsAddingGoal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span>+</span>
            Add Goal
          </button>
        </div>

        {/* Add/Edit Goal Form */}
        {isAddingGoal && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingGoal ? 'Edit Goal' : 'Add New Goal'}
            </h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Goal Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as GoalCategory })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {Object.entries(goalCategoryNames).map(([key, name]) => (
                    <option key={key} value={key}>
                      {goalCategoryIcons[key as GoalCategory]} {name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Amount *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({ ...formData, targetAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.currentAmount}
                  onChange={(e) => setFormData({ ...formData, currentAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Date *
                </label>
                <input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(priorityConfig).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional description or notes about this goal..."
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingGoal(false);
                    setEditingGoal(null);
                    setFormData({
                      name: '',
                      targetAmount: 0,
                      targetDate: '',
                      currentAmount: 0,
                      description: '',
                      category: GoalCategory.OTHER,
                      priority: Priority.MEDIUM,
                      isActive: true
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingGoal ? 'Update Goal' : 'Add Goal'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Goals List */}
        <div className="space-y-4">
          {filteredGoals.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No goals yet</h3>
              <p className="text-gray-600 mb-4">Start by adding your first financial goal!</p>
              <button
                onClick={() => setIsAddingGoal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Your First Goal
              </button>
            </div>
          ) : (
            filteredGoals.map((goal) => {
              const progress = getProgressPercentage(goal.currentAmount, goal.targetAmount);
              const daysUntilTarget = getDaysUntilTarget(goal.targetDate);
              const isOverdue = daysUntilTarget < 0;
              const isCompleted = progress >= 100;

              return (
                <div key={goal.id} className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Goal Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{goalCategoryIcons[goal.category]}</span>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{goal.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className={`px-2 py-1 rounded-full text-xs ${priorityConfig[goal.priority].bg} ${priorityConfig[goal.priority].color}`}>
                              {priorityConfig[goal.priority].label}
                            </span>
                            <span>{goalCategoryNames[goal.category]}</span>
                          </div>
                        </div>
                      </div>

                      {goal.description && (
                        <p className="text-gray-600 mb-3">{goal.description}</p>
                      )}

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{progress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress)}`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Goal Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Current</p>
                          <p className="font-semibold">{formatCurrency(goal.currentAmount)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Target</p>
                          <p className="font-semibold">{formatCurrency(goal.targetAmount)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Remaining</p>
                          <p className="font-semibold">{formatCurrency(goal.targetAmount - goal.currentAmount)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Target Date</p>
                          <p className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                            {formatDate(goal.targetDate)}
                          </p>
                          {!isCompleted && (
                            <p className={`text-xs ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                              {isOverdue ? `${Math.abs(daysUntilTarget)} days overdue` : `${daysUntilTarget} days left`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {isCompleted && (
                        <span className="text-green-600 text-2xl">✅</span>
                      )}
                      <button
                        onClick={() => handleEdit(goal)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Edit goal"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete goal"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
