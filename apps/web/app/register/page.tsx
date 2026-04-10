import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { churches } from "@sanctuary/db";
import { eq } from "drizzle-orm";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { RegisterWizard } from "@/components/onboarding/RegisterWizard";

export default async function RegisterPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/register");

  // Redirect if this user already owns a church
  const [ownedChurch] = await db
    .select({ slug: churches.slug })
    .from(churches)
    .where(eq(churches.ownerClerkUserId, userId))
    .limit(1);
  if (ownedChurch) redirect(`/${ownedChurch.slug}/admin`);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <SiteHeader />
      <main className="px-4 pt-[96px] pb-20">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-900/40">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-white mb-2">Create your account</h1>
            <p className="text-white/40 text-sm">Register your organisation or individual profile on ChurchPass.</p>
          </div>

          {/* Wizard */}
          <div className="rounded-2xl bg-[#111118] border border-white/8 p-7">
            <RegisterWizard />
          </div>

          <p className="text-center text-xs text-white/20 mt-6">
            Already registered?{" "}
            <a href="/sign-in" className="text-indigo-400 hover:text-indigo-300 transition-colors">Sign in</a>
          </p>
        </div>
      </main>
    </div>
  );
}
