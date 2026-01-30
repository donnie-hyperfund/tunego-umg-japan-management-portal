"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Eye, EyeOff, Power, PowerOff, Pencil, Trash2, MapPin } from "lucide-react";
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

// Dynamically import GeofencePreview to avoid SSR issues with Leaflet
const GeofencePreview = dynamic(() => import("./GeofencePreview"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-48 bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg flex items-center justify-center">
      <p className="text-[#AAAAAA] text-sm">Loading map...</p>
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
  const [previewEventId, setPreviewEventId] = useState<string | null>(null);
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
  
  // Use ref to track latest formData to avoid closure issues
  const formDataRef = useRef(formData);

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

      // Use ref to get latest formData to avoid closure issues
      const currentFormData = formDataRef.current;
      
      const payload = {
        ...currentFormData,
        geofenceType: currentFormData.geofenceType || null,
        geofenceLatitude: currentFormData.geofenceLatitude
          ? parseFloat(currentFormData.geofenceLatitude)
          : null,
        geofenceLongitude: currentFormData.geofenceLongitude
          ? parseFloat(currentFormData.geofenceLongitude)
          : null,
        geofenceRadius: currentFormData.geofenceRadius
          ? parseInt(currentFormData.geofenceRadius)
          : null,
        geofencePolygon: currentFormData.geofencePolygon,
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
        const resetFormData = {
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
        };
        setFormData(resetFormData);
        formDataRef.current = resetFormData; // Update ref immediately
      } else {
        const errorData = await response.json();
        console.error("Error saving event:", errorData);
        alert(`Error: ${errorData.error || "Failed to save event"}`);
      }
    } catch (error) {
      console.error("Error saving event:", error);
      alert("An error occurred while saving the event. Please check the console for details.");
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    
    // Parse geofencePolygon if it's a string (JSON)
    let parsedPolygon = event.geofencePolygon;
    if (typeof event.geofencePolygon === "string") {
      try {
        parsedPolygon = JSON.parse(event.geofencePolygon);
      } catch (e) {
        console.error("[EventsManager] Failed to parse polygon JSON:", e);
        parsedPolygon = null;
      }
    }
    
    // If polygon is an empty array, keep it as null
    if (Array.isArray(parsedPolygon) && parsedPolygon.length === 0) {
      parsedPolygon = null;
    }
    
    const formDataToSet = {
      name: event.name,
      description: event.description || "",
      startDate: new Date(event.startDate).toISOString().slice(0, 16),
      endDate: new Date(event.endDate).toISOString().slice(0, 16),
      location: event.location || "",
      geofenceType: event.geofenceType || "circle",
      geofenceLatitude: event.geofenceLatitude || "",
      geofenceLongitude: event.geofenceLongitude || "",
      geofenceRadius: event.geofenceRadius?.toString() || "",
      geofencePolygon: parsedPolygon,
      isActive: event.isActive,
    };
    setFormData(formDataToSet);
    formDataRef.current = formDataToSet; // Update ref immediately
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
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#00A0FF]"></div>
        <p className="mt-4 text-[#AAAAAA]">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0F0F0F] border border-[#1A1A1A] rounded-xl shadow-lg">
      <div className="flex justify-between items-center p-6 border-b border-[#1A1A1A]">
        <h3 className="text-xl font-bold text-white">Events</h3>
        <button
          onClick={() => {
            const resetFormData = {
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
            };
            setShowForm(true);
            setEditingEvent(null);
            setFormData(resetFormData);
            formDataRef.current = resetFormData; // Update ref immediately
          }}
          className="px-5 py-2.5 bg-[#00A0FF] text-white rounded-lg hover:bg-[#0088DD] transition-colors text-sm font-medium shadow-[0_0_10px_rgba(0,160,255,0.3)]"
        >
          + Add New Event
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-6 border-b border-[#1A1A1A] bg-[#060606]">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-[#CCCCCC]">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData((prev) => {
                    const updated = { ...prev, name: e.target.value };
                    formDataRef.current = updated;
                    return updated;
                  });
                }}
                className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg text-white placeholder-[#6A6A6A] focus:border-[#00A0FF] focus:outline-none focus:ring-1 focus:ring-[#00A0FF] transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-[#CCCCCC]">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => {
                  setFormData((prev) => {
                    const updated = { ...prev, location: e.target.value };
                    formDataRef.current = updated;
                    return updated;
                  });
                }}
                className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg text-white placeholder-[#6A6A6A] focus:border-[#00A0FF] focus:outline-none focus:ring-1 focus:ring-[#00A0FF] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-[#CCCCCC]">Start Date</label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => {
                  setFormData((prev) => {
                    const updated = { ...prev, startDate: e.target.value };
                    formDataRef.current = updated;
                    return updated;
                  });
                }}
                className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg text-white focus:border-[#00A0FF] focus:outline-none focus:ring-1 focus:ring-[#00A0FF] transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-[#CCCCCC]">End Date</label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => {
                  setFormData((prev) => {
                    const updated = { ...prev, endDate: e.target.value };
                    formDataRef.current = updated;
                    return updated;
                  });
                }}
                className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg text-white focus:border-[#00A0FF] focus:outline-none focus:ring-1 focus:ring-[#00A0FF] transition-colors"
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
                  setFormData((prev) => {
                    const updated = { ...prev, geofenceType: type };
                    formDataRef.current = updated;
                    return updated;
                  });
                }}
                onLocationChange={(lat, lng) => {
                  setFormData((prev) => {
                    const updated = {
                      ...prev,
                      geofenceLatitude: lat.toString(),
                      geofenceLongitude: lng.toString(),
                    };
                    formDataRef.current = updated;
                    return updated;
                  });
                }}
                onRadiusChange={(radius) => {
                  setFormData((prev) => {
                    const updated = { ...prev, geofenceRadius: radius.toString() };
                    formDataRef.current = updated;
                    return updated;
                  });
                }}
                onPolygonChange={(polygon) => {
                  // Update state and ref together inside the state updater
                  setFormData((prev) => {
                    const updated = {
                      ...prev,
                      geofencePolygon: polygon,
                    };
                    // Update ref synchronously inside the state updater
                    formDataRef.current = updated;
                    return updated;
                  });
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-[#CCCCCC]">Active</label>
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => {
                    setFormData((prev) => {
                      const updated = { ...prev, isActive: e.target.checked };
                      formDataRef.current = updated;
                      return updated;
                    });
                  }}
                  className="w-5 h-5 rounded border-[#1A1A1A] bg-[#0F0F0F] text-[#00A0FF] focus:ring-[#00A0FF] focus:ring-2"
                />
                <span className="ml-2 text-[#AAAAAA] text-sm">
                  {formData.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2 text-[#CCCCCC]">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => {
                  setFormData((prev) => {
                    const updated = { ...prev, description: e.target.value };
                    formDataRef.current = updated;
                    return updated;
                  });
                }}
                className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg text-white placeholder-[#6A6A6A] focus:border-[#00A0FF] focus:outline-none focus:ring-1 focus:ring-[#00A0FF] transition-colors resize-none"
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#00A0FF] text-white rounded-lg hover:bg-[#0088DD] transition-colors text-sm font-medium shadow-[0_0_10px_rgba(0,160,255,0.3)]"
            >
              {editingEvent ? "Update Event" : "Create Event"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingEvent(null);
              }}
              className="px-5 py-2.5 bg-[#1A1A1A] text-[#CCCCCC] rounded-lg hover:bg-[#2A2A2A] transition-colors text-sm font-medium border border-[#2A2A2A]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1A1A1A] bg-[#060606]">
              <th className="text-left px-6 py-4 text-xs font-semibold text-[#CCCCCC] uppercase tracking-wider">Name</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-[#CCCCCC] uppercase tracking-wider">Location</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-[#CCCCCC] uppercase tracking-wider">Start Date</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-[#CCCCCC] uppercase tracking-wider">End Date</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-[#CCCCCC] uppercase tracking-wider">Geofence</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-[#CCCCCC] uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-[#CCCCCC] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center px-6 py-12 text-[#6A6A6A]">
                  No events found. Create one to get started.
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr key={event.id} className="border-b border-[#1A1A1A] hover:bg-[#0A0A0A] transition-colors">
                  <td className="px-6 py-4 text-white font-medium">{event.name}</td>
                  <td className="px-6 py-4 text-[#AAAAAA]">{event.location || "-"}</td>
                  <td className="px-6 py-4 text-sm text-[#AAAAAA]">
                    {new Date(event.startDate).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#AAAAAA]">
                    {new Date(event.endDate).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#AAAAAA]">
                    <div className="flex items-center gap-2">
                      <span>
                        {event.geofenceType === "polygon" && event.geofencePolygon
                          ? `Polygon (${event.geofencePolygon.length} points)`
                          : event.geofenceType === "circle" &&
                            event.geofenceLatitude &&
                            event.geofenceLongitude
                          ? `Circle: ${event.geofenceLatitude}, ${event.geofenceLongitude}${
                              event.geofenceRadius ? ` (${event.geofenceRadius}m)` : ""
                            }`
                          : "-"}
                      </span>
                      {(event.geofenceType === "polygon" && event.geofencePolygon) ||
                      (event.geofenceType === "circle" &&
                        event.geofenceLatitude &&
                        event.geofenceLongitude) ? (
                        <button
                          onClick={() =>
                            setPreviewEventId(
                              previewEventId === event.id ? null : event.id
                            )
                          }
                          className="p-1.5 text-[#00A0FF] hover:text-[#0088DD] hover:bg-[#00A0FF]/10 rounded transition-colors"
                          title="Preview geofence on map"
                        >
                          <MapPin className="w-4 h-4" />
                        </button>
                      ) : null}
                    </div>
                    {previewEventId === event.id && (
                      <div className="mt-3">
                        <GeofencePreview
                          geofenceType={event.geofenceType}
                          latitude={
                            event.geofenceLatitude
                              ? parseFloat(event.geofenceLatitude)
                              : null
                          }
                          longitude={
                            event.geofenceLongitude
                              ? parseFloat(event.geofenceLongitude)
                              : null
                          }
                          radius={event.geofenceRadius}
                          polygon={event.geofencePolygon}
                        />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        event.isActive
                          ? "bg-[#00A0FF]/20 text-[#00A0FF] border border-[#00A0FF]/30"
                          : "bg-[#3A3A3A] text-[#8A8A8A] border border-[#2A2A2A]"
                      }`}
                    >
                      {event.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() =>
                          setSelectedEventId(
                            selectedEventId === event.id ? null : event.id
                          )
                        }
                        className="p-2 text-[#00A0FF] hover:text-[#0088DD] hover:bg-[#00A0FF]/10 rounded transition-colors"
                        title={selectedEventId === event.id ? "Hide Check-ins" : "View Check-ins"}
                      >
                        {selectedEventId === event.id ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => toggleActive(event)}
                        className="p-2 text-[#00A0FF] hover:text-[#0088DD] hover:bg-[#00A0FF]/10 rounded transition-colors"
                        title={event.isActive ? "Deactivate" : "Activate"}
                      >
                        {event.isActive ? (
                          <PowerOff className="w-4 h-4" />
                        ) : (
                          <Power className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(event)}
                        className="p-2 text-[#FF9900] hover:text-[#FF8800] hover:bg-[#FF9900]/10 rounded transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
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
