// components/UI/protectedRoutes.tsx
"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import API from "@/lib/api";

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({
  children,
  adminOnly,
}: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get user from localStorage or your auth state
        const userStr = localStorage.getItem("user");
        if (!userStr) {
          router.push("/login");
          return;
        }

        const user = JSON.parse(userStr);

        // If adminOnly is true, check if user is admin
        if (adminOnly && user.role !== "admin") {
          router.push("/dashboard");
          return;
        }

        // Optional: Verify token with backend
        const response = await API.get("/auth/verify");
        if (response.data.valid) {
          setIsAuthorized(true);
        } else {
          localStorage.removeItem("user");
          router.push("/login");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, adminOnly]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          <p className="mt-4 text-green-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  return isAuthorized ? <>{children}</> : null;
}
