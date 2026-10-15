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
import { StatCard } from "@/components/UI/StatCard";
import { ActivityItem } from "@/components/UI/ActivityItem";
import { StatusItem } from "@/components/UI/StatusItem";

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground text-sm mt-1">Manage platform resources</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full"></span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => (
            <StatCard
              key={index}
              title={card.title}
              value={loading ? "..." : card.value}
              change={card.change}
              icon={card.icon}
              link={card.link}
              trend="up"
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Quick Actions & Upcoming Events */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <div className="ncc-card-elevated p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">
                  Quick Actions
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <Link
                    key={index}
                    href={action.link}
                    className="ncc-card p-4 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                        {action.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {action.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Activities */}
            <div className="ncc-card-elevated">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">
                  Recent Activities
                </h2>
              </div>
              <div className="divide-y divide-border">
                {recentActivities.map((activity) => (
                  <ActivityItem
                    key={activity.id}
                    icon={activity.icon}
                    action={activity.action}
                    user={activity.user}
                    time={activity.time}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Upcoming Events & System Status */}
          <div className="space-y-8">
            {/* Upcoming Events */}
            <div className="ncc-card-elevated p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">
                  Upcoming Events
                </h2>
              </div>
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="ncc-card p-4 border-l-4 border-l-primary hover:shadow-md transition-all"
                  >
                    <h3 className="font-medium text-foreground">{event.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                      <Clock className="h-4 w-4" />
                      {event.date}
                    </div>
                    <div className="mt-3">
                      <span className="ncc-badge-primary text-xs">
                        {event.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/admin/events?action=create"
                className="ncc-btn-secondary w-full mt-6"
              >
                + Add New Event
              </Link>
            </div>

            {/* System Status */}
            <div className="ncc-card-elevated p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">
                System Status
              </h2>
              <div className="space-y-4">
                <StatusItem label="Database" status="Online" isHealthy />
                <StatusItem label="Authentication" status="Active" isHealthy />
                <StatusItem label="Storage" status="85% used" isHealthy={false} />
                <StatusItem label="API Services" status="Normal" isHealthy />
              </div>
            </div>
          </div>
        </div>

        {/* Admin Modules Grid */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-foreground mb-6">
            Admin Modules
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Users Module */}
            <Link
              href="/admin/users"
              className="group ncc-card-elevated p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-100/50 rounded-lg group-hover:bg-blue-100 transition-colors">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <span className="ncc-badge-info text-xs">156 Members</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary mb-2">
                User Management
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Manage NCC members, roles, permissions, and user profiles
              </p>
              <div className="flex items-center text-sm text-primary font-medium group-hover:gap-1 transition-all">
                Manage Users →
              </div>
            </Link>

            {/* Courses Module */}
            <Link
              href="/admin/courses"
              className="group ncc-card-elevated p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-purple-100/50 rounded-lg group-hover:bg-purple-100 transition-colors">
                  <BookOpen className="h-6 w-6 text-purple-600" />
                </div>
                <span className="ncc-badge text-xs bg-purple-100 text-purple-700">24 Courses</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary mb-2">
                Course Management
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create, organize, and manage learning materials and resources
              </p>
              <div className="flex items-center text-sm text-primary font-medium">
                Manage Courses →
              </div>
            </Link>

            {/* Attendance Module */}
            <Link
              href="/admin/attendance"
              className="group ncc-card-elevated p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-green-100/50 rounded-lg group-hover:bg-green-100 transition-colors">
                  <CalendarCheck className="h-6 w-6 text-green-600" />
                </div>
                <span className="ncc-badge-success text-xs">89% Today</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary mb-2">
                Attendance System
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Track attendance, generate reports, and monitor participation
              </p>
              <div className="flex items-center text-sm text-primary font-medium">
                Mark Attendance →
              </div>
            </Link>

            {/* Achievements Module */}
            <Link
              href="/admin/achievements"
              className="group ncc-card-elevated p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-yellow-100/50 rounded-lg group-hover:bg-yellow-100 transition-colors">
                  <Trophy className="h-6 w-6 text-yellow-600" />
                </div>
                <span className="ncc-badge-warning text-xs">18 Pending</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary mb-2">
                Achievements
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Manage and verify member achievements and certificates
              </p>
              <div className="flex items-center text-sm text-primary font-medium">
                View Achievements →
              </div>
            </Link>

            {/* Events Module */}
            <Link
              href="/admin/events"
              className="group ncc-card-elevated p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-red-100/50 rounded-lg group-hover:bg-red-100 transition-colors">
                  <CalendarCheck className="h-6 w-6 text-red-600" />
                </div>
                <span className="ncc-badge-danger text-xs">7 Upcoming</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary mb-2">
                Events Management
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Schedule, manage, and track NCC events and activities
              </p>
              <div className="flex items-center text-sm text-primary font-medium">
                Manage Events →
              </div>
            </Link>

            {/* Reports Module */}
            <Link
              href="/admin/reports"
              className="group ncc-card-elevated p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-indigo-100/50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                  <BarChart3 className="h-6 w-6 text-indigo-600" />
                </div>
                <span className="ncc-badge text-xs bg-indigo-100 text-indigo-700">Monthly</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary mb-2">
                Analytics & Reports
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                View insights, generate reports, and analyze performance
              </p>
              <div className="flex items-center text-sm text-primary font-medium">
                View Reports →
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between text-sm text-muted-foreground">
            <div>NCC Management System v1.0</div>
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <Link href="/admin/support" className="hover:text-foreground transition-colors">
                Support
              </Link>
              <Link href="/admin/docs" className="hover:text-foreground transition-colors">
                Documentation
              </Link>
              <Link href="/admin/settings" className="hover:text-foreground transition-colors">
                Settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
