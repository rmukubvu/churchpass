import type { Config } from "drizzle-kit";
import { config } from "dotenv";
import path from "path";

// Load .env.local from apps/web since that's where credentials live
config({ path: path.resolve(__dirname, "../../apps/web/.env.local") });

export default {
  schema: "./src/schema/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env["DATABASE_URL"]!,
  },
} satisfies Config;
