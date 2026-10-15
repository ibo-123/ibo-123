import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { User, Lock, ArrowRight, Shield, Sparkles, Trophy, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const redirectUrl =
    location.state?.from?.pathname || searchParams.get("redirect") || "/dashboard";

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const username = String(form.get("username"));
    const password = String(form.get("password"));

    try {
      const user = await login({ username, password });
      if (user.role === "ADMIN") {
        navigate("/admin");
      } else {
        navigate(redirectUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0e1a 0%, #1a1f35 50%, #0a0e1a 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated Background */}
      <div
        style={{
          position: "absolute",
          top: "-50%",
          right: "-30%",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(41, 121, 255, 0.08) 0%, transparent 70%)",
          borderRadius: "50%",
          animation: "pulse 6s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-40%",
          left: "-20%",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(56, 189, 248, 0.06) 0%, transparent 70%)",
          borderRadius: "50%",
          animation: "pulse 8s ease-in-out infinite reverse",
        }}
      />

      {/* Brand */}
      <Link
        to="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          textDecoration: "none",
          marginBottom: "32px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #2979FF, #EAB308)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            fontWeight: "700",
            color: "white",
          }}
        >
          CA
        </div>
        <div>
          <span
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "white",
              letterSpacing: "0.5px",
            }}
          >
            CodeArena
          </span>
          <span
            style={{
              display: "block",
              fontSize: "11px",
              color: "rgba(255,215,0,0.6)",
              fontWeight: "600",
              letterSpacing: "2px",
              textTransform: "uppercase",
              marginTop: "-2px",
            }}
          >
            Championship 2026
          </span>
        </div>
      </Link>

      <Card
        style={{
          maxWidth: "440px",
          width: "100%",
          padding: "40px",
          background: "rgba(20, 25, 45, 0.9)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "24px",
          position: "relative",
          zIndex: 1,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div>
            <Badge
              tone="blue"
              style={{
                padding: "4px 14px",
                borderRadius: "100px",
                background: "linear-gradient(135deg, #2979FF, #1565C0)",
                fontWeight: "600",
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              <Sparkles size={12} style={{ marginRight: "6px", display: "inline" }} />
              Welcome Back
            </Badge>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              color: "rgba(255,255,255,0.3)",
            }}
          >
            <Trophy size={14} color="#FFD700" />
            <span>Champion</span>
          </div>
        </div>

        <h1
          style={{
            fontSize: "28px",
            fontWeight: "700",
            color: "white",
            margin: "0 0 8px 0",
            background: "linear-gradient(135deg, #FFFFFF, #64B5F6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Sign in to Code Arena
        </h1>
        <p
          style={{
            fontSize: "15px",
            color: "rgba(255,255,255,0.5)",
            marginBottom: "32px",
          }}
        >
          Continue your championship campaign.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* Username */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <label
              style={{
                fontSize: "13px",
                fontWeight: "500",
                color: "rgba(255,255,255,0.7)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <User size={16} color="rgba(255,255,255,0.3)" />
              Username
            </label>
            <input
              required
              type="text"
              name="username"
              placeholder="Your username"
              autoComplete="username"
              style={inputStyle}
            />
          </div>

          {/* Password */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <label
              style={{
                fontSize: "13px",
                fontWeight: "500",
                color: "rgba(255,255,255,0.7)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Lock size={16} color="rgba(255,255,255,0.3)" />
                Password
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,0.4)",
                  fontSize: "12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                {showPassword ? "Hide" : "Show"}
              </button>
            </label>
            <input
              required
              minLength={6}
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="••••••••"
              autoComplete="current-password"
              style={inputStyle}
            />
          </div>

          {/* Remember Me & Forgot Password */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "-4px",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                color: "rgba(255,255,255,0.5)",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  width: "16px",
                  height: "16px",
                  accentColor: "#2979FF",
                  cursor: "pointer",
                }}
              />
              Remember me
            </label>
            <Link
              to="/forgot-password"
              style={{
                fontSize: "13px",
                color: "rgba(255,255,255,0.4)",
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
            >
              Forgot password?
            </Link>
          </div>

          {error && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "10px",
                background: "rgba(244, 67, 54, 0.1)",
                border: "1px solid rgba(244, 67, 54, 0.2)",
                color: "#FF6B6B",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>⚠️</span>
              {error}
            </div>
          )}

          <Button
            type="submit"
            loading={loading}
            variant="primary"
            size="lg"
            style={{
              width: "100%",
              borderRadius: "12px",
              background: loading
                ? "rgba(255,255,255,0.05)"
                : "linear-gradient(135deg, #2979FF, #1565C0)",
              border: "none",
              color: "white",
              fontWeight: "700",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.3s ease",
              padding: "14px 24px",
            }}
          >
            {loading ? (
              "Signing in..."
            ) : (
              <>
                Sign In
                <ArrowRight size={18} />
              </>
            )}
          </Button>
        </form>

        <div
          style={{
            marginTop: "24px",
            paddingTop: "24px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: "14px",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            New to the arena?{" "}
            <Link
              to="/register"
              style={{
                color: "#2979FF",
                fontWeight: "600",
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
            >
              Register now
            </Link>
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "16px",
              marginTop: "12px",
              fontSize: "12px",
              color: "rgba(255,255,255,0.2)",
            }}
          >
            <span>Secure login</span>
            <span>•</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Shield size={12} />
              Encrypted
            </span>
          </div>
        </div>
      </Card>

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .auth-card {
          animation: slideUp 0.5s ease;
        }
        input:focus {
          border-color: #2979FF !important;
          box-shadow: 0 0 0 3px rgba(41,121,255,0.15) !important;
        }
        input:hover {
          border-color: rgba(255,255,255,0.2);
        }
      `}</style>
    </div>
  );
};

// Input styles
const inputStyle: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "white",
  fontSize: "14px",
  outline: "none",
  transition: "all 0.3s ease",
  width: "100%",
  boxSizing: "border-box",
};

export default Login;
