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

  useEffect(() => {
    fetchCheckIns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#00A0FF]"></div>
        <p className="mt-2 text-[#AAAAAA] text-sm">Loading check-ins...</p>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 sm:p-6 border border-[#1A1A1A] rounded-lg bg-[#0F0F0F]">
      <h4 className="text-base sm:text-lg font-semibold mb-4 text-white">Event Check-ins</h4>
      {checkIns.length === 0 ? (
        <p className="text-[#6A6A6A] text-sm">No check-ins for this event yet.</p>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1A1A1A] bg-[#060606]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#CCCCCC] uppercase tracking-wider">User ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#CCCCCC] uppercase tracking-wider">Location</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#CCCCCC] uppercase tracking-wider">Points Awarded</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#CCCCCC] uppercase tracking-wider">Checked In At</th>
                </tr>
              </thead>
              <tbody>
                {checkIns.map((checkIn) => (
                  <tr key={checkIn.id} className="border-b border-[#1A1A1A] hover:bg-[#0A0A0A] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-[#AAAAAA]">
                      {checkIn.clerkUserId || checkIn.userId}
                    </td>
                    <td className="px-4 py-3 text-[#AAAAAA]">
                      {checkIn.latitude && checkIn.longitude
                        ? `${checkIn.latitude}, ${checkIn.longitude}`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-[#00A0FF] font-semibold">
                      {checkIn.pointsAwarded !== null
                        ? `${checkIn.pointsAwarded} pts`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#AAAAAA]">
                      {new Date(checkIn.checkedInAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {checkIns.map((checkIn) => (
              <div
                key={checkIn.id}
                className="bg-[#060606] border border-[#1A1A1A] rounded-lg p-4 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-[#AAAAAA] truncate">
                      {checkIn.clerkUserId || checkIn.userId}
                    </p>
                    <p className="text-[#8A8A8A] text-xs mt-1">
                      {new Date(checkIn.checkedInAt).toLocaleString()}
                    </p>
                  </div>
                  {checkIn.pointsAwarded !== null && (
                    <div className="px-2.5 py-1 rounded-lg bg-[#00A0FF]/10 text-[#00A0FF] font-semibold text-sm shrink-0 ml-2">
                      {checkIn.pointsAwarded} pts
                    </div>
                  )}
                </div>
                {checkIn.latitude && checkIn.longitude && (
                  <div className="pt-2 border-t border-[#1A1A1A]">
                    <span className="text-[#8A8A8A] text-xs">Location: </span>
                    <span className="text-[#AAAAAA] text-xs">
                      {checkIn.latitude}, {checkIn.longitude}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
