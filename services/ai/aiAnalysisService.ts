import { UserPlan } from "@/types";

export interface AIAnalysisRequest {
  userPlan: UserPlan;
  query: string;
  context?: string;
  analysisType?: "general" | "budget" | "investment" | "debt" | "savings";
  model?: string;
}

export interface AIAnalysisResponse {
  analysis: string;
  suggestions: string[];
  insights: string[];
  nextSteps: string[];
  confidence: number;
  model: string;
  tokens_used: number;
}

export interface AIServiceStatus {
  enabled: boolean;
  connectionStatus: boolean;
  availableModels: Array<{
    id: string;
    name: string;
    description: string;
  }>;
  defaultModel: string;
  configuration: {
    maxTokens: number;
    temperature: number;
    topP: number;
    requestsPerMinute: number;
    dailyCostLimit: number;
  };
}

export interface AIAnalysisResult {
  success: boolean;
  data?: AIAnalysisResponse;
  error?: string;
  metadata?: {
    model: string;
    processingTime: number;
    estimatedCost: number;
    timestamp: string;
  };
}

class AIAnalysisService {
  private baseUrl = "/api/ai";
  private cache = new Map<
    string,
    { data: AIAnalysisResult; timestamp: number }
  >();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private isLoading = false;
  private loadingCallbacks: Array<(loading: boolean) => void> = [];

  // Subscribe to loading state changes
  onLoadingChange(callback: (loading: boolean) => void) {
    this.loadingCallbacks.push(callback);
    return () => {
      this.loadingCallbacks = this.loadingCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  private setLoading(loading: boolean) {
    this.isLoading = loading;
    this.loadingCallbacks.forEach((callback) => callback(loading));
  }

  // Get current loading state
  getLoadingState(): boolean {
    return this.isLoading;
  }

  // Create cache key for request
  private createCacheKey(request: AIAnalysisRequest): string {
    const key = {
      query: request.query,
      analysisType: request.analysisType,
      model: request.model,
      // Include financial data that affects analysis
      balance: request.userPlan.currentBalance,
      incomeCount: request.userPlan.income?.length || 0,
      expenseCount: request.userPlan.expenses?.length || 0,
      goalCount: request.userPlan.goals?.length || 0,
    };
    return btoa(JSON.stringify(key));
  }

  // Check if cached result is still valid
  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.cacheTimeout;
  }

  // Get AI service status
  async getServiceStatus(): Promise<AIServiceStatus | null> {
    try {
      const response = await fetch(`${this.baseUrl}/analyze`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error("Failed to get AI service status:", response.status);
        return null;
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("Error getting AI service status:", error);
      return null;
    }
  }

  // Analyze financial data with AI
  async analyzeFinancialData(
    request: AIAnalysisRequest
  ): Promise<AIAnalysisResult> {
    try {
      // Check cache first
      const cacheKey = this.createCacheKey(request);
      const cached = this.cache.get(cacheKey);

      if (cached && this.isCacheValid(cached.timestamp)) {
        console.log("Returning cached AI analysis result");
        return cached.data;
      }

      // Set loading state
      this.setLoading(true);

      // Make API request
      const response = await fetch(`${this.baseUrl}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || "Failed to analyze financial data",
        };
      }

      // Cache successful result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      console.error("Error analyzing financial data:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Network error occurred",
      };
    } finally {
      this.setLoading(false);
    }
  }

  // Quick analysis for common questions
  async quickAnalysis(
    userPlan: UserPlan,
    analysisType: string
  ): Promise<AIAnalysisResult> {
    const prompts = {
      overview:
        "Give me a quick overview of my financial situation and any immediate concerns.",
      savings: "How can I improve my savings rate and build my emergency fund?",
      expenses:
        "What expenses should I focus on reducing to improve my financial health?",
      goals:
        "How am I doing with my financial goals and what should I prioritize?",
      budget:
        "Is my budget balanced and sustainable? What adjustments should I make?",
      investment:
        "Based on my financial situation, what investment strategies should I consider?",
    };

    const query =
      prompts[analysisType as keyof typeof prompts] || prompts.overview;

    return this.analyzeFinancialData({
      userPlan,
      query,
      analysisType: analysisType as
        | "general"
        | "budget"
        | "investment"
        | "debt"
        | "savings",
    });
  }

  // Generate personalized insights based on financial data
  async generateInsights(userPlan: UserPlan): Promise<AIAnalysisResult> {
    const totalIncome =
      userPlan.income?.reduce((sum, inc) => sum + inc.amount, 0) || 0;
    const totalExpenses =
      userPlan.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
    const activeGoals = userPlan.goals?.filter((goal) => goal.isActive) || [];
    const savingsRate =
      totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    let contextPrompt = `Analyze my financial situation and provide personalized insights. `;

    if (savingsRate < 10) {
      contextPrompt += `My savings rate is low at ${savingsRate.toFixed(1)}%. `;
    } else if (savingsRate > 30) {
      contextPrompt += `I have a good savings rate of ${savingsRate.toFixed(
        1
      )}%. `;
    }

    if (activeGoals.length === 0) {
      contextPrompt += `I don't have any active financial goals set. `;
    } else {
      contextPrompt += `I have ${activeGoals.length} active financial goals. `;
    }

    if (userPlan.currentBalance < totalExpenses * 3) {
      contextPrompt += `My emergency fund might be insufficient. `;
    }

    contextPrompt += `Please provide specific, actionable advice tailored to my situation.`;

    return this.analyzeFinancialData({
      userPlan,
      query: contextPrompt,
      analysisType: "general",
    });
  }

  // Ask AI about specific goals
  async askAboutGoal(
    userPlan: UserPlan,
    goalName: string,
    question?: string
  ): Promise<AIAnalysisResult> {
    const goal = userPlan.goals?.find((g) =>
      g.name.toLowerCase().includes(goalName.toLowerCase())
    );

    if (!goal) {
      return {
        success: false,
        error: `Goal "${goalName}" not found`,
      };
    }

    const progress =
      goal.targetAmount > 0
        ? (goal.currentAmount / goal.targetAmount) * 100
        : 0;
    const defaultQuestion = `How am I doing with my "${goal.name}" goal? What's the best strategy to reach it?`;

    const query = question || defaultQuestion;
    const context = `Goal: ${goal.name}, Target: $${
      goal.targetAmount
    }, Current: $${goal.currentAmount}, Progress: ${progress.toFixed(
      1
    )}%, Target Date: ${goal.targetDate}`;

    return this.analyzeFinancialData({
      userPlan,
      query,
      context,
      analysisType: "general",
    });
  }

  // Compare different scenarios
  async compareScenarios(
    userPlan: UserPlan,
    scenario: string,
    changes: string
  ): Promise<AIAnalysisResult> {
    const query = `What would happen if ${scenario}? ${changes}`;
    const context = `This is a scenario analysis. Please compare the current situation with the proposed changes and highlight the key differences, benefits, and risks.`;

    return this.analyzeFinancialData({
      userPlan,
      query,
      context,
      analysisType: "general",
    });
  }

  // Get optimization suggestions
  async getOptimizationSuggestions(
    userPlan: UserPlan
  ): Promise<AIAnalysisResult> {
    const query = `Please analyze my financial data and provide specific optimization suggestions. Focus on actionable steps I can take to improve my financial health, reduce expenses, increase savings, and achieve my goals faster.`;

    return this.analyzeFinancialData({
      userPlan,
      query,
      analysisType: "general",
    });
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache size
  getCacheSize(): number {
    return this.cache.size;
  }

  // Clean expired cache entries
  cleanCache(): void {
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isCacheValid(entry.timestamp)) {
        this.cache.delete(key);
      }
    }
  }

  // Estimate request cost (simple estimation)
  estimateRequestCost(query: string): number {
    const baseTokens = 500; // Base prompt tokens
    const queryTokens = query.length / 4; // Rough estimation
    const estimatedCost = (baseTokens + queryTokens) * 0.000001; // Very rough cost estimation
    return Math.max(0.001, estimatedCost); // Minimum cost
  }

  // Validate request before sending
  validateRequest(request: AIAnalysisRequest): string[] {
    const errors: string[] = [];

    if (!request.query || request.query.trim().length === 0) {
      errors.push("Query is required");
    }

    if (request.query && request.query.length > 5000) {
      errors.push("Query is too long (maximum 5000 characters)");
    }

    if (!request.userPlan) {
      errors.push("User plan is required");
    }

    return errors;
  }
}

// Export singleton instance
export const aiAnalysisService = new AIAnalysisService();

export default AIAnalysisService;
