import type { Express } from "express";
import { generateInfographicSuggestions } from "../services/infographicAiService";

export function registerInfographicAiRoutes(app: Express) {
  // API endpoint for generating infographic suggestions
  app.post("/api/ai/infographic-suggestions", async (req, res) => {
    try {
      const { content, title, category } = req.body;

      // Validate input
      if (!content && !title) {
        return res.status(400).json({
          success: false,
          message: "يجب توفير المحتوى أو العنوان على الأقل",
        });
      }

      console.log("📊 [API] Generating infographic suggestions for article");
      console.log(`   - Title: ${title ? title.substring(0, 50) + '...' : 'N/A'}`);
      console.log(`   - Content length: ${content ? content.length : 0} chars`);
      console.log(`   - Category: ${category || 'N/A'}`);

      // Generate suggestions using Gemini AI
      const suggestions = await generateInfographicSuggestions(
        content || "",
        title || undefined,
        category || undefined
      );

      console.log("✅ [API] Successfully generated infographic suggestions");

      return res.json({
        success: true,
        suggestions,
      });
    } catch (error) {
      console.error("❌ [API] Failed to generate infographic suggestions:", error);
      
      return res.status(500).json({
        success: false,
        message: "فشل في توليد اقتراحات الإنفوجرافيك. يرجى المحاولة مرة أخرى",
        error: error instanceof Error ? error.message : "خطأ غير معروف",
      });
    }
  });

  console.log("✅ Infographic AI routes registered");
}