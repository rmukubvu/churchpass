import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/server/db";
import { churches } from "@sanctuary/db";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, slug, address, brandColour } = await req.json();

  // Validate
  if (!name || !slug || !address)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const cleanSlug = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!cleanSlug)
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });

  // Check slug not taken
  const existing = await db
    .select({ id: churches.id })
    .from(churches)
    .where(eq(churches.slug, cleanSlug))
    .limit(1);

  if (existing[0])
    return NextResponse.json(
      { error: "This URL is already taken. Try another name or slug." },
      { status: 409 }
    );

  // Create church
  const [church] = await db
    .insert(churches)
    .values({
      name: name.trim(),
      slug: cleanSlug,
      address: address.trim(),
      brandColour: brandColour ?? "#4F46E5",
      timezone: "UTC",
      plan: "free",
    })
    .returning();

  // Grant admin access via Clerk metadata
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const existingAdminOf =
    (user.publicMetadata?.adminOf as string[] | undefined) ?? [];

  await clerk.users.updateUserMetadata(userId, {
    publicMetadata: {
      ...user.publicMetadata,
      adminOf: [...new Set([...existingAdminOf, cleanSlug])],
    },
  });

  if (!church) return NextResponse.json({ error: "Failed to create church" }, { status: 500 });

  return NextResponse.json({ slug: church.slug });
}
