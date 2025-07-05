/**
 * Data Storage and Persistence
 *
 * This file handles saving and loading user plan data to/from localStorage
 * with proper error handling and data validation.
 */

import { UserPlan } from "../types";

// =============================================================================
// STORAGE KEYS
// =============================================================================

const STORAGE_KEYS = {
  USER_PLAN: "finance-planner-user-plan",
  APP_SETTINGS: "finance-planner-settings",
  BACKUP_DATA: "finance-planner-backup",
} as const;

// =============================================================================
// STORAGE UTILITIES
// =============================================================================

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === "undefined") return false;

    const test = "__storage_test__";
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely parse JSON data with error handling
 */
function safeJsonParse<T>(data: string, fallback: T): T {
  try {
    const parsed = JSON.parse(data);
    return parsed || fallback;
  } catch {
    console.warn("Failed to parse JSON data, using fallback");
    return fallback;
  }
}

/**
 * Safely stringify data with error handling
 */
function safeJsonStringify(data: any): string | null {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error("Failed to stringify data:", error);
    return null;
  }
}

// =============================================================================
// USER PLAN PERSISTENCE
// =============================================================================

/**
 * Save user plan to localStorage
 */
export async function saveUserPlan(userPlan: UserPlan): Promise<void> {
  if (!isLocalStorageAvailable()) {
    throw new Error("localStorage is not available");
  }

  try {
    // Create backup before saving new data
    await createBackup(userPlan);

    const serialized = safeJsonStringify(userPlan);
    if (!serialized) {
      throw new Error("Failed to serialize user plan");
    }

    window.localStorage.setItem(STORAGE_KEYS.USER_PLAN, serialized);

    // Update last saved timestamp
    const metadata = {
      lastSaved: new Date().toISOString(),
      version: "1.0.0",
    };

    window.localStorage.setItem(
      `${STORAGE_KEYS.USER_PLAN}-metadata`,
      safeJsonStringify(metadata) || "{}"
    );

    console.log("✅ User plan saved successfully");
  } catch (error) {
    console.error("❌ Failed to save user plan:", error);
    throw new Error("Failed to save user plan to storage");
  }
}

/**
 * Load user plan from localStorage
 */
export async function loadUserPlan(): Promise<UserPlan | null> {
  if (!isLocalStorageAvailable()) {
    console.warn("localStorage is not available");
    return null;
  }

  try {
    const data = window.localStorage.getItem(STORAGE_KEYS.USER_PLAN);

    if (!data) {
      console.log("No saved user plan found");
      return null;
    }

    const userPlan = safeJsonParse<UserPlan | null>(data, null);

    if (!userPlan) {
      console.warn("Invalid user plan data found in storage");
      return null;
    }

    // Validate the loaded data structure
    if (!isValidUserPlan(userPlan)) {
      console.warn("Loaded user plan failed validation");
      return null;
    }

    console.log("✅ User plan loaded successfully");
    return userPlan;
  } catch (error) {
    console.error("❌ Failed to load user plan:", error);
    return null;
  }
}

/**
 * Delete user plan from localStorage
 */
export async function deleteUserPlan(): Promise<void> {
  if (!isLocalStorageAvailable()) {
    throw new Error("localStorage is not available");
  }

  try {
    window.localStorage.removeItem(STORAGE_KEYS.USER_PLAN);
    window.localStorage.removeItem(`${STORAGE_KEYS.USER_PLAN}-metadata`);

    console.log("✅ User plan deleted successfully");
  } catch (error) {
    console.error("❌ Failed to delete user plan:", error);
    throw new Error("Failed to delete user plan from storage");
  }
}

// =============================================================================
// BACKUP AND RESTORE
// =============================================================================

/**
 * Create a backup of the current user plan
 */
export async function createBackup(userPlan: UserPlan): Promise<void> {
  if (!isLocalStorageAvailable()) return;

  try {
    const backup = {
      userPlan,
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    };

    const serialized = safeJsonStringify(backup);
    if (serialized) {
      window.localStorage.setItem(STORAGE_KEYS.BACKUP_DATA, serialized);
    }
  } catch (error) {
    console.warn("Failed to create backup:", error);
  }
}

/**
 * Validate user plan structure
 */
function isValidUserPlan(userPlan: any): userPlan is UserPlan {
  try {
    return (
      userPlan &&
      typeof userPlan === "object" &&
      typeof userPlan.id === "string" &&
      Array.isArray(userPlan.income) &&
      Array.isArray(userPlan.expenses) &&
      Array.isArray(userPlan.goals) &&
      Array.isArray(userPlan.forecast) &&
      typeof userPlan.currentBalance === "number" &&
      typeof userPlan.createdAt === "string" &&
      typeof userPlan.updatedAt === "string"
    );
  } catch {
    return false;
  }
}

/**
 * Get storage usage information
 */
export function getStorageInfo(): {
  used: number;
  available: number;
  total: number;
  percentage: number;
} {
  if (!isLocalStorageAvailable()) {
    return { used: 0, available: 0, total: 0, percentage: 0 };
  }

  try {
    let used = 0;

    for (const key in window.localStorage) {
      if (window.localStorage.hasOwnProperty(key)) {
        used += window.localStorage[key].length + key.length;
      }
    }

    // Most browsers have a 5-10MB limit for localStorage
    const estimated_total = 5 * 1024 * 1024; // 5MB in bytes
    const available = estimated_total - used;
    const percentage = (used / estimated_total) * 100;

    return {
      used,
      available: Math.max(0, available),
      total: estimated_total,
      percentage: Math.min(100, percentage),
    };
  } catch {
    return { used: 0, available: 0, total: 0, percentage: 0 };
  }
}
