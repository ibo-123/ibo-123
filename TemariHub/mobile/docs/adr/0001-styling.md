# ADR 0001: StyleSheet + typed tokens for the sprint

| | |
|---|---|
| Status | Accepted |
| Date | 2026-10-04 |
| Deciders | TemariHub mobile |

## Context

The PRD leans toward Tailwind-style utility classes (NativeWind on React Native). The sprint has no buffer for tooling that can break after an Expo SDK upgrade. Screens must stay readable on low-end Android (PRD §19).

## Decision

Use React Native `StyleSheet` with a typed `src/shared/theme/tokens.ts` as the single source of truth for color, type, space, and radius.

- No raw hex or magic numbers in screens.
- Shared UI in `src/shared/ui` is the only layer that should know about StyleSheet details.
- NativeWind may be reconsidered after phase 2; switching later should touch `shared/ui` and tokens, not every screen.

## Consequences

- TypeScript catches invalid token keys.
- Best runtime fit for low-end devices; zero Babel/Metro styling plugins.
- Figma Tailwind output needs a short translation step into tokens (MOB-04).
- Web and mobile share token *values*, not class strings.
