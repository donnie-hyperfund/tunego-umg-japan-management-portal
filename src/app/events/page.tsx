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
        <h1 className="text-4xl font-bold mb-8">Live Events Management</h1>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Events</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Manage live events, geofences, and check-ins
            </p>
            <EventsManager />
          </section>
        </div>
      </div>
    </div>
  );
}
