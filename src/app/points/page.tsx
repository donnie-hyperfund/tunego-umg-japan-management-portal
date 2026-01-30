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
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            ← Back to Dashboard
          </Link>
        </div>
        <h1 className="text-4xl font-bold mb-8">Points System Management</h1>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Point Rules</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Manage point earning rules for different actions (drop purchases, social media, etc.)
            </p>
            <PointRulesManager />
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Point Transactions</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              View and manage all point transactions
            </p>
            <PointTransactionsView />
          </section>
        </div>
      </div>
    </div>
  );
}
