"use client";

import { useForm } from "react-hook-form";
import API from "@/lib/api";
import { setToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";

type LoginForm = {
  email: string;
  password: string;
};

export default function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Fix hydration issues by only rendering dynamic content after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await API.post("/auth/login", data);
      const token = res.data.data.token;
      
      if (!token) {
        throw new Error("No authentication token received");
      }
      
      setToken(token);
      // Small delay to allow token to be set before navigation
      setTimeout(() => {
        router.push("/dashboard");
      }, 100);
    } catch (err: any) {
      console.error("[v0] Login error:", err);
      
      let errorMessage = "Login failed. Please try again.";
      
      if (err.response?.status === 401) {
        errorMessage = "Invalid email or password. Please check your credentials.";
      } else if (err.response?.status === 429) {
        errorMessage = "Too many login attempts. Please try again later.";
      } else if (err.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (err.message === "Network Error") {
        errorMessage = "Network error. Please check your connection.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate static background elements that won't change between server and client
  const backgroundElements = mounted
    ? [...Array(10)].map((_, i) => {
        // Generate consistent values based on index
        const left = ((i * 13) % 90) + 5; // 5-95%
        const top = ((i * 17) % 90) + 5; // 5-95%
        const duration = 3 + (i % 5); // 3-8s
        const delay = (i % 20) / 10; // 0-2s
        const value = i % 2 === 0 ? "1" : "0"; // Alternate between 1 and 0

        return (
          <div
            key={i}
            className="absolute font-mono text-green-900/10 text-xl animate-pulse"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
            }}
          >
            {value}
          </div>
        );
      })
    : null; // Don't render on server

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8 sm:px-6 lg:px-8 safe-area-inset">
      <div className="w-full max-w-sm">
        {/* Back to Home Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-8 transition-colors text-sm font-medium"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Platform
        </Link>

        {/* Login Card */}
        <div className="ncc-card-elevated p-8">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary text-primary-foreground rounded-lg mb-4 font-bold text-xl">
              NCC
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Welcome Back</h1>
            <p className="text-muted-foreground text-sm">
              Sign in to your NCC MSJ account
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-destructive flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-destructive text-sm">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <input
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
                placeholder="your@email.com"
                className="ncc-input"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-2 text-sm text-destructive font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <input
                type="password"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
                placeholder="••••••••"
                className="ncc-input"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="mt-2 text-sm text-destructive font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="ncc-btn-primary w-full flex items-center justify-center gap-2 min-h-[48px] text-base tap-highlight"
            >
              {isLoading && <div className="ncc-spinner w-4 h-4" />}
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-muted-foreground text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-primary hover:text-primary/80 font-semibold transition-colors"
              >
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
