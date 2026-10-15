// frontend/src/components/common/LoadingState.tsx
import React from "react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type Variant =
  | "skeleton"
  | "spinner"
  | "dots"
  | "pulse"
  | "card"
  | "table"
  | "list"
  | "progress"
  | "bars";

type LabelPosition = "bottom" | "right" | "hidden";

interface LoadingStateProps {
  label?: string;
  size?: "sm" | "md" | "lg";
  variant?: Variant;
  fullScreen?: boolean;
  labelPosition?: LabelPosition;
  /** Remove min-height so it fits inside a card or row. */
  inline?: boolean;
  /** Progress variant only: current value. */
  value?: number;
  /** Progress variant only: max value (default 100). */
  max?: number;
  className?: string;
  style?: React.CSSProperties;
}

/* ------------------------------------------------------------------ */
/* Size + color maps                                                   */
/* ------------------------------------------------------------------ */

const sizeMap = {
  sm: {
    container: 36,
    dot: 8,
    stroke: 2,
    font: 12,
    avatar: 32,
    gap: 12,
    barH: 10,
  },
  md: {
    container: 56,
    dot: 12,
    stroke: 3,
    font: 14,
    avatar: 48,
    gap: 16,
    barH: 14,
  },
  lg: {
    container: 80,
    dot: 16,
    stroke: 4,
    font: 16,
    avatar: 64,
    gap: 20,
    barH: 18,
  },
} as const;

const Colors = {
  blue: "#2979FF",
  blueLight: "#64B5F6",
  purple: "#38BDF8", // secondary tech (steel cyan)
  green: "#22C55E",
  textMuted: "rgba(255,255,255,0.55)",
  textFaint: "rgba(255,255,255,0.4)",
} as const;

/* ------------------------------------------------------------------ */
/* Shared keyframes                                                    */
/* ------------------------------------------------------------------ */

const Keyframes: React.FC = () => (
  <style>{`
    @keyframes lsSpin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes lsDotBounce {
      0%, 80%, 100% { transform: scale(0.6) translateY(0); opacity: 0.3; }
      40% { transform: scale(1) translateY(-8px); opacity: 1; }
    }
    @keyframes lsPulseRing {
      0% { transform: scale(0.5); opacity: 1; }
      100% { transform: scale(1.6); opacity: 0; }
    }
    @keyframes lsCorePulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(0.85); opacity: 0.7; }
    }
    @keyframes lsShimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    @keyframes lsBarWave {
      0%, 100% { transform: scaleY(0.4); }
      50% { transform: scaleY(1); }
    }
    @keyframes lsIndeterminate {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(400%); }
    }
    .ls-sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
    @media (prefers-reduced-motion: reduce) {
      [data-ls-animated="true"] { animation: none !important; }
      .ls-shimmer { animation: none !important; }
    }
  `}</style>
);

/* ------------------------------------------------------------------ */
/* Skeleton primitive                                                  */
/* ------------------------------------------------------------------ */

interface ShimmerProps {
  height: number | string;
  width?: number | string;
  radius?: number | string;
  delay?: number;
  tone?: "default" | "avatar";
}

const Shimmer: React.FC<ShimmerProps> = ({
  height,
  width = "100%",
  radius = 8,
  delay = 0,
  tone = "default",
}) => {
  const background =
    tone === "avatar"
      ? `linear-gradient(135deg, ${Colors.blue}1a, ${Colors.purple}1a)`
      : `rgba(255,255,255,0.06)`;

  return (
    <div
      style={{
        position: "relative",
        height,
        width,
        borderRadius: radius,
        background,
        overflow: "hidden",
      }}
    >
      <div
        className="ls-shimmer"
        data-ls-animated="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
          backgroundSize: "200% 100%",
          animation: `lsShimmer 1.8s ${delay}s infinite`,
        }}
      />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export const LoadingState: React.FC<LoadingStateProps> = ({
  label = "Loading...",
  size = "md",
  variant = "skeleton",
  fullScreen = false,
  labelPosition = "bottom",
  inline = false,
  value = 0,
  max = 100,
  className,
  style,
}) => {
  const s = sizeMap[size] ?? sizeMap.md;

  /* Lock body scroll when fullScreen */
  React.useEffect(() => {
    if (!fullScreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [fullScreen]);

  /* Wrapper that grows / centers everything */
  const outerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: labelPosition === "right" ? "row" : "column",
    alignItems: "center",
    justifyContent: "center",
    padding: fullScreen ? 0 : inline ? "12px" : "48px 24px",
    gap: labelPosition === "right" ? "16px" : "20px",
    minHeight: fullScreen ? "100vh" : inline ? "auto" : "160px",
    width: "100%",
    ...(fullScreen && {
      position: "fixed",
      inset: 0,
      background: "rgba(8, 10, 20, 0.95)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      zIndex: 9999,
    }),
    ...style,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: `${s.font}px`,
    color: Colors.textMuted,
    fontWeight: 600,
    letterSpacing: "0.4px",
  };

  /* Render label if requested */
  const renderLabel =
    labelPosition !== "hidden" && label ? (
      <div style={labelStyle} aria-live="polite">
        {label}
      </div>
    ) : null;

  /* Screen-reader-only fallback so AT knows something is happening */
  const srLabel = (
    <span className="ls-sr-only" role="status">
      {label || "Loading"}
    </span>
  );

  /* ================================================================ */
  /* Dots                                                             */
  /* ================================================================ */
  if (variant === "dots") {
    return (
      <div
        className={className}
        style={outerStyle}
        role="status"
        aria-busy="true"
        aria-live="polite"
      >
        {srLabel}
        <div style={{ display: "flex", gap: `${s.dot}px`, alignItems: "center" }}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              data-ls-animated="true"
              style={{
                width: `${s.dot}px`,
                height: `${s.dot}px`,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${Colors.blue}, ${Colors.blueLight})`,
                boxShadow: `0 0 16px ${Colors.blue}80`,
                animation: `lsDotBounce 1.4s ease-in-out ${i * 0.15}s infinite`,
              }}
            />
          ))}
        </div>
        {renderLabel}
        <Keyframes />
      </div>
    );
  }

  /* ================================================================ */
  /* Pulse                                                            */
  /* ================================================================ */
  if (variant === "pulse") {
    return (
      <div
        className={className}
        style={outerStyle}
        role="status"
        aria-busy="true"
        aria-live="polite"
      >
        {srLabel}
        <div
          style={{
            position: "relative",
            width: s.container,
            height: s.container,
          }}
        >
          <div
            data-ls-animated="true"
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: `${Colors.blue}26`,
              animation: "lsPulseRing 2s ease-out infinite",
            }}
          />
          <div
            data-ls-animated="true"
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: `${Colors.blue}1a`,
              animation: "lsPulseRing 2s ease-out 0.5s infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: "30%",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${Colors.blue}, ${Colors.blueLight})`,
              boxShadow: `0 0 32px ${Colors.blue}99`,
            }}
          />
        </div>
        {renderLabel}
        <Keyframes />
      </div>
    );
  }

  /* ================================================================ */
  /* Spinner                                                          */
  /* ================================================================ */
  if (variant === "spinner") {
    return (
      <div
        className={className}
        style={outerStyle}
        role="status"
        aria-busy="true"
        aria-live="polite"
      >
        {srLabel}
        <div
          style={{
            width: s.container,
            height: s.container,
            position: "relative",
          }}
        >
          <div
            data-ls-animated="true"
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: `${s.stroke}px solid ${Colors.blue}14`,
              borderTop: `${s.stroke}px solid ${Colors.blue}`,
              animation: "lsSpin 0.9s linear infinite",
              boxShadow: `0 0 24px ${Colors.blue}33`,
            }}
          />
          <div
            data-ls-animated="true"
            style={{
              position: "absolute",
              inset: `${s.container * 0.2}px`,
              borderRadius: "50%",
              border: `${s.stroke}px solid ${Colors.purple}14`,
              borderBottom: `${s.stroke}px solid ${Colors.purple}`,
              animation: "lsSpin 1.4s linear infinite reverse",
            }}
          />
          <div
            data-ls-animated="true"
            style={{
              position: "absolute",
              inset: `${s.container * 0.4}px`,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${Colors.blue}, ${Colors.blueLight})`,
              animation: "lsCorePulse 1.2s ease-in-out infinite",
            }}
          />
        </div>
        {renderLabel}
        <Keyframes />
      </div>
    );
  }

  /* ================================================================ */
  /* Bars                                                             */
  /* ================================================================ */
  if (variant === "bars") {
    const barWidth = Math.max(4, Math.round(s.container / 8));
    return (
      <div
        className={className}
        style={outerStyle}
        role="status"
        aria-busy="true"
        aria-live="polite"
      >
        {srLabel}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            height: s.container,
          }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              data-ls-animated="true"
              style={{
                width: barWidth,
                height: "100%",
                borderRadius: barWidth / 2,
                background: `linear-gradient(180deg, ${Colors.blueLight}, ${Colors.blue})`,
                transformOrigin: "center",
                animation: `lsBarWave 1.2s ease-in-out ${i * 0.12}s infinite`,
                boxShadow: `0 0 12px ${Colors.blue}55`,
              }}
            />
          ))}
        </div>
        {renderLabel}
        <Keyframes />
      </div>
    );
  }

  /* ================================================================ */
  /* Progress                                                         */
  /* ================================================================ */
  if (variant === "progress") {
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    const determinate = value > 0;

    return (
      <div
        className={className}
        style={{ ...outerStyle, gap: "12px" }}
        role="status"
        aria-busy="true"
        aria-live="polite"
      >
        {srLabel}
        <div style={{ width: "100%", maxWidth: "360px" }}>
          <div
            style={{
              height: "8px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.06)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {determinate ? (
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  borderRadius: "999px",
                  background: `linear-gradient(90deg, ${Colors.blue}, ${Colors.blueLight})`,
                  boxShadow: `0 0 16px ${Colors.blue}66`,
                  transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            ) : (
              <div
                data-ls-animated="true"
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  width: "25%",
                  borderRadius: "999px",
                  background: `linear-gradient(90deg, transparent, ${Colors.blueLight}, transparent)`,
                  animation: "lsIndeterminate 1.4s ease-in-out infinite",
                }}
              />
            )}
          </div>
          {determinate && (
            <div
              style={{
                marginTop: "8px",
                fontSize: "11px",
                color: Colors.textFaint,
                fontWeight: 700,
                textAlign: "right",
              }}
            >
              {Math.round(pct)}%
            </div>
          )}
        </div>
        {renderLabel}
        <Keyframes />
      </div>
    );
  }

  /* ================================================================ */
  /* Card                                                             */
  /* ================================================================ */
  if (variant === "card") {
    return (
      <div
        className={className}
        style={outerStyle}
        role="status"
        aria-busy="true"
        aria-live="polite"
      >
        {srLabel}
        <div
          style={{
            display: "flex",
            gap: `${s.gap}px`,
            padding: "20px 22px",
            background: "rgba(255,255,255,0.02)",
            borderRadius: "20px",
            border: "1px solid rgba(255,255,255,0.06)",
            width: "100%",
            maxWidth: "440px",
          }}
        >
          <Shimmer height={s.avatar} width={s.avatar} radius={14} tone="avatar" />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              flex: 1,
              justifyContent: "center",
            }}
          >
            <Shimmer height={s.barH} width="75%" />
            <Shimmer height={s.barH - 2} width="55%" delay={0.2} />
            <Shimmer height={s.barH - 4} width="35%" delay={0.4} />
          </div>
        </div>
        {renderLabel}
        <Keyframes />
      </div>
    );
  }

  /* ================================================================ */
  /* Table                                                            */
  /* ================================================================ */
  if (variant === "table") {
    return (
      <div
        className={className}
        style={outerStyle}
        role="status"
        aria-busy="true"
        aria-live="polite"
      >
        {srLabel}
        <div
          style={{
            width: "100%",
            maxWidth: "720px",
            background: "rgba(255,255,255,0.02)",
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.06)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <Shimmer height={s.barH - 4} width="30%" />
          </div>
          {/* Rows */}
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "14px 20px",
                borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.04)" : "none",
              }}
            >
              <Shimmer height={28} width={28} radius="50%" delay={i * 0.1} tone="avatar" />
              <Shimmer height={s.barH - 4} width="30%" delay={i * 0.1} />
              <Shimmer height={s.barH - 4} width="15%" delay={i * 0.15} />
              <Shimmer height={s.barH - 4} width="20%" delay={i * 0.2} />
            </div>
          ))}
        </div>
        {renderLabel}
        <Keyframes />
      </div>
    );
  }

  /* ================================================================ */
  /* List                                                             */
  /* ================================================================ */
  if (variant === "list") {
    return (
      <div
        className={className}
        style={outerStyle}
        role="status"
        aria-busy="true"
        aria-live="polite"
      >
        {srLabel}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            width: "100%",
            maxWidth: "560px",
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "14px 16px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <Shimmer
                height={s.avatar * 0.75}
                width={s.avatar * 0.75}
                radius={12}
                delay={i * 0.1}
                tone="avatar"
              />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  flex: 1,
                }}
              >
                <Shimmer height={s.barH - 4} width="50%" delay={i * 0.1} />
                <Shimmer height={s.barH - 6} width="35%" delay={i * 0.15} />
              </div>
            </div>
          ))}
        </div>
        {renderLabel}
        <Keyframes />
      </div>
    );
  }

  /* ================================================================ */
  /* Skeleton (default)                                               */
  /* ================================================================ */
  return (
    <div className={className} style={outerStyle} role="status" aria-busy="true" aria-live="polite">
      {srLabel}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: `${s.gap}px`,
          padding: "24px 28px",
          background: "rgba(255,255,255,0.02)",
          borderRadius: "20px",
          border: "1px solid rgba(255,255,255,0.06)",
          width: "100%",
          maxWidth: "440px",
          position: "relative",
          overflow: "hidden",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      >
        <Shimmer height={s.avatar} width={s.avatar} radius={16} tone="avatar" />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            flex: 1,
          }}
        >
          <Shimmer height={s.barH} width="75%" />
          <Shimmer height={s.barH - 2} width="55%" delay={0.2} />
          <Shimmer height={s.barH - 4} width="35%" delay={0.4} />
        </div>
        <div
          data-ls-animated="true"
          aria-hidden="true"
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${Colors.blue}, ${Colors.blueLight})`,
            boxShadow: `0 0 12px ${Colors.blue}80`,
            animation: "lsCorePulse 1.5s ease-in-out infinite",
            flexShrink: 0,
          }}
        />
      </div>
      {renderLabel}
      <Keyframes />
    </div>
  );
};

export default LoadingState;
