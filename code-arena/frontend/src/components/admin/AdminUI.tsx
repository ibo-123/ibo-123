import React from "react";
import {
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info,
  X,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { tokens } from "../../styles/designTokens";

/* ================================================================== */
/* Page Header                                                         */
/* ================================================================== */

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ eyebrow, title, subtitle, actions }) => (
  <header
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: tokens.spacing.xl,
      flexWrap: "wrap",
      gap: tokens.spacing.md,
    }}
  >
    <div>
      <small
        style={{
          fontSize: "11px",
          color: tokens.colors.text.muted,
          textTransform: "uppercase",
          letterSpacing: "2px",
          fontWeight: 600,
        }}
      >
        {eyebrow}
      </small>
      <h1
        style={{
          fontSize: "clamp(24px, 2.5vw, 36px)",
          fontWeight: 700,
          margin: "4px 0 0 0",
          letterSpacing: "-0.5px",
        }}
      >
        {title}
      </h1>
      {subtitle && (
        <p
          style={{
            fontSize: "14px",
            color: tokens.colors.text.muted,
            marginTop: "4px",
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
    {actions && (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        {actions}
      </div>
    )}
  </header>
);

/* ================================================================== */
/* Button                                                              */
/* ================================================================== */

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success" | "gold";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "secondary",
  size = "md",
  icon,
  iconPosition = "left",
  loading,
  fullWidth,
  children,
  style,
  disabled,
  ...props
}) => {
  const [focused, setFocused] = React.useState(false);

  const sizeStyles: Record<NonNullable<ButtonProps["size"]>, React.CSSProperties> = {
    sm: { padding: "6px 12px", fontSize: "12px", gap: "5px" },
    md: { padding: "8px 16px", fontSize: "13px", gap: "6px" },
    lg: { padding: "12px 24px", fontSize: "14px", gap: "8px" },
  };

  const variantStyles: Record<NonNullable<ButtonProps["variant"]>, React.CSSProperties> = {
    primary: {
      background: tokens.gradients.brand,
      border: "none",
      color: "white",
    },
    secondary: {
      background: tokens.colors.bg.card,
      border: `1px solid ${tokens.colors.border.medium}`,
      color: tokens.colors.text.secondary,
    },
    ghost: {
      background: "transparent",
      border: "none",
      color: tokens.colors.text.secondary,
    },
    danger: {
      background: "rgba(244,67,54,0.1)",
      border: "1px solid rgba(244,67,54,0.2)",
      color: tokens.colors.accent.red,
    },
    success: {
      background: "rgba(76,175,80,0.15)",
      border: "1px solid rgba(76,175,80,0.3)",
      color: tokens.colors.accent.green,
    },
    gold: {
      background: tokens.gradients.gold,
      border: "none",
      color: "#0a0e17",
    },
  };

  const isDisabled = disabled || loading;

  const content = loading ? (
    <>
      <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} />
      Loading...
    </>
  ) : (
    <>
      {iconPosition === "left" && icon}
      {children}
      {iconPosition === "right" && icon}
    </>
  );

  return (
    <button
      {...props}
      disabled={isDisabled}
      onFocus={(e) => {
        setFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        props.onBlur?.(e);
      }}
      style={{
        ...sizeStyles[size],
        ...variantStyles[variant],
        borderRadius: tokens.radius.md,
        fontWeight: 600,
        cursor: isDisabled ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s ease",
        opacity: isDisabled ? 0.5 : 1,
        whiteSpace: "nowrap",
        width: fullWidth ? "100%" : undefined,
        outline: "none",
        boxShadow: focused ? "0 0 0 3px rgba(41,121,255,0.25)" : "none",
        ...style,
      }}
    >
      {content}
    </button>
  );
};

/* ================================================================== */
/* Alert                                                               */
/* ================================================================== */

interface AlertProps {
  type: "error" | "success" | "info" | "warning";
  message: string;
  onDismiss?: () => void;
}

export const Alert: React.FC<AlertProps> = ({ type, message, onDismiss }) => {
  const config = {
    error: {
      color: tokens.colors.accent.red,
      bg: "rgba(244,67,54,0.1)",
      Icon: AlertCircle,
    },
    success: {
      color: tokens.colors.accent.green,
      bg: "rgba(76,175,80,0.1)",
      Icon: CheckCircle,
    },
    info: {
      color: tokens.colors.accent.blueLight,
      bg: "rgba(41,121,255,0.1)",
      Icon: Info,
    },
    warning: {
      color: tokens.colors.accent.orange,
      bg: "rgba(255,152,0,0.1)",
      Icon: AlertCircle,
    },
  }[type];

  return (
    <div
      role="alert"
      style={{
        padding: "12px 16px",
        borderRadius: tokens.radius.md,
        background: config.bg,
        border: `1px solid ${config.color}33`,
        color: config.color,
        fontSize: "13px",
        marginBottom: tokens.spacing.md,
        display: "flex",
        alignItems: "center",
        gap: "10px",
        animation: "alertIn 0.25s ease",
      }}
    >
      <config.Icon size={18} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, lineHeight: 1.5 }}>{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          style={{
            background: "transparent",
            border: "none",
            color: config.color,
            cursor: "pointer",
            padding: "2px",
            opacity: 0.7,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "opacity 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

/* ================================================================== */
/* Admin Card                                                          */
/* ================================================================== */

interface AdminCardProps {
  children: React.ReactNode;
  padding?: string;
  onClick?: () => void;
  hoverable?: boolean;
  interactive?: boolean;
  variant?: "default" | "gold" | "blue" | "danger";
  style?: React.CSSProperties;
  as?: "div" | "section" | "article" | "aside";
}

export const AdminCard: React.FC<AdminCardProps> = ({
  children,
  padding = "20px",
  onClick,
  hoverable,
  interactive,
  variant = "default",
  style,
  as: Tag = "div",
}) => {
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  const variantStyles: Record<NonNullable<AdminCardProps["variant"]>, React.CSSProperties> = {
    default: {
      background: tokens.colors.bg.card,
      border: `1px solid ${tokens.colors.border.subtle}`,
    },
    gold: {
      background: "rgba(255,215,0,0.03)",
      border: "1px solid rgba(255,215,0,0.1)",
    },
    blue: {
      background: "rgba(41,121,255,0.03)",
      border: "1px solid rgba(41,121,255,0.08)",
    },
    danger: {
      background: "rgba(244,67,54,0.03)",
      border: "1px solid rgba(244,67,54,0.1)",
    },
  };

  const isClickable = Boolean(onClick);
  const lifted = hoverable && hovered;

  return (
    <Tag
      onClick={onClick}
      onMouseEnter={() => hoverable && setHovered(true)}
      onMouseLeave={() => hoverable && setHovered(false)}
      onFocus={() => interactive && setFocused(true)}
      onBlur={() => interactive && setFocused(false)}
      tabIndex={isClickable || interactive ? 0 : undefined}
      role={isClickable ? "button" : undefined}
      onKeyDown={
        isClickable
          ? (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      style={{
        ...variantStyles[variant],
        borderRadius: tokens.radius.lg,
        padding,
        transition: "all 0.2s ease",
        cursor: isClickable ? "pointer" : undefined,
        outline: "none",
        boxShadow: focused ? "0 0 0 3px rgba(41,121,255,0.25)" : undefined,
        ...(lifted
          ? {
              background: tokens.colors.bg.cardHover,
              borderColor: tokens.colors.border.focus,
              transform: "translateY(-2px)",
              boxShadow: tokens.shadows.cardHover,
            }
          : {}),
        ...style,
      }}
    >
      {children}
    </Tag>
  );
};

/* ================================================================== */
/* Collapsible Section                                                 */
/* ================================================================== */

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  variant?: "default" | "gold" | "purple" | "blue";
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  badge,
  expanded,
  onToggle,
  children,
  variant = "default",
}) => {
  const variantStyles: Record<
    NonNullable<CollapsibleSectionProps["variant"]>,
    React.CSSProperties
  > = {
    default: {
      background: tokens.colors.bg.card,
      border: `1px solid ${tokens.colors.border.subtle}`,
    },
    gold: {
      background: "rgba(255,215,0,0.03)",
      border: "1px solid rgba(255,215,0,0.1)",
    },
    purple: {
      background: "rgba(56,189,248,0.03)",
      border: "1px solid rgba(56,189,248,0.1)",
    },
    blue: {
      background: "rgba(41,121,255,0.03)",
      border: "1px solid rgba(41,121,255,0.08)",
    },
  };

  return (
    <div
      style={{
        ...variantStyles[variant],
        borderRadius: tokens.radius.lg,
        padding: "20px",
        marginBottom: tokens.spacing.lg,
      }}
    >
      <button
        onClick={onToggle}
        aria-expanded={expanded}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          padding: "4px 0",
          background: "transparent",
          border: "none",
          color: "inherit",
          fontFamily: "inherit",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {icon}
          <h3 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>{title}</h3>
          {badge}
        </div>
        <span
          style={{
            color: tokens.colors.text.muted,
            display: "flex",
            transition: "transform 0.25s ease",
            transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
          }}
        >
          <ChevronDown size={18} />
        </span>
      </button>
      {expanded && <div style={{ marginTop: tokens.spacing.md }}>{children}</div>}
    </div>
  );
};

/* ================================================================== */
/* Empty State                                                         */
/* ================================================================== */

interface AdminEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
}

export const AdminEmptyState: React.FC<AdminEmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
}) => (
  <AdminCard padding="60px 24px" style={{ textAlign: "center", borderStyle: "dashed" }}>
    <div
      style={{
        width: "72px",
        height: "72px",
        borderRadius: "50%",
        background: "rgba(41,121,255,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 20px",
      }}
    >
      {icon}
    </div>
    <h3
      style={{
        margin: "0 0 8px 0",
        color: tokens.colors.text.primary,
        fontSize: "18px",
      }}
    >
      {title}
    </h3>
    <p
      style={{
        color: tokens.colors.text.muted,
        marginBottom: action || secondaryAction ? "20px" : 0,
        fontSize: "14px",
        maxWidth: "440px",
        marginLeft: "auto",
        marginRight: "auto",
        lineHeight: 1.6,
      }}
    >
      {description}
    </p>
    {(action || secondaryAction) && (
      <div
        style={{
          display: "flex",
          gap: "10px",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {action}
        {secondaryAction}
      </div>
    )}
  </AdminCard>
);

/* ================================================================== */
/* Stat Card                                                           */
/* ================================================================== */

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  bgColor: string;
  subtitle?: string;
  trend?: {
    direction: "up" | "down" | "flat";
    value: string;
  };
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  bgColor,
  subtitle,
  trend,
  onClick,
}) => {
  const trendConfig = trend
    ? {
        up: { color: tokens.colors.accent.green, Icon: TrendingUp },
        down: { color: tokens.colors.accent.red, Icon: TrendingDown },
        flat: { color: tokens.colors.text.muted, Icon: Minus },
      }[trend.direction]
    : null;

  return (
    <AdminCard
      padding="18px 22px"
      hoverable={!onClick}
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: "14px" }}
    >
      <div
        style={{
          width: "50px",
          height: "50px",
          borderRadius: tokens.radius.lg,
          background: bgColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: "11px",
            color: tokens.colors.text.muted,
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            fontWeight: 600,
          }}
        >
          {label}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              fontSize: "22px",
              fontWeight: 800,
              color: tokens.colors.text.primary,
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {value}
          </div>
          {trendConfig && trend && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
                fontSize: "11px",
                fontWeight: 700,
                color: trendConfig.color,
              }}
            >
              <trendConfig.Icon size={12} />
              {trend.value}
            </span>
          )}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: "11px",
              color: tokens.colors.text.muted,
              marginTop: "2px",
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </AdminCard>
  );
};

/* ================================================================== */
/* Toast                                                               */
/* ================================================================== */

type ToastTone = "success" | "error" | "info" | "warning";

interface ToastProps {
  tone: ToastTone;
  message: string;
  onClose?: () => void;
  duration?: number;
  visible?: boolean;
}

export const Toast: React.FC<ToastProps> = ({
  tone,
  message,
  onClose,
  duration = 3500,
  visible = true,
}) => {
  const [shown, setShown] = React.useState(visible);

  React.useEffect(() => {
    setShown(visible);
    if (!visible || !onClose) return;
    const id = window.setTimeout(() => {
      setShown(false);
      onClose();
    }, duration);
    return () => window.clearTimeout(id);
  }, [visible, duration, onClose]);

  if (!shown) return null;

  const config = {
    success: {
      color: tokens.colors.accent.green,
      bg: "rgba(76,175,80,0.15)",
      Icon: CheckCircle,
    },
    error: {
      color: tokens.colors.accent.red,
      bg: "rgba(244,67,54,0.15)",
      Icon: AlertCircle,
    },
    info: {
      color: tokens.colors.accent.blueLight,
      bg: "rgba(41,121,255,0.15)",
      Icon: Info,
    },
    warning: {
      color: tokens.colors.accent.orange,
      bg: "rgba(255,152,0,0.15)",
      Icon: AlertCircle,
    },
  }[tone];

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "14px 18px",
        borderRadius: tokens.radius.md,
        background: "#0F1420",
        border: `1px solid ${config.color}40`,
        color: tokens.colors.text.primary,
        fontSize: "13px",
        fontWeight: 600,
        boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
        animation: "toastIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        maxWidth: "380px",
      }}
    >
      <span style={{ color: config.color, display: "flex" }}>
        <config.Icon size={18} />
      </span>
      <span style={{ flex: 1, lineHeight: 1.5 }}>{message}</span>
      {onClose && (
        <button
          onClick={() => {
            setShown(false);
            onClose();
          }}
          aria-label="Close"
          style={{
            background: "transparent",
            border: "none",
            color: tokens.colors.text.muted,
            cursor: "pointer",
            padding: 0,
            display: "flex",
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

/* ================================================================== */
/* Tabs                                                                */
/* ================================================================== */

interface TabItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number | string;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (key: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ items, value, onChange }) => (
  <div
    role="tablist"
    style={{
      display: "flex",
      gap: "4px",
      padding: "4px",
      borderRadius: tokens.radius.md,
      background: tokens.colors.bg.card,
      border: `1px solid ${tokens.colors.border.subtle}`,
      marginBottom: tokens.spacing.lg,
      overflowX: "auto",
    }}
  >
    {items.map((item) => {
      const active = item.key === value;
      return (
        <button
          key={item.key}
          role="tab"
          aria-selected={active}
          onClick={() => onChange(item.key)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 14px",
            borderRadius: tokens.radius.sm,
            background: active ? tokens.gradients.brand : "transparent",
            border: "none",
            color: active ? "white" : tokens.colors.text.muted,
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            whiteSpace: "nowrap",
            transition: "all 0.2s ease",
          }}
        >
          {item.icon}
          {item.label}
          {item.badge !== undefined && (
            <span
              style={{
                padding: "1px 7px",
                borderRadius: "999px",
                background: active ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.05)",
                fontSize: "10px",
                fontWeight: 700,
              }}
            >
              {item.badge}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

/* ================================================================== */
/* Badge                                                               */
/* ================================================================== */

type BadgeTone = "default" | "success" | "error" | "warning" | "info" | "gold" | "purple";

interface BadgeProps {
  children: React.ReactNode;
  tone?: BadgeTone;
  size?: "sm" | "md";
  icon?: React.ReactNode;
}

const badgeTones: Record<BadgeTone, { color: string; bg: string; border: string }> = {
  default: {
    color: tokens.colors.text.muted,
    bg: "rgba(255,255,255,0.05)",
    border: "rgba(255,255,255,0.1)",
  },
  success: {
    color: tokens.colors.accent.green,
    bg: "rgba(76,175,80,0.12)",
    border: "rgba(76,175,80,0.28)",
  },
  error: {
    color: tokens.colors.accent.red,
    bg: "rgba(244,67,54,0.12)",
    border: "rgba(244,67,54,0.28)",
  },
  warning: {
    color: tokens.colors.accent.orange,
    bg: "rgba(255,152,0,0.12)",
    border: "rgba(255,152,0,0.28)",
  },
  info: {
    color: tokens.colors.accent.blueLight,
    bg: "rgba(41,121,255,0.12)",
    border: "rgba(41,121,255,0.28)",
  },
  gold: {
    color: tokens.colors.accent.gold,
    bg: "rgba(255,215,0,0.12)",
    border: "rgba(255,215,0,0.28)",
  },
  purple: {
    color: tokens.colors.accent.purple,
    bg: "rgba(56,189,248,0.12)",
    border: "rgba(56,189,248,0.28)",
  },
};

export const Badge: React.FC<BadgeProps> = ({ children, tone = "default", size = "sm", icon }) => {
  const t = badgeTones[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: size === "sm" ? "3px 9px" : "5px 12px",
        borderRadius: "999px",
        background: t.bg,
        border: `1px solid ${t.border}`,
        color: t.color,
        fontSize: size === "sm" ? "10px" : "12px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        whiteSpace: "nowrap",
      }}
    >
      {icon}
      {children}
    </span>
  );
};

/* ================================================================== */
/* Modal                                                               */
/* ================================================================== */

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  eyebrow?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
  maxWidth = "560px",
}) => {
  React.useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "24px",
        animation: "modalIn 0.2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth,
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#0F1420",
          borderRadius: "18px",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
        }}
      >
        {(title || eyebrow) && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "20px 24px",
              borderBottom: `1px solid ${tokens.colors.border.subtle}`,
              position: "sticky",
              top: 0,
              background: "#0F1420",
              zIndex: 1,
            }}
          >
            <div>
              {eyebrow && (
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                    color: "rgba(100, 181, 246, 0.85)",
                    marginBottom: "2px",
                  }}
                >
                  {eyebrow}
                </div>
              )}
              {title && <h2 style={{ margin: 0, fontSize: "18px", color: "white" }}>{title}</h2>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${tokens.colors.border.subtle}`,
                borderRadius: "8px",
                color: tokens.colors.text.muted,
                cursor: "pointer",
                padding: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div style={{ padding: "20px 24px" }}>{children}</div>
        {footer && (
          <div
            style={{
              padding: "16px 24px",
              borderTop: `1px solid ${tokens.colors.border.subtle}`,
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

/* ================================================================== */
/* Tooltip                                                             */
/* ================================================================== */

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [shown, setShown] = React.useState(false);

  return (
    <span
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setShown(true)}
      onMouseLeave={() => setShown(false)}
      onFocus={() => setShown(true)}
      onBlur={() => setShown(false)}
    >
      {children}
      {shown && (
        <span
          role="tooltip"
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "6px 10px",
            borderRadius: tokens.radius.sm,
            background: "#0F1420",
            border: `1px solid ${tokens.colors.border.subtle}`,
            color: tokens.colors.text.primary,
            fontSize: "11px",
            fontWeight: 600,
            whiteSpace: "nowrap",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            pointerEvents: "none",
            zIndex: 100,
            animation: "tooltipIn 0.15s ease",
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
};

/* ================================================================== */
/* Progress Bar                                                        */
/* ================================================================== */

interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: "brand" | "success" | "warning" | "error" | "gold";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  variant = "brand",
  size = "md",
  showLabel,
}) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  const fill: Record<NonNullable<ProgressBarProps["variant"]>, string> = {
    brand: tokens.gradients.brand,
    success: "linear-gradient(90deg, #22C55E, #2E7D32)",
    warning: "linear-gradient(90deg, #F59E0B, #F57C00)",
    error: "linear-gradient(90deg, #EF5350, #C62828)",
    gold: tokens.gradients.gold,
  };

  const height = size === "sm" ? "4px" : size === "md" ? "8px" : "12px";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div
        style={{
          flex: 1,
          height,
          borderRadius: "999px",
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: fill[variant],
            borderRadius: "999px",
            transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 0 12px rgba(41,121,255,0.3)",
          }}
        />
      </div>
      {showLabel && (
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: tokens.colors.text.muted,
            minWidth: "36px",
            textAlign: "right",
          }}
        >
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
};

/* ================================================================== */
/* Skeleton                                                            */
/* ================================================================== */

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = "100%",
  height = "16px",
  radius = tokens.radius.sm,
}) => (
  <div
    style={{
      width,
      height,
      borderRadius: radius,
      background:
        "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)",
      backgroundSize: "200% 100%",
      animation: "skeleton 1.4s ease infinite",
    }}
  />
);

/* ================================================================== */
/* Section Title                                                       */
/* ================================================================== */

interface SectionTitleProps {
  icon?: React.ReactNode;
  children: React.ReactNode;
  badge?: React.ReactNode;
  action?: React.ReactNode;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ icon, children, badge, action }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
      marginBottom: tokens.spacing.md,
      flexWrap: "wrap",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      {icon}
      <h3
        style={{
          margin: 0,
          fontSize: "14px",
          fontWeight: 700,
          color: tokens.colors.text.primary,
          letterSpacing: "0.3px",
        }}
      >
        {children}
      </h3>
      {badge}
    </div>
    {action}
  </div>
);

/* ================================================================== */
/* Kbd                                                                 */
/* ================================================================== */

export const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd
    style={{
      padding: "3px 8px",
      borderRadius: "6px",
      background: tokens.colors.bg.input,
      border: `1px solid ${tokens.colors.border.medium}`,
      fontSize: "11px",
      fontWeight: 700,
      color: tokens.colors.text.primary,
      fontFamily: "inherit",
    }}
  >
    {children}
  </kbd>
);

/* ================================================================== */
/* Empty State Icon                                                    */
/* ================================================================== */

interface EmptyStateIconProps {
  children: React.ReactNode;
  tone?: "brand" | "gold" | "green" | "purple";
}

export const EmptyStateIcon: React.FC<EmptyStateIconProps> = ({ children, tone = "brand" }) => {
  const colors = {
    brand: { fg: tokens.colors.accent.blueLight, bg: "rgba(41,121,255,0.08)" },
    gold: { fg: tokens.colors.accent.gold, bg: "rgba(255,215,0,0.08)" },
    green: { fg: tokens.colors.accent.green, bg: "rgba(76,175,80,0.08)" },
    purple: { fg: tokens.colors.accent.purple, bg: "rgba(56,189,248,0.08)" },
  }[tone];

  return (
    <div
      style={{
        width: "72px",
        height: "72px",
        borderRadius: "50%",
        background: colors.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: colors.fg,
      }}
    >
      {children}
    </div>
  );
};

/* ================================================================== */
/* Shared Styles                                                       */
/* ================================================================== */

export const globalStyles = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes alertIn {
    from { opacity: 0; transform: translateY(-6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes toastIn {
    from { opacity: 0; transform: translateY(20px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes modalIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes tooltipIn {
    from { opacity: 0; transform: translateX(-50%) translateY(4px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  @keyframes skeleton {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  input:focus, select:focus, textarea:focus {
    border-color: ${tokens.colors.border.focus} !important;
    box-shadow: 0 0 0 3px rgba(41,121,255,0.15) !important;
    outline: none !important;
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: tokens.radius.md,
  background: tokens.colors.bg.input,
  border: `1px solid ${tokens.colors.border.medium}`,
  color: tokens.colors.text.primary,
  fontSize: "14px",
  outline: "none",
  transition: "all 0.2s ease",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

export const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: tokens.colors.text.secondary,
  marginBottom: "6px",
  letterSpacing: "0.3px",
};
