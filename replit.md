# Cognitive Exploration Interface

## Overview

An experimental interactive application focused on cognitive exploration and pattern discovery. The app presents three interconnected panels in a triangular layout where actions in one panel cause indirect, non-predictable effects in other panels. There are no tutorials, explicit goals, or traditional UI elements - users discover the system's hidden rules through interaction and observation.

The core concept is "Zero Explanation Design" where meaning emerges from experience rather than instruction. The system maintains session persistence so returning users experience subtly altered behavior, creating a sense that the system "remembers" previous interactions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React hooks for local state
- **Animation**: Framer Motion for panel and element animations
- **Styling**: Tailwind CSS with CSS variables for theming, shadcn/ui component library

### Backend Architecture
- **Runtime**: Node.js with Express
- **Build Tool**: Vite for frontend, esbuild for server bundling
- **Development**: tsx for TypeScript execution in development

### Panel Logic System
Each of the three panels operates with distinct behavioral rules:
- **Panel 0 (Inversion)**: Reverses order and inverts values
- **Panel 1 (Temporal)**: Delays or anticipates consequences
- **Panel 2 (Distortion)**: Distorts meaning and relationships

Effects from interactions are never direct - they propagate to other panels with transformations applied based on each panel's logic.

### Interaction Modes
- **shapes/words/mixed**: Basic element display modes
- **conversation**: AI-powered text transformation with OpenAI
- **pattern**: Pattern recognition scoring
- **decisions**: Consequential choice system with dramatic effects
- **physics**: Pairwise repulsion with wall bouncing
- **gravity**: Center attraction with collision prevention  
- **repel (agua/aceite)**: Strong water/oil separation with turbulence
- **network (red neuronal)**: Sentence clustering visualization with neural-style connections

### Network Mode
The network mode creates a neural network-style visualization where:
- Similar sentences are grouped into interconnected nodes
- Similarity is calculated using Jaccard word overlap (words > 2 chars, 15% threshold)
- **Draggable nodes**: All nodes can be dragged to new positions with collision prevention
- **Click to expand**: Clicking a node (without dragging) expands it to show all sentences and an input to add more
- **Multiple sentences per node**: Each node has a `sentences[]` array - clicking adds sentences TO the node, not new nodes
- **Collision detection**: Uses viewport-relative distance calculation with iterative resolution (10-15 passes)
- **Click/drag separation**: Uses `hasDraggedRef` to detect if pointer moved during interaction
- SVG lines connect related nodes with curved paths
- Nodes are positioned using golden-angle spiral distribution
- Network state persists to localStorage (including positions and sentences)

### Intensity Control
User-adjustable vibration intensity (5 levels: 0.2x to 2.0x) affects all animation movement globally.

### Data Storage
- **Schema**: Defined with Drizzle ORM and Zod validation in `shared/schema.ts`
- **Current Implementation**: In-memory storage (`MemStorage` class)
- **Database Ready**: Drizzle config points to PostgreSQL via `DATABASE_URL`
- **Session Persistence**: LocalStorage for client-side state, API endpoints for server-side session storage

### Responsive Layout Strategy
- **Desktop**: 2x2 grid with triangular visual division (two upper panels, one full-width lower panel)
- **Tablet**: L-shaped layout with vertical stacking
- **Mobile**: Fully stacked vertical panels

## External Dependencies

### UI Components
- **shadcn/ui**: Complete component library (Radix UI primitives + Tailwind)
- **Radix UI**: Accessible component primitives
- **Framer Motion**: Animation library
- **Lucide React**: Icon library

### Data & Validation
- **Drizzle ORM**: Database toolkit with PostgreSQL dialect configured
- **Zod**: Schema validation for runtime type checking
- **drizzle-zod**: Integration between Drizzle schemas and Zod

### State Management
- **TanStack React Query**: Async state management and caching

### Fonts
- **IBM Plex Mono**: Primary monospace font (loaded via Google Fonts)

### Build & Development
- **Vite**: Frontend build tool with React plugin
- **esbuild**: Server bundling for production
- **tsx**: TypeScript execution for development
- **Replit plugins**: Error overlay, cartographer, dev banner (development only)