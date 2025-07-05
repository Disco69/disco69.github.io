export interface AIConfig {
  apiKey: string;
  enabled: boolean;
  defaultModel: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  dailyCostLimit: number;
  monthlyCostLimit: number;
  requestsPerMinute: number;
  requestsPerHour: number;
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  apiKey: process.env.OPENROUTER_API_KEY || "",
  enabled: process.env.AI_FEATURES_ENABLED === "true",
  defaultModel: process.env.DEFAULT_AI_MODEL || "anthropic/claude-3-sonnet",
  maxTokens: parseInt(process.env.AI_MAX_TOKENS || "1500"),
  temperature: parseFloat(process.env.AI_TEMPERATURE || "0.7"),
  topP: parseFloat(process.env.AI_TOP_P || "0.9"),
  dailyCostLimit: parseFloat(process.env.AI_DAILY_COST_LIMIT || "5.00"),
  monthlyCostLimit: parseFloat(process.env.AI_MONTHLY_COST_LIMIT || "50.00"),
  requestsPerMinute: parseInt(process.env.AI_REQUESTS_PER_MINUTE || "10"),
  requestsPerHour: parseInt(process.env.AI_REQUESTS_PER_HOUR || "100"),
};

export const AI_MODELS = {
  CLAUDE_3_SONNET: "anthropic/claude-3-sonnet",
  CLAUDE_3_HAIKU: "anthropic/claude-3-haiku",
  GPT_4_TURBO: "openai/gpt-4-turbo",
  GPT_3_5_TURBO: "openai/gpt-3.5-turbo",
  LLAMA_3_1_70B: "meta-llama/llama-3.1-70b-instruct",
} as const;

export const MODEL_DESCRIPTIONS = {
  [AI_MODELS.CLAUDE_3_SONNET]: {
    name: "Claude 3 Sonnet",
    description: "Balanced performance for financial analysis and planning",
    strengths: ["Financial analysis", "Planning", "Detailed explanations"],
    cost: "Medium",
  },
  [AI_MODELS.CLAUDE_3_HAIKU]: {
    name: "Claude 3 Haiku",
    description: "Fast and efficient for quick financial insights",
    strengths: ["Quick responses", "Cost-effective", "Simple analysis"],
    cost: "Low",
  },
  [AI_MODELS.GPT_4_TURBO]: {
    name: "GPT-4 Turbo",
    description: "Advanced reasoning for complex financial scenarios",
    strengths: [
      "Complex analysis",
      "Multi-step reasoning",
      "Comprehensive insights",
    ],
    cost: "High",
  },
  [AI_MODELS.GPT_3_5_TURBO]: {
    name: "GPT-3.5 Turbo",
    description: "Cost-effective for general financial advice",
    strengths: ["General advice", "Cost-effective", "Reliable"],
    cost: "Low",
  },
  [AI_MODELS.LLAMA_3_1_70B]: {
    name: "Llama 3.1 70B",
    description: "Open-source model for budget-conscious users",
    strengths: ["Open source", "Budget-friendly", "Good reasoning"],
    cost: "Very Low",
  },
} as const;

export const ANALYSIS_TYPES = {
  GENERAL: "general",
  BUDGET: "budget",
  INVESTMENT: "investment",
  DEBT: "debt",
  SAVINGS: "savings",
  GOAL_PLANNING: "goal_planning",
  EXPENSE_OPTIMIZATION: "expense_optimization",
  INCOME_GROWTH: "income_growth",
} as const;

export const ANALYSIS_PROMPTS = {
  [ANALYSIS_TYPES.GENERAL]:
    "Provide a comprehensive overview of the user's financial situation",
  [ANALYSIS_TYPES.BUDGET]: "Analyze the user's budget and spending patterns",
  [ANALYSIS_TYPES.INVESTMENT]:
    "Provide investment recommendations based on the user's profile",
  [ANALYSIS_TYPES.DEBT]: "Analyze debt situation and provide payoff strategies",
  [ANALYSIS_TYPES.SAVINGS]:
    "Analyze savings patterns and provide optimization suggestions",
  [ANALYSIS_TYPES.GOAL_PLANNING]: "Help plan and prioritize financial goals",
  [ANALYSIS_TYPES.EXPENSE_OPTIMIZATION]:
    "Identify areas to reduce expenses and optimize spending",
  [ANALYSIS_TYPES.INCOME_GROWTH]:
    "Suggest strategies to increase income and earning potential",
} as const;

// Rate limiting configuration
export const RATE_LIMITS = {
  REQUESTS_PER_MINUTE: 10,
  REQUESTS_PER_HOUR: 100,
  REQUESTS_PER_DAY: 500,
  COOLDOWN_PERIOD: 60000, // 1 minute in milliseconds
} as const;

// Cost tracking configuration
export const COST_LIMITS = {
  DAILY: 5.0,
  WEEKLY: 25.0,
  MONTHLY: 100.0,
  WARNING_THRESHOLD: 0.8, // 80% of limit
} as const;

// Validation functions
export const validateAIConfig = (config: Partial<AIConfig>): string[] => {
  const errors: string[] = [];

  if (!config.apiKey) {
    errors.push("OpenRouter API key is required");
  }

  if (config.maxTokens && (config.maxTokens < 100 || config.maxTokens > 8000)) {
    errors.push("Max tokens must be between 100 and 8000");
  }

  if (
    config.temperature &&
    (config.temperature < 0 || config.temperature > 2)
  ) {
    errors.push("Temperature must be between 0 and 2");
  }

  if (config.topP && (config.topP < 0 || config.topP > 1)) {
    errors.push("Top P must be between 0 and 1");
  }

  return errors;
};

export const isAIEnabled = (): boolean => {
  return DEFAULT_AI_CONFIG.enabled && !!DEFAULT_AI_CONFIG.apiKey;
};

export const getModelConfig = (modelId: string) => {
  return MODEL_DESCRIPTIONS[modelId as keyof typeof MODEL_DESCRIPTIONS];
};

export const getAllAvailableModels = () => {
  return Object.entries(MODEL_DESCRIPTIONS).map(([id, config]) => ({
    id,
    ...config,
  }));
};
