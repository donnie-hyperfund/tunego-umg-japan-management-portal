import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import SiteEditor from "@/components/sites/SiteEditor";

export default async function SiteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { id } = await params;

  return (
    <div className="min-h-screen bg-[#060606]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-12 md:py-16">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Edit Site
          </h1>
          <p className="text-[#8A8A8A]">
            Update site settings and content
          </p>
        </div>
        <SiteEditor siteId={id} />
      </div>
    </div>
  );
}
