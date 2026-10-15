import React from "react";

interface EmptyStateProps {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: "default" | "compact" | "centered";
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  label,
  description,
  icon,
  action,
  variant = "centered",
}) => {
  const variantStyles = {
    default: {
      padding: "40px 20px",
      gap: "12px",
    },
    compact: {
      padding: "24px 16px",
      gap: "8px",
    },
    centered: {
      padding: "60px 20px",
      gap: "16px",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        animation: "fadeIn 0.5s ease",
        ...styles,
      }}
    >
      {icon && (
        <div
          style={{
            marginBottom: "4px",
            opacity: 0.4,
            fontSize: variant === "compact" ? "32px" : "48px",
          }}
        >
          {icon}
        </div>
      )}
      <p
        style={{
          fontSize: variant === "compact" ? "14px" : "16px",
          color: "rgba(255,255,255,0.5)",
          fontWeight: "500",
          margin: 0,
          lineHeight: "1.5",
        }}
      >
        {label}
      </p>
      {description && (
        <p
          style={{
            fontSize: variant === "compact" ? "12px" : "14px",
            color: "rgba(255,255,255,0.3)",
            margin: 0,
            maxWidth: "400px",
            lineHeight: "1.6",
          }}
        >
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: "16px",
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
          {action.label}
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

export default EmptyState;
