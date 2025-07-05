import { NextRequest, NextResponse } from "next/server";
import { openRouterService } from "@/services/ai/openrouter";
import {
  isAIEnabled,
  validateAIConfig,
  DEFAULT_AI_CONFIG,
} from "@/services/ai/config";
import type { FinancialAnalysisRequest } from "@/services/ai/openrouter";

// Rate limiting storage (in production, use Redis or database)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Cost tracking storage (in production, use database)
const costTrackingMap = new Map<
  string,
  { dailyCost: number; resetTime: number }
>();

function getRateLimitKey(ip: string): string {
  return `rate_limit_${ip}`;
}

function getCostTrackingKey(ip: string): string {
  return `cost_tracking_${ip}`;
}

function checkRateLimit(ip: string): boolean {
  const key = getRateLimitKey(ip);
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window

  const current = rateLimitMap.get(key);

  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= DEFAULT_AI_CONFIG.requestsPerMinute) {
    return false;
  }

  current.count++;
  return true;
}

function trackCost(ip: string, cost: number): boolean {
  const key = getCostTrackingKey(ip);
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000; // 24 hours

  const current = costTrackingMap.get(key);

  if (!current || now > current.resetTime) {
    costTrackingMap.set(key, { dailyCost: cost, resetTime: now + dayMs });
    return true;
  }

  const newDailyCost = current.dailyCost + cost;

  if (newDailyCost > DEFAULT_AI_CONFIG.dailyCostLimit) {
    return false;
  }

  current.dailyCost = newDailyCost;
  return true;
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIP) {
    return realIP.trim();
  }

  return "unknown";
}

export async function POST(request: NextRequest) {
  try {
    // Check if AI features are enabled
    if (!isAIEnabled()) {
      return NextResponse.json(
        {
          error: "AI features are not enabled or configured properly",
          details:
            "Please set OPENROUTER_API_KEY environment variable and enable AI features",
        },
        { status: 503 }
      );
    }

    // Validate configuration
    const configErrors = validateAIConfig(DEFAULT_AI_CONFIG);
    if (configErrors.length > 0) {
      return NextResponse.json(
        {
          error: "AI configuration is invalid",
          details: configErrors,
        },
        { status: 500 }
      );
    }

    // Get client IP for rate limiting
    const clientIP = getClientIP(request);

    // Check rate limit
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          details: `Maximum ${DEFAULT_AI_CONFIG.requestsPerMinute} requests per minute allowed`,
        },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate request
    if (!body.userPlan || !body.query) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: "userPlan and query are required",
        },
        { status: 400 }
      );
    }

    const analysisRequest: FinancialAnalysisRequest = {
      userPlan: body.userPlan,
      query: body.query,
      context: body.context,
      analysisType: body.analysisType || "general",
    };

    // Get selected model or use default
    const selectedModel = body.model || DEFAULT_AI_CONFIG.defaultModel;

    // Estimate cost (simple estimation based on prompt length)
    const estimatedCost = 0.001; // Simplified cost estimation

    // Check cost limit
    if (!trackCost(clientIP, estimatedCost)) {
      return NextResponse.json(
        {
          error: "Daily cost limit exceeded",
          details: `Daily limit of $${DEFAULT_AI_CONFIG.dailyCostLimit} reached`,
        },
        { status: 429 }
      );
    }

    // Perform AI analysis
    const startTime = Date.now();
    const analysisResult = await openRouterService.analyzeFinancialData(
      analysisRequest,
      selectedModel
    );
    const processingTime = Date.now() - startTime;

    // Return successful response
    return NextResponse.json({
      success: true,
      data: analysisResult,
      metadata: {
        model: selectedModel,
        processingTime,
        estimatedCost,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("AI Analysis API Error:", error);

    // Determine error type and return appropriate response
    if (error instanceof Error) {
      if (error.message.includes("API request failed")) {
        return NextResponse.json(
          {
            error: "AI service temporarily unavailable",
            details:
              "The AI service is currently experiencing issues. Please try again later.",
          },
          { status: 503 }
        );
      }

      if (error.message.includes("API key")) {
        return NextResponse.json(
          {
            error: "AI service configuration error",
            details: "AI service is not properly configured",
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        details: "An unexpected error occurred while processing your request",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Return AI service status and available models
    const isEnabled = isAIEnabled();
    const availableModels = openRouterService.getAvailableModels();

    // Test connection if enabled
    let connectionStatus = false;
    if (isEnabled) {
      connectionStatus = await openRouterService.testConnection();
    }

    return NextResponse.json({
      success: true,
      data: {
        enabled: isEnabled,
        connectionStatus,
        availableModels,
        defaultModel: DEFAULT_AI_CONFIG.defaultModel,
        configuration: {
          maxTokens: DEFAULT_AI_CONFIG.maxTokens,
          temperature: DEFAULT_AI_CONFIG.temperature,
          topP: DEFAULT_AI_CONFIG.topP,
          requestsPerMinute: DEFAULT_AI_CONFIG.requestsPerMinute,
          dailyCostLimit: DEFAULT_AI_CONFIG.dailyCostLimit,
        },
      },
    });
  } catch (error) {
    console.error("AI Status API Error:", error);

    return NextResponse.json(
      {
        error: "Failed to get AI service status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
