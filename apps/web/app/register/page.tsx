import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { RegisterChurchForm } from "@/components/onboarding/RegisterChurchForm";

export default async function RegisterPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/register");

  const user = await currentUser();
  const adminOf = user?.publicMetadata?.adminOf as string[] | undefined;
  if (adminOf && adminOf.length > 0) {
    redirect(`/${adminOf[0]}/admin`);
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <SiteHeader />
      <main className="px-4 py-16">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-10">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Register your church</h1>
            <p className="text-white/50 text-sm">Set up your Church Pass page in under a minute.</p>
          </div>
          <RegisterChurchForm />
        </div>
      </main>
    </div>
  );
}
