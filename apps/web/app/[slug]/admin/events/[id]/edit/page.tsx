import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/server/db";
import { churches, events } from "@sanctuary/db";
import { eq, and } from "drizzle-orm";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { EditEventForm } from "@/components/admin/EditEventForm";
import { isChurchAdmin } from "@/lib/auth/isChurchAdmin";

type Props = {
  params: Promise<{ slug: string; id: string }>;
};

export default async function EditEventPage({ params }: Props) {
  const { userId } = await auth();
  const { slug, id } = await params;

  if (!userId) {
    redirect(`/sign-in?redirect_url=/${slug}/admin/events/${id}/edit`);
  }
  if (!(await isChurchAdmin(slug))) redirect(`/${slug}`);

  const [church] = await db
    .select({ id: churches.id, name: churches.name, slug: churches.slug, brandColour: churches.brandColour })
    .from(churches)
    .where(eq(churches.slug, slug))
    .limit(1);

  if (!church) notFound();

  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, id), eq(events.churchId, church.id)))
    .limit(1);

  if (!event) notFound();

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
          <a href={`/${slug}/admin`} className="hover:text-white/60 transition-colors">
            Admin
          </a>
          <span>/</span>
          <span className="text-white/50 truncate max-w-[200px]">{event.title}</span>
          <span>/</span>
          <span className="text-white/50">Edit</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full mb-4"
            style={{ backgroundColor: church.brandColour + "22", color: church.brandColour }}
          >
            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 8h12M10 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Edit event
          </div>
          <h1 className="text-3xl font-extrabold text-white">Edit event</h1>
          <p className="text-white/40 text-sm mt-2">
            Changes will go live immediately. Location changes re-geocode automatically.
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 sm:p-8">
          <EditEventForm event={event} churchSlug={slug} />
        </div>
      </div>
    </div>
  );
}
