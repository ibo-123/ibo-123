// app/hooks/useAuth.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn, getToken, removeToken, setToken } from "@/lib/auth";

/**
 * @typedef {Object} User
 * @property {string} _id
 * @property {string} name
 * @property {string} email
 * @property {string} studentId
 * @property {string} department
 * @property {string} year
 * @property {'admin' | 'member'} role
 * @property {'Active' | 'Inactive' | 'Suspended'} status
 * @property {number} [activeness]
 * @property {string} [lastLogin]
 * @property {string} createdAt
 */

/**
 * @typedef {Object} AuthReturn
 * @property {User | null} user
 * @property {boolean} loading
 * @property {function(string, User): void} login
 * @property {function(): void} logout
 * @property {function(User): void} updateUser
 * @property {boolean} isAuthenticated
 * @property {boolean} isAdmin
 */

/**
 * @returns {AuthReturn}
 */
export function useAuth() {
  const [user, setUserState] = useState(/** @type {User | null} */ (null));
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      if (!isLoggedIn()) {
        setLoading(false);
        return;
      }

      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          /** @type {User} */
          const parsedUser = JSON.parse(userData);
          setUserState(parsedUser);
        } catch (e) {
          localStorage.removeItem("user");
        }
      }
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * @param {string} token
   * @param {User} userData
   */
  const login = (token, userData) => {
    setToken(token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUserState(userData);
  };

  const logout = () => {
    removeToken();
    localStorage.removeItem("user");
    setUserState(null);
    router.push("/login");
  };

  /**
   * @param {User} userData
   */
  const updateUser = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUserState(userData);
  };

  return {
    user,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user && isLoggedIn(),
    isAdmin: user?.role === "admin",
  };
}