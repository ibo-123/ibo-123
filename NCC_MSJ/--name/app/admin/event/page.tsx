"use client";

import { useState, useEffect } from "react";
import API from "@/lib/api";

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: "Training" | "Meeting" | "Camp" | "Competition" | "Other";
  status: "Upcoming" | "Ongoing" | "Completed" | "Cancelled";
  attendees?: number;
  maxAttendees?: number;
  createdAt: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    type: "Training" as Event["type"],
    status: "Upcoming" as Event["status"],
    maxAttendees: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<Event["type"] | "All">("All");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await API.get("/event");
      setEvents(response.data.data || []);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await API.put(`/events/${editingId}`, form);
      } else {
        await API.post("/events", form);
      }
      fetchEvents();
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this event?")) {
      await API.delete(`/events/${id}`);
      fetchEvents();
    }
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      date: "",
      time: "",
      location: "",
      type: "Training",
      status: "Upcoming",
      maxAttendees: 0,
    });
    setEditingId(null);
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType = filterType === "All" || event.type === filterType;
    return matchesSearch && matchesType;
  });

  const getStatusColor = (status: Event["status"]) => {
    const colors = {
      Upcoming: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      Ongoing: "bg-green-500/10 text-green-400 border-green-500/30",
      Completed: "bg-gray-500/10 text-gray-400 border-gray-500/30",
      Cancelled: "bg-red-500/10 text-red-400 border-red-500/30",
    };
    return colors[status];
  };

  const getTypeIcon = (type: Event["type"]) => {
    const icons = {
      Training: "⚔️",
      Meeting: "👥",
      Camp: "🏕️",
      Competition: "🏆",
      Other: "📅",
    };
    return icons[type];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Events Management
          </h1>
          <p className="text-gray-400">Manage NCC events and activities</p>
          <div className="h-1 w-24 bg-gradient-to-r from-green-600 to-emerald-400 mt-4 rounded-full" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900/70 border border-green-900/30 rounded-xl p-6">
            <h3 className="text-sm text-gray-400 mb-1">Total Events</h3>
            <p className="text-2xl font-bold text-white">{events.length}</p>
          </div>
          <div className="bg-gray-900/70 border border-green-900/30 rounded-xl p-6">
            <h3 className="text-sm text-gray-400 mb-1">Upcoming</h3>
            <p className="text-2xl font-bold text-blue-400">
              {events.filter((e) => e.status === "Upcoming").length}
            </p>
          </div>
          <div className="bg-gray-900/70 border border-green-900/30 rounded-xl p-6">
            <h3 className="text-sm text-gray-400 mb-1">Ongoing</h3>
            <p className="text-2xl font-bold text-green-400">
              {events.filter((e) => e.status === "Ongoing").length}
            </p>
          </div>
          <div className="bg-gray-900/70 border border-green-900/30 rounded-xl p-6">
            <h3 className="text-sm text-gray-400 mb-1">Training</h3>
            <p className="text-2xl font-bold text-purple-400">
              {events.filter((e) => e.type === "Training").length}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-900/70 border border-green-900/30 rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search events..."
              className="flex-1 bg-gray-800/50 border border-green-900/30 rounded-xl px-4 py-3 text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="bg-gray-800/50 border border-green-900/30 rounded-xl px-4 py-3 text-white"
              value={filterType}
              onChange={(e) =>
                setFilterType(e.target.value as Event["type"] | "All")
              }
            >
              <option value="All">All Types</option>
              <option value="Training">Training</option>
              <option value="Meeting">Meeting</option>
              <option value="Camp">Camp</option>
              <option value="Competition">Competition</option>
              <option value="Other">Other</option>
            </select>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-green-700 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-500"
            >
              + New Event
            </button>
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            <p className="mt-4 text-gray-400">Loading events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/50 rounded-2xl border border-green-900/30">
            <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📅</span>
            </div>
            <p className="text-gray-400 text-lg mb-2">No events found</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-green-700 to-emerald-600 text-white rounded-xl"
            >
              + Create First Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div
                key={event._id}
                className="bg-gray-900/70 border border-green-900/30 rounded-2xl p-6 hover:border-green-500/50 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center mr-3">
                      <span className="text-xl">{getTypeIcon(event.type)}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">
                        {event.title}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${getStatusColor(event.status)}`}
                      >
                        {event.status}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(event._id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-gray-300 mb-4 line-clamp-3">
                  {event.description}
                </p>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-gray-400">
                    <svg
                      className="w-5 h-5 mr-2 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                    {event.time && <span className="ml-2">• {event.time}</span>}
                  </div>
                  <div className="flex items-center text-gray-400">
                    <svg
                      className="w-5 h-5 mr-2 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>{event.location}</span>
                  </div>
                </div>

                {event.maxAttendees && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                      <span>Attendance</span>
                      <span>
                        {event.attendees || 0} / {event.maxAttendees}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, ((event.attendees || 0) / event.maxAttendees) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    setEditingId(event._id);
                    setForm({
                      title: event.title,
                      description: event.description,
                      date: event.date.split("T")[0],
                      time: event.time || "",
                      location: event.location,
                      type: event.type,
                      status: event.status,
                      maxAttendees: event.maxAttendees || 0,
                    });
                    setIsModalOpen(true);
                  }}
                  className="w-full mt-4 px-4 py-2 border border-green-900/30 text-green-400 rounded-xl hover:bg-green-900/20 transition-all"
                >
                  Edit Event
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-green-900/30 rounded-2xl p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingId ? "Edit Event" : "Create Event"}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Event Title"
                className="w-full bg-gray-800 border border-green-900/30 rounded-xl p-3 text-white"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />

              <textarea
                placeholder="Description"
                className="w-full bg-gray-800 border border-green-900/30 rounded-xl p-3 text-white"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  className="bg-gray-800 border border-green-900/30 rounded-xl p-3 text-white"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
                <input
                  type="time"
                  className="bg-gray-800 border border-green-900/30 rounded-xl p-3 text-white"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                />
              </div>

              <input
                type="text"
                placeholder="Location"
                className="w-full bg-gray-800 border border-green-900/30 rounded-xl p-3 text-white"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <select
                  className="bg-gray-800 border border-green-900/30 rounded-xl p-3 text-white"
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value as Event["type"] })
                  }
                  required
                >
                  <option value="Training">Training</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Camp">Camp</option>
                  <option value="Competition">Competition</option>
                  <option value="Other">Other</option>
                </select>

                <select
                  className="bg-gray-800 border border-green-900/30 rounded-xl p-3 text-white"
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as Event["status"],
                    })
                  }
                  required
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <input
                type="number"
                placeholder="Max Attendees (0 = unlimited)"
                className="w-full bg-gray-800 border border-green-900/30 rounded-xl p-3 text-white"
                value={form.maxAttendees}
                onChange={(e) =>
                  setForm({
                    ...form,
                    maxAttendees: parseInt(e.target.value) || 0,
                  })
                }
                min="0"
              />

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="flex-1 border border-green-900/30 text-gray-300 rounded-xl p-3 hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-green-700 to-emerald-600 text-white rounded-xl p-3 hover:from-green-600 hover:to-emerald-500"
                >
                  {editingId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
