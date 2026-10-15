export const tokens = {
        colors: {
                bg: {
                        primary: "#0a0e17",
                        secondary: "#111827",
                        card: "rgba(255,255,255,0.03)",
                        cardHover: "rgba(255,255,255,0.06)",
                        input: "rgba(255,255,255,0.04)",
                },
                border: {
                        subtle: "rgba(255,255,255,0.06)",
                        medium: "rgba(255,255,255,0.08)",
                        focus: "rgba(41,121,255,0.3)",
                },
                text: {
                        primary: "#ffffff",
                        secondary: "rgba(255,255,255,0.7)",
                        muted: "rgba(255,255,255,0.4)",
                        faint: "rgba(255,255,255,0.2)",
                },
                accent: {
                        blue: "#2979FF",
                        blueLight: "#64B5F6",
                        gold: "#FFD700",
                        green: "#22C55E",
                        red: "#EF4444",
                        /** Secondary tech accent (steel cyan) — key kept for compatibility */
                        purple: "#38BDF8",
                        orange: "#F59E0B",
                },
        },
        radius: {
                sm: "8px",
                md: "10px",
                lg: "14px",
                xl: "18px",
                full: "9999px",
        },
        spacing: {
                xs: "4px",
                sm: "8px",
                md: "16px",
                lg: "24px",
                xl: "32px",
        },
        shadows: {
                card: "0 4px 20px rgba(0,0,0,0.3)",
                cardHover: "0 8px 32px rgba(41,121,255,0.15)",
                glow: "0 0 20px rgba(41,121,255,0.2)",
        },
        gradients: {
                brand: "linear-gradient(135deg, #2979FF, #1565C0)",
                gold: "linear-gradient(135deg, #FFD700, #EAB308)",
                green: "linear-gradient(135deg, #22C55E, #15803D)",
                /** Secondary tech gradient (steel cyan) — key kept for compatibility */
                purple: "linear-gradient(135deg, #38BDF8, #0284C7)",
                orange: "linear-gradient(135deg, #F59E0B, #D97706)",
                /** Neutralized: mid-stage amber instead of pink */
                pink: "linear-gradient(135deg, #F59E0B, #B45309)",
                prestige: "linear-gradient(135deg, #2979FF, #EAB308)",
        },
} as const;
