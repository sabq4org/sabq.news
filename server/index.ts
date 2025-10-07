import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { startNotificationWorker } from "./notificationWorker";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check endpoint - should be first to avoid middleware issues
app.get("/health", (_req, res) => {
  res.status(200).json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    console.log("[Server] Starting server initialization...");
    
    // Check for required environment variables in production
    if (process.env.NODE_ENV === "production") {
      const requiredEnvVars = ["DATABASE_URL"];
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        console.error(`[Server] ERROR: Missing required environment variables: ${missingVars.join(", ")}`);
        console.error("[Server] Please configure these in your deployment settings");
      } else {
        console.log("[Server] All required environment variables are present");
      }
    }

    const server = await registerRoutes(app);
    console.log("[Server] Routes registered successfully");

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error(`[Server] Error: ${status} - ${message}`, err);
      res.status(status).json({ message });
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
      console.log("[Server] Vite setup completed");
    } else {
      serveStatic(app);
      console.log("[Server] Static files setup completed");
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      console.log(`[Server] Successfully started on port ${port}`);
      log(`serving on port ${port}`);
      
      // Start notification worker in a non-blocking way
      // Any errors in the worker won't crash the main server
      setImmediate(() => {
        try {
          startNotificationWorker();
        } catch (error) {
          console.error("[Server] Error starting notification worker:", error);
          console.error("[Server] Server will continue running without notification worker");
        }
      });
    });

    // Handle server errors
    server.on("error", (error: any) => {
      console.error("[Server] Server error:", error);
      if (error.code === "EADDRINUSE") {
        console.error(`[Server] Port ${port} is already in use`);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error("[Server] Fatal error during startup:", error);
    console.error("[Server] Stack trace:", error instanceof Error ? error.stack : "No stack trace available");
    process.exit(1);
  }
})();

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  console.error("[Server] Uncaught Exception:", error);
  console.error("[Server] Stack trace:", error.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("[Server] Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("[Server] SIGTERM signal received: closing HTTP server");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("[Server] SIGINT signal received: closing HTTP server");
  process.exit(0);
});
