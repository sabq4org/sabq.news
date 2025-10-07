import { readFile } from "fs/promises";
import { join } from "path";
import { eq } from "drizzle-orm";
import type { Pool } from "@neondatabase/serverless";
import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import * as schema from "../../shared/schema.js";
import { seedRBAC } from "../seedRBAC.js";
import { bootstrapAdmin } from "./bootstrapAdmin.js";

export async function setupProductionDatabase(
  pool: Pool,
  db: NeonDatabase<typeof schema>
) {
  console.log("🚀 Starting production database setup...");

  try {
    // Step 1: Apply schema (create tables)
    console.log("\n📋 Step 1: Applying database schema...");
    const migrationSQL = await readFile(
      join(process.cwd(), "migrations", "0000_lazy_jocasta.sql"),
      "utf-8"
    );
    
    await pool.query(migrationSQL);
    console.log("✅ Database schema applied successfully");

    // Step 2: Seed RBAC (Roles & Permissions)
    console.log("\n👥 Step 2: Seeding RBAC (Roles & Permissions)...");
    const { allRoles, allPermissions } = await seedRBAC();
    console.log(`✅ Created ${allRoles.length} roles and ${allPermissions.length} permissions`);

    // Step 3: Seed Categories
    console.log("\n📁 Step 3: Seeding categories...");
    const categoriesData = [
      { nameAr: "سياسة", nameEn: "Politics", slug: "politics", color: "#e74c3c", icon: "⚖️", displayOrder: 1 },
      { nameAr: "اقتصاد", nameEn: "Economy", slug: "economy", color: "#3498db", icon: "💼", displayOrder: 2 },
      { nameAr: "رياضة", nameEn: "Sports", slug: "sports", color: "#2ecc71", icon: "⚽", displayOrder: 3 },
      { nameAr: "تقنية", nameEn: "Technology", slug: "technology", color: "#9b59b6", icon: "💻", displayOrder: 4 },
      { nameAr: "صحة", nameEn: "Health", slug: "health", color: "#1abc9c", icon: "🏥", displayOrder: 5 },
      { nameAr: "ثقافة", nameEn: "Culture", slug: "culture", color: "#f39c12", icon: "🎭", displayOrder: 6 },
    ];

    for (const cat of categoriesData) {
      await db
        .insert(schema.categories)
        .values({
          nameAr: cat.nameAr,
          nameEn: cat.nameEn,
          slug: cat.slug,
          color: cat.color,
          icon: cat.icon,
          displayOrder: cat.displayOrder,
        })
        .onConflictDoNothing();
    }
    console.log(`✅ Created ${categoriesData.length} categories`);

    // Step 4: Create admin user
    console.log("\n👤 Step 4: Creating admin user...");
    const adminResult = await bootstrapAdmin(db);
    console.log(`✅ Admin user created: ${adminResult.email}`);

    // Step 5: Create default theme
    console.log("\n🎨 Step 5: Creating default theme...");
    const [adminUser] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, adminResult.email))
      .limit(1);

    if (adminUser) {
      await db
        .insert(schema.themes)
        .values({
          name: "سبق الافتراضي",
          slug: "default",
          isDefault: true,
          status: "published",
          priority: 100,
          createdBy: adminUser.id,
          publishedBy: adminUser.id,
          tokens: {
            colors: {
              primary: { h: 210, s: 100, l: 50 },
              secondary: { h: 270, s: 60, l: 50 },
              accent: { h: 30, s: 90, l: 55 },
            },
          },
        })
        .onConflictDoNothing();
      console.log("✅ Default theme created");
    }

    console.log("\n🎉 Production database setup completed successfully!");
    return {
      success: true,
      message: "Database setup completed",
      credentials: {
        email: adminResult.email,
        password: adminResult.password,
      },
    };
  } catch (error) {
    console.error("❌ Production setup error:", error);
    throw error;
  }
}
