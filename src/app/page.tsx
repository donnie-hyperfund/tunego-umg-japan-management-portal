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
      {/* Hero Banner */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url(https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=2000&auto=format&fit=crop)",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#060606] via-[#060606]/90 to-[#060606]/70"></div>
        </div>
        <div className="relative max-w-[1400px] mx-auto px-6 sm:px-8 md:px-12 lg:px-16 h-full flex items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 text-white" style={{ fontFamily: '"Avenir Next", sans-serif' }}>
              TuneGO Management Portal
            </h1>
            <p className="text-[#CCCCCC] text-lg md:text-xl leading-relaxed max-w-2xl">
              Manage points, events, and user interactions for Universal Music Japan
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 md:px-12 lg:px-16 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/points"
            className="group relative block overflow-hidden bg-[#0F0F0F] border border-[#1A1A1A] rounded-xl hover:border-[#00A0FF] transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,160,255,0.2)]"
          >
            <div 
              className="absolute inset-0 opacity-10 group-hover:opacity-15 transition-opacity bg-cover bg-center"
              style={{
                backgroundImage: "url(https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=800&auto=format&fit=crop)",
              }}
            ></div>
            <div className="relative p-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Points System</h2>
                <svg className="w-6 h-6 text-[#00A0FF] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-[#8A8A8A]">
                Manage point rules, transactions, and user rewards
              </p>
            </div>
          </Link>

          <Link
            href="/events"
            className="group relative block overflow-hidden bg-[#0F0F0F] border border-[#1A1A1A] rounded-xl hover:border-[#00A0FF] transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,160,255,0.2)]"
          >
            <div 
              className="absolute inset-0 opacity-10 group-hover:opacity-15 transition-opacity bg-cover bg-center"
              style={{
                backgroundImage: "url(https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=800&auto=format&fit=crop)",
              }}
            ></div>
            <div className="relative p-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Live Events</h2>
                <svg className="w-6 h-6 text-[#00A0FF] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-[#8A8A8A]">
                Manage live events, geofences, and check-ins
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
