#!/usr/bin/env node

/**
 * Script to manually initialize database with test data
 * Run with: npm run initialize-data
 */

import dotenv from "dotenv";
import { connectDatabase } from "../src/config/database";
import { initializeDatabase } from "../src/utils/initializeDatabase";

// Load environment variables
dotenv.config();

async function run() {
  try {
    console.log("🔄 Connecting to database...");
    await connectDatabase();
    console.log("✅ Connected to MongoDB successfully");

    console.log("🔄 Initializing database with test data...");
    await initializeDatabase();
    console.log("✅ Database initialization completed successfully");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error during database initialization:", error);
    process.exit(1);
  }
}

run();
