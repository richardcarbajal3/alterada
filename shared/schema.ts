import { z } from "zod";

// Interaction event within a panel
export const interactionEventSchema = z.object({
  id: z.string(),
  panelId: z.number().min(0).max(2),
  type: z.enum(["click", "drag", "hover"]),
  elementId: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  timestamp: z.number(),
  value: z.any().optional(),
});

export type InteractionEvent = z.infer<typeof interactionEventSchema>;

// Panel state - each panel has its own state
export const panelStateSchema = z.object({
  id: z.number().min(0).max(2),
  elements: z.array(z.object({
    id: z.string(),
    type: z.enum(["circle", "square", "triangle", "line", "glyph"]),
    x: z.number(),
    y: z.number(),
    size: z.number(),
    rotation: z.number(),
    opacity: z.number(),
    scale: z.number(),
    value: z.any().optional(),
    color: z.string().optional(),
  })),
  glyphs: z.array(z.object({
    id: z.string(),
    symbol: z.string(),
    x: z.number(),
    y: z.number(),
    opacity: z.number(),
    size: z.number().optional(),
    color: z.string().optional(),
  })),
  patternDensity: z.number().min(0).max(1),
  backgroundColor: z.string().optional(),
  zoomLevel: z.number().min(0.3).max(3).optional(),
});

export type PanelState = z.infer<typeof panelStateSchema>;

// Session state - persisted across visits
export const sessionStateSchema = z.object({
  id: z.string(),
  interactionCount: z.number(),
  patternRecognitionScore: z.number().min(0).max(1),
  lastVisit: z.number(),
  visitCount: z.number(),
  panelStates: z.array(panelStateSchema),
  recentEvents: z.array(interactionEventSchema),
  behaviorModifier: z.number().min(0).max(1), // Subtle behavior changes
});

export type SessionState = z.infer<typeof sessionStateSchema>;

// Insert schemas
export const insertSessionSchema = sessionStateSchema.omit({ id: true });
export type InsertSession = z.infer<typeof insertSessionSchema>;

// Panel logic types
export type PanelLogic = "inversion" | "temporal" | "distortion";

// Effect propagation
export const effectSchema = z.object({
  sourcePanel: z.number(),
  targetPanel: z.number(),
  effectType: z.enum(["position", "opacity", "scale", "rotation", "spawn", "remove"]),
  delay: z.number(),
  intensity: z.number(),
});

export type Effect = z.infer<typeof effectSchema>;

// Legacy user types for compatibility
export const users = {
  id: "",
  username: "",
  password: "",
};

export type InsertUser = { username: string; password: string };
export type User = { id: string; username: string; password: string };
