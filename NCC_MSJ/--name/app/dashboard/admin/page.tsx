// app/dashboard/admin/page.jsx
"use client";

import { useState, useEffect } from "react";
import API from "@/lib/api";
import Link from "next/link";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import ProtectedRoute from "@/components/UI/protectedRoutes";

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("week");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await API.get("/dashboard/admin");
      setDashboardData(response.data.data);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          <p className="mt-4 text-green-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const { overview, charts, leaderboard, recentActivity, quickStats } =
    dashboardData || {};

  return (
    <ProtectedRoute adminOnly>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-400">Welcome back, Administrator</p>
            <div className="h-1 w-24 bg-gradient-to-r from-green-600 to-emerald-400 mt-4 rounded-full" />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-900/70 border border-green-900/30 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Total Users</p>
                  <h3 className="text-3xl font-bold text-white">
                    {overview?.users?.total || 0}
                  </h3>
                  <p className="text-xs text-green-400 mt-2">
                    +{quickStats?.newUsersToday || 0} today
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-900/30 to-emerald-800/30 rounded-xl flex items-center justify-center border border-green-700/30">
                  <svg
                    className="w-6 h-6 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/70 border border-green-900/30 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Active Users</p>
                  <h3 className="text-3xl font-bold text-white">
                    {overview?.users?.active || 0}
                  </h3>
                  <p className="text-xs text-green-400 mt-2">
                    {(
                      (overview?.users?.active / overview?.users?.total) *
                        100 || 0
                    ).toFixed(1)}
                    % active
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-900/30 to-emerald-800/30 rounded-xl flex items-center justify-center border border-green-700/30">
                  <svg
                    className="w-6 h-6 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/70 border border-green-900/30 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Courses</p>
                  <h3 className="text-3xl font-bold text-white">
                    {overview?.courses?.total || 0}
                  </h3>
                  <p className="text-xs text-green-400 mt-2">
                    {overview?.courses?.published || 0} published
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-900/30 to-emerald-800/30 rounded-xl flex items-center justify-center border border-green-700/30">
                  <svg
                    className="w-6 h-6 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/70 border border-green-900/30 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Achievements</p>
                  <h3 className="text-3xl font-bold text-white">
                    {overview?.achievements?.total || 0}
                  </h3>
                  <p className="text-xs text-green-400 mt-2">
                    {overview?.achievements?.verified || 0} verified
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-900/30 to-emerald-800/30 rounded-xl flex items-center justify-center border border-green-700/30">
                  <svg
                    className="w-6 h-6 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Attendance Trend - Enhanced */}
            <div className="bg-gray-900/70 border border-green-900/30 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Attendance Trend
              </h2>
              {charts?.attendanceTrend && (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart
                    data={charts.attendanceTrend.slice(0, 7).map((item) => ({
                      date: new Date(item.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      }),
                      rate: item.rate,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #4b5563",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "#ffffff" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="rate"
                      stroke="#10b981"
                      fill="#10b98133"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* User Distribution */}
            <div className="bg-gray-900/70 border border-green-900/30 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Users by Department
              </h2>
              {charts?.userDepartments && (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={charts.userDepartments}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="_id" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #4b5563",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "#ffffff" }}
                    />
                    <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Leaderboard & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Leaderboard */}
            <div className="bg-gray-900/70 border border-green-900/30 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Top Performers
              </h2>
              <div className="space-y-4">
                {leaderboard?.map((user, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                          i === 0
                            ? "bg-yellow-500/20 text-yellow-400"
                            : i === 1
                              ? "bg-gray-400/20 text-gray-400"
                              : i === 2
                                ? "bg-amber-600/20 text-amber-600"
                                : "bg-gray-800 text-gray-500"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.name}</p>
                        <p className="text-xs text-gray-400">
                          {user.studentId}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-bold">{user.points}</p>
                      <p className="text-xs text-gray-500">pts</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Users */}
            <div className="bg-gray-900/70 border border-green-900/30 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Recent Users
              </h2>
              <div className="space-y-4">
                {recentActivity?.newUsers?.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-900/30 to-emerald-800/30 rounded-full flex items-center justify-center mr-3 border border-green-700/30">
                        <span className="text-white font-bold">
                          {user.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.name}</p>
                        <p className="text-xs text-gray-400">
                          {user.studentId}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-gray-900/70 border border-green-900/30 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Upcoming Events
              </h2>
              <div className="space-y-4">
                {recentActivity?.upcomingEvents?.map((event) => (
                  <div
                    key={event._id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-900/30 to-purple-800/30 rounded-lg flex items-center justify-center mr-3 border border-purple-700/30">
                        <span className="text-purple-400 text-lg">📅</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{event.title}</p>
                        <p className="text-xs text-gray-400">
                          {event.location}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-green-400">
                      {new Date(event.startDate).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
