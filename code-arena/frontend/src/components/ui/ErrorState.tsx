import React from "react";

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 20px",
        gap: "12px",
        textAlign: "center",
        animation: "fadeIn 0.5s ease",
      }}
    >
      <div
        style={{
          fontSize: "56px",
          marginBottom: "4px",
        }}
      >
        ⚠️
      </div>
      <h3
        style={{
          fontSize: "20px",
          fontWeight: "700",
          color: "#FF6B6B",
          margin: 0,
          background: "linear-gradient(135deg, #EF4444, #B91C1C)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        Something went wrong
      </h3>
      <p
        style={{
          fontSize: "14px",
          color: "rgba(255,255,255,0.5)",
          maxWidth: "400px",
          margin: 0,
          lineHeight: "1.6",
        }}
      >
        {error}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: "12px",
            padding: "10px 28px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #2979FF, #1565C0)",
            border: "none",
            color: "white",
            fontWeight: "600",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(41, 121, 255, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          Try Again
        </button>
      )}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ErrorState;
