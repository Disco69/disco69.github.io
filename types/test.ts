/**
 * Test script to validate TypeScript interfaces
 *
 * This script runs the validation function to ensure all data models
 * are correctly defined and can be used without compilation errors.
 */

import validateDataStructures from "./validation";

// Run the validation
console.log("🔍 Testing TypeScript interfaces for Finance Planner...\n");

const validationResult = validateDataStructures();

if (validationResult) {
  console.log("\n🎉 All data models validated successfully!");
  console.log("✅ Ready to proceed with building the application components");
} else {
  console.log("\n❌ Validation failed - check the interfaces for errors");
  process.exit(1);
}
