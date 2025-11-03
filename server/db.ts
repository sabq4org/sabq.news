// Reference: javascript_database blueprint
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle, type NeonDatabase } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Graceful database connection with error handling
let pool: Pool;
let db: NeonDatabase<typeof schema>;

try {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set. Database features will be unavailable.");
    console.error("Please configure DATABASE_URL in your deployment settings.");
    
    // Create a dummy pool that will fail gracefully
    throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
  }

  console.log("🔗 Initializing database connection...");
  
  // Optimized connection pool settings for high performance
  pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    max: 20, // Increased from 10 for better concurrency
    idleTimeoutMillis: 20000, // 20s - release idle connections faster
    connectionTimeoutMillis: 10000, // 10s timeout for new connections
    allowExitOnIdle: false, // Keep pool alive
  });
  
  db = drizzle({ client: pool, schema });
  
  console.log("✅ Database connection initialized successfully");
} catch (error) {
  console.error("❌ Database initialization error:", error);
  
  // In production, we still want the server to start even if DB fails
  // This allows health checks to work and helps with debugging
  if (process.env.NODE_ENV === 'production') {
    console.error("⚠️  Server will start without database connection");
    console.error("⚠️  Please fix database configuration and restart");
    
    // Create a minimal pool that will throw errors when used
    pool = new Pool({ 
      connectionString: 'postgresql://dummy:dummy@localhost:5432/dummy',
      max: 1,
    });
    db = drizzle({ client: pool, schema });
  } else {
    // In development, fail fast to catch issues early
    throw error;
  }
}

export { pool, db };
