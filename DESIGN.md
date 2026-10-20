# DESIGN.md — Realistic Solar System Navigation (Minecraft Service Dashboard v2)

## 1. Design Tokens (Sole Color & Spacing Source)
- `--bg-void: #050608` (3D viewport fallback)
- `--bg-surface-1: rgba(12, 14, 18, 0.78)` (panels, `backdrop-filter: blur(16px)`)
- `--bg-surface-2: rgba(20, 23, 30, 0.85)` (cards, rows, inputs)
- `--bg-surface-hover: rgba(32, 36, 46, 0.90)` (interactive hover)
- `--border-subtle: rgba(255, 255, 255, 0.07)` (hairline `1px` dividers)
- `--border-strong: rgba(255, 255, 255, 0.14)` (active card, focused input)
- `--text-primary: #F2F4F8` | `--text-secondary: #9BA3B0` | `--text-muted: #5E6673`
- `--accent: #E8ECF2` | `--accent-fg: #08090C`
- `--status-ok: #3FB97A` | `--status-warn: #D49B35` | `--status-danger: #E05252`
- Radius: `--radius-sm: 6px`, `--radius-md: 10px`, `--radius-lg: 14px`
- Spacing: `4, 8, 12, 16, 24, 32, 48px`
- Typography: `--font-sans: "Inter", system-ui, sans-serif`, `--font-mono: "JetBrains Mono", monospace` (`tabular-nums` on all metrics/coords).

## 2. Screen Layouts
- **Viewport Contract:** `100vw × 100vh` (`overflow: hidden`), full-bleed `<canvas>` at `z-index: 0`. At least 45% of viewport remains unobstructed space + 3D planet.
- **Pre-Auth (Key Entry):** Centered card (`max-width: 380px`, `padding: 28px`, `--bg-surface-1`, `1px solid --border-subtle`) over dimmed 3D Earth (`opacity: 0.35`). Single key input (`MC-ORBIT-2025`), primary action, inline demo key fill button.
- **Desktop Shell (`> 1024px`):**
  - Left floating sidebar (`220px` expanded / `56px` collapsed, `12px` inset) with 6 destinations, Assistant style toggle (Smooth / Pixel), Reduced Motion toggle, and collapse button.
  - Right floating content panel (`width: clamp(380px, 36vw, 520px)`, `max-height: calc(100vh - 24px)`, `12px` inset, internal scroll).
  - Top-center minimal HUD pill during interplanetary flight (origin → destination, distance in AU/km, ETA, Skip `Esc`) and compact header badge on arrival.
- **Tablet (`768px–1024px`):** Collapsed `56px` rail + `400px` right panel.
- **Mobile (`< 768px`):** Top compact header + bottom sheet (`38vh` peek / `82vh` expanded) + `56px` bottom nav bar (4 primary items + `More`).
- **Explore Overlay:** Hides right panel (`opacity: 0`, `translateX(16px)`), reveals bottom floating toolbar (planet switcher pills, Reset View, Back to Panel).

## 3. Five Core Design Principles
1. **3D Planet is the Only Spectacle:** UI chrome stays quiet, flat, dark, and disciplined; never competes with planetary lighting or rings.
2. **Strict Token Discipline:** Zero raw hex/rgb in components, zero gradients on UI chrome, zero neon glows or sci-fi corner brackets.
3. **1px Hairline Architecture:** Separation relies on `1px solid var(--border-subtle)` and translucent surface layers rather than heavy shadows.
4. **Tabular Precision:** Every coordinate, latency, player count, version, and astronomical distance uses monospace `tabular-nums`.
5. **Respectful Motion & Framing:** Camera offsets dynamically so the planet sits in the unobstructed canvas region; `prefers-reduced-motion` and instant skip (`Esc`) are first-class.

## 4. Self-Review Against Banned List (Section 3.9)
- *Reviewed & Changed:* Removed any tendency toward multi-metric KPI sparkline grids on Earth Overview; restricted to 1 primary status strip + 3-column key-value summary + recent events + 2 text CTAs. Replaced any blue/cyan primary button habit with `--accent: #E8ECF2` / `--accent-fg: #08090C`.
