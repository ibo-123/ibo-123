// frontend/src/components/common/Badge.tsx
import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  tone?: "blue" | "gold" | "green" | "red" | "muted" | "purple" | "pink" | "orange";
  className?: string;
  style?: React.CSSProperties;
  glowing?: boolean;
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

const toneMap = {
  blue: {
    bg: "rgba(41, 121, 255, 0.12)",
    text: "#64B5F6",
    border: "rgba(41, 121, 255, 0.2)",
    glow: "0 0 20px rgba(41, 121, 255, 0.15)",
  },
  gold: {
    bg: "rgba(255, 215, 0, 0.12)",
    text: "#FFD700",
    border: "rgba(255, 215, 0, 0.2)",
    glow: "0 0 20px rgba(255, 215, 0, 0.15)",
  },
  green: {
    bg: "rgba(34, 197, 94, 0.12)",
    text: "#22C55E",
    border: "rgba(34, 197, 94, 0.2)",
    glow: "0 0 20px rgba(34, 197, 94, 0.15)",
  },
  red: {
    bg: "rgba(239, 68, 68, 0.12)",
    text: "#EF4444",
    border: "rgba(239, 68, 68, 0.2)",
    glow: "0 0 20px rgba(239, 68, 68, 0.15)",
  },
  muted: {
    bg: "rgba(255, 255, 255, 0.05)",
    text: "#9EAFCE",
    border: "rgba(255, 255, 255, 0.08)",
    glow: "none",
  },
  purple: {
    bg: "rgba(56, 189, 248, 0.12)",
    text: "#7DD3FC",
    border: "rgba(56, 189, 248, 0.2)",
    glow: "0 0 20px rgba(56, 189, 248, 0.15)",
  },
  pink: {
    bg: "rgba(245, 158, 11, 0.12)",
    text: "#F59E0B",
    border: "rgba(245, 158, 11, 0.2)",
    glow: "0 0 20px rgba(245, 158, 11, 0.15)",
  },
  orange: {
    bg: "rgba(245, 158, 11, 0.12)",
    text: "#F59E0B",
    border: "rgba(245, 158, 11, 0.2)",
    glow: "0 0 20px rgba(245, 158, 11, 0.15)",
  },
} as const;

const sizeMap = {
  sm: { padding: "2px 10px", fontSize: "10px", borderRadius: "12px", gap: "4px" },
  md: { padding: "4px 14px", fontSize: "12px", borderRadius: "100px", gap: "6px" },
  lg: { padding: "6px 18px", fontSize: "14px", borderRadius: "100px", gap: "8px" },
} as const;

export const Badge: React.FC<BadgeProps> = ({
  children,
  tone = "blue",
  className = "",
  style,
  glowing = false,
  size = "md",
  icon,
}) => {
  const t = toneMap[tone] ?? toneMap.blue;
  const s = sizeMap[size];

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: t.bg,
        color: t.text,
        border: `1px solid ${t.border}`,
        boxShadow: glowing ? t.glow : "none",
        fontWeight: 600,
        letterSpacing: "0.2px",
        whiteSpace: "nowrap",
        lineHeight: 1.2,
        transition: "background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
        padding: s.padding,
        fontSize: s.fontSize,
        borderRadius: s.borderRadius,
        gap: s.gap,
        ...style,
      }}
    >
      {icon && (
        <span aria-hidden="true" style={{ display: "inline-flex", alignItems: "center" }}>
          {icon}
        </span>
      )}
      {children}
    </span>
  );
};

export default Badge;
