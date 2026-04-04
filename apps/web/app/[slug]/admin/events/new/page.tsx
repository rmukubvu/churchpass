import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { churches } from "@sanctuary/db";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CreateEventForm } from "@/components/admin/CreateEventForm";
import { isChurchAdmin } from "@/lib/auth/isChurchAdmin";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function NewEventPage({ params }: Props) {
  const { userId } = await auth();
  const { slug } = await params;

  if (!userId) {
    redirect(`/sign-in?redirect_url=/${slug}/admin/events/new`);
  }
  if (!(await isChurchAdmin(slug))) redirect(`/${slug}`);

  let church;
  try {
    const [found] = await db
      .select({ id: churches.id, name: churches.name, slug: churches.slug, brandColour: churches.brandColour })
      .from(churches)
      .where(eq(churches.slug, slug))
      .limit(1);
    church = found;
  } catch {
    // Dev fallback
    church = { id: "dev-church-1", name: "Koinonia", slug, brandColour: "#4F46E5" };
  }

  if (!church) notFound();

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <SiteHeader />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-white/30 mb-8">
          <a href={`/${slug}`} className="hover:text-white/60 transition-colors">
            {church.name}
          </a>
          <span>/</span>
          <span className="text-white/50">New event</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full mb-4"
            style={{ backgroundColor: church.brandColour + "22", color: church.brandColour }}
          >
            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 2v12M2 8h12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            New event
          </div>
          <h1 className="text-3xl font-extrabold text-white">Create an event</h1>
          <p className="text-white/40 text-sm mt-2">
            Fill in the details below. The location will be geocoded automatically
            for hotel suggestions.
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 sm:p-8">
          <CreateEventForm churchId={church.id} churchSlug={slug} />
        </div>
      </div>
    </div>
  );
}
