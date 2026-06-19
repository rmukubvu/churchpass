import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";
import { registerUserInDb } from "@/lib/auth/db-register";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const sql = postgres(databaseUrl, { ssl: "require" });

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, password, code } = await req.json();

    // 1. Basic validation
    if (!firstName?.trim()) {
      return NextResponse.json({ error: "First name is required." }, { status: 400 });
    }
    if (!lastName?.trim()) {
      return NextResponse.json({ error: "Last name is required." }, { status: 400 });
    }
    if (!email?.trim() || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }
    if (!code?.trim() || code.length !== 6) {
      return NextResponse.json({ error: "A 6-digit verification code is required." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 2. Fetch and check verification OTP record
    const otpRecords = await sql`
      SELECT code, expires_at 
      FROM public.otp_verifications 
      WHERE email = ${cleanEmail} 
      LIMIT 1
    `;

    if (otpRecords.length === 0) {
      return NextResponse.json(
        { error: "No verification request found for this email." },
        { status: 400 }
      );
    }

    const { code: dbCode, expires_at: expiresAt } = otpRecords[0]!;

    if (dbCode !== code.trim()) {
      return NextResponse.json(
        { error: "Incorrect verification code." },
        { status: 400 }
      );
    }

    if (new Date(expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // 3. Register user in DB
    await registerUserInDb({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: cleanEmail,
      password,
    });

    // 4. Delete the used verification record
    await sql`
      DELETE FROM public.otp_verifications 
      WHERE email = ${cleanEmail}
    `;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error in register API:", err);
    return NextResponse.json(
      { error: err.message || "Failed to register user. Please try again." },
      { status: 500 }
    );
  }
}
