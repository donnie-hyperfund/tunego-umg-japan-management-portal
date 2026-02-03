import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { Plus, ExternalLink, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import SitesList from "@/components/sites/SitesList";

export default async function SitesPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-[#060606]">
      {/* Hero Banner */}
      <div className="relative h-48 md:h-64 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url(https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=2000&auto=format&fit=crop)",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#060606] via-[#060606]/90 to-[#060606]/70"></div>
        </div>
        <div className="relative max-w-[1400px] mx-auto px-6 sm:px-8 md:px-12 lg:px-16 h-full flex items-center">
          <div className="flex items-center justify-between w-full">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white" style={{ fontFamily: '"Avenir Next", sans-serif' }}>
                Campaign Sites
              </h1>
              <p className="text-[#CCCCCC] text-base sm:text-lg md:text-xl leading-relaxed max-w-2xl">
                Create and manage artist campaign sites
              </p>
            </div>
            <Link
              href="/sites/new"
              className="hidden md:flex items-center gap-2 px-6 py-3 bg-[#00A0FF] hover:bg-[#0088CC] text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Site
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-12 md:py-16">
        <div className="mb-6 flex items-center justify-between">
          <div className="md:hidden">
            <Link
              href="/sites/new"
              className="flex items-center gap-2 px-4 py-2 bg-[#00A0FF] hover:bg-[#0088CC] text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Site
            </Link>
          </div>
        </div>
        <SitesList />
      </div>
    </div>
  );
}
