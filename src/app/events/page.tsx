import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import EventsManager from "@/components/events/EventsManager";

export default async function EventsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-[#060606]">
      {/* Hero Banner */}
      <div className="relative h-48 md:h-56 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url(https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=2000&auto=format&fit=crop)",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#060606] via-[#060606]/95 to-[#060606]/80"></div>
        </div>
        <div className="relative max-w-[1400px] mx-auto px-6 sm:px-8 md:px-12 lg:px-16 h-full flex items-center">
          <div>
            <div className="mb-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-[#00A0FF] hover:text-[#0088DD] transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </Link>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white">Live Events Management</h1>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 md:px-12 lg:px-16 py-12">

        <div className="space-y-16">
          <section>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Events</h2>
              <p className="text-[#8A8A8A] text-sm leading-relaxed">
                Manage live events, geofences, and check-ins
              </p>
            </div>
            <EventsManager />
          </section>
        </div>
      </div>
    </div>
  );
}
