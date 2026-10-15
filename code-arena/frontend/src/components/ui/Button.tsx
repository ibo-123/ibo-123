import React, { useState } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success" | "gold" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  disabled,
  style,
  icon,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const variantStyles = {
    primary: {
      background: isHovered
        ? "linear-gradient(135deg, #1565C0, #0D47A1)"
        : "linear-gradient(135deg, #2979FF, #1565C0)",
      color: "#FFFFFF",
      border: "none",
      boxShadow: isHovered
        ? "0 8px 32px rgba(41, 121, 255, 0.4)"
        : "0 4px 16px rgba(41, 121, 255, 0.3)",
    },
    secondary: {
      background: isHovered ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)",
      color: "#FFFFFF",
      border: "1px solid rgba(255,255,255,0.15)",
      boxShadow: "none",
    },
    danger: {
      background: isHovered
        ? "linear-gradient(135deg, #C62828, #B71C1C)"
        : "linear-gradient(135deg, #F44336, #D32F2F)",
      color: "#FFFFFF",
      border: "none",
      boxShadow: isHovered
        ? "0 8px 32px rgba(244, 67, 54, 0.4)"
        : "0 4px 16px rgba(244, 67, 54, 0.3)",
    },
    success: {
      background: isHovered
        ? "linear-gradient(135deg, #2E7D32, #1B5E20)"
        : "linear-gradient(135deg, #22C55E, #388E3C)",
      color: "#FFFFFF",
      border: "none",
      boxShadow: isHovered
        ? "0 8px 32px rgba(76, 175, 80, 0.4)"
        : "0 4px 16px rgba(76, 175, 80, 0.3)",
    },
    gold: {
      background: isHovered
        ? "linear-gradient(135deg, #FFA000, #F57C00)"
        : "linear-gradient(135deg, #FFD700, #FFA000)",
      color: "#0a0e1a",
      border: "none",
      boxShadow: isHovered
        ? "0 8px 32px rgba(255, 215, 0, 0.4)"
        : "0 4px 16px rgba(255, 215, 0, 0.3)",
    },
    outline: {
      background: isHovered ? "rgba(41, 121, 255, 0.05)" : "transparent",
      color: "#FFFFFF",
      border: isHovered
        ? "1px solid rgba(41, 121, 255, 0.5)"
        : "1px solid rgba(255, 255, 255, 0.2)",
      boxShadow: "none",
    },
  };

  const sizeStyles = {
    sm: { padding: "8px 16px", fontSize: "13px", borderRadius: "8px" },
    md: { padding: "10px 24px", fontSize: "15px", borderRadius: "10px" },
    lg: { padding: "14px 32px", fontSize: "17px", borderRadius: "12px" },
  };

  const baseStyles: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontWeight: "600",
    cursor: disabled || loading ? "not-allowed" : "pointer",
    opacity: disabled || loading ? 0.5 : 1,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    outline: "none",
    transform: isActive ? "scale(0.97)" : isHovered ? "translateY(-2px)" : "scale(1)",
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...style,
  };

  return (
    <button
      style={baseStyles}
      disabled={disabled || loading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsActive(false);
      }}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
      {...props}
    >
      {loading ? (
        <>
          <span
            style={{
              display: "inline-block",
              width: "16px",
              height: "16px",
              border: "2px solid rgba(255,255,255,0.3)",
              borderTop: `2px solid ${variant === "secondary" || variant === "outline" ? "#64B5F6" : "#FFFFFF"}`,
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          {typeof children === "string" ? children : "Loading..."}
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
};

export default Button;
