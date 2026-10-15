import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

/**
 * variant: "icon" | "switch" | "pill"
 */
function ThemeToggle({ variant = "icon", className = "" }) {
  const { theme, toggleTheme, isDark } = useTheme();

  // ── Icon button ──────────────────────────────────────────────────────
  if (variant === "icon") {
    return (
      <button
        onClick={toggleTheme}
        aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
        title={`Switch to ${isDark ? "light" : "dark"} mode`}
        className={`
          relative p-2.5 rounded-xl
          bg-white/5 hover:bg-white/10
          border border-white/10 hover:border-white/20
          text-slate-300 hover:text-white
          transition-all duration-300
          light:bg-slate-100 light:hover:bg-slate-200
          light:border-slate-200 light:hover:border-slate-300
          light:text-slate-600 light:hover:text-slate-900
          group
          ${className}
        `}
      >
        <div className="relative w-5 h-5">
          <Sun
            className={`
              absolute inset-0 w-5 h-5 transition-all duration-500
              ${
                isDark
                  ? "rotate-0 scale-100 opacity-100"
                  : "rotate-90 scale-0 opacity-0"
              }
            `}
          />
          <Moon
            className={`
              absolute inset-0 w-5 h-5 transition-all duration-500
              ${
                isDark
                  ? "-rotate-90 scale-0 opacity-0"
                  : "rotate-0 scale-100 opacity-100"
              }
            `}
          />
        </div>
      </button>
    );
  }

  // ── iOS-style switch ─────────────────────────────────────────────────
  if (variant === "switch") {
    return (
      <button
        onClick={toggleTheme}
        role="switch"
        aria-checked={isDark}
        aria-label="Toggle theme"
        className={`
          relative inline-flex items-center h-7 w-12 rounded-full
          transition-colors duration-300
          ${
            isDark
              ? "bg-indigo-600/80 hover:bg-indigo-600"
              : "bg-amber-400/80 hover:bg-amber-400"
          }
          ${className}
        `}
      >
        <span
          className={`
            absolute top-0.5 left-0.5 w-6 h-6 rounded-full
            bg-white shadow-lg
            flex items-center justify-center
            transform transition-transform duration-300 ease-out
            ${isDark ? "translate-x-5" : "translate-x-0"}
          `}
        >
          {isDark ? (
            <Moon className="w-3.5 h-3.5 text-indigo-600" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          )}
        </span>
      </button>
    );
  }

  // ── Pill toggle ──────────────────────────────────────────────────────
  if (variant === "pill") {
    return (
      <div
        className={`
          inline-flex items-center gap-1 p-1 rounded-full
          bg-white/5 border border-white/10
          light:bg-slate-100 light:border-slate-200
          ${className}
        `}
      >
        <button
          onClick={() => useTheme().setLight?.()}
          className={`
            px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5
            transition-all duration-200
            ${
              !isDark
                ? "bg-amber-400 text-amber-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }
          `}
        >
          <Sun className="w-3.5 h-3.5" />
          Light
        </button>
        <button
          className={`
            px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5
            transition-all duration-200
            ${
              isDark
                ? "bg-indigo-500 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }
          `}
        >
          <Moon className="w-3.5 h-3.5" />
          Dark
        </button>
      </div>
    );
  }

  return null;
}

export default ThemeToggle;