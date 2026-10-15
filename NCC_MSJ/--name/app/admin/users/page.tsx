"use client";

import { useState, useEffect } from "react";
import API from "@/lib/api";

interface User {
  _id: string;
  name: string;
  email: string;
  studentId: string;
  department: string;
  year: string;
  role: "admin" | "member";
  status: "Active" | "Inactive" | "Suspended";
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "member">(
    "all",
  );
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await API.get("/users");
      setUsers(response.data.data || []);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (
    userId: string,
    newStatus: User["status"],
  ) => {
    try {
      await API.put(`/users/${userId}`, { status: newStatus });
      fetchUsers();
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleRoleChange = async (userId: string, newRole: User["role"]) => {
    try {
      await API.put(`/users/${userId}`, { role: newRole });
      fetchUsers();
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      await API.delete(`/users/${userId}`);
      fetchUsers();
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getStatusColor = (status: User["status"]) => {
    const colors = {
      Active: "bg-green-500/10 text-green-400 border-green-500/30",
      Inactive: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
      Suspended: "bg-red-500/10 text-red-400 border-red-500/30",
    };
    return colors[status];
  };

  const getRoleColor = (role: User["role"]) => {
    return role === "admin"
      ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
      : "bg-blue-500/10 text-blue-400 border-blue-500/30";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            User Management
          </h1>
          <p className="text-gray-400">Manage NCC members and administrators</p>
          <div className="h-1 w-24 bg-gradient-to-r from-green-600 to-emerald-400 mt-4 rounded-full" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900/70 border border-green-900/30 rounded-xl p-6">
            <h3 className="text-sm text-gray-400 mb-1">Total Users</h3>
            <p className="text-2xl font-bold text-white">{users.length}</p>
          </div>
          <div className="bg-gray-900/70 border border-green-900/30 rounded-xl p-6">
            <h3 className="text-sm text-gray-400 mb-1">Active</h3>
            <p className="text-2xl font-bold text-green-400">
              {users.filter((u) => u.status === "Active").length}
            </p>
          </div>
          <div className="bg-gray-900/70 border border-green-900/30 rounded-xl p-6">
            <h3 className="text-sm text-gray-400 mb-1">Admins</h3>
            <p className="text-2xl font-bold text-purple-400">
              {users.filter((u) => u.role === "admin").length}
            </p>
          </div>
          <div className="bg-gray-900/70 border border-green-900/30 rounded-xl p-6">
            <h3 className="text-sm text-gray-400 mb-1">Members</h3>
            <p className="text-2xl font-bold text-blue-400">
              {users.filter((u) => u.role === "member").length}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-900/70 border border-green-900/30 rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search users..."
              className="flex-1 bg-gray-800/50 border border-green-900/30 rounded-xl px-4 py-3 text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="bg-gray-800/50 border border-green-900/30 rounded-xl px-4 py-3 text-white"
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(e.target.value as "all" | "admin" | "member")
              }
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
            </select>
            <button
              onClick={fetchUsers}
              className="px-4 py-3 border border-green-900/30 text-green-400 rounded-xl hover:bg-gray-800/50"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Users Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            <p className="mt-4 text-gray-400">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/50 rounded-2xl border border-green-900/30">
            <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">👤</span>
            </div>
            <p className="text-gray-400 text-lg mb-2">No users found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <div
                key={user._id}
                className="bg-gray-900/70 border border-green-900/30 rounded-2xl p-6 hover:border-green-500/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-900/30 to-emerald-800/30 rounded-full flex items-center justify-center mr-4 border border-green-700/30">
                      <span className="text-xl font-bold text-green-400">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {user.name}
                      </h3>
                      <p className="text-gray-400 text-sm">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setUserToDelete(user._id);
                      setIsDeleteModalOpen(true);
                    }}
                    className="text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-gray-400">
                    <span className="mr-2">ID:</span>
                    <span className="text-white">{user.studentId}</span>
                  </div>
                  <div className="flex items-center text-gray-400">
                    <span className="mr-2">Dept:</span>
                    <span className="text-white">{user.department}</span>
                  </div>
                  <div className="flex items-center text-gray-400">
                    <span className="mr-2">Year:</span>
                    <span className="text-white">{user.year}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${getRoleColor(user.role)}`}
                  >
                    {user.role}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${getStatusColor(user.status)}`}
                  >
                    {user.status}
                  </span>
                </div>

                <div className="flex gap-2">
                  <select
                    value={user.role}
                    onChange={(e) =>
                      handleRoleChange(user._id, e.target.value as User["role"])
                    }
                    className="flex-1 bg-gray-800 border border-green-900/30 rounded-xl px-3 py-2 text-white text-sm"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>

                  <select
                    value={user.status}
                    onChange={(e) =>
                      handleStatusChange(
                        user._id,
                        e.target.value as User["status"],
                      )
                    }
                    className="flex-1 bg-gray-800 border border-green-900/30 rounded-xl px-3 py-2 text-white text-sm"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>

                <div className="text-xs text-gray-400 mt-4">
                  Joined: {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-green-900/30 rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Delete User</h2>
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setUserToDelete(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this user? This action cannot be
              undone.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setUserToDelete(null);
                }}
                className="flex-1 border border-green-900/30 text-gray-300 rounded-xl p-3 hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => userToDelete && handleDelete(userToDelete)}
                className="flex-1 bg-gradient-to-r from-red-700 to-red-600 text-white rounded-xl p-3 hover:from-red-600 hover:to-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
  