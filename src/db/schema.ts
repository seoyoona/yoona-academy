import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  primaryKey,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Per-user state only. Course CONTENT lives in committed JSON (content/generated),
 * not here — so the reading experience needs no DB. This schema backs "account
 * mode": cross-device progress sync, quiz history, and tutor chat history once
 * Postgres + auth are provisioned. `userId` is the auth provider's user id.
 */

export const progress = pgTable(
  "progress",
  {
    userId: text("user_id").notNull(),
    lessonId: text("lesson_id").notNull(),
    status: text("status", { enum: ["in_progress", "completed"] })
      .notNull()
      .default("in_progress"),
    completedAt: timestamp("completed_at"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.lessonId] })],
);

/**
 * External certification courses (Salesforce, Databricks, Google …). Unlike
 * lessons — which are binary complete — a cert tracks a status + percent + the
 * earned badge URL + a free-form note. Catalog lives in committed JSON
 * (src/content/certifications.ts); only the user's progress is stored here.
 */
export const certProgress = pgTable(
  "cert_progress",
  {
    userId: text("user_id").notNull(),
    certId: text("cert_id").notNull(),
    status: text("status", {
      enum: ["not_started", "in_progress", "completed"],
    })
      .notNull()
      .default("not_started"),
    percent: integer("percent").notNull().default(0),
    badgeUrl: text("badge_url"),
    notes: text("notes"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.certId] })],
);

export const quizAttempts = pgTable("quiz_attempts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  lessonId: text("lesson_id").notNull(),
  score: integer("score").notNull(),
  total: integer("total").notNull(),
  answers: jsonb("answers").$type<number[]>().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  lessonId: text("lesson_id").notNull(),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
