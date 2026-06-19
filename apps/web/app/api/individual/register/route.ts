import { auth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/server/db";
import { individuals, churches } from "@sanctuary/db";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    legalName: string;
    slug: string;
    idType: "passport" | "drivers_license" | "national_id" | "other";
    idDocUrl?: string;
    description?: string;
    role: "artist" | "musician" | "organizer" | "speaker" | "volunteer" | "other";
    address?: string;
    website?: string;
    instagramHandle?: string;
    twitterHandle?: string;
    contactEmail?: string;
    contactPhone?: string;
  };

  if (!body.legalName || !body.role || !body.slug)
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  const cleanSlug = body.slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!cleanSlug)
    return NextResponse.json({ error: "Invalid URL handle" }, { status: 400 });

  // Auto-deconflict slug if it's already taken
  let finalSlug = cleanSlug;
  const existing = await db
    .select({ id: churches.id })
    .from(churches)
    .where(eq(churches.slug, cleanSlug))
    .limit(1);
  if (existing[0]) {
    const randomSuffix = Math.random().toString(36).substring(2, 5); // 3 chars
    finalSlug = `${cleanSlug}-${randomSuffix}`;
  }

  // Upsert Individual Profile
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
        website: body.website?.trim() ?? null,
        instagramHandle: body.instagramHandle?.trim() ?? null,
        twitterHandle: body.twitterHandle?.trim() ?? null,
      },
    })
    .returning();

  if (!individual) return NextResponse.json({ error: "Failed to register profile" }, { status: 500 });

  // Create or Update corresponding personal Church/Space
  const [existingChurch] = await db
    .select()
    .from(churches)
    .where(eq(churches.ownerClerkUserId, userId))
    .limit(1);

  let finalChurch;
  if (existingChurch) {
    [finalChurch] = await db
      .update(churches)
      .set({
        name: body.legalName.trim(),
        description: body.description?.trim() || null,
        address: body.address?.trim() || null,
        publicEmail: body.contactEmail?.trim() || null,
        publicPhone: body.contactPhone?.trim() || null,
      })
      .where(eq(churches.id, existingChurch.id))
      .returning();
  } else {
    [finalChurch] = await db
      .insert(churches)
      .values({
        name: body.legalName.trim(),
        slug: finalSlug,
        ownerClerkUserId: userId,
        description: body.description?.trim() || null,
        address: body.address?.trim() || null,
        publicEmail: body.contactEmail?.trim() || null,
        publicPhone: body.contactPhone?.trim() || null,
        brandColour: "#4F46E5",
        timezone: "UTC",
        plan: "free",
        locationType: "physical",
        isVerified: false,
      })
      .returning();
  }

  if (!finalChurch) return NextResponse.json({ error: "Failed to create space" }, { status: 500 });

  // Grant admin access via Supabase metadata
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const existingAdminOf = (user.user_metadata?.adminOf as string[] | undefined) ?? [];
    await supabase.auth.updateUser({
      data: {
        adminOf: [...new Set([...existingAdminOf, finalChurch.slug])],
      },
    });
  }

  return NextResponse.json({ id: individual.id, slug: finalChurch.slug });
}
