import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import PointRulesManager from "@/components/points/PointRulesManager";
import PointTransactionsView from "@/components/points/PointTransactionsView";

export default async function PointsPage() {
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
            backgroundImage: "url(https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=2000&auto=format&fit=crop)",
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
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">Points System Management</h1>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8 md:py-12">

        <div className="space-y-8 md:space-y-16">
          <section>
            <div className="mb-4 md:mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Point Rules</h2>
              <p className="text-[#8A8A8A] text-sm leading-relaxed">
                Manage point earning rules for different actions (drop purchases, social media, etc.)
              </p>
            </div>
            <PointRulesManager />
          </section>

          <section>
            <div className="mb-4 md:mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Point Transactions</h2>
              <p className="text-[#8A8A8A] text-sm leading-relaxed">
                View and manage all point transactions
              </p>
            </div>
            <PointTransactionsView />
          </section>
        </div>
      </div>
    </div>
  );
}
