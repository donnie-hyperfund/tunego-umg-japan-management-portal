"use client";

import { useState, useEffect } from "react";

interface EventCheckIn {
  id: string;
  eventId: string;
  userId: string;
  clerkUserId: string | null;
  latitude: string | null;
  longitude: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  checkedInAt: string;
  pointsAwarded: number | null;
}

interface EventCheckInsViewProps {
  eventId: string;
}

export default function EventCheckInsView({ eventId }: EventCheckInsViewProps) {
  const [checkIns, setCheckIns] = useState<EventCheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCheckIns();
  }, [eventId]);

  const fetchCheckIns = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/check-ins`);
      if (response.ok) {
        const data = await response.json();
        setCheckIns(data.checkIns || []);
      }
    } catch (error) {
      console.error("Error fetching check-ins:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading check-ins...</div>;
  }

  return (
    <div className="mt-4 p-4 border rounded">
      <h4 className="text-lg font-semibold mb-4">Event Check-ins</h4>
      {checkIns.length === 0 ? (
        <p className="text-gray-500">No check-ins for this event yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">User ID</th>
                <th className="text-left p-2">Location</th>
                <th className="text-left p-2">Points Awarded</th>
                <th className="text-left p-2">Checked In At</th>
              </tr>
            </thead>
            <tbody>
              {checkIns.map((checkIn) => (
                <tr key={checkIn.id} className="border-b">
                  <td className="p-2 font-mono text-xs">
                    {checkIn.clerkUserId || checkIn.userId}
                  </td>
                  <td className="p-2">
                    {checkIn.latitude && checkIn.longitude
                      ? `${checkIn.latitude}, ${checkIn.longitude}`
                      : "-"}
                  </td>
                  <td className="p-2">
                    {checkIn.pointsAwarded !== null
                      ? `${checkIn.pointsAwarded} pts`
                      : "-"}
                  </td>
                  <td className="p-2">
                    {new Date(checkIn.checkedInAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
