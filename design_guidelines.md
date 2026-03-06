# Design Guidelines: Cognitive Exploration Interface

## Design Approach
**Selected Framework**: Custom experimental design inspired by brutalist and minimalist principles. This app rejects conventional patterns entirely - no reference apps apply. The design must express pure conceptual interaction without familiar UI paradigms.

## Core Principles
- **Zero Explanation Design**: Interface communicates solely through visual feedback and behavior
- **Structural Honesty**: Every element serves the core mechanic of pattern discovery
- **Intentional Disorientation**: Initial confusion is a feature, not a bug

## Layout System

### Primary Structure
**Triangular Viewport Division**:
- Three equal panels arranged in triangular formation meeting at a central vertex
- Desktop: Y-axis split at 50vh, creating two upper panels (each 50vw) and one full-width lower panel
- Mobile: Stack vertically with subtle angular dividers between sections
- Each panel is a distinct viewport with independent scroll (if needed)

**Spacing Scale**: Use Tailwind units of 1, 2, 4 for tight, intentional spacing
- Minimal padding within panels (p-2 to p-4)
- No generous whitespace - economy of space reinforces experimental nature
- Inter-panel gaps: 1px hairline borders only

### Panel Characteristics
Each panel must feel isolated yet connected:
- Contained boundaries with subtle visual separation (1px borders)
- Independent interaction zones
- No traditional navigation between panels

## Typography

**Font System**:
- Primary: IBM Plex Mono (via Google Fonts) - monospace reinforces systematic/code-like nature
- Size hierarchy strictly limited:
  - Base text: text-sm (14px)
  - Interaction feedback: text-xs (12px)
  - Minimal labels (if any): text-2xs or text-xs

**Typographic Treatment**:
- No bold weights - maintain uniform texture
- Uppercase sparingly for system states only
- Line-height: tight (leading-tight) to create density

## Color Strategy (Structural Only)

**Panel Differentiation** (Engineer will assign specific colors):
- Each panel must have distinct but related background treatment
- Use subtle tonal shifts to establish separate "realities"
- Interaction elements should contrast minimally - just enough to be perceived
- No traditional button styling - rely on state changes instead

## Component Library

### Interaction Elements
**No Traditional Buttons**: Replace with:
- Tappable/clickable zones marked only by subtle borders or hover states
- Geometric shapes (circles, squares, triangles) as interaction primitives
- Text as interactive element without button chrome

### Feedback Mechanisms
**Visual Response System**:
- Position shifts (translate transforms)
- Opacity changes (0.5 to 1.0 range)
- Scale variations (scale-95 to scale-105)
- Rotation (rotate-3, rotate-6 for subtle disorientation)
- No color changes on interaction - rely on geometric transformation

### State Indicators
**Persistent Memory Visualization**:
- Small abstract marks/glyphs that accumulate in corners
- Subtle background pattern density that increases with use
- No explicit counters or progress bars

### Content Elements
**Interaction Primitives** (what users can manipulate):
- Geometric shapes (20px to 60px)
- Single words or short phrases
- Abstract symbols/glyphs
- Lines or paths that can be drawn/modified

## Animation Guidelines

**Permitted Animations** (essential to pattern discovery):
- Cross-panel causality indicators (0.3s to 1.2s delays between panels)
- State transitions using CSS transforms
- Subtle pulse or drift animations on idle elements (very slow, 3-5s duration)

**Forbidden**:
- Celebratory animations
- Loading spinners (use subtle opacity shifts instead)
- Bouncing or elastic effects

## Responsive Behavior

**Desktop (lg:)**: 
- Full triangular layout with vertex at center
- Mouse hover states active

**Tablet (md:)**:
- Modified triangular arrangement, possibly L-shaped
- Touch-optimized interaction zones (min 44px)

**Mobile (base)**:
- Vertical stack maintaining three distinct sections
- Swipe gestures between panels
- Each section: min-h-[33vh]

## Images
**No Images**: This is a pure interaction/geometry-based experience. No hero images, no decorative photography, no illustrations. Visual interest comes entirely from geometric forms and their transformations.

## Accessibility Adaptations
- Maintain keyboard navigation between panels (Tab order: Panel 1 → Panel 2 → Panel 3)
- Focus indicators using geometric outlines (ring-1 ring-offset-2)
- Screen reader hints kept cryptic: "Zone 1", "Zone 2", "Zone 3" (maintains discovery-based experience)

## Critical Implementation Notes
- No localStorage or cookie banners - state persistence should feel mysterious
- No error messages - failed interactions simply produce no response
- Each panel operates independently - no shared UI chrome
- Absolutely no onboarding modals, tooltips, or help text

---

**Design Philosophy**: Create an interface that feels like a scientific instrument or experimental apparatus rather than a consumer app. Users should feel like they're probing a system, not completing tasks.