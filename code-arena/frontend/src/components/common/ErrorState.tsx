// frontend/src/components/common/ErrorState.tsx
import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
}

const Colors = {
  red: "#FF6B6B",
  redBg: "rgba(255, 107, 107, 0.08)",
  redBorder: "rgba(255, 107, 107, 0.2)",
  blue: "#2979FF",
  blueLight: "#64B5F6",
  textPrimary: "#ffffff",
  textMuted: "rgba(255,255,255,0.55)",
};

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  return (
    <div
      role="alert"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 24px",
        gap: "14px",
        textAlign: "center",
      }}
    >
      {/* Icon tile */}
      <div
        aria-hidden="true"
        style={{
          width: "72px",
          height: "72px",
          borderRadius: "20px",
          background: Colors.redBg,
          border: `1px solid ${Colors.redBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: Colors.red,
          marginBottom: "4px",
        }}
      >
        <AlertTriangle size={32} />
      </div>

      <h3
        style={{
          fontSize: "20px",
          fontWeight: 700,
          color: Colors.red,
          margin: 0,
          letterSpacing: "-0.01em",
        }}
      >
        Something went wrong
      </h3>

      <p
        style={{
          fontSize: "14px",
          color: Colors.textMuted,
          maxWidth: "420px",
          margin: 0,
          lineHeight: 1.6,
        }}
      >
        {error}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "10px",
            padding: "10px 22px",
            borderRadius: "12px",
            background: `linear-gradient(135deg, ${Colors.blue}, #1565C0)`,
            border: "none",
            color: "#fff",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
            transition:
              "transform 0.2s ease, box-shadow 0.2s ease, opacity 0.15s ease",
            boxShadow: `0 8px 24px ${Colors.blue}4d`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = `0 12px 32px ${Colors.blue}66`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = `0 8px 24px ${Colors.blue}4d`;
          }}
        >
          <RotateCcw size={14} />
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorState;