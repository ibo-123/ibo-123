"use client";

import { useState, useEffect, useCallback } from "react";
import API from "@/lib/api";

interface Achievement {
  _id: string;
  user: {
    _id: string;
    name: string;
    studentId: string;
    department: string;
    profileImage?: string;
  };
  title: string;
  description: string;
  category: string;
  level: string;
  date: string;
  verified: boolean;
  verifiedBy?: { name: string };
  verifiedAt?: string;
  organizer?: string;
  isPublic: boolean;
  likes: string[];
  comments: any[];
  views: number;
  points: number;
  createdAt: string;
}

interface User {
  _id: string;
  name: string;
  studentId: string;
  department: string;
  role: string;
  profileImage?: string;
}

interface Stats {
  overall: {
    totalAchievements: number;
    verifiedAchievements: number;
    verificationRate: number;
    totalPoints: number;
    averagePoints: number;
  };
  byCategory: Array<{
    category: string;
    count: number;
    totalPoints: number;
    verified: number;
    verificationRate: number;
  }>;
  byLevel: Array<{
    level: string;
    count: number;
    averagePoints: number;
  }>;
  monthlyTrend: Array<{
    year: number;
    month: number;
    count: number;
    verified: number;
    verificationRate: number;
  }>;
}

interface Pagination {
  page: number;
  limit: number;
  pages: number;
  total: number;
  next: number | null;
  prev: number | null;
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 12,
    pages: 1,
    total: 0,
    next: null,
    prev: null,
  });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    user: "",
    title: "",
    description: "",
    category: "NCC",
    level: "College",
    date: new Date().toISOString().split("T")[0],
    organizer: "",
    isPublic: true,
    verified: false,
  });

  const [filters, setFilters] = useState({
    search: "",
    category: "All",
    level: "All",
    verified: "All",
    startDate: "",
    endDate: "",
    sortBy: "date:desc",
    userId: undefined as string | undefined,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [error, setError] = useState<string | null>(null);

  // Helper function to get user initials
  const getInitials = useCallback((name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, []);

  // Fetch functions remain the same...
  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await API.get("/auth/me");
      setCurrentUser(response.data.data);
    } catch (err) {
      console.error("Error fetching current user:", err);
    }
  }, []);

  const fetchAchievements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.category !== "All" && { category: filters.category }),
        ...(filters.level !== "All" && { level: filters.level }),
        ...(filters.verified !== "All" && {
          verified: filters.verified === "true" ? "true" : "false",
        }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.userId && { userId: filters.userId }),
        sortBy: filters.sortBy,
      });

      const response = await API.get(`/achievements?${params}`);

      setAchievements(response.data.data || []);
      setPagination({
        page: response.data.pagination?.page || pagination.page,
        limit: response.data.pagination?.limit || pagination.limit,
        pages: response.data.pagination?.pages || 1,
        total: response.data.total || 0,
        next: response.data.pagination?.next || null,
        prev: response.data.pagination?.prev || null,
      });
    } catch (err: any) {
      console.error("Error fetching achievements:", err);
      setError(err.response?.data?.message || "Failed to load achievements");
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await API.get("/users");
      setUsers(response.data.data || response.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  }, []);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const response = await API.get("/achievements/stats");
      setStats(response.data.data);
      setIsStatsModalOpen(true);
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchAchievements();
    fetchUsers();
  }, [fetchCurrentUser, fetchAchievements, fetchUsers]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (pagination.page === 1) {
        fetchAchievements();
      } else {
        setPagination((prev) => ({ ...prev, page: 1 }));
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [filters, fetchAchievements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (editingId) {
        await API.put(`/achievements/${editingId}`, form);
      } else {
        await API.post("/achievements", form);
      }
      fetchAchievements();
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.response?.data?.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this achievement?")) {
      try {
        await API.delete(`/achievements/${id}`);
        fetchAchievements();
      } catch (err) {
        console.error("Error deleting achievement:", err);
        alert("Failed to delete achievement");
      }
    }
  };

  const handleVerify = async (id: string, verified: boolean) => {
    try {
      await API.patch(`/achievements/${id}/verify`, { verified: !verified });
      fetchAchievements();
    } catch (err) {
      console.error("Error verifying achievement:", err);
      alert("Failed to update verification status");
    }
  };

  const handleToggleLike = async (id: string) => {
    if (!currentUser) {
      alert("Please login to like achievements");
      return;
    }

    try {
      await API.post(`/achievements/${id}/like`);
      fetchAchievements();
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const resetForm = () => {
    setForm({
      user: "",
      title: "",
      description: "",
      category: "NCC",
      level: "College",
      date: new Date().toISOString().split("T")[0],
      organizer: "",
      isPublic: true,
      verified: false,
    });
    setEditingId(null);
    setError(null);
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Sports: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      Academic: "bg-green-500/10 text-green-400 border-green-500/30",
      Leadership: "bg-purple-500/10 text-purple-400 border-purple-500/30",
      Cultural: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
      NCC: "bg-red-500/10 text-red-400 border-red-500/30",
      Technical: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    };
    return (
      colors[category] || "bg-gray-500/10 text-gray-400 border-gray-500/30"
    );
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      College: "bg-green-500/10 text-green-400",
      University: "bg-blue-500/10 text-blue-400",
      State: "bg-purple-500/10 text-purple-400",
      National: "bg-orange-500/10 text-orange-400",
      International: "bg-red-500/10 text-red-400",
    };
    return colors[level] || "bg-gray-500/10 text-gray-400";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading && achievements.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading achievements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Achievements Management
              </h1>
              <p className="text-gray-400">
                Manage NCC member achievements and recognition
              </p>
              <div className="h-1 w-24 bg-gradient-to-r from-green-600 to-emerald-400 mt-4 rounded-full" />
            </div>

            <div className="flex gap-3">
              {currentUser?.role === "admin" && (
                <button
                  onClick={fetchStats}
                  disabled={statsLoading}
                  className="px-4 py-2 bg-gradient-to-r from-purple-700 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-500 disabled:opacity-50 transition-all"
                >
                  {statsLoading ? "Loading..." : "View Statistics"}
                </button>
              )}
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-green-700 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-500 transition-all"
              >
                + Add Achievement
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-800 mt-8 overflow-x-auto">
            {["all", "pending", "verified", "my"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  if (tab === "pending") {
                    setFilters({
                      ...filters,
                      verified: "false",
                      userId: undefined,
                    });
                  } else if (tab === "verified") {
                    setFilters({
                      ...filters,
                      verified: "true",
                      userId: undefined,
                    });
                  } else if (tab === "my" && currentUser) {
                    setFilters({
                      ...filters,
                      verified: "All",
                      userId: currentUser._id,
                    });
                  } else {
                    setFilters({
                      ...filters,
                      verified: "All",
                      userId: undefined,
                    });
                  }
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className={`px-4 py-3 font-medium whitespace-nowrap ${activeTab === tab ? "text-green-400 border-b-2 border-green-400" : "text-gray-400 hover:text-white"}`}
              >
                {tab === "all" && "All Achievements"}
                {tab === "pending" &&
                  `Pending (${achievements.filter((a) => !a.verified).length})`}
                {tab === "verified" && "Verified"}
                {tab === "my" && "My Achievements"}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-gray-900/70 border border-green-900/30 rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search achievements..."
              className="bg-gray-800/50 border border-green-900/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 transition-colors"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />

            <select
              className="bg-gray-800/50 border border-green-900/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition-colors"
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
            >
              <option value="All">All Categories</option>
              <option value="NCC">NCC</option>
              <option value="Sports">Sports</option>
              <option value="Academic">Academic</option>
              <option value="Leadership">Leadership</option>
              <option value="Cultural">Cultural</option>
              <option value="Technical">Technical</option>
            </select>

            <select
              className="bg-gray-800/50 border border-green-900/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition-colors"
              value={filters.level}
              onChange={(e) =>
                setFilters({ ...filters, level: e.target.value })
              }
            >
              <option value="All">All Levels</option>
              <option value="College">College</option>
              <option value="University">University</option>
              <option value="State">State</option>
              <option value="National">National</option>
              <option value="International">International</option>
            </select>

            <select
              className="bg-gray-800/50 border border-green-900/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition-colors"
              value={filters.sortBy}
              onChange={(e) =>
                setFilters({ ...filters, sortBy: e.target.value })
              }
            >
              <option value="date:desc">Newest First</option>
              <option value="date:asc">Oldest First</option>
              <option value="level:desc">Highest Level</option>
              <option value="views:desc">Most Viewed</option>
              <option value="likes:desc">Most Liked</option>
              <option value="points:desc">Most Points</option>
            </select>
          </div>

          {/* Date Range Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <input
                type="date"
                className="w-full bg-gray-800/50 border border-green-900/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition-colors"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
              />
              {filters.startDate && (
                <p className="text-xs text-gray-500 mt-1">
                  From: {formatDate(filters.startDate)}
                </p>
              )}
            </div>

            <div>
              <input
                type="date"
                className="w-full bg-gray-800/50 border border-green-900/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition-colors"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
              />
              {filters.endDate && (
                <p className="text-xs text-gray-500 mt-1">
                  To: {formatDate(filters.endDate)}
                </p>
              )}
            </div>

            <button
              onClick={() =>
                setFilters({
                  search: "",
                  category: "All",
                  level: "All",
                  verified: "All",
                  startDate: "",
                  endDate: "",
                  sortBy: "date:desc",
                  userId: undefined,
                })
              }
              className="px-4 py-3 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        {pagination.total > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-900/70 border border-green-900/30 rounded-2xl p-4">
              <p className="text-gray-400 text-sm">Total Achievements</p>
              <p className="text-2xl font-bold text-white">
                {pagination.total}
              </p>
            </div>
            <div className="bg-gray-900/70 border border-green-900/30 rounded-2xl p-4">
              <p className="text-gray-400 text-sm">This Page</p>
              <p className="text-2xl font-bold text-white">
                {achievements.length}
              </p>
            </div>
            <div className="bg-gray-900/70 border border-green-900/30 rounded-2xl p-4">
              <p className="text-gray-400 text-sm">Verified</p>
              <p className="text-2xl font-bold text-green-400">
                {achievements.filter((a) => a.verified).length}
              </p>
              <p className="text-xs text-gray-400">
                {(
                  (achievements.filter((a) => a.verified).length /
                    achievements.length) *
                    100 || 0
                ).toFixed(1)}
                % of page
              </p>
            </div>
            <div className="bg-gray-900/70 border border-green-900/30 rounded-2xl p-4">
              <p className="text-gray-400 text-sm">Total Points</p>
              <p className="text-2xl font-bold text-yellow-400">
                {achievements.reduce((sum, a) => sum + (a.points || 0), 0)}
              </p>
            </div>
          </div>
        )}

        {/* Achievements Grid */}
        {achievements.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-500 text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              No achievements found
            </h3>
            <p className="text-gray-500 mb-6">
              Try adjusting your filters or add a new achievement
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-green-700 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-500 transition-all"
            >
              Add First Achievement
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((achievement) => {
                const isOwner = currentUser?._id === achievement.user._id;
                const isAdmin = currentUser?.role === "admin";
                const canEdit = isOwner || isAdmin;
                const hasLiked = achievement.likes?.includes(
                  currentUser?._id || "",
                );

                return (
                  <div
                    key={achievement._id}
                    className="bg-gray-900/70 border border-green-900/30 rounded-2xl p-6 hover:border-green-500/50 transition-all duration-300 group flex flex-col h-full"
                  >
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold text-white group-hover:text-green-300 transition-colors line-clamp-1">
                              {achievement.title}
                            </h3>
                            {!achievement.isPublic && (
                              <span className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-400 flex-shrink-0">
                                Private
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 mb-4">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-600 to-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                                {getInitials(achievement.user.name)}
                              </div>
                            </div>
                            <div className="min-w-0">
                              <p className="text-white font-medium truncate">
                                {achievement.user.name}
                              </p>
                              <p className="text-gray-400 text-sm truncate">
                                {achievement.user.studentId} •{" "}
                                {achievement.user.department}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() =>
                              handleVerify(
                                achievement._id,
                                achievement.verified,
                              )
                            }
                            disabled={!isAdmin}
                            className={`px-3 py-1 rounded-full text-xs transition-colors ${
                              achievement.verified
                                ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                : "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                            } ${!isAdmin ? "opacity-50 cursor-not-allowed" : ""}`}
                            title={
                              !isAdmin
                                ? "Admin only"
                                : achievement.verified
                                  ? "Mark as unverified"
                                  : "Mark as verified"
                            }
                          >
                            {achievement.verified ? "✓ Verified" : "⚠️ Pending"}
                          </button>

                          <button
                            onClick={() => handleToggleLike(achievement._id)}
                            disabled={!currentUser}
                            className={`px-3 py-1 rounded-full text-xs flex items-center justify-center gap-1 transition-colors ${
                              hasLiked
                                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                            } ${!currentUser ? "opacity-50 cursor-not-allowed" : ""}`}
                            title={
                              !currentUser
                                ? "Login to like"
                                : hasLiked
                                  ? "Unlike"
                                  : "Like"
                            }
                          >
                            <span>❤️</span>
                            <span>{achievement.likes?.length || 0}</span>
                          </button>
                        </div>
                      </div>

                      <p className="text-gray-300 mb-4 line-clamp-3 min-h-[4.5rem]">
                        {achievement.description}
                      </p>

                      {achievement.organizer && (
                        <p className="text-gray-400 text-sm mb-4">
                          <span className="font-medium">Organizer:</span>{" "}
                          <span className="text-gray-300">
                            {achievement.organizer}
                          </span>
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2 mb-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${getCategoryColor(achievement.category)}`}
                        >
                          {achievement.category}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${getLevelColor(achievement.level)}`}
                        >
                          {achievement.level}
                        </span>
                        {achievement.points > 0 && (
                          <span className="px-3 py-1 bg-yellow-500/10 rounded-full text-sm text-yellow-400">
                            {achievement.points} pts
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-800 mt-auto">
                      <div className="flex justify-between items-center text-sm text-gray-400">
                        <div className="space-y-1">
                          <div className="flex items-center gap-4">
                            <span
                              className="flex items-center gap-1"
                              title="Date"
                            >
                              📅 {formatDate(achievement.date)}
                            </span>
                            <span
                              className="flex items-center gap-1"
                              title="Views"
                            >
                              👁️ {achievement.views || 0}
                            </span>
                            <span
                              className="flex items-center gap-1"
                              title="Comments"
                            >
                              💬 {achievement.comments?.length || 0}
                            </span>
                          </div>
                          {achievement.verifiedBy && achievement.verifiedAt && (
                            <p
                              className="text-green-400 text-xs"
                              title="Verification details"
                            >
                              Verified by {achievement.verifiedBy.name} on{" "}
                              {formatDate(achievement.verifiedAt)}
                            </p>
                          )}
                        </div>

                        {canEdit && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingId(achievement._id);
                                setForm({
                                  user: achievement.user._id,
                                  title: achievement.title,
                                  description: achievement.description,
                                  category: achievement.category,
                                  level: achievement.level,
                                  date: achievement.date.split("T")[0],
                                  organizer: achievement.organizer || "",
                                  isPublic: achievement.isPublic,
                                  verified: achievement.verified,
                                });
                                setIsModalOpen(true);
                              }}
                              className="text-green-400 hover:text-green-300 px-2 py-1 hover:bg-green-500/10 rounded transition-colors"
                              title="Edit achievement"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(achievement._id)}
                              className="text-red-400 hover:text-red-300 px-2 py-1 hover:bg-red-500/10 rounded transition-colors"
                              title="Delete achievement"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex flex-wrap justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.prev}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    pagination.prev
                      ? "bg-gray-800 text-white hover:bg-gray-700"
                      : "bg-gray-900 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Previous
                </button>

                {[...Array(pagination.pages)].map((_, i) => {
                  const pageNum = i + 1;
                  // Show first, last, current, and neighbors
                  if (
                    pageNum === 1 ||
                    pageNum === pagination.pages ||
                    Math.abs(pageNum - pagination.page) <= 1
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 rounded-lg transition-colors min-w-[40px] ${
                          pagination.page === pageNum
                            ? "bg-green-600 text-white"
                            : "bg-gray-800 text-white hover:bg-gray-700"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (Math.abs(pageNum - pagination.page) === 2) {
                    return (
                      <span key={pageNum} className="text-gray-500 px-2">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.next}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    pagination.next
                      ? "bg-gray-800 text-white hover:bg-gray-700"
                      : "bg-gray-900 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Add/Edit Achievement Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 border border-green-900/30 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingId ? "Edit Achievement" : "Add Achievement"}
                </h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-white text-2xl transition-colors"
                  disabled={submitting}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {(currentUser?.role === "admin" || !editingId) && (
                  <div>
                    <label className="block text-gray-300 mb-2">Student</label>
                    <select
                      value={form.user}
                      onChange={(e) =>
                        setForm({ ...form, user: e.target.value })
                      }
                      className="w-full bg-gray-800 border border-green-900/30 rounded-xl p-3 text-white focus:outline-none focus:border-green-500/50 transition-colors"
                      required
                      disabled={
                        (editingId && currentUser?.role !== "admin") ||
                        submitting
                      }
                    >
                      <option value="">Select Student</option>
                      {users.map((user) => (
                        <option
                          key={user._id}
                          value={user._id}
                          className="bg-gray-800"
                        >
                          {user.name} ({user.studentId}) - {user.department}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-gray-300 mb-2">Title *</label>
                  <input
                    type="text"
                    placeholder="Enter achievement title"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    className="w-full bg-gray-800 border border-green-900/30 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 transition-colors"
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    placeholder="Describe the achievement..."
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    className="w-full bg-gray-800 border border-green-900/30 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 transition-colors"
                    rows={4}
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-2">
                      Category *
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) =>
                        setForm({ ...form, category: e.target.value })
                      }
                      className="w-full bg-gray-800 border border-green-900/30 rounded-xl p-3 text-white focus:outline-none focus:border-green-500/50 transition-colors"
                      required
                      disabled={submitting}
                    >
                      <option value="NCC">NCC</option>
                      <option value="Sports">Sports</option>
                      <option value="Academic">Academic</option>
                      <option value="Leadership">Leadership</option>
                      <option value="Cultural">Cultural</option>
                      <option value="Technical">Technical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">Level *</label>
                    <select
                      value={form.level}
                      onChange={(e) =>
                        setForm({ ...form, level: e.target.value })
                      }
                      className="w-full bg-gray-800 border border-green-900/30 rounded-xl p-3 text-white focus:outline-none focus:border-green-500/50 transition-colors"
                      required
                      disabled={submitting}
                    >
                      <option value="College">College</option>
                      <option value="University">University</option>
                      <option value="State">State</option>
                      <option value="National">National</option>
                      <option value="International">International</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-2">Date *</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) =>
                        setForm({ ...form, date: e.target.value })
                      }
                      className="w-full bg-gray-800 border border-green-900/30 rounded-xl p-3 text-white focus:outline-none focus:border-green-500/50 transition-colors"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">
                      Organizer (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., University, Organization"
                      value={form.organizer}
                      onChange={(e) =>
                        setForm({ ...form, organizer: e.target.value })
                      }
                      className="w-full bg-gray-800 border border-green-900/30 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 transition-colors"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <label className="flex items-center text-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.isPublic}
                        onChange={(e) =>
                          setForm({ ...form, isPublic: e.target.checked })
                        }
                        className="mr-2 w-5 h-5 accent-green-500"
                        disabled={submitting}
                      />
                      Make Public
                    </label>

                    {currentUser?.role === "admin" && (
                      <label className="flex items-center text-gray-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.verified}
                          onChange={(e) =>
                            setForm({ ...form, verified: e.target.checked })
                          }
                          className="mr-2 w-5 h-5 accent-green-500"
                          disabled={submitting}
                        />
                        Mark as Verified
                      </label>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    className="flex-1 border border-green-900/30 text-gray-300 rounded-xl p-3 hover:bg-gray-800 transition-colors disabled:opacity-50"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-700 to-emerald-600 text-white rounded-xl p-3 hover:from-green-600 hover:to-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {editingId ? "Updating..." : "Creating..."}
                      </span>
                    ) : editingId ? (
                      "Update Achievement"
                    ) : (
                      "Add Achievement"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Statistics Modal */}
        {isStatsModalOpen && stats && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 border border-green-900/30 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Achievement Statistics
                </h2>
                <button
                  onClick={() => setIsStatsModalOpen(false)}
                  className="text-gray-400 hover:text-white text-2xl transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Overall Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-800/50 border border-green-900/30 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">Total Achievements</p>
                    <p className="text-2xl font-bold text-white">
                      {stats.overall.totalAchievements}
                    </p>
                  </div>
                  <div className="bg-gray-800/50 border border-green-900/30 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">Verified</p>
                    <p className="text-2xl font-bold text-green-400">
                      {stats.overall.verifiedAchievements}
                    </p>
                    <p className="text-sm text-gray-400">
                      {stats.overall.verificationRate.toFixed(1)}% rate
                    </p>
                  </div>
                  <div className="bg-gray-800/50 border border-green-900/30 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">Total Points</p>
                    <p className="text-2xl font-bold text-yellow-400">
                      {stats.overall.totalPoints}
                    </p>
                  </div>
                  <div className="bg-gray-800/50 border border-green-900/30 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">Avg. Points</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {stats.overall.averagePoints.toFixed(1)}
                    </p>
                  </div>
                </div>

                {/* Category Stats */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    By Category
                  </h3>
                  <div className="space-y-3">
                    {stats.byCategory.map((cat) => (
                      <div
                        key={cat.category}
                        className="flex items-center justify-between"
                      >
                        <span className="text-gray-300">{cat.category}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-gray-400">
                            {cat.verified}/{cat.count}
                          </span>
                          <div className="w-32 bg-gray-800 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${cat.verificationRate}%` }}
                            />
                          </div>
                          <span className="text-gray-400 w-12 text-right">
                            {cat.verificationRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Level Stats */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    By Level
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {stats.byLevel.map((level) => (
                      <div
                        key={level.level}
                        className="bg-gray-800/50 border border-green-900/30 rounded-xl p-4"
                      >
                        <p className="text-gray-400 text-sm">{level.level}</p>
                        <p className="text-xl font-bold text-white">
                          {level.count}
                        </p>
                        <p className="text-sm text-gray-400">
                          Avg. {level.averagePoints.toFixed(1)} pts
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setIsStatsModalOpen(false)}
                  className="w-full border border-green-900/30 text-gray-300 rounded-xl p-3 hover:bg-gray-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
