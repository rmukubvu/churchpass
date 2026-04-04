import { auth } from "@clerk/nextjs/server";
import type { Db } from "@sanctuary/db";
import { db } from "../db";

export type Context = {
  db: Db;
  clerkUserId: string | null;
};

export async function createContext(): Promise<Context> {
  const { userId } = await auth();
  return {
    db,
    clerkUserId: userId,
  };
}
