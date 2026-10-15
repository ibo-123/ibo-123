"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  BookOpen,
  CalendarCheck,
  Trophy,
  BarChart3,
  Settings,
  Bell,
  UserCircle,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import API from "@/lib/api";

interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  recentAttendances: number;
  totalAchievements: number;
  pendingVerifications: number;
  upcomingEvents: number;
}

interface RecentActivity {
  id: string;
  type: "user" | "attendance" | "achievement" | "course";
  action: string;
  user: string;
  time: string;
  icon: React.ReactNode;
  color: string;
}

export default function AdminPanel() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCourses: 0,
    recentAttendances: 0,
    totalAchievements: 0,
    pendingVerifications: 0,
    upcomingEvents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([
    {
      id: "1",
      type: "user",
      action: "New Registration",
      user: "John Doe",
      time: "10 min ago",
      icon: <Users className="h-4 w-4" />,
      color: "bg-blue-500",
    },
    {
      id: "2",
      type: "attendance",
      action: "Attendance Marked",
      user: "Sarah Wilson",
      time: "30 min ago",
      icon: <CalendarCheck className="h-4 w-4" />,
      color: "bg-green-500",
    },
    {
      id: "3",
      type: "achievement",
      action: "Achievement Added",
      user: "Mike Johnson",
      time: "1 hour ago",
      icon: <Trophy className="h-4 w-4" />,
      color: "bg-yellow-500",
    },
    {
      id: "4",
      type: "course",
      action: "Course Published",
      user: "Admin",
      time: "2 hours ago",
      icon: <BookOpen className="h-4 w-4" />,
      color: "bg-purple-500",
    },
  ]);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      // You can implement API calls for each stat
      // For now, we'll use mock data
      setStats({
        totalUsers: 156,
        totalCourses: 24,
        recentAttendances: 89,
        totalAchievements: 312,
        pendingVerifications: 18,
        upcomingEvents: 7,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      change: "+12%",
      icon: <Users className="h-6 w-6" />,
      color: "bg-blue-500",
      link: "/admin/users",
    },
    {
      title: "Courses",
      value: stats.totalCourses,
      change: "+3",
      icon: <BookOpen className="h-6 w-6" />,
      color: "bg-purple-500",
      link: "/admin/courses",
    },
    {
      title: "Today's Attendance",
      value: stats.recentAttendances,
      change: "89%",
      icon: <CalendarCheck className="h-6 w-6" />,
      color: "bg-green-500",
      link: "/admin/attendance",
    },
    {
      title: "Achievements",
      value: stats.totalAchievements,
      change: "18 pending",
      icon: <Trophy className="h-6 w-6" />,
      color: "bg-yellow-500",
      link: "/admin/achievements",
    },
  ];

  const quickActions = [
    {
      title: "Add New User",
      description: "Register a new NCC member",
      icon: <Users className="h-8 w-8" />,
      color: "bg-blue-100 text-blue-600",
      link: "/admin/users?action=create",
    },
    {
      title: "Create Course",
      description: "Add new learning material",
      icon: <BookOpen className="h-8 w-8" />,
      color: "bg-purple-100 text-purple-600",
      link: "/admin/courses?action=create",
    },
    {
      title: "Mark Attendance",
      description: "Take today's attendance",
      icon: <CalendarCheck className="h-8 w-8" />,
      color: "bg-green-100 text-green-600",
      link: "/admin/attendance",
    },
    {
      title: "Verify Achievements",
      description: `${stats.pendingVerifications} pending`,
      icon: <Trophy className="h-8 w-8" />,
      color: "bg-yellow-100 text-yellow-600",
      link: "/admin/achievements?filter=unverified",
    },
  ];

  const upcomingEvents = [
    {
      id: 1,
      title: "NCC Drill Practice",
      date: "Today, 4:00 PM",
      type: "Training",
    },
    {
      id: 2,
      title: "Monthly Meeting",
      date: "Tomorrow, 10:00 AM",
      type: "Meeting",
    },
    {
      id: 3,
      title: "Sports Competition",
      date: "Jan 25, 9:00 AM",
      type: "Event",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-600">Welcome back, Administrator</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-gray-900">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg">
                <UserCircle className="h-8 w-8 text-gray-600" />
                <div className="text-left">
                  <p className="text-sm font-medium">Admin User</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => (
            <Link
              key={index}
              href={card.link}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {card.title}
                  </p>
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-2"></div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {card.value}
                    </p>
                  )}
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">
                      {card.change}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">
                      from last month
                    </span>
                  </div>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <div className="text-white">{card.icon}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Quick Actions & Upcoming Events */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Quick Actions
                </h2>
                <Link
                  href="/admin"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <Link
                    key={index}
                    href={action.link}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`${action.color} p-2 rounded-lg`}>
                        {action.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 group-hover:text-blue-600">
                          {action.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Activities
                </h2>
                <Link
                  href="/admin/activities"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View all →
                </Link>
              </div>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg"
                  >
                    <div className={`${activity.color} p-2 rounded-lg`}>
                      <div className="text-white">{activity.icon}</div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.action}
                      </p>
                      <p className="text-xs text-gray-500">
                        by {activity.user}
                      </p>
                    </div>
                    <div className="text-xs text-gray-400">{activity.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Upcoming Events & System Status */}
          <div className="space-y-8">
            {/* Upcoming Events */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Upcoming Events
                </h2>
                <Link
                  href="/admin/events"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View all →
                </Link>
              </div>
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="border-l-4 border-blue-500 pl-4 py-2 hover:bg-gray-50 rounded-r"
                  >
                    <h3 className="font-medium text-gray-900">{event.title}</h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      {event.date}
                    </div>
                    <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                      {event.type}
                    </span>
                  </div>
                ))}
              </div>
              <Link
                href="/admin/events?action=create"
                className="mt-6 w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
              >
                + Add New Event
              </Link>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                System Status
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-700">Database</span>
                  </div>
                  <span className="text-sm font-medium text-green-600">
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-700">Authentication</span>
                  </div>
                  <span className="text-sm font-medium text-green-600">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-yellow-500 mr-3" />
                    <span className="text-gray-700">Storage</span>
                  </div>
                  <span className="text-sm font-medium text-yellow-600">
                    85% used
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-700">API Services</span>
                  </div>
                  <span className="text-sm font-medium text-green-600">
                    Normal
                  </span>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <Link
                  href="/admin/settings"
                  className="flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-900"
                >
                  <Settings className="h-4 w-4" />
                  <span className="text-sm font-medium">System Settings</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Modules Grid */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Admin Modules
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Users Module */}
            <Link
              href="/admin/users"
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  156 Members
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 mb-2">
                User Management
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Manage NCC members, roles, permissions, and user profiles
              </p>
              <div className="flex items-center text-sm text-blue-600 font-medium">
                Manage Users →
              </div>
            </Link>

            {/* Courses Module */}
            <Link
              href="/admin/courses"
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-purple-300 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-purple-600" />
                </div>
                <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">
                  24 Courses
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 mb-2">
                Course Management
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Create, organize, and manage learning materials and resources
              </p>
              <div className="flex items-center text-sm text-purple-600 font-medium">
                Manage Courses →
              </div>
            </Link>

            {/* Attendance Module */}
            <Link
              href="/admin/attendance"
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-green-300 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CalendarCheck className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                  89% Today
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 mb-2">
                Attendance System
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Track attendance, generate reports, and monitor participation
              </p>
              <div className="flex items-center text-sm text-green-600 font-medium">
                Mark Attendance →
              </div>
            </Link>

            {/* Achievements Module */}
            <Link
              href="/admin/achievements"
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-yellow-300 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Trophy className="h-6 w-6 text-yellow-600" />
                </div>
                <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                  18 Pending
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-yellow-600 mb-2">
                Achievements
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Manage and verify member achievements and certificates
              </p>
              <div className="flex items-center text-sm text-yellow-600 font-medium">
                View Achievements →
              </div>
            </Link>

            {/* Events Module */}
            <Link
              href="/admin/events"
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-red-300 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <CalendarCheck className="h-6 w-6 text-red-600" />
                </div>
                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                  7 Upcoming
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-red-600 mb-2">
                Events Management
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Schedule, manage, and track NCC events and activities
              </p>
              <div className="flex items-center text-sm text-red-600 font-medium">
                Manage Events →
              </div>
            </Link>

            {/* Reports Module */}
            <Link
              href="/admin/reports"
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-indigo-300 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-indigo-600" />
                </div>
                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                  Monthly
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 mb-2">
                Analytics & Reports
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                View insights, generate reports, and analyze performance
              </p>
              <div className="flex items-center text-sm text-indigo-600 font-medium">
                View Reports →
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 px-6 py-4 border-t border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between text-sm text-gray-500">
          <div>NCC Management System v1.0 • Last updated: Today, 10:30 AM</div>
          <div className="flex items-center space-x-4 mt-2 md:mt-0">
            <Link href="/admin/support" className="hover:text-gray-700">
              Support
            </Link>
            <Link href="/admin/docs" className="hover:text-gray-700">
              Documentation
            </Link>
            <Link href="/admin/settings" className="hover:text-gray-700">
              Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
