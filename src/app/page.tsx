import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function Home() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-[#060606]">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 md:px-12 lg:px-16 py-16">
        <div className="mb-16">
          <h1 className="text-5xl font-bold mb-4 text-white" style={{ fontFamily: '"Avenir Next", sans-serif' }}>
            TuneGO Management Portal
          </h1>
          <p className="text-[#AAAAAA] text-lg leading-relaxed">
            Manage points, events, and user interactions
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/points"
            className="group block p-8 bg-[#0F0F0F] border border-[#1A1A1A] rounded-xl hover:border-[#00A0FF] transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,160,255,0.2)]"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Points System</h2>
              <svg className="w-6 h-6 text-[#00A0FF] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <p className="text-[#8A8A8A]">
              Manage point rules, transactions, and user rewards
            </p>
          </Link>

          <Link
            href="/events"
            className="group block p-8 bg-[#0F0F0F] border border-[#1A1A1A] rounded-xl hover:border-[#00A0FF] transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,160,255,0.2)]"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Live Events</h2>
              <svg className="w-6 h-6 text-[#00A0FF] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <p className="text-[#8A8A8A]">
              Manage live events, geofences, and check-ins
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
