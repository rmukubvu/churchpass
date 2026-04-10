import { auth } from "@clerk/nextjs/server";
import { db } from "@/server/db";
import { individuals } from "@sanctuary/db";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    legalName: string;
    idType: "passport" | "drivers_license" | "national_id" | "other";
    idDocUrl?: string;
    description?: string;
    role: "artist" | "musician" | "organizer" | "speaker" | "volunteer" | "other";
    address?: string;
    website?: string;
    instagramHandle?: string;
    twitterHandle?: string;
  };

  if (!body.legalName || !body.role)
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  // Upsert — allow re-registration
  const [individual] = await db
    .insert(individuals)
    .values({
      clerkUserId: userId,
      legalName: body.legalName.trim(),
      idType: body.idType ?? null,
      idDocUrl: body.idDocUrl ?? null,
      description: body.description?.trim() ?? null,
      role: body.role,
      address: body.address?.trim() ?? null,
      website: body.website?.trim() ?? null,
      instagramHandle: body.instagramHandle?.trim() ?? null,
      twitterHandle: body.twitterHandle?.trim() ?? null,
    })
    .onConflictDoUpdate({
      target: [individuals.clerkUserId],
      set: {
        legalName: body.legalName.trim(),
        idType: body.idType ?? null,
        idDocUrl: body.idDocUrl ?? null,
        description: body.description?.trim() ?? null,
        role: body.role,
        address: body.address?.trim() ?? null,
      },
    })
    .returning();

  if (!individual) return NextResponse.json({ error: "Failed to register" }, { status: 500 });

  return NextResponse.json({ id: individual.id });
}
