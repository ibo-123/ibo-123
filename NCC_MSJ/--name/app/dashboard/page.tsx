// app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import ProtectedRoute from "@/components/UI/protectedRoutes";

// Types
interface Stats {
  totalMembers: number;
  activeMembers: number;
  totalEvents: number;
  upcomingEvents: number;
  totalAchievements: number;
  verifiedAchievements: number;
  totalCourses: number;
  ongoingCourses: number;
}

interface Activity {
  id: number;
  type: "member" | "achievement" | "event" | "course";
  action: string;
  user: string;
  time: string;
}

interface Event {
  id: number;
  title: string;
  date: string;
  location: string;
  attendees: number;
}

// Chart data for visualizations
const attendanceTrendData = [
  { day: "Mon", attendance: 75 },
  { day: "Tue", attendance: 82 },
  { day: "Wed", attendance: 78 },
  { day: "Thu", attendance: 85 },
  { day: "Fri", attendance: 88 },
  { day: "Sat", attendance: 72 },
];

const memberGrowthData = [
  { month: "Jan", members: 150 },
  { month: "Feb", members: 175 },
  { month: "Mar", members: 198 },
  { month: "Apr", members: 220 },
  { month: "May", members: 235 },
  { month: "Jun", members: 250 },
];

const categoryDistributionData = [
  { name: "Sports", value: 35 },
  { name: "Academic", value: 28 },
  { name: "Leadership", value: 22 },
  { name: "Cultural", value: 15 },
];

const courseProgressData = [
  { course: "Basic Training", progress: 85 },
  { course: "Advanced Tactics", progress: 72 },
  { course: "Leadership", progress: 68 },
  { course: "Weapons", progress: 91 },
  { course: "Field Ops", progress: 55 },
];

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

export default function DashboardPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<Stats>({
    totalMembers: 0,
    activeMembers: 0,
    totalEvents: 0,
    upcomingEvents: 0,
    totalAchievements: 0,
    verifiedAchievements: 0,
    totalCourses: 0,
    ongoingCourses: 0,
  });

  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setStats({
        totalMembers: 250,
        activeMembers: 180,
        totalEvents: 45,
        upcomingEvents: 12,
        totalAchievements: 120,
        verifiedAchievements: 85,
        totalCourses: 15,
        ongoingCourses: 8,
      });

      setRecentActivities([
        {
          id: 1,
          type: "member",
          action: "New member joined",
          user: "John Doe",
          time: "2 hours ago",
        },
        {
          id: 2,
          type: "achievement",
          action: "Achievement verified",
          user: "Jane Smith",
          time: "5 hours ago",
        },
        {
          id: 3,
          type: "event",
          action: "Event completed",
          user: "Drill Practice",
          time: "1 day ago",
        },
        {
          id: 4,
          type: "course",
          action: "Course completed",
          user: "Basic Training",
          time: "2 days ago",
        },
      ]);

      setUpcomingEvents([
        {
          id: 1,
          title: "NCC Training Session",
          date: "Today, 4:00 PM",
          location: "Main Ground",
          attendees: 45,
        },
        {
          id: 2,
          title: "Drill Practice",
          date: "Tomorrow, 6:00 AM",
          location: "Parade Ground",
          attendees: 60,
        },
        {
          id: 3,
          title: "Weapon Training",
          date: "Feb 20, 3:00 PM",
          location: "Armory",
          attendees: 30,
        },
        {
          id: 4,
          title: "Leadership Workshop",
          date: "Feb 22, 10:00 AM",
          location: "Conference Hall",
          attendees: 25,
        },
        {
          id: 5,
          title: "Field Exercise",
          date: "Feb 25, 8:00 AM",
          location: "Training Area",
          attendees: 80,
        },
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  const getActivityIcon = (type: Activity["type"]): string => {
    switch (type) {
      case "member":
        return "👤";
      case "achievement":
        return "🏆";
      case "event":
        return "📅";
      case "course":
        return "📚";
      default:
        return "📌";
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Dashboard
            </h1>
            <p className="text-gray-400">Welcome back to NCC_MSJ Platform</p>
            <div className="h-1 w-24 bg-gradient-to-r from-green-600 to-emerald-400 mt-4 rounded-full" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            {/* Total Members */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-900/70 backdrop-blur-sm border border-green-900/30 rounded-2xl p-6 hover:border-green-500/50 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Total Members</p>
                  <h3 className="text-3xl font-bold text-white">
                    {stats.totalMembers}
                  </h3>
                  <p className="text-xs text-green-400 mt-2">
                    {stats.activeMembers} active
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-900/30 to-emerald-800/30 rounded-xl flex items-center justify-center border border-green-700/30">
                  <span className="text-2xl">👥</span>
                </div>
              </div>
            </motion.div>

            {/* Events */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-900/70 backdrop-blur-sm border border-green-900/30 rounded-2xl p-6 hover:border-green-500/50 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Total Events</p>
                  <h3 className="text-3xl font-bold text-white">
                    {stats.totalEvents}
                  </h3>
                  <p className="text-xs text-green-400 mt-2">
                    {stats.upcomingEvents} upcoming
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-900/30 to-purple-800/30 rounded-xl flex items-center justify-center border border-purple-700/30">
                  <span className="text-2xl">📅</span>
                </div>
              </div>
            </motion.div>

            {/* Achievements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-900/70 backdrop-blur-sm border border-green-900/30 rounded-2xl p-6 hover:border-green-500/50 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Achievements</p>
                  <h3 className="text-3xl font-bold text-white">
                    {stats.totalAchievements}
                  </h3>
                  <p className="text-xs text-green-400 mt-2">
                    {stats.verifiedAchievements} verified
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-900/30 to-yellow-800/30 rounded-xl flex items-center justify-center border border-yellow-700/30">
                  <span className="text-2xl">🏆</span>
                </div>
              </div>
            </motion.div>

            {/* Courses */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-900/70 backdrop-blur-sm border border-green-900/30 rounded-2xl p-6 hover:border-green-500/50 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Total Courses</p>
                  <h3 className="text-3xl font-bold text-white">
                    {stats.totalCourses}
                  </h3>
                  <p className="text-xs text-green-400 mt-2">
                    {stats.ongoingCourses} ongoing
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-xl flex items-center justify-center border border-blue-700/30">
                  <span className="text-2xl">📚</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upcoming Events */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="lg:col-span-2 bg-gray-900/70 backdrop-blur-sm border border-green-900/30 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">
                  Upcoming Events
                </h2>
                <Link
                  href="/events"
                  className="text-sm text-green-400 hover:text-green-300"
                >
                  View All →
                </Link>
              </div>

              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-all"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-900/30 to-purple-800/30 rounded-xl flex items-center justify-center border border-purple-700/30">
                        <span className="text-xl">📅</span>
                      </div>
                      <div>
                        <h3 className="text-white font-medium">
                          {event.title}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {event.date} • {event.location}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-xs">
                        {event.attendees} attending
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gray-900/70 backdrop-blur-sm border border-green-900/30 rounded-2xl p-6"
            >
              <h2 className="text-xl font-bold text-white mb-6">
                Recent Activity
              </h2>

              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-3 p-3 bg-gray-800/50 rounded-xl"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-900/30 to-emerald-800/30 flex items-center justify-center border border-green-700/30 mt-1">
                      <span className="text-sm">
                        {getActivityIcon(activity.type)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm">
                        <span className="font-medium">{activity.action}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {activity.user} • {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t border-green-900/30">
                <h3 className="text-sm font-medium text-gray-400 mb-3">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/attendance"
                    className="p-3 bg-gray-800/50 rounded-xl text-center hover:bg-gray-800 transition-all"
                  >
                    <span className="block text-xl mb-1">📋</span>
                    <span className="text-xs text-gray-300">
                      Mark Attendance
                    </span>
                  </Link>
                  <Link
                    href="/events/new"
                    className="p-3 bg-gray-800/50 rounded-xl text-center hover:bg-gray-800 transition-all"
                  >
                    <span className="block text-xl mb-1">➕</span>
                    <span className="text-xs text-gray-300">Create Event</span>
                  </Link>
                  <Link
                    href="/achievements/new"
                    className="p-3 bg-gray-800/50 rounded-xl text-center hover:bg-gray-800 transition-all"
                  >
                    <span className="block text-xl mb-1">🏅</span>
                    <span className="text-xs text-gray-300">
                      Add Achievement
                    </span>
                  </Link>
                  <Link
                    href="/courses/new"
                    className="p-3 bg-gray-800/50 rounded-xl text-center hover:bg-gray-800 transition-all"
                  >
                    <span className="block text-xl mb-1">📖</span>
                    <span className="text-xs text-gray-300">New Course</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Charts Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Member Growth Chart */}
            <div className="bg-gray-900/70 backdrop-blur-sm border border-green-900/30 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                Member Growth Trend
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={memberGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #4b5563",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#ffffff" }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="members"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Attendance Trend */}
            <div className="bg-gray-900/70 backdrop-blur-sm border border-green-900/30 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                Weekly Attendance
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={attendanceTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="day" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #4b5563",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#ffffff" }}
                  />
                  <Bar dataKey="attendance" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Achievement Categories */}
            <div className="bg-gray-900/70 backdrop-blur-sm border border-green-900/30 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                Achievement Categories
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryDistributionData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #4b5563",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#ffffff" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Course Progress */}
            <div className="bg-gray-900/70 backdrop-blur-sm border border-green-900/30 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                Course Completion Progress
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={courseProgressData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9ca3af" />
                  <YAxis dataKey="course" type="category" width={145} stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #4b5563",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#ffffff" }}
                  />
                  <Bar dataKey="progress" fill="#f59e0b" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Stats Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Attendance Rate */}
            <div className="bg-gray-900/70 backdrop-blur-sm border border-green-900/30 rounded-2xl p-6">
              <h3 className="text-gray-400 text-sm mb-4">Attendance Rate</h3>
              <div className="flex items-end justify-between">
                <span className="text-4xl font-bold text-white">85%</span>
                <span className="text-green-400 text-sm">+5% this month</span>
              </div>
              <div className="mt-4 w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-600 to-emerald-400 h-2 rounded-full"
                  style={{ width: "85%" }}
                />
              </div>
            </div>

            {/* Achievement Rate */}
            <div className="bg-gray-900/70 backdrop-blur-sm border border-green-900/30 rounded-2xl p-6">
              <h3 className="text-gray-400 text-sm mb-4">Achievement Rate</h3>
              <div className="flex items-end justify-between">
                <span className="text-4xl font-bold text-white">71%</span>
                <span className="text-green-400 text-sm">
                  {stats.verifiedAchievements}/{stats.totalAchievements}{" "}
                  verified
                </span>
              </div>
              <div className="mt-4 w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-yellow-600 to-yellow-400 h-2 rounded-full"
                  style={{ width: "71%" }}
                />
              </div>
            </div>

            {/* Course Completion */}
            <div className="bg-gray-900/70 backdrop-blur-sm border border-green-900/30 rounded-2xl p-6">
              <h3 className="text-gray-400 text-sm mb-4">Course Completion</h3>
              <div className="flex items-end justify-between">
                <span className="text-4xl font-bold text-white">53%</span>
                <span className="text-green-400 text-sm">
                  {stats.ongoingCourses}/{stats.totalCourses} ongoing
                </span>
              </div>
              <div className="mt-4 w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-600 to-blue-400 h-2 rounded-full"
                  style={{ width: "53%" }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
