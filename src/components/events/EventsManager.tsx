"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import EventCheckInsView from "./EventCheckInsView";

// Dynamically import MapPicker to avoid SSR issues with Leaflet
const MapPicker = dynamic(() => import("./MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});

interface Event {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  location: string | null;
  geofenceType: "circle" | "polygon" | null;
  geofenceLatitude: string | null;
  geofenceLongitude: string | null;
  geofenceRadius: number | null;
  geofencePolygon: Array<[number, number]> | null;
  isActive: boolean;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

export default function EventsManager() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    location: "",
    geofenceType: "circle" as "circle" | "polygon",
    geofenceLatitude: "",
    geofenceLongitude: "",
    geofenceRadius: "",
    geofencePolygon: null as Array<[number, number]> | null,
    isActive: true,
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events");
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingEvent
        ? `/api/events/${editingEvent.id}`
        : "/api/events";
      const method = editingEvent ? "PATCH" : "POST";

      const payload = {
        ...formData,
        geofenceType: formData.geofenceType || null,
        geofenceLatitude: formData.geofenceLatitude
          ? parseFloat(formData.geofenceLatitude)
          : null,
        geofenceLongitude: formData.geofenceLongitude
          ? parseFloat(formData.geofenceLongitude)
          : null,
        geofenceRadius: formData.geofenceRadius
          ? parseInt(formData.geofenceRadius)
          : null,
        geofencePolygon: formData.geofencePolygon,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchEvents();
        setShowForm(false);
        setEditingEvent(null);
        setFormData({
          name: "",
          description: "",
          startDate: "",
          endDate: "",
          location: "",
          geofenceType: "circle",
          geofenceLatitude: "",
          geofenceLongitude: "",
          geofenceRadius: "",
          geofencePolygon: null,
          isActive: true,
        });
      }
    } catch (error) {
      console.error("Error saving event:", error);
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      description: event.description || "",
      startDate: new Date(event.startDate).toISOString().slice(0, 16),
      endDate: new Date(event.endDate).toISOString().slice(0, 16),
      location: event.location || "",
      geofenceType: event.geofenceType || "circle",
      geofenceLatitude: event.geofenceLatitude || "",
      geofenceLongitude: event.geofenceLongitude || "",
      geofenceRadius: event.geofenceRadius?.toString() || "",
      geofencePolygon: event.geofencePolygon || null,
      isActive: event.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const response = await fetch(`/api/events/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchEvents();
      }
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const toggleActive = async (event: Event) => {
    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !event.isActive }),
      });

      if (response.ok) {
        await fetchEvents();
      }
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Events</h3>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingEvent(null);
            setFormData({
              name: "",
              description: "",
              startDate: "",
              endDate: "",
              location: "",
              geofenceType: "circle",
              geofenceLatitude: "",
              geofenceLongitude: "",
              geofenceRadius: "",
              geofencePolygon: null,
              isActive: true,
            });
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add New Event
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">
                Geofence Location
              </label>
              <MapPicker
                geofenceType={formData.geofenceType}
                latitude={
                  formData.geofenceLatitude
                    ? parseFloat(formData.geofenceLatitude)
                    : null
                }
                longitude={
                  formData.geofenceLongitude
                    ? parseFloat(formData.geofenceLongitude)
                    : null
                }
                radius={
                  formData.geofenceRadius
                    ? parseInt(formData.geofenceRadius)
                    : null
                }
                polygon={formData.geofencePolygon}
                onGeofenceTypeChange={(type) => {
                  setFormData({
                    ...formData,
                    geofenceType: type,
                  });
                }}
                onLocationChange={(lat, lng) => {
                  setFormData({
                    ...formData,
                    geofenceLatitude: lat.toString(),
                    geofenceLongitude: lng.toString(),
                  });
                }}
                onRadiusChange={(radius) => {
                  setFormData({
                    ...formData,
                    geofenceRadius: radius.toString(),
                  });
                }}
                onPolygonChange={(polygon) => {
                  setFormData({
                    ...formData,
                    geofencePolygon: polygon,
                  });
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Active</label>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="mt-2"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              {editingEvent ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingEvent(null);
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Location</th>
              <th className="text-left p-2">Start Date</th>
              <th className="text-left p-2">End Date</th>
              <th className="text-left p-2">Geofence</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center p-4 text-gray-500">
                  No events found. Create one to get started.
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr key={event.id} className="border-b">
                  <td className="p-2">{event.name}</td>
                  <td className="p-2">{event.location || "-"}</td>
                  <td className="p-2 text-sm">
                    {new Date(event.startDate).toLocaleString()}
                  </td>
                  <td className="p-2 text-sm">
                    {new Date(event.endDate).toLocaleString()}
                  </td>
                  <td className="p-2 text-sm">
                    {event.geofenceType === "polygon" && event.geofencePolygon
                      ? `Polygon (${event.geofencePolygon.length} points)`
                      : event.geofenceType === "circle" &&
                        event.geofenceLatitude &&
                        event.geofenceLongitude
                      ? `Circle: ${event.geofenceLatitude}, ${event.geofenceLongitude}${
                          event.geofenceRadius ? ` (${event.geofenceRadius}m)` : ""
                        }`
                      : "-"}
                  </td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        event.isActive
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      }`}
                    >
                      {event.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setSelectedEventId(
                            selectedEventId === event.id ? null : event.id
                          )
                        }
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {selectedEventId === event.id ? "Hide" : "View"} Check-ins
                      </button>
                      <button
                        onClick={() => toggleActive(event)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {event.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => handleEdit(event)}
                        className="text-yellow-600 hover:text-yellow-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedEventId && (
        <div className="mt-6">
          <EventCheckInsView eventId={selectedEventId} />
        </div>
      )}
    </div>
  );
}
