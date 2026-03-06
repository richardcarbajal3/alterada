import type { InteractionEvent, Effect, PanelState } from "@shared/schema";

// Panel 0: Inversion - reverses order, inverts values
// Panel 1: Temporal - delays or anticipates consequences
// Panel 2: Distortion - distorts meaning and relationships

const SYMBOLS = ["◯", "△", "□", "◇", "⬡", "⬢", "○", "●", "◐", "◑", "◒", "◓"];

// Color palettes for backgrounds and elements
export const BACKGROUND_PALETTES = [
  ["#0f172a", "#1e1b4b", "#1a1a2e"], // Midnight blues
  ["#18181b", "#27272a", "#1c1917"], // Neutral dark
  ["#1e293b", "#312e81", "#3f3cbb"], // Indigo gradient
  ["#0c4a6e", "#7c2d12", "#166534"], // Sky/amber/emerald
  ["#581c87", "#9f1239", "#1e3a8a"], // Purple/rose/blue
  ["#292524", "#422006", "#14532d"], // Stone/orange/green
];

export const ELEMENT_COLORS = [
  "#ffffff", "#00ffff", "#ff00ff", "#ffff00", 
  "#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4",
  "#ffeaa7", "#dfe6e9", "#a29bfe", "#fd79a8",
];

// Panel vibrancy profiles - determines color intensity
export const PANEL_VIBRANCY = {
  0: { saturation: 1.4, brightness: 1.3, opacity: 1 },     // Ultra vibrant
  1: { saturation: 0.5, brightness: 0.7, opacity: 0.6 },   // Muted/foggy
  2: { saturation: 1.2, brightness: 1.1, opacity: 0.9 },   // Chaotic strobe
};

// Panel scaling behavior - how elements grow/shrink
export const PANEL_SCALING = {
  0: { baseScale: 1.5, growthRate: 0.3, min: 0.8, max: 2.5 },   // Amplify/grow
  1: { baseScale: 0.7, growthRate: -0.1, min: 0.4, max: 1.0 },  // Compress/shrink
  2: { baseScale: 1.0, growthRate: 0, min: 0.3, max: 2.0 },     // Random oscillation
};

// Get color with panel vibrancy applied
export function getVibrancyColor(color: string, panelId: number): string {
  const vibrancy = PANEL_VIBRANCY[panelId as keyof typeof PANEL_VIBRANCY];
  const hex = color.replace("#", "");
  let r = parseInt(hex.substr(0, 2), 16);
  let g = parseInt(hex.substr(2, 2), 16);
  let b = parseInt(hex.substr(4, 2), 16);
  
  // Apply saturation and brightness
  const avg = (r + g + b) / 3;
  r = Math.min(255, Math.round(avg + (r - avg) * vibrancy.saturation) * vibrancy.brightness);
  g = Math.min(255, Math.round(avg + (g - avg) * vibrancy.saturation) * vibrancy.brightness);
  b = Math.min(255, Math.round(avg + (b - avg) * vibrancy.saturation) * vibrancy.brightness);
  
  // Panel 2: add random chromatic aberration
  if (panelId === 2 && Math.random() > 0.5) {
    const shift = Math.floor(Math.random() * 60) - 30;
    r = Math.max(0, Math.min(255, r + shift));
    g = Math.max(0, Math.min(255, g - shift));
  }
  
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// Get scale with panel scaling behavior applied
export function getPanelScale(baseScale: number, panelId: number, intensity: number = 1): number {
  const scaling = PANEL_SCALING[panelId as keyof typeof PANEL_SCALING];
  let newScale = baseScale * scaling.baseScale;
  
  // Panel 2: random oscillation
  if (panelId === 2) {
    newScale *= 0.5 + Math.random() * 1.5;
  } else {
    newScale += scaling.growthRate * intensity;
  }
  
  return Math.max(scaling.min, Math.min(scaling.max, newScale));
}

export function getNextBackgroundPalette(currentIndex: number): number {
  return (currentIndex + 1) % BACKGROUND_PALETTES.length;
}

export function getRandomElementColor(): string {
  return ELEMENT_COLORS[Math.floor(Math.random() * ELEMENT_COLORS.length)];
}

export function transformColor(color: string, panelId: number): string {
  // Parse hex color and transform based on panel logic
  const hex = color.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  let newR = r, newG = g, newB = b;
  
  switch (panelId) {
    case 0: // Inversion - invert colors
      newR = 255 - r;
      newG = 255 - g;
      newB = 255 - b;
      break;
    case 1: // Temporal - shift hue slightly
      newR = (r + 30) % 256;
      newG = (g + 60) % 256;
      newB = b;
      break;
    case 2: // Distortion - randomize
      newR = Math.min(255, Math.max(0, r + Math.floor((Math.random() - 0.5) * 100)));
      newG = Math.min(255, Math.max(0, g + Math.floor((Math.random() - 0.5) * 100)));
      newB = Math.min(255, Math.max(0, b + Math.floor((Math.random() - 0.5) * 100)));
      break;
  }
  
  return `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
}

export function generateInitialElements(panelId: number): PanelState["elements"] {
  const count = 3 + Math.floor(Math.random() * 2);
  const elements: PanelState["elements"] = [];
  
  for (let i = 0; i < count; i++) {
    const types = ["circle", "square", "triangle"] as const;
    elements.push({
      id: `${panelId}-el-${i}`,
      type: types[Math.floor(Math.random() * types.length)],
      x: 15 + Math.random() * 70,
      y: 15 + Math.random() * 70,
      size: 20 + Math.random() * 30,
      rotation: Math.random() * 360,
      opacity: 0.5 + Math.random() * 0.5,
      scale: 0.8 + Math.random() * 0.4,
      color: getRandomElementColor(),
    });
  }
  
  return elements;
}

// Mutate element properties (color, size, shape) across all panels
// Each panel has distinct, anomalous behavior
export function mutateElement(
  element: PanelState["elements"][0],
  panelId: number
): PanelState["elements"][0] {
  const types = ["circle", "square", "triangle"] as const;
  const vibrancy = PANEL_VIBRANCY[panelId as keyof typeof PANEL_VIBRANCY];
  const scaling = PANEL_SCALING[panelId as keyof typeof PANEL_SCALING];
  
  let newType = element.type;
  let newSize = element.size;
  let newColor = element.color || getRandomElementColor();
  let newScale = element.scale;
  let newOpacity = element.opacity;
  let newX = element.x;
  let newY = element.y;
  let newRotation = element.rotation;
  
  // Panel-specific chaos levels
  if (panelId === 0) {
    // AMPLIFYING - everything grows, brightens, intensifies
    if (Math.random() > 0.3 && element.type !== "glyph") {
      const currentIndex = types.indexOf(element.type as typeof types[number]);
      newType = types[(currentIndex + 2) % 3];
    }
    newSize = Math.min(100, element.size * (1.2 + Math.random() * 0.3));
    newScale = Math.min(scaling.max, element.scale * 1.25);
    newOpacity = Math.min(1, element.opacity * 1.2);
    newColor = getVibrancyColor(newColor, panelId);
    newRotation += (Math.random() - 0.5) * 60;
    // Elements drift toward center
    newX = element.x + (50 - element.x) * 0.1;
    newY = element.y + (50 - element.y) * 0.1;
    
  } else if (panelId === 1) {
    // FADING - everything shrinks, dims, becomes ghostly
    if (Math.random() > 0.5 && element.type !== "glyph") {
      const currentIndex = types.indexOf(element.type as typeof types[number]);
      newType = types[(currentIndex + 1) % 3];
    }
    newSize = Math.max(8, element.size * (0.7 + Math.random() * 0.2));
    newScale = Math.max(scaling.min, element.scale * 0.85);
    newOpacity = Math.max(0.2, element.opacity * vibrancy.opacity);
    newColor = getVibrancyColor(newColor, panelId);
    newRotation += Math.random() * 15;
    // Elements drift outward slowly
    const angle = Math.atan2(element.y - 50, element.x - 50);
    newX = Math.max(5, Math.min(95, element.x + Math.cos(angle) * 3));
    newY = Math.max(5, Math.min(95, element.y + Math.sin(angle) * 3));
    
  } else {
    // CHAOTIC - pure randomness, anomalous, terrifying
    if (Math.random() > 0.2) {
      newType = element.type !== "glyph" ? types[Math.floor(Math.random() * types.length)] : "glyph";
    }
    // Extreme random size changes
    newSize = Math.max(10, Math.min(90, element.size * (0.4 + Math.random() * 1.6)));
    newScale = scaling.min + Math.random() * (scaling.max - scaling.min);
    newOpacity = 0.3 + Math.random() * 0.7;
    newColor = Math.random() > 0.3 ? getRandomElementColor() : getVibrancyColor(newColor, panelId);
    // Wild rotation
    newRotation = Math.random() * 360;
    // Elements teleport randomly
    if (Math.random() > 0.6) {
      newX = 10 + Math.random() * 80;
      newY = 10 + Math.random() * 80;
    } else {
      newX = Math.max(5, Math.min(95, element.x + (Math.random() - 0.5) * 30));
      newY = Math.max(5, Math.min(95, element.y + (Math.random() - 0.5) * 30));
    }
  }
  
  return {
    ...element,
    type: newType,
    x: newX,
    y: newY,
    size: newSize,
    scale: newScale,
    opacity: newOpacity,
    color: newColor,
    rotation: newRotation,
  };
}

export function generateGlyph(panelId: number, x: number, y: number): PanelState["glyphs"][0] {
  return {
    id: `${panelId}-glyph-${Date.now()}`,
    symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    x: x + (Math.random() - 0.5) * 10,
    y: y + (Math.random() - 0.5) * 10,
    opacity: 0.3 + Math.random() * 0.4,
  };
}

// Calculate effects from an interaction based on panel logic
export function calculateEffects(
  event: InteractionEvent,
  behaviorModifier: number = 0
): Effect[] {
  const effects: Effect[] = [];
  const sourcePanel = event.panelId;
  
  // Effects are never direct - they affect other panels with delays
  const targetPanels = [0, 1, 2].filter(p => p !== sourcePanel);
  
  // Base delay varies by source panel logic
  const baseDelays = {
    0: 300, // Inversion: quick but reversed
    1: 800, // Temporal: longer delays
    2: 150, // Distortion: fast but altered
  };
  
  const baseDelay = baseDelays[sourcePanel as keyof typeof baseDelays] || 300;
  
  // Behavior modifier subtly changes the system when patterns are detected
  const modifiedDelay = baseDelay * (1 + behaviorModifier * 0.5);
  
  targetPanels.forEach((targetPanel, index) => {
    // Each panel reacts differently
    const effectTypes: Effect["effectType"][] = ["position", "opacity", "scale", "rotation"];
    
    // Probability of spawning new elements increases with interaction
    if (Math.random() > 0.85 - behaviorModifier * 0.1) {
      effects.push({
        sourcePanel,
        targetPanel,
        effectType: "spawn",
        delay: modifiedDelay + index * 200,
        intensity: 0.3 + Math.random() * 0.4,
      });
    }
    
    // Main effect
    effects.push({
      sourcePanel,
      targetPanel,
      effectType: effectTypes[Math.floor(Math.random() * effectTypes.length)],
      delay: modifiedDelay + index * 150,
      intensity: 0.2 + Math.random() * 0.5 + behaviorModifier * 0.2,
    });
  });
  
  return effects;
}

// Apply panel-specific transformation to an effect
export function transformByPanelLogic(
  panelId: number,
  value: number,
  effectType: Effect["effectType"]
): number {
  switch (panelId) {
    case 0: // Inversion
      if (effectType === "rotation") return -value;
      if (effectType === "position") return -value;
      if (effectType === "opacity") return 1 - value;
      return value;
      
    case 1: // Temporal - values drift over time
      return value * (0.8 + Math.random() * 0.4);
      
    case 2: // Distortion - unpredictable but bounded
      const distortionFactor = 0.5 + Math.random();
      return value * distortionFactor;
      
    default:
      return value;
  }
}

// Calculate pattern recognition score based on user behavior
export function analyzePatternRecognition(
  recentEvents: InteractionEvent[],
  currentScore: number
): number {
  if (recentEvents.length < 5) return currentScore;
  
  // Look for patterns in timing and panel selection
  const timings = recentEvents.slice(-10).map(e => e.timestamp);
  const panels = recentEvents.slice(-10).map(e => e.panelId);
  
  // Calculate timing regularity (consistent timing = pattern recognition)
  let timingScore = 0;
  for (let i = 1; i < timings.length; i++) {
    const diff = timings[i] - timings[i - 1];
    if (diff > 500 && diff < 3000) {
      timingScore += 0.1;
    }
  }
  
  // Calculate panel switching patterns
  let panelScore = 0;
  for (let i = 2; i < panels.length; i++) {
    // Detecting if user is cycling through panels systematically
    if (panels[i] !== panels[i - 1] && panels[i - 1] !== panels[i - 2]) {
      panelScore += 0.15;
    }
  }
  
  const newScore = Math.min(1, currentScore * 0.9 + (timingScore + panelScore) * 0.1);
  return newScore;
}

// Get panel CSS class based on its logic type
export function getPanelLogicName(panelId: number): string {
  const names = ["inversion", "temporal", "distortion"];
  return names[panelId] || "unknown";
}

// Words for word mode
const WORDS = [
  ["eco", "flujo", "onda", "luz", "sombra"],
  ["tiempo", "pausa", "ritmo", "pulso", "ciclo"],
  ["forma", "caos", "orden", "nexo", "umbral"],
];

const MIXED_WORDS = ["ser", "ver", "ir", "dar", "hay"];

// Generate word-based elements for word mode
export function generateWordElements(panelId: number): PanelState["elements"] {
  const count = 2 + Math.floor(Math.random() * 2);
  const elements: PanelState["elements"] = [];
  const panelWords = WORDS[panelId] || WORDS[0];
  
  for (let i = 0; i < count; i++) {
    elements.push({
      id: `${panelId}-word-${i}`,
      type: "glyph" as const,
      x: 15 + Math.random() * 70,
      y: 15 + Math.random() * 70,
      size: 14 + Math.random() * 6,
      rotation: (Math.random() - 0.5) * 20,
      opacity: 0.6 + Math.random() * 0.4,
      scale: 0.9 + Math.random() * 0.2,
      value: panelWords[Math.floor(Math.random() * panelWords.length)],
      color: getRandomElementColor(),
    });
  }
  
  return elements;
}

// Generate mixed elements (shapes + words)
export function generateMixedElements(panelId: number): PanelState["elements"] {
  const shapeElements = generateInitialElements(panelId).slice(0, 2);
  const wordCount = 1 + Math.floor(Math.random() * 2);
  const wordElements: PanelState["elements"] = [];
  
  for (let i = 0; i < wordCount; i++) {
    wordElements.push({
      id: `${panelId}-mixed-word-${i}`,
      type: "glyph" as const,
      x: 20 + Math.random() * 60,
      y: 20 + Math.random() * 60,
      size: 12 + Math.random() * 4,
      rotation: (Math.random() - 0.5) * 15,
      opacity: 0.5 + Math.random() * 0.4,
      scale: 0.9 + Math.random() * 0.2,
      value: MIXED_WORDS[Math.floor(Math.random() * MIXED_WORDS.length)],
      color: getRandomElementColor(),
    });
  }
  
  return [...shapeElements, ...wordElements];
}

// Transform text based on panel logic
export function transformText(text: string, panelId: number): string {
  switch (panelId) {
    case 0: // Inversion - reverse the text
      return text.split("").reverse().join("");
    
    case 1: // Temporal - fragment or delay (show partial)
      const fragmentLength = Math.max(1, Math.floor(text.length * 0.6));
      const start = Math.floor(Math.random() * (text.length - fragmentLength + 1));
      return "..." + text.substring(start, start + fragmentLength) + "...";
    
    case 2: // Distortion - scramble or replace characters
      const chars = text.split("");
      const distorted = chars.map((char, i) => {
        if (Math.random() > 0.7) {
          // Replace with similar looking character or symbol
          const replacements: Record<string, string> = {
            "a": "α", "e": "ε", "i": "ι", "o": "ο", "u": "υ",
            "s": "ş", "n": "η", "t": "τ", "r": "я", "l": "ł",
          };
          return replacements[char.toLowerCase()] || char;
        }
        return char;
      });
      return distorted.join("");
    
    default:
      return text;
  }
}
