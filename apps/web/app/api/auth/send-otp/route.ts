import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";
import { sendOtpEmail } from "@/lib/sendgrid";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const sql = postgres(databaseUrl, { ssl: "require" });

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Check if the user is already registered in auth.users
    const existingUser = await sql`
      SELECT id FROM auth.users WHERE email = ${cleanEmail} LIMIT 1
    `;

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 400 }
      );
    }

    // 2. Generate a 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // 3. Upsert the OTP in our verification table
    await sql`
      INSERT INTO public.otp_verifications (email, code, expires_at)
      VALUES (${cleanEmail}, ${code}, ${expiresAt})
      ON CONFLICT (email) DO UPDATE
      SET code = EXCLUDED.code, expires_at = EXCLUDED.expires_at, created_at = now()
    `;

    // 4. Send email via SendGrid
    await sendOtpEmail(cleanEmail, code);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error in send-otp API:", err);
    return NextResponse.json(
      { error: "Failed to send verification email. Please try again." },
      { status: 500 }
    );
  }
}
