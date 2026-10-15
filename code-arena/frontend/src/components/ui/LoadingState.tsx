  import React from "react";

  interface LoadingStateProps {
    label?: string;
    size?: "sm" | "md" | "lg";
    variant?: "skeleton" | "spinner" | "dots";
  }

  export const LoadingState: React.FC<LoadingStateProps> = ({
    label = "Loading...",
    size = "md",
    variant = "skeleton",
  }) => {
    // ---- Dots variant ----
    if (variant === "dots") {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 20px",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", gap: "8px" }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background: "#2979FF",
                  animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite`,
                }}
              />
            ))}
          </div>
          {label && (
            <div
              style={{
                fontSize: "14px",
                color: "rgba(255,255,255,0.5)",
                fontWeight: "500",
              }}
            >
              {label}
            </div>
          )}
          <style>{`
            @keyframes bounce {
              0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
              40% { transform: scale(1); opacity: 1; }
            }
          `}</style>
        </div>
      );
    }

    // ---- Spinner variant ----
    if (variant === "spinner") {
      const containerSize = { sm: "40px", md: "60px", lg: "80px" }[size] || "60px";

      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 20px",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: containerSize,
              height: containerSize,
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: `3px solid rgba(41,121,255,0.1)`,
                borderTop: `3px solid #2979FF`,
                animation: "spin 0.8s linear infinite",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: "12px",
                borderRadius: "50%",
                border: `3px solid rgba(56,189,248,0.1)`,
                borderBottom: `3px solid #38BDF8`,
                animation: "spin 1.2s linear infinite reverse",
              }}
            />
          </div>
          {label && (
            <div
              style={{
                fontSize: "14px",
                color: "rgba(255,255,255,0.5)",
                fontWeight: "500",
              }}
            >
              {label}
            </div>
          )}
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      );
    }

    // ---- Skeleton variant (default) ----
    const avatarSizes = { sm: 32, md: 48, lg: 64 };
    const gapSizes = { sm: 12, md: 16, lg: 20 };
    const avatarSize = avatarSizes[size] || 48;
    const gap = gapSizes[size] || 16;

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 24px",
          minHeight: "120px",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: `${gap}px`,
            padding: "20px 24px",
            background: `
              linear-gradient(
                90deg,
                rgba(255,255,255,0.02) 25%,
                rgba(255,255,255,0.06) 50%,
                rgba(255,255,255,0.02) 75%
              )
            `,
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.06)",
            width: "100%",
            maxWidth: "400px",
            position: "relative",
            overflow: "hidden",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s infinite",
          }}
        >
          <div
            style={{
              width: `${avatarSize}px`,
              height: `${avatarSize}px`,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
              flexShrink: 0,
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              flex: 1,
            }}
          >
            <div
              style={{
                height: "16px",
                width: "70%",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.06)",
              }}
            />
            <div
              style={{
                height: "12px",
                width: "50%",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.04)",
              }}
            />
            <div
              style={{
                height: "10px",
                width: "30%",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.03)",
              }}
            />
          </div>
          <style>{`
            @keyframes shimmer {
              0% { background-position: -200% 0; }
              100% { background-position: 200% 0; }
            }
          `}</style>
        </div>
      </div>
    );
  };

  export default LoadingState;
