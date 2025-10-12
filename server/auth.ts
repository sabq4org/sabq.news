import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          console.log("🔍 LocalStrategy: Checking user:", email);
          
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email.toLowerCase()))
            .limit(1);

          if (!user) {
            console.log("❌ LocalStrategy: User not found");
            return done(null, false, { message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
          }

          console.log("✅ LocalStrategy: User found, checking password");

          if (!user.passwordHash) {
            console.log("❌ LocalStrategy: No password hash");
            return done(null, false, { message: "هذا الحساب يحتاج إلى إعادة تعيين كلمة المرور" });
          }

          const isValidPassword = await bcrypt.compare(password, user.passwordHash);
          console.log("🔑 LocalStrategy: Password valid?", isValidPassword);
          
          if (!isValidPassword) {
            return done(null, false, { message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
          }

          if (user.status !== "active") {
            console.log("❌ LocalStrategy: User not active:", user.status);
            return done(null, false, { message: "هذا الحساب معطل. يرجى التواصل مع الإدارة" });
          }

          console.log("✅ LocalStrategy: Success!");
          return done(null, { id: user.id, email: user.email });
        } catch (error) {
          console.error("❌ LocalStrategy error:", error);
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    console.log('🔹 SerializeUser:', user.id);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      console.log('🔸 DeserializeUser called with id:', id);
      const user = await storage.getUser(id);
      if (!user) {
        console.log('❌ DeserializeUser: User not found for id:', id);
        return done(null, false);
      }
      console.log('✅ DeserializeUser: User found:', user.email);
      done(null, { id: user.id, email: user.email });
    } catch (error) {
      console.error('❌ DeserializeUser error:', error);
      done(error);
    }
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};
