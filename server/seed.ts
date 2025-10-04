// Seed database with initial data
import { db } from "./db";
import { categories, articles } from "@shared/schema";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Create categories
    const categoriesData = [
      { nameAr: "سياسة", nameEn: "Politics", slug: "politics", icon: "🏛️" },
      { nameAr: "اقتصاد", nameEn: "Economy", slug: "economy", icon: "💰" },
      { nameAr: "تكنولوجيا", nameEn: "Technology", slug: "technology", icon: "💻" },
      { nameAr: "رياضة", nameEn: "Sports", slug: "sports", icon: "⚽" },
      { nameAr: "صحة", nameEn: "Health", slug: "health", icon: "🏥" },
      { nameAr: "ثقافة", nameEn: "Culture", slug: "culture", icon: "🎭" },
    ];

    const insertedCategories = await db
      .insert(categories)
      .values(categoriesData)
      .onConflictDoNothing()
      .returning();

    console.log(`✅ Created ${insertedCategories.length} categories`);

    console.log("🎉 Seeding completed!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seed();
