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
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 md:px-12 lg:px-16 py-12">
        <div className="mb-8">
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
        
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Points System Management</h1>
        </div>

        <div className="space-y-16">
          <section>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Point Rules</h2>
              <p className="text-[#8A8A8A] text-sm leading-relaxed">
                Manage point earning rules for different actions (drop purchases, social media, etc.)
              </p>
            </div>
            <PointRulesManager />
          </section>

          <section>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Point Transactions</h2>
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
