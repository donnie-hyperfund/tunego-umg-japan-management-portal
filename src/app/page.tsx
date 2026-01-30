import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function Home() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Tunego Management Portal</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Link
            href="/points"
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
          >
            <h2 className="text-2xl font-semibold mb-2">Points System</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Manage point rules, transactions, and user rewards
            </p>
          </Link>

          <Link
            href="/events"
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
          >
            <h2 className="text-2xl font-semibold mb-2">Live Events</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Manage live events, geofences, and check-ins
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
