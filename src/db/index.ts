import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * DB client for account mode. Returns null when DATABASE_URL is unset so the app
 * degrades to local-only mode (progress in the browser) instead of crashing.
 */
export const db = process.env.DATABASE_URL
  ? drizzle(neon(process.env.DATABASE_URL), { schema })
  : null;

export const isDbEnabled = db !== null;
export { schema };
