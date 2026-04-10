import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/server/db";
import { churches } from "@sanctuary/db";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    name: string;
    slug: string;
    address: string;
    brandColour: string;
    // Step 2 — org profile
    description?: string;
    registrationDocUrl?: string;
    foundedYear?: number;
    website?: string;
    bannerUrl?: string;
    logoUrl?: string;
    // Step 3 — org details
    denomination?: string;
    primaryLanguage?: string;
    otherLanguages?: string[];
    congregationSize?: string;
    instagramHandle?: string;
    twitterHandle?: string;
    facebookHandle?: string;
    youtubeHandle?: string;
    // Step 4 — location & contact
    locationType?: "physical" | "virtual" | "both";
    publicEmail?: string;
    publicPhone?: string;
  };

  const { name, slug, address, brandColour, ...rest } = body;

  if (!name || !slug || !address)
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  const cleanSlug = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!cleanSlug)
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });

  const existing = await db
    .select({ id: churches.id })
    .from(churches)
    .where(eq(churches.slug, cleanSlug))
    .limit(1);

  if (existing[0])
    return NextResponse.json(
      { error: "This URL is already taken. Try a different name." },
      { status: 409 }
    );

  const [church] = await db
    .insert(churches)
    .values({
      name: name.trim(),
      slug: cleanSlug,
      address: address.trim(),
      brandColour: brandColour ?? "#4F46E5",
      timezone: "UTC",
      plan: "free",
      ownerClerkUserId: userId,
      description: rest.description?.trim() || null,
      registrationDocUrl: rest.registrationDocUrl || null,
      foundedYear: rest.foundedYear || null,
      website: rest.website?.trim() || null,
      bannerUrl: rest.bannerUrl || null,
      logoUrl: rest.logoUrl || null,
      denomination: rest.denomination?.trim() || null,
      primaryLanguage: rest.primaryLanguage || "English",
      otherLanguages: rest.otherLanguages ?? [],
      congregationSize: rest.congregationSize || null,
      instagramHandle: rest.instagramHandle?.trim() || null,
      twitterHandle: rest.twitterHandle?.trim() || null,
      facebookHandle: rest.facebookHandle?.trim() || null,
      youtubeHandle: rest.youtubeHandle?.trim() || null,
      locationType: rest.locationType ?? "physical",
      publicEmail: rest.publicEmail?.trim() || null,
      publicPhone: rest.publicPhone?.trim() || null,
    })
    .returning();

  if (!church) return NextResponse.json({ error: "Failed to create church" }, { status: 500 });

  // Grant admin access via Clerk metadata
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const existingAdminOf = (user.publicMetadata?.adminOf as string[] | undefined) ?? [];

  await clerk.users.updateUserMetadata(userId, {
    publicMetadata: {
      ...user.publicMetadata,
      adminOf: [...new Set([...existingAdminOf, cleanSlug])],
    },
  });

  return NextResponse.json({ slug: church.slug });
}
