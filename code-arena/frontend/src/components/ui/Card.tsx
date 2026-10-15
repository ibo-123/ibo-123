import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  hoverable?: boolean;
  variant?: "default" | "glass" | "dark" | "glow" | "gold" | "gradient";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  onClick?: () => void;
  borderColor?: string;
  glowColor?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  style,
  hoverable = true,
  variant = "glass",
  padding = "md",
  onClick,
  borderColor,
  glowColor,
}) => {
  const variantStyles = {
    glass: {
      background: "rgba(255, 255, 255, 0.03)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: `1px solid ${borderColor || "rgba(255, 255, 255, 0.06)"}`,
      boxShadow: "0 4px 24px rgba(0, 0, 0, 0.2)",
    },
    dark: {
      background: "rgba(15, 16, 26, 0.95)",
      border: `1px solid ${borderColor || "rgba(255, 255, 255, 0.04)"}`,
      boxShadow: "0 4px 24px rgba(0, 0, 0, 0.3)",
    },
    default: {
      background: "rgba(255, 255, 255, 0.02)",
      border: `1px solid ${borderColor || "rgba(255, 255, 255, 0.06)"}`,
      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
    },
    glow: {
      background: "rgba(41, 121, 255, 0.03)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: `1px solid ${borderColor || "rgba(41, 121, 255, 0.15)"}`,
      boxShadow: glowColor ? `0 4px 32px ${glowColor}` : "0 4px 32px rgba(41, 121, 255, 0.08)",
    },
    gold: {
      background: "rgba(255, 215, 0, 0.03)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: `1px solid ${borderColor || "rgba(255, 215, 0, 0.15)"}`,
      boxShadow: "0 4px 32px rgba(255, 215, 0, 0.06)",
    },
    gradient: {
      background: "linear-gradient(145deg, rgba(41, 121, 255, 0.05), rgba(56, 189, 248, 0.05))",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: `1px solid ${borderColor || "rgba(255, 255, 255, 0.06)"}`,
      boxShadow: "0 4px 24px rgba(0, 0, 0, 0.2)",
    },
  };

  const paddingStyles = {
    none: { padding: 0 },
    sm: { padding: "12px" },
    md: { padding: "24px" },
    lg: { padding: "32px" },
    xl: { padding: "40px" },
  };

  const baseStyles: React.CSSProperties = {
    borderRadius: "16px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    overflow: "hidden",
    cursor: onClick ? "pointer" : "default",
    ...variantStyles[variant],
    ...paddingStyles[padding],
  };

  const hoverStyles: React.CSSProperties = hoverable
    ? {
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }
    : {};

  // Get the border color for hover state
  const getHoverBorderColor = () => {
    if (borderColor) return borderColor;
    if (variant === "gold") return "rgba(255, 215, 0, 0.3)";
    if (variant === "glow") return "rgba(41, 121, 255, 0.3)";
    return "rgba(41, 121, 255, 0.2)";
  };

  // Get the hover box shadow
  const getHoverShadow = () => {
    if (glowColor) return glowColor;
    if (variant === "gold") return "0 12px 48px rgba(255, 215, 0, 0.08)";
    if (variant === "glow") return "0 12px 48px rgba(41, 121, 255, 0.15)";
    return "0 12px 48px rgba(0, 0, 0, 0.4)";
  };

  return (
    <div
      className={className}
      style={{
        ...baseStyles,
        ...hoverStyles,
        ...style,
        position: "relative",
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (hoverable) {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.borderColor = getHoverBorderColor();
          e.currentTarget.style.boxShadow = getHoverShadow();

          // Add glow effect for glass variant
          if (variant === "glass") {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
          }
        }
      }}
      onMouseLeave={(e) => {
        if (hoverable) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.borderColor =
            variantStyles[variant].border || "rgba(255, 255, 255, 0.06)";
          e.currentTarget.style.boxShadow =
            variantStyles[variant].boxShadow || "0 4px 24px rgba(0, 0, 0, 0.2)";

          if (variant === "glass") {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
          }
        }
      }}
    >
      {/* Decorative corner accent for gold variant */}
      {variant === "gold" && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "80px",
            height: "80px",
            background: "linear-gradient(135deg, transparent 50%, rgba(255, 215, 0, 0.03) 100%)",
            pointerEvents: "none",
            borderRadius: "0 16px 0 0",
          }}
        />
      )}

      {/* Decorative glow dot for glow variant */}
      {variant === "glow" && (
        <div
          style={{
            position: "absolute",
            top: "-20px",
            right: "-20px",
            width: "120px",
            height: "120px",
            background: `radial-gradient(circle, ${glowColor || "rgba(41, 121, 255, 0.05)"}, transparent 70%)`,
            pointerEvents: "none",
            borderRadius: "50%",
          }}
        />
      )}

      {/* Gradient border accent for gradient variant */}
      {variant === "gradient" && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: "linear-gradient(90deg, #2979FF, #38BDF8, #2979FF)",
            backgroundSize: "200% 100%",
            animation: "gradientMove 3s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />
      )}

      {children}

      <style>{`
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
};

export default Card;
