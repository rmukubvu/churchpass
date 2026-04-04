import { createDb } from "@sanctuary/db";

const databaseUrl = process.env["DATABASE_URL"];

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Copy apps/web/.env.example to apps/web/.env.local and fill in your credentials."
  );
}

export const db = createDb(databaseUrl);
