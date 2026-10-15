"use client";

import { useState, useEffect } from "react";
import API from "@/lib/api";
import ProtectedRoute from "@/components/UI/protectedRoutes";

type AttendanceForm = {
  user: string;
  event: string;
  status: "present" | "absent" | "late";
};

type Event = {
  id: string;
  name: string;
  date: string;
  type: string;
};

type User = {
  id: string;
  name: string;
  studentId: string;
  department: string;
};

export default function AttendancePage() {
  const [form, setForm] = useState<AttendanceForm>({
    user: "",
    event: "",
    status: "present",
  });
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch events and users on component mount
  useEffect(() => {
    fetchData();
    fetchRecentAttendance();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // In a real app, these would be API calls
      // For now, using mock data
      const mockEvents: Event[] = [
        {
          id: "EVT001",
          name: "Morning Parade",
          date: "2024-01-15",
          type: "Daily",
        },
        {
          id: "EVT002",
          name: "Drill Practice",
          date: "2024-01-16",
          type: "Training",
        },
        {
          id: "EVT003",
          name: "Weapon Training",
          date: "2024-01-17",
          type: "Training",
        },
        {
          id: "EVT004",
          name: "Field Exercise",
          date: "2024-01-18",
          type: "Exercise",
        },
        {
          id: "EVT005",
          name: "Theory Class",
          date: "2024-01-19",
          type: "Academic",
        },
      ];

      const mockUsers: User[] = [
        {
          id: "USR001",
          name: "John Doe",
          studentId: "MSJ2024001",
          department: "Computer Science",
        },
        {
          id: "USR002",
          name: "Jane Smith",
          studentId: "MSJ2024002",
          department: "Information Technology",
        },
        {
          id: "USR003",
          name: "Robert Johnson",
          studentId: "MSJ2024003",
          department: "Mechanical Engineering",
        },
        {
          id: "USR004",
          name: "Sarah Williams",
          studentId: "MSJ2024004",
          department: "Civil Engineering",
        },
        {
          id: "USR005",
          name: "Michael Brown",
          studentId: "MSJ2024005",
          department: "Electronics",
        },
      ];

      setEvents(mockEvents);
      setUsers(mockUsers);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentAttendance = async () => {
    try {
      // Mock recent attendance data
      const mockAttendance = [
        {
          id: "ATT001",
          userName: "John Doe",
          eventName: "Morning Parade",
          status: "present",
          timestamp: "2024-01-15 06:00",
        },
        {
          id: "ATT002",
          userName: "Jane Smith",
          eventName: "Drill Practice",
          status: "present",
          timestamp: "2024-01-16 14:00",
        },
        {
          id: "ATT003",
          userName: "Robert Johnson",
          eventName: "Weapon Training",
          status: "late",
          timestamp: "2024-01-17 09:30",
        },
        {
          id: "ATT004",
          userName: "Sarah Williams",
          eventName: "Field Exercise",
          status: "absent",
          timestamp: "2024-01-18 08:00",
        },
      ];
      setRecentAttendance(mockAttendance);
    } catch (error) {
      console.error("Error fetching recent attendance:", error);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.user || !form.event) {
      alert("Please select both user and event");
      return;
    }

    setIsSubmitting(true);
    try {
      await API.post("/attendance", form);
      alert("✅ Attendance marked successfully!");
      // Reset form
      setForm({ user: "", event: "", status: "present" });
      // Refresh recent attendance
      fetchRecentAttendance();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to mark attendance");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "absent":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "late":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return "✓";
      case "absent":
        return "✗";
      case "late":
        return "⏰";
      default:
        return "?";
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.studentId.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Attendance Management
            </h1>
            <p className="text-gray-400">
              Mark and manage attendance for NCC events and activities
            </p>
            <div className="h-1 w-24 bg-gradient-to-r from-green-600 to-emerald-400 mt-4 rounded-full" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Attendance Form */}
            <div className="lg:col-span-2">
              <div className="bg-gray-900/70 backdrop-blur-sm border border-green-900/30 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-900/30 to-emerald-800/30 rounded-xl flex items-center justify-center mr-4 border border-green-700/30">
                    <span className="text-2xl font-bold text-green-400">✓</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Mark Attendance
                    </h2>
                    <p className="text-gray-400 text-sm">
                      Record attendance for NCC events
                    </p>
                  </div>
                </div>

                <form onSubmit={submit} className="space-y-6">
                  {/* User Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Select Member <span className="text-red-400">*</span>
                    </label>
                    <div className="relative mb-3">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          className="w-5 h-5 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Search by name or student ID..."
                        className="w-full bg-gray-800/50 border border-green-900/30 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    <div className="max-h-60 overflow-y-auto rounded-lg border border-green-900/20">
                      {isLoading ? (
                        <div className="p-4 text-center text-gray-500">
                          Loading members...
                        </div>
                      ) : filteredUsers.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No members found
                        </div>
                      ) : (
                        filteredUsers.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => setForm({ ...form, user: user.id })}
                            className={`w-full text-left p-4 hover:bg-gray-800/50 transition-colors ${form.user === user.id ? "bg-green-900/20 border-l-4 border-green-500" : "border-l-4 border-transparent"}`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-medium text-white">
                                  {user.name}
                                </div>
                                <div className="text-sm text-gray-400">
                                  {user.studentId} • {user.department}
                                </div>
                              </div>
                              {form.user === user.id && (
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                  <svg
                                    className="w-4 h-4 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Event Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Select Event <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {events.map((event) => (
                        <button
                          key={event.id}
                          type="button"
                          onClick={() => setForm({ ...form, event: event.id })}
                          className={`p-4 rounded-lg border transition-all ${form.event === event.id ? "bg-green-900/20 border-green-500" : "bg-gray-800/30 border-green-900/30 hover:border-green-500/50"}`}
                        >
                          <div className="flex items-start">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${form.event === event.id ? "bg-green-500/20" : "bg-gray-800"}`}
                            >
                              <span className="text-lg">📅</span>
                            </div>
                            <div className="text-left flex-1">
                              <div className="font-medium text-white">
                                {event.name}
                              </div>
                              <div className="text-sm text-gray-400">
                                {event.date}
                              </div>
                              <div className="text-xs text-green-400 mt-1">
                                {event.type}
                              </div>
                            </div>
                            {form.event === event.id && (
                              <div className="ml-2">
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                  <svg
                                    className="w-4 h-4 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Status Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Attendance Status <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        {
                          value: "present",
                          label: "Present",
                          icon: "✓",
                          color:
                            "bg-green-500/20 text-green-400 border-green-500/30 hover:border-green-500",
                        },
                        {
                          value: "absent",
                          label: "Absent",
                          icon: "✗",
                          color:
                            "bg-red-500/20 text-red-400 border-red-500/30 hover:border-red-500",
                        },
                        {
                          value: "late",
                          label: "Late",
                          icon: "⏰",
                          color:
                            "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:border-yellow-500",
                        },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setForm({ ...form, status: option.value as any })
                          }
                          className={`p-4 rounded-lg border transition-all flex items-center justify-center ${form.status === option.value ? option.color : "bg-gray-800/30 border-green-900/30 hover:bg-gray-800/50"}`}
                        >
                          <span className="text-xl mr-2">{option.icon}</span>
                          <span className="font-medium">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || !form.user || !form.event}
                    className="w-full bg-gradient-to-r from-green-700 to-emerald-600 hover:from-green-600 hover:to-emerald-500 text-white font-semibold py-4 px-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Marking Attendance...
                      </div>
                    ) : (
                      `Mark as ${form.status.charAt(0).toUpperCase() + form.status.slice(1)}`
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column - Recent Attendance */}
            <div>
              <div className="bg-gray-900/70 backdrop-blur-sm border border-green-900/30 rounded-2xl p-6 shadow-2xl h-full">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-900/30 to-emerald-800/30 rounded-xl flex items-center justify-center mr-4 border border-green-700/30">
                    <span className="text-2xl font-bold text-green-400">
                      📋
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Recent Attendance
                    </h2>
                    <p className="text-gray-400 text-sm">
                      Latest recorded entries
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {recentAttendance.map((record) => (
                    <div
                      key={record.id}
                      className={`p-4 rounded-lg border ${getStatusColor(record.status)} transition-all hover:scale-[1.02]`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-white">
                          {record.userName}
                        </div>
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(record.status)}`}
                        >
                          <span className="font-bold">
                            {getStatusIcon(record.status)}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-300 mb-1">
                        {record.eventName}
                      </div>
                      <div className="text-xs text-gray-400">
                        {record.timestamp}
                      </div>
                      <div className="text-xs mt-2 font-medium uppercase tracking-wider">
                        Status: {record.status}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Statistics */}
                <div className="mt-8 pt-6 border-t border-green-900/30">
                  <h3 className="text-lg font-bold text-white mb-4">
                    Today's Summary
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-green-400">
                        42
                      </div>
                      <div className="text-xs text-gray-400">Present</div>
                    </div>
                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-red-400">3</div>
                      <div className="text-xs text-gray-400">Absent</div>
                    </div>
                    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-yellow-400">
                        2
                      </div>
                      <div className="text-xs text-gray-400">Late</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
