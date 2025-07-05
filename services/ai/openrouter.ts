interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  pricing: {
    prompt: number;
    completion: number;
  };
  context_length: number;
  architecture: {
    modality: string;
    tokenizer: string;
    instruct_type?: string;
  };
  top_provider: {
    context_length: number;
    max_completion_tokens: number;
  };
}

interface OpenRouterResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface FinancialAnalysisRequest {
  userPlan: any;
  query: string;
  context?: string;
  analysisType?: "general" | "budget" | "investment" | "debt" | "savings";
}

interface FinancialAnalysisResponse {
  analysis: string;
  suggestions: string[];
  insights: string[];
  nextSteps: string[];
  confidence: number;
  model: string;
  tokens_used: number;
}

class OpenRouterService {
  private apiKey: string;
  private baseUrl: string = "https://openrouter.ai/api/v1";
  private defaultModel: string = "anthropic/claude-3-sonnet";
  private headers: Record<string, string>;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || "";

    if (!this.apiKey) {
      console.warn(
        "OpenRouter API key not found. AI features will be disabled."
      );
    }

    this.headers = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer":
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Finance Planner AI",
    };
  }

  // Available models for financial analysis
  getAvailableModels(): Array<{
    id: string;
    name: string;
    description: string;
  }> {
    return [
      {
        id: "anthropic/claude-3-sonnet",
        name: "Claude 3 Sonnet",
        description: "Balanced performance for financial analysis and planning",
      },
      {
        id: "anthropic/claude-3-haiku",
        name: "Claude 3 Haiku",
        description: "Fast and efficient for quick financial insights",
      },
      {
        id: "openai/gpt-4-turbo",
        name: "GPT-4 Turbo",
        description: "Advanced reasoning for complex financial scenarios",
      },
      {
        id: "openai/gpt-3.5-turbo",
        name: "GPT-3.5 Turbo",
        description: "Cost-effective for general financial advice",
      },
      {
        id: "meta-llama/llama-3.1-70b-instruct",
        name: "Llama 3.1 70B",
        description: "Open-source model for budget-conscious users",
      },
    ];
  }

  // Test API connection
  async testConnection(): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: this.headers,
      });

      return response.ok;
    } catch (error) {
      console.error("OpenRouter connection test failed:", error);
      return false;
    }
  }

  // Get available models from API
  async fetchAvailableModels(): Promise<OpenRouterModel[]> {
    if (!this.apiKey) return [];

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("Failed to fetch models:", error);
      return [];
    }
  }

  // Create financial analysis prompt
  private createFinancialPrompt(request: FinancialAnalysisRequest): string {
    const { userPlan, query, context, analysisType } = request;

    const systemPrompt = `You are a professional financial advisor AI assistant. Your role is to provide personalized, actionable financial advice based on the user's financial data.

Guidelines:
- Provide specific, actionable recommendations
- Use the user's actual financial data in your analysis
- Be encouraging but realistic
- Focus on practical next steps
- Consider the user's financial situation and goals
- Avoid generic advice - be specific to their situation

User Financial Data:
- Current Balance: $${userPlan.currentBalance || 0}
- Monthly Income: $${
      userPlan.income?.reduce((sum: number, inc: any) => sum + inc.amount, 0) ||
      0
    }
- Monthly Expenses: $${
      userPlan.expenses?.reduce(
        (sum: number, exp: any) => sum + exp.amount,
        0
      ) || 0
    }
- Active Goals: ${userPlan.goals?.filter((g: any) => g.isActive).length || 0}
- Total Goal Target: $${
      userPlan.goals?.reduce(
        (sum: number, goal: any) => sum + goal.targetAmount,
        0
      ) || 0
    }

Analysis Type: ${analysisType || "general"}
${context ? `Additional Context: ${context}` : ""}

User Query: "${query}"

Please provide a comprehensive financial analysis including:
1. Direct answer to the user's question
2. Specific recommendations based on their data
3. Actionable next steps
4. Potential risks or considerations
5. Timeline for implementation

Format your response as a detailed analysis that's easy to understand and act upon.`;

    return systemPrompt;
  }

  // Analyze financial data with AI
  async analyzeFinancialData(
    request: FinancialAnalysisRequest,
    model?: string
  ): Promise<FinancialAnalysisResponse> {
    if (!this.apiKey) {
      throw new Error("OpenRouter API key not configured");
    }

    const selectedModel = model || this.defaultModel;
    const prompt = this.createFinancialPrompt(request);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 1500,
          temperature: 0.7,
          top_p: 0.9,
          frequency_penalty: 0,
          presence_penalty: 0,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      const data: OpenRouterResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error("No response from AI model");
      }

      const analysis = data.choices[0].message.content;

      // Parse the analysis to extract structured data
      const suggestions = this.extractSuggestions(analysis);
      const insights = this.extractInsights(analysis);
      const nextSteps = this.extractNextSteps(analysis);

      return {
        analysis,
        suggestions,
        insights,
        nextSteps,
        confidence: 0.85, // Could be calculated based on response quality
        model: selectedModel,
        tokens_used: data.usage?.total_tokens || 0,
      };
    } catch (error) {
      console.error("Financial analysis failed:", error);
      throw new Error(
        `Failed to analyze financial data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Extract suggestions from analysis text
  private extractSuggestions(analysis: string): string[] {
    const suggestions: string[] = [];

    // Look for numbered lists or bullet points
    const suggestionPatterns = [
      /(?:^|\n)[\d\-\*]\s*(.+?)(?=\n|$)/gm,
      /(?:recommend|suggest|should|consider)\s+(.+?)(?=\.|,|\n|$)/gi,
    ];

    for (const pattern of suggestionPatterns) {
      const matches = analysis.match(pattern);
      if (matches) {
        suggestions.push(...matches.map((m) => m.trim()));
      }
    }

    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  // Extract key insights from analysis
  private extractInsights(analysis: string): string[] {
    const insights: string[] = [];

    // Look for insight keywords
    const insightPatterns = [
      /(?:insight|notice|observe|analysis shows|data indicates)\s+(.+?)(?=\.|,|\n|$)/gi,
      /(?:key point|important|significant)\s+(.+?)(?=\.|,|\n|$)/gi,
    ];

    for (const pattern of insightPatterns) {
      const matches = analysis.match(pattern);
      if (matches) {
        insights.push(...matches.map((m) => m.trim()));
      }
    }

    return insights.slice(0, 3); // Limit to 3 insights
  }

  // Extract next steps from analysis
  private extractNextSteps(analysis: string): string[] {
    const nextSteps: string[] = [];

    // Look for action items
    const actionPatterns = [
      /(?:next step|action|first|then|finally|start by)\s+(.+?)(?=\.|,|\n|$)/gi,
      /(?:should|need to|must|can)\s+(.+?)(?=\.|,|\n|$)/gi,
    ];

    for (const pattern of actionPatterns) {
      const matches = analysis.match(pattern);
      if (matches) {
        nextSteps.push(...matches.map((m) => m.trim()));
      }
    }

    return nextSteps.slice(0, 4); // Limit to 4 next steps
  }

  // Get model pricing information
  async getModelPricing(
    modelId: string
  ): Promise<{ prompt: number; completion: number } | null> {
    try {
      const models = await this.fetchAvailableModels();
      const model = models.find((m) => m.id === modelId);
      return model ? model.pricing : null;
    } catch (error) {
      console.error("Failed to get model pricing:", error);
      return null;
    }
  }

  // Calculate estimated cost for a request
  estimateRequestCost(
    promptTokens: number,
    completionTokens: number,
    pricing: { prompt: number; completion: number }
  ): number {
    return (
      (promptTokens * pricing.prompt + completionTokens * pricing.completion) /
      1000
    );
  }
}

// Create singleton instance
export const openRouterService = new OpenRouterService();

// Export types and service
export type {
  OpenRouterModel,
  OpenRouterResponse,
  FinancialAnalysisRequest,
  FinancialAnalysisResponse,
};

export default OpenRouterService;
