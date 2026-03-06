import { useState, useCallback, useEffect, useRef } from "react";
import type { PanelState, InteractionEvent, SessionState, Effect } from "@shared/schema";
import type { InteractionMode } from "@/components/OptionsMenu";
import type { NetworkNode } from "@/components/NetworkView";
import {
  generateInitialElements,
  generateGlyph,
  calculateEffects,
  transformByPanelLogic,
  analyzePatternRecognition,
  generateWordElements,
  generateMixedElements,
  transformText,
  BACKGROUND_PALETTES,
  getNextBackgroundPalette,
  mutateElement,
  getRandomElementColor,
} from "@/lib/panelLogic";
import { apiRequest } from "@/lib/queryClient";

const STORAGE_KEY = "cognitive-explorer-session";
const MODE_STORAGE_KEY = "cognitive-explorer-mode";
const PALETTE_STORAGE_KEY = "cognitive-explorer-palette";
const INTENSITY_STORAGE_KEY = "cognitive-explorer-intensity";
const NETWORK_STORAGE_KEY = "cognitive-explorer-network";

function createInitialPanelStates(mode: InteractionMode = "shapes", paletteIndex: number = 0): PanelState[] {
  const palette = BACKGROUND_PALETTES[paletteIndex] || BACKGROUND_PALETTES[0];
  return [0, 1, 2].map((id) => ({
    id,
    elements: mode === "shapes" 
      ? generateInitialElements(id)
      : mode === "words"
      ? generateWordElements(id)
      : generateMixedElements(id),
    glyphs: [],
    patternDensity: 0,
    backgroundColor: palette[id],
    zoomLevel: 1,
  }));
}

function createInitialSession(mode: InteractionMode = "shapes", paletteIndex: number = 0): SessionState {
  return {
    id: crypto.randomUUID(),
    interactionCount: 0,
    patternRecognitionScore: 0,
    lastVisit: Date.now(),
    visitCount: 1,
    panelStates: createInitialPanelStates(mode, paletteIndex),
    recentEvents: [],
    behaviorModifier: 0,
  };
}

export function useExplorerState() {
  const [interactionMode, setInteractionMode] = useState<InteractionMode>(() => {
    try {
      const saved = localStorage.getItem(MODE_STORAGE_KEY);
      if (saved && ["shapes", "words", "mixed", "conversation", "pattern", "decisions", "physics", "gravity", "repel", "network"].includes(saved)) {
        return saved as InteractionMode;
      }
    } catch {}
    return "shapes";
  });

  const [networkNodes, setNetworkNodes] = useState<NetworkNode[]>(() => {
    try {
      const saved = localStorage.getItem(NETWORK_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as NetworkNode[];
        return parsed.map(node => ({
          ...node,
          sentences: node.sentences || [node.text]
        }));
      }
    } catch {}
    return [];
  });

  const [backgroundPaletteIndex, setBackgroundPaletteIndex] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(PALETTE_STORAGE_KEY);
      if (saved) return parseInt(saved, 10);
    } catch {}
    return 0;
  });

  const [intensity, setIntensity] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(INTENSITY_STORAGE_KEY);
      if (saved) {
        const val = parseInt(saved, 10);
        if (val >= 0 && val <= 4) return val;
      }
    } catch {}
    return 2; // Default to medium intensity
  });

  const handleIntensityChange = useCallback((newIntensity: number) => {
    setIntensity(newIntensity);
    localStorage.setItem(INTENSITY_STORAGE_KEY, newIntensity.toString());
  }, []);

  const [session, setSession] = useState<SessionState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as SessionState;
        return {
          ...parsed,
          visitCount: parsed.visitCount + 1,
          lastVisit: Date.now(),
          behaviorModifier: Math.min(1, parsed.behaviorModifier + 0.05),
        };
      }
    } catch {}
    return createInitialSession(interactionMode);
  });

  const [activeElementId, setActiveElementId] = useState<string | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const pendingEffectsRef = useRef<NodeJS.Timeout[]>([]);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  // Continuous ambient animation - elements never stay still
  useEffect(() => {
    // Intensity multiplier: 0=0.2x, 1=0.5x, 2=1x, 3=1.5x, 4=2x
    const intensityMultiplier = [0.2, 0.5, 1.0, 1.5, 2.0][intensity] || 1.0;
    
    const animateElements = () => {
      setSession((prev) => ({
        ...prev,
        panelStates: prev.panelStates.map((panel) => {
          // Physics, gravity, and repel modes need collision detection
          const isPhysicsMode = interactionMode === "physics";
          const isGravityMode = interactionMode === "gravity";
          const isRepelMode = interactionMode === "repel";
          
          // Calculate forces between all elements for physics/gravity/repel
          const forces: Record<string, { fx: number; fy: number }> = {};
          
          if (isPhysicsMode || isGravityMode || isRepelMode) {
            // Initialize forces
            panel.elements.forEach((el) => {
              forces[el.id] = { fx: 0, fy: 0 };
            });
            
            // Calculate pairwise forces
            for (let i = 0; i < panel.elements.length; i++) {
              for (let j = i + 1; j < panel.elements.length; j++) {
                const a = panel.elements[i];
                const b = panel.elements[j];
                
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
                const minDist = (a.size + b.size) / 15; // Collision threshold
                
                if (isRepelMode) {
                  // Water and oil: STRONG repulsion - elements flee from each other dramatically
                  const repelStrength = 3.0 / (dist * dist + 0.5); // Inverse square law, very strong
                  const fx = (dx / dist) * repelStrength;
                  const fy = (dy / dist) * repelStrength;
                  forces[a.id].fx -= fx;
                  forces[a.id].fy -= fy;
                  forces[b.id].fx += fx;
                  forces[b.id].fy += fy;
                  
                  // Extra strong repulsion when too close
                  if (dist < minDist * 1.5) {
                    const emergencyRepel = (minDist * 1.5 - dist) * 2;
                    forces[a.id].fx -= (dx / dist) * emergencyRepel;
                    forces[a.id].fy -= (dy / dist) * emergencyRepel;
                    forces[b.id].fx += (dx / dist) * emergencyRepel;
                    forces[b.id].fy += (dy / dist) * emergencyRepel;
                  }
                } else if (isPhysicsMode) {
                  // Repulsion: elements push each other away
                  const repelForce = Math.max(0, (minDist - dist) * 0.8);
                  if (dist < minDist * 2) {
                    const fx = (dx / dist) * repelForce;
                    const fy = (dy / dist) * repelForce;
                    forces[a.id].fx -= fx;
                    forces[a.id].fy -= fy;
                    forces[b.id].fx += fx;
                    forces[b.id].fy += fy;
                  }
                  // Add constant small repulsion
                  const constantRepel = 0.5 / (dist + 1);
                  forces[a.id].fx -= (dx / dist) * constantRepel;
                  forces[a.id].fy -= (dy / dist) * constantRepel;
                  forces[b.id].fx += (dx / dist) * constantRepel;
                  forces[b.id].fy += (dy / dist) * constantRepel;
                } else if (isGravityMode) {
                  // Attraction: elements pull toward each other but don't cross
                  const attractForce = 0.3 / (dist + 1);
                  
                  if (dist > minDist) {
                    // Attract when far
                    forces[a.id].fx += (dx / dist) * attractForce;
                    forces[a.id].fy += (dy / dist) * attractForce;
                    forces[b.id].fx -= (dx / dist) * attractForce;
                    forces[b.id].fy -= (dy / dist) * attractForce;
                  } else {
                    // Repel when too close (collision prevention)
                    const repelForce = (minDist - dist) * 1.5;
                    forces[a.id].fx -= (dx / dist) * repelForce;
                    forces[a.id].fy -= (dy / dist) * repelForce;
                    forces[b.id].fx += (dx / dist) * repelForce;
                    forces[b.id].fy += (dy / dist) * repelForce;
                  }
                }
              }
            }
            
            // Add gravity toward center for gravity mode
            if (isGravityMode) {
              panel.elements.forEach((el) => {
                const toCenterX = 50 - el.x;
                const toCenterY = 50 - el.y;
                forces[el.id].fx += toCenterX * 0.01;
                forces[el.id].fy += toCenterY * 0.01;
              });
            }
            
            // Add boundary repulsion for physics mode
            if (isPhysicsMode) {
              panel.elements.forEach((el) => {
                // Bounce off walls
                if (el.x < 10) forces[el.id].fx += (10 - el.x) * 0.3;
                if (el.x > 90) forces[el.id].fx -= (el.x - 90) * 0.3;
                if (el.y < 10) forces[el.id].fy += (10 - el.y) * 0.3;
                if (el.y > 90) forces[el.id].fy -= (el.y - 90) * 0.3;
              });
            }
          }
          
          return {
            ...panel,
            elements: panel.elements.map((el) => {
              let dx = 0, dy = 0, dr = 0;
              
              // Apply physics/gravity/repel forces if in those modes
              if ((isPhysicsMode || isGravityMode || isRepelMode) && forces[el.id]) {
                // Base forces from physics simulation
                dx = forces[el.id].fx;
                dy = forces[el.id].fy;
                
                // Add time-varying noise so elements NEVER stop moving
                const time = Date.now() / 1000;
                const noiseScale = isRepelMode ? 0.6 : isPhysicsMode ? 0.4 : 0.25;
                dx += Math.sin(time * 2 + el.x * 0.1 + el.y * 0.05) * noiseScale;
                dy += Math.cos(time * 2.3 + el.y * 0.1 + el.x * 0.05) * noiseScale;
                
                // Add orbital wobble for gravity mode
                if (isGravityMode) {
                  const angle = Math.atan2(el.y - 50, el.x - 50);
                  const orbitSpeed = 0.15;
                  dx += Math.cos(angle + Math.PI / 2) * orbitSpeed * Math.sin(time);
                  dy += Math.sin(angle + Math.PI / 2) * orbitSpeed * Math.sin(time);
                }
                
                // Add erratic jitter for repel mode (water/oil turbulence)
                if (isRepelMode) {
                  dx += (Math.random() - 0.5) * 0.8;
                  dy += (Math.random() - 0.5) * 0.8;
                }
                
                dr = (dx + dy) * 0.5 + Math.sin(time * 3 + parseFloat(el.id.slice(-3) || "0")) * 0.3;
              } else {
                // Standard panel-specific movement patterns
                if (panel.id === 0) {
                  // Amplifying: slow drift toward center with pulsing
                  const toCenter = { x: 50 - el.x, y: 50 - el.y };
                  dx = toCenter.x * 0.008 + Math.sin(Date.now() / 1000 + el.x) * 0.3;
                  dy = toCenter.y * 0.008 + Math.cos(Date.now() / 1000 + el.y) * 0.3;
                  dr = Math.sin(Date.now() / 800) * 0.5;
                } else if (panel.id === 1) {
                  // Fading: slow outward drift, ghostly floating
                  const fromCenter = { x: el.x - 50, y: el.y - 50 };
                  const dist = Math.sqrt(fromCenter.x ** 2 + fromCenter.y ** 2) || 1;
                  dx = (fromCenter.x / dist) * 0.15 + Math.sin(Date.now() / 2000 + el.y) * 0.2;
                  dy = (fromCenter.y / dist) * 0.15 + Math.cos(Date.now() / 2000 + el.x) * 0.2;
                  dr = Math.sin(Date.now() / 1500) * 0.3;
                } else {
                  // Chaotic: erratic, unpredictable movement
                  dx = (Math.random() - 0.5) * 2 + Math.sin(Date.now() / 300 + el.x * 10) * 1;
                  dy = (Math.random() - 0.5) * 2 + Math.cos(Date.now() / 300 + el.y * 10) * 1;
                  dr = (Math.random() - 0.5) * 3;
                }
              }
              
              // Apply intensity multiplier to all movement
              return {
                ...el,
                x: Math.max(5, Math.min(95, el.x + dx * intensityMultiplier)),
                y: Math.max(5, Math.min(95, el.y + dy * intensityMultiplier)),
                rotation: el.rotation + dr * intensityMultiplier,
              };
            }),
          };
        }),
      }));
    };

    // Run animation at 30fps for smooth but efficient movement
    animationRef.current = setInterval(animateElements, 33);
    
    return () => {
      if (animationRef.current) clearInterval(animationRef.current);
    };
  }, [interactionMode, intensity]);

  // Spontaneous chaotic disturbances - random mutations every few seconds
  useEffect(() => {
    const causeDisturbance = () => {
      const randomPanel = Math.floor(Math.random() * 3);
      
      setSession((prev) => ({
        ...prev,
        panelStates: prev.panelStates.map((panel) => {
          // Random chance to mutate elements in any panel
          if (Math.random() > 0.6) {
            const elementToMutate = Math.floor(Math.random() * panel.elements.length);
            return {
              ...panel,
              elements: panel.elements.map((el, idx) => 
                idx === elementToMutate ? mutateElement(el, panel.id) : el
              ),
            };
          }
          // Random chance for zoom pulse
          if (panel.id === randomPanel && Math.random() > 0.8) {
            const zoomPulse = (Math.random() - 0.5) * 0.15;
            return {
              ...panel,
              zoomLevel: Math.max(0.3, Math.min(3, (panel.zoomLevel || 1) + zoomPulse)),
            };
          }
          return panel;
        }),
      }));
    };

    const disturbanceInterval = setInterval(causeDisturbance, 2000 + Math.random() * 3000);
    
    return () => clearInterval(disturbanceInterval);
  }, []);

  // Cycle through background color palettes
  const cycleBackgroundPalette = useCallback(() => {
    const newIndex = getNextBackgroundPalette(backgroundPaletteIndex);
    setBackgroundPaletteIndex(newIndex);
    localStorage.setItem(PALETTE_STORAGE_KEY, newIndex.toString());
    
    const palette = BACKGROUND_PALETTES[newIndex];
    setSession((prev) => ({
      ...prev,
      panelStates: prev.panelStates.map((panel, idx) => ({
        ...panel,
        backgroundColor: palette[idx],
      })),
    }));
  }, [backgroundPaletteIndex]);

  // Mutate all elements in all panels (change color, size, shape)
  const mutateAllElements = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      panelStates: prev.panelStates.map((panel) => ({
        ...panel,
        elements: panel.elements.map((el) => mutateElement(el, panel.id)),
      })),
      interactionCount: prev.interactionCount + 1,
    }));
  }, []);

  // Handle zoom in a panel - also affects other panels with delayed, indirect chaos
  const handlePanelZoom = useCallback((panelId: number, delta: number) => {
    // First: immediately zoom the source panel
    setSession((prev) => {
      const newPanelStates = prev.panelStates.map((panel) => {
        if (panel.id === panelId) {
          const currentZoom = panel.zoomLevel || 1;
          const newZoom = Math.max(0.3, Math.min(3, currentZoom + delta));
          return { ...panel, zoomLevel: newZoom };
        }
        return panel;
      });
      return { ...prev, panelStates: newPanelStates, interactionCount: prev.interactionCount + 1 };
    });

    // Then: trigger delayed, chaotic reactions in other panels
    const otherPanels = [0, 1, 2].filter((p) => p !== panelId);
    
    otherPanels.forEach((targetId) => {
      // Different delays per panel type
      const delays = { 0: 150, 1: 600, 2: 50 };
      const delay = delays[targetId as keyof typeof delays];
      
      setTimeout(() => {
        setSession((prev) => {
          const newPanelStates = prev.panelStates.map((panel) => {
            if (panel.id !== targetId) return panel;
            
            const currentZoom = panel.zoomLevel || 1;
            let reaction = 0;
            
            if (targetId === 0) {
              // Inversion: opposite zoom + mutation
              reaction = -delta * 0.7;
            } else if (targetId === 1) {
              // Temporal: subtle, delayed reduction
              reaction = delta * 0.25;
            } else {
              // Distortion: wild random zoom
              reaction = (Math.random() - 0.5) * delta * 2;
            }
            
            const newZoom = Math.max(0.3, Math.min(3, currentZoom + reaction));
            
            // Also shift some elements as side effect
            const shiftedElements = panel.elements.map((el) => ({
              ...el,
              x: Math.max(5, Math.min(95, el.x + (Math.random() - 0.5) * 8)),
              y: Math.max(5, Math.min(95, el.y + (Math.random() - 0.5) * 8)),
              rotation: el.rotation + (Math.random() - 0.5) * 20,
            }));
            
            return { ...panel, zoomLevel: newZoom, elements: shiftedElements };
          });
          return { ...prev, panelStates: newPanelStates };
        });
      }, delay);
      
      // Panel 2 gets additional chaotic follow-on effect
      if (targetId === 2) {
        setTimeout(() => {
          setSession((prev) => {
            const newPanelStates = prev.panelStates.map((panel) => {
              if (panel.id !== 2) return panel;
              const randomZoomShift = (Math.random() - 0.5) * 0.3;
              const currentZoom = panel.zoomLevel || 1;
              return { 
                ...panel, 
                zoomLevel: Math.max(0.3, Math.min(3, currentZoom + randomZoomShift)),
              };
            });
            return { ...prev, panelStates: newPanelStates };
          });
        }, delay + 300);
      }
    });
  }, []);

  // Handle consequences from decision system - dramatic panel effects
  const handleConsequence = useCallback((type: string, intensity: number) => {
    setSession((prev) => {
      const newPanelStates = prev.panelStates.map((panel) => {
        let updatedElements = [...panel.elements];
        let newZoom = panel.zoomLevel || 1;
        
        switch (type) {
          case "war":
            // War: dramatic destruction - elements shrink, scatter, some disappear
            updatedElements = panel.elements
              .filter(() => Math.random() > 0.2) // 20% chance to remove
              .map((el) => ({
                ...el,
                x: Math.max(5, Math.min(95, el.x + (Math.random() - 0.5) * 40)),
                y: Math.max(5, Math.min(95, el.y + (Math.random() - 0.5) * 40)),
                size: Math.max(8, el.size * (0.5 + Math.random() * 0.3)),
                rotation: el.rotation + (Math.random() - 0.5) * 180,
                opacity: Math.max(0.3, el.opacity * 0.7),
              }));
            newZoom = Math.max(0.5, newZoom * 0.8);
            break;
            
          case "peace":
            // Peace: gentle alignment - elements drift to orderly positions
            updatedElements = panel.elements.map((el, idx) => ({
              ...el,
              x: 20 + (idx % 4) * 20 + (Math.random() - 0.5) * 5,
              y: 20 + Math.floor(idx / 4) * 20 + (Math.random() - 0.5) * 5,
              rotation: Math.round(el.rotation / 90) * 90,
              opacity: Math.min(1, el.opacity * 1.2),
              scale: 1,
            }));
            newZoom = 1;
            break;
            
          case "chaos":
            // Chaos: extreme randomization - everything goes wild
            updatedElements = panel.elements.map((el) => mutateElement({
              ...el,
              x: 10 + Math.random() * 80,
              y: 10 + Math.random() * 80,
              size: 15 + Math.random() * 50,
              rotation: Math.random() * 360,
              scale: 0.5 + Math.random() * 1.5,
              opacity: 0.4 + Math.random() * 0.6,
              color: getRandomElementColor(),
            }, 2));
            newZoom = 0.5 + Math.random() * 2;
            break;
            
          case "growth":
            // Growth: elements expand and brighten
            updatedElements = panel.elements.map((el) => ({
              ...el,
              size: Math.min(80, el.size * (1.3 + Math.random() * 0.3)),
              scale: Math.min(2, el.scale * 1.2),
              opacity: Math.min(1, el.opacity * 1.3),
              x: el.x + (50 - el.x) * 0.15,
              y: el.y + (50 - el.y) * 0.15,
            }));
            newZoom = Math.min(2.5, newZoom * 1.3);
            break;
            
          case "decay":
            // Decay: elements shrink and fade
            updatedElements = panel.elements.map((el) => ({
              ...el,
              size: Math.max(8, el.size * (0.6 + Math.random() * 0.2)),
              scale: Math.max(0.3, el.scale * 0.7),
              opacity: Math.max(0.2, el.opacity * 0.6),
              x: Math.max(5, Math.min(95, el.x + (el.x - 50) * 0.2)),
              y: Math.max(5, Math.min(95, el.y + (el.y - 50) * 0.2)),
            }));
            newZoom = Math.max(0.4, newZoom * 0.7);
            break;
            
          case "merge":
            // Merge: elements move toward each other and combine properties
            const centerX = panel.elements.reduce((sum, el) => sum + el.x, 0) / panel.elements.length;
            const centerY = panel.elements.reduce((sum, el) => sum + el.y, 0) / panel.elements.length;
            updatedElements = panel.elements.map((el) => ({
              ...el,
              x: el.x + (centerX - el.x) * 0.4,
              y: el.y + (centerY - el.y) * 0.4,
              size: Math.min(60, el.size * 1.1),
              rotation: el.rotation + 45,
            }));
            break;
        }
        
        return {
          ...panel,
          elements: updatedElements,
          zoomLevel: newZoom,
        };
      });
      
      return {
        ...prev,
        panelStates: newPanelStates,
        interactionCount: prev.interactionCount + 1,
      };
    });
  }, []);

  // Reset the session to initial state
  const resetSession = useCallback(() => {
    pendingEffectsRef.current.forEach(clearTimeout);
    pendingEffectsRef.current = [];
    
    setBackgroundPaletteIndex(0);
    localStorage.setItem(PALETTE_STORAGE_KEY, "0");
    
    const newSession = createInitialSession(interactionMode);
    setSession(newSession);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
  }, [interactionMode]);

  const handleModeChange = useCallback((newMode: InteractionMode) => {
    setInteractionMode(newMode);
    localStorage.setItem(MODE_STORAGE_KEY, newMode);
    setIsDrawingMode(false);
    
    if (newMode !== "conversation" && newMode !== "pattern") {
      setSession((prev) => ({
        ...prev,
        panelStates: createInitialPanelStates(newMode, backgroundPaletteIndex),
      }));
    }
  }, [backgroundPaletteIndex]);

  const saveSession = useCallback((newSession: SessionState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
    } catch {}
    
    if (newSession.interactionCount % 10 === 0) {
      apiRequest("POST", "/api/session", newSession).catch(() => {});
    }
  }, []);

  const applyEffect = useCallback((effect: Effect) => {
    setSession((prev) => {
      const newPanelStates = [...prev.panelStates];
      const targetPanel = newPanelStates[effect.targetPanel];
      
      if (!targetPanel) return prev;

      const updatedElements = targetPanel.elements.map((element) => {
        const intensity = effect.intensity;
        
        switch (effect.effectType) {
          case "position":
            const dx = transformByPanelLogic(effect.targetPanel, intensity * 5, "position");
            const dy = transformByPanelLogic(effect.targetPanel, intensity * 5, "position");
            return {
              ...element,
              x: Math.max(5, Math.min(95, element.x + (Math.random() - 0.5) * dx)),
              y: Math.max(5, Math.min(95, element.y + (Math.random() - 0.5) * dy)),
            };
          
          case "opacity":
            const newOpacity = transformByPanelLogic(
              effect.targetPanel,
              element.opacity + (Math.random() - 0.5) * intensity * 0.3,
              "opacity"
            );
            return {
              ...element,
              opacity: Math.max(0.3, Math.min(1, newOpacity)),
            };
          
          case "scale":
            return {
              ...element,
              scale: Math.max(0.5, Math.min(1.5, element.scale + (Math.random() - 0.5) * intensity * 0.2)),
            };
          
          case "rotation":
            const rotationDelta = transformByPanelLogic(
              effect.targetPanel,
              intensity * 45,
              "rotation"
            );
            return {
              ...element,
              rotation: element.rotation + (Math.random() - 0.5) * rotationDelta,
            };
          
          default:
            return element;
        }
      });

      if (effect.effectType === "spawn" && targetPanel.elements.length < 8) {
        const types = ["circle", "square", "triangle"] as const;
        updatedElements.push({
          id: `${effect.targetPanel}-el-${Date.now()}`,
          type: types[Math.floor(Math.random() * types.length)],
          x: 10 + Math.random() * 80,
          y: 10 + Math.random() * 80,
          size: 15 + Math.random() * 25,
          rotation: Math.random() * 360,
          opacity: 0.4 + Math.random() * 0.4,
          scale: 0.7 + Math.random() * 0.4,
        });
      }

      if (effect.effectType === "remove" && updatedElements.length > 2) {
        const removeIndex = Math.floor(Math.random() * updatedElements.length);
        updatedElements.splice(removeIndex, 1);
      }

      newPanelStates[effect.targetPanel] = {
        ...targetPanel,
        elements: updatedElements,
        patternDensity: Math.min(1, targetPanel.patternDensity + 0.02),
      };

      return {
        ...prev,
        panelStates: newPanelStates,
      };
    });
  }, []);

  const handleInteraction = useCallback((event: InteractionEvent) => {
    if (event.type !== "click" && event.type !== "drag") return;

    setActiveElementId(event.elementId);
    setTimeout(() => setActiveElementId(null), 600);

    setSession((prev) => {
      const newPanelStates = [...prev.panelStates];
      const sourcePanel = newPanelStates[event.panelId];
      
      if (sourcePanel && sourcePanel.glyphs.length < 20) {
        newPanelStates[event.panelId] = {
          ...sourcePanel,
          glyphs: [
            ...sourcePanel.glyphs,
            generateGlyph(event.panelId, event.position.x, event.position.y),
          ],
          patternDensity: Math.min(1, sourcePanel.patternDensity + 0.03),
        };
      }

      const recentEvents = [...prev.recentEvents.slice(-19), event];
      const patternRecognitionScore = analyzePatternRecognition(
        recentEvents,
        prev.patternRecognitionScore
      );

      const behaviorModifier = patternRecognitionScore > 0.6
        ? Math.min(1, prev.behaviorModifier + 0.1)
        : prev.behaviorModifier;

      return {
        ...prev,
        interactionCount: prev.interactionCount + 1,
        patternRecognitionScore,
        behaviorModifier,
        panelStates: newPanelStates,
        recentEvents,
      };
    });

    const effects = calculateEffects(event, session.behaviorModifier);
    
    effects.forEach((effect) => {
      const timeoutId = setTimeout(() => {
        applyEffect(effect);
      }, effect.delay);
      pendingEffectsRef.current.push(timeoutId);
    });
  }, [session.behaviorModifier, applyEffect]);

  // Handle element position update from drag - receives panel-relative percentages
  const handleElementDrag = useCallback((
    panelId: number,
    elementId: string,
    relX: number,
    relY: number
  ) => {
    setSession((prev) => {
      const newPanelStates = [...prev.panelStates];
      const panel = newPanelStates[panelId];
      
      if (!panel) return prev;
      
      const updatedElements = panel.elements.map((el) => {
        if (el.id === elementId) {
          return {
            ...el,
            x: relX,
            y: relY,
          };
        }
        return el;
      });
      
      newPanelStates[panelId] = {
        ...panel,
        elements: updatedElements,
      };
      
      return {
        ...prev,
        panelStates: newPanelStates,
      };
    });
  }, []);

  // Handle drag end - create reflection in other panels (receives panel-relative percentages)
  const handleElementDragEnd = useCallback((
    panelId: number,
    elementId: string,
    relX: number,
    relY: number
  ) => {
    // Find the dragged element to get its properties
    const panel = session.panelStates[panelId];
    const element = panel?.elements.find((el) => el.id === elementId);
    
    if (!element) return;

    // Create reflections in other panels
    const otherPanels = [0, 1, 2].filter((p) => p !== panelId);
    
    setSession((prev) => {
      const newPanelStates = [...prev.panelStates];
      
      otherPanels.forEach((targetPanelId, index) => {
        const targetPanel = newPanelStates[targetPanelId];
        if (!targetPanel || targetPanel.elements.length >= 12) return;
        
        // More dramatic position transformations based on panel logic
        let transformedX = relX;
        let transformedY = relY;
        let sizeMultiplier = 1;
        let rotationOffset = 0;
        
        if (targetPanelId === 0) {
          // Inversion: mirror position completely + shrink
          transformedX = 100 - relX;
          transformedY = 100 - relY;
          sizeMultiplier = 0.7;
          rotationOffset = 180;
        } else if (targetPanelId === 1) {
          // Temporal: spiral outward + grow
          const angle = Math.atan2(relY - 50, relX - 50);
          const distance = Math.sqrt(Math.pow(relX - 50, 2) + Math.pow(relY - 50, 2));
          const newDistance = distance * 1.3;
          transformedX = Math.max(5, Math.min(95, 50 + Math.cos(angle + 0.5) * newDistance));
          transformedY = Math.max(5, Math.min(95, 50 + Math.sin(angle + 0.5) * newDistance));
          sizeMultiplier = 1.3;
          rotationOffset = 45;
        } else {
          // Distortion: chaotic scatter + random size
          transformedX = Math.max(5, Math.min(95, relX + (Math.random() - 0.5) * 50));
          transformedY = Math.max(5, Math.min(95, relY + (Math.random() - 0.5) * 50));
          sizeMultiplier = 0.6 + Math.random() * 0.8;
          rotationOffset = Math.random() * 360;
        }
        
        // Also move existing elements in the target panel
        setTimeout(() => {
          setSession((current) => {
            const panels = [...current.panelStates];
            const target = panels[targetPanelId];
            if (!target) return current;
            
            // Move existing elements dramatically
            const shiftedElements = target.elements.map((el) => ({
              ...el,
              x: Math.max(5, Math.min(95, el.x + (Math.random() - 0.5) * 15)),
              y: Math.max(5, Math.min(95, el.y + (Math.random() - 0.5) * 15)),
              rotation: el.rotation + (Math.random() - 0.5) * 30,
              scale: Math.max(0.5, Math.min(1.5, el.scale + (Math.random() - 0.5) * 0.2)),
            }));
            
            const transformedValue = element.value 
              ? transformText(element.value as string, targetPanelId)
              : undefined;
            
            // Add new reflected element if under limit
            const newElements = target.elements.length < 12 
              ? [
                  ...shiftedElements,
                  {
                    id: `${targetPanelId}-reflected-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    type: element.type,
                    x: transformedX,
                    y: transformedY,
                    size: element.size * sizeMultiplier,
                    rotation: element.rotation + rotationOffset,
                    opacity: Math.max(0.5, element.opacity * 0.9),
                    scale: element.scale * sizeMultiplier,
                    value: transformedValue,
                    color: element.color,
                  },
                ]
              : shiftedElements;
            
            panels[targetPanelId] = {
              ...target,
              elements: newElements,
              patternDensity: Math.min(1, target.patternDensity + 0.08),
            };
            
            return {
              ...current,
              panelStates: panels,
            };
          });
        }, 100 + index * 200);
      });
      
      return prev;
    });

    // Trigger interaction event
    handleInteraction({
      id: `drag-${Date.now()}`,
      panelId,
      type: "drag",
      elementId,
      position: { x: relX, y: relY },
      timestamp: Date.now(),
    });
  }, [session.panelStates, handleInteraction]);

  // Handle text input - create word elements in all panels with AI transformations
  const handleTextInput = useCallback(async (text: string) => {
    // First, add the original text to the first panel immediately
    setSession((prev) => {
      const newPanelStates = [...prev.panelStates];
      const panel0 = newPanelStates[0];
      if (panel0.elements.length < 10) {
        newPanelStates[0] = {
          ...panel0,
          elements: [
            ...panel0.elements,
            {
              id: `0-text-${Date.now()}`,
              type: "glyph" as const,
              x: 20 + Math.random() * 60,
              y: 20 + Math.random() * 60,
              size: 14 + Math.random() * 4,
              rotation: (Math.random() - 0.5) * 20,
              opacity: 0.7 + Math.random() * 0.3,
              scale: 1,
              value: text,
            },
          ],
          patternDensity: Math.min(1, panel0.patternDensity + 0.05),
        };
      }
      return { ...prev, panelStates: newPanelStates, interactionCount: prev.interactionCount + 1 };
    });

    // Then fetch AI transformations for other panels
    for (let panelId = 1; panelId <= 2; panelId++) {
      try {
        const response = await fetch("/api/transform-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, panelId }),
        });
        const data = await response.json();
        const transformedText = data.transformed || transformText(text, panelId);
        
        setTimeout(() => {
          setSession((prev) => {
            const newPanelStates = [...prev.panelStates];
            const panel = newPanelStates[panelId];
            if (panel.elements.length >= 10) return prev;
            
            newPanelStates[panelId] = {
              ...panel,
              elements: [
                ...panel.elements,
                {
                  id: `${panelId}-text-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                  type: "glyph" as const,
                  x: 20 + Math.random() * 60,
                  y: 20 + Math.random() * 60,
                  size: 14 + Math.random() * 4,
                  rotation: (Math.random() - 0.5) * 20,
                  opacity: 0.7 + Math.random() * 0.3,
                  scale: 1,
                  value: transformedText,
                },
              ],
              patternDensity: Math.min(1, panel.patternDensity + 0.05),
            };
            return { ...prev, panelStates: newPanelStates };
          });
        }, panelId * 400);
      } catch {
        // Fallback to local transformation
        const transformedText = transformText(text, panelId);
        setTimeout(() => {
          setSession((prev) => {
            const newPanelStates = [...prev.panelStates];
            const panel = newPanelStates[panelId];
            if (panel.elements.length >= 10) return prev;
            
            newPanelStates[panelId] = {
              ...panel,
              elements: [
                ...panel.elements,
                {
                  id: `${panelId}-text-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                  type: "glyph" as const,
                  x: 20 + Math.random() * 60,
                  y: 20 + Math.random() * 60,
                  size: 14 + Math.random() * 4,
                  rotation: (Math.random() - 0.5) * 20,
                  opacity: 0.7 + Math.random() * 0.3,
                  scale: 1,
                  value: transformedText,
                },
              ],
              patternDensity: Math.min(1, panel.patternDensity + 0.05),
            };
            return { ...prev, panelStates: newPanelStates };
          });
        }, panelId * 400);
      }
    }
  }, []);

  // Handle shape creation from drawing
  const handleShapeCreated = useCallback((
    panelId: number,
    shape: { type: "circle" | "square" | "triangle"; x: number; y: number; size: number }
  ) => {
    // Add shape to source panel
    setSession((prev) => {
      const newPanelStates = [...prev.panelStates];
      const sourcePanel = newPanelStates[panelId];
      
      if (!sourcePanel || sourcePanel.elements.length >= 10) return prev;
      
      newPanelStates[panelId] = {
        ...sourcePanel,
        elements: [
          ...sourcePanel.elements,
          {
            id: `${panelId}-drawn-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            type: shape.type,
            x: shape.x,
            y: shape.y,
            size: shape.size,
            rotation: 0,
            opacity: 0.7,
            scale: 1,
          },
        ],
        patternDensity: Math.min(1, sourcePanel.patternDensity + 0.03),
      };
      
      return {
        ...prev,
        panelStates: newPanelStates,
        interactionCount: prev.interactionCount + 1,
      };
    });

    // Create reflections in other panels
    const otherPanels = [0, 1, 2].filter((p) => p !== panelId);
    
    otherPanels.forEach((targetPanelId, index) => {
      setTimeout(() => {
        setSession((current) => {
          const panels = [...current.panelStates];
          const target = panels[targetPanelId];
          if (!target || target.elements.length >= 10) return current;
          
          let transformedX = shape.x;
          let transformedY = shape.y;
          let transformedSize = shape.size;
          let transformedType = shape.type;
          
          if (targetPanelId === 0) {
            // Inversion: mirror position
            transformedX = 100 - shape.x;
            transformedY = 100 - shape.y;
          } else if (targetPanelId === 1) {
            // Temporal: offset position
            transformedX = ((shape.x + 15) % 90) + 5;
            transformedY = ((shape.y + 15) % 90) + 5;
            transformedSize = shape.size * 0.8;
          } else {
            // Distortion: random offset + possible shape change
            transformedX = Math.max(5, Math.min(95, shape.x + (Math.random() - 0.5) * 25));
            transformedY = Math.max(5, Math.min(95, shape.y + (Math.random() - 0.5) * 25));
            const types: ("circle" | "square" | "triangle")[] = ["circle", "square", "triangle"];
            transformedType = types[Math.floor(Math.random() * types.length)];
          }
          
          panels[targetPanelId] = {
            ...target,
            elements: [
              ...target.elements,
              {
                id: `${targetPanelId}-reflected-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                type: transformedType,
                x: transformedX,
                y: transformedY,
                size: transformedSize,
                rotation: (Math.random() - 0.5) * 45,
                opacity: 0.5 + Math.random() * 0.3,
                scale: 0.9 + Math.random() * 0.2,
              },
            ],
            patternDensity: Math.min(1, target.patternDensity + 0.04),
          };
          
          return {
            ...current,
            panelStates: panels,
          };
        });
      }, 250 + index * 350);
    });
  }, []);

  const toggleDrawingMode = useCallback(() => {
    setIsDrawingMode((prev) => !prev);
  }, []);

  // Simple text similarity using word overlap (Jaccard-like)
  const calculateSimilarity = useCallback((text1: string, text2: string): number => {
    const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    if (words1.size === 0 || words2.size === 0) return 0;
    
    const arr1 = Array.from(words1);
    const arr2 = Array.from(words2);
    const intersection = arr1.filter(x => words2.has(x));
    const union = new Set([...arr1, ...arr2]);
    return intersection.length / union.size;
  }, []);

  // Helper to find non-overlapping position
  const findNonOverlappingPosition = useCallback((nodes: NetworkNode[], initialX: number, initialY: number): { x: number; y: number } => {
    const minDistance = 15;
    let x = initialX;
    let y = initialY;
    
    for (let iteration = 0; iteration < 15; iteration++) {
      let hasCollision = false;
      
      for (const other of nodes) {
        const dx = x - other.x;
        const dy = y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < minDistance) {
          hasCollision = true;
          if (dist > 0.01) {
            const overlap = minDistance - dist;
            const angle = Math.atan2(dy, dx);
            x += Math.cos(angle) * (overlap + 1);
            y += Math.sin(angle) * (overlap + 1);
          } else {
            const randomAngle = Math.random() * Math.PI * 2;
            x += Math.cos(randomAngle) * minDistance;
            y += Math.sin(randomAngle) * minDistance;
          }
        }
      }
      
      const margin = minDistance / 2;
      x = Math.max(margin, Math.min(100 - margin, x));
      y = Math.max(margin, Math.min(100 - margin, y));
      
      if (!hasCollision) break;
    }
    
    return { x, y };
  }, []);

  // Add a node to the network with automatic similarity-based connections
  const handleAddNetworkNode = useCallback((text: string) => {
    setNetworkNodes((prev) => {
      const newId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      
      // Find similar existing nodes and create connections
      const connections: string[] = [];
      const similarityThreshold = 0.15; // Lower threshold for more connections
      
      prev.forEach((existingNode) => {
        const similarity = calculateSimilarity(text, existingNode.text);
        if (similarity >= similarityThreshold) {
          connections.push(existingNode.id);
        }
      });
      
      // Calculate initial position - spread nodes in a circular pattern
      const angle = (prev.length * 137.5 * Math.PI) / 180; // Golden angle
      const radius = 15 + Math.min(prev.length * 3, 30);
      const initialX = 50 + Math.cos(angle) * radius + (Math.random() - 0.5) * 10;
      const initialY = 50 + Math.sin(angle) * radius + (Math.random() - 0.5) * 10;
      
      // Find non-overlapping position
      const { x, y } = findNonOverlappingPosition(prev, initialX, initialY);
      
      const newNode: NetworkNode = {
        id: newId,
        text,
        sentences: [text],
        x,
        y,
        connections,
        similarity: connections.length > 0 ? 
          connections.reduce((acc, connId) => {
            const node = prev.find(n => n.id === connId);
            return node ? acc + calculateSimilarity(text, node.text) : acc;
          }, 0) / connections.length : 0,
        createdAt: Date.now(),
      };
      
      // Update connections in existing nodes
      const updatedNodes = prev.map((node) => {
        if (connections.includes(node.id)) {
          return {
            ...node,
            connections: [...node.connections, newId],
          };
        }
        return node;
      });
      
      return [...updatedNodes, newNode];
    });
  }, [calculateSimilarity, findNonOverlappingPosition]);

  // Update network node position (for dragging)
  const handleUpdateNetworkNodePosition = useCallback((nodeId: string, x: number, y: number) => {
    setNetworkNodes((prev) => 
      prev.map(node => node.id === nodeId ? { ...node, x, y } : node)
    );
  }, []);

  // Batch update multiple node positions (for repulsion)
  const handleBatchUpdateNodePositions = useCallback((updates: Array<{ id: string; x: number; y: number }>) => {
    setNetworkNodes((prev) => {
      const updateMap = new Map(updates.map(u => [u.id, { x: u.x, y: u.y }]));
      return prev.map(node => {
        const update = updateMap.get(node.id);
        return update ? { ...node, x: update.x, y: update.y } : node;
      });
    });
  }, []);

  // Add a sentence to an existing node
  const handleAddSentenceToNode = useCallback((nodeId: string, sentence: string) => {
    setNetworkNodes((prev) => 
      prev.map(node => {
        if (node.id === nodeId) {
          const newSentences = [...node.sentences, sentence];
          return {
            ...node,
            sentences: newSentences,
            text: newSentences.join(' | ')
          };
        }
        return node;
      })
    );
  }, []);

  // State for generating random sentences
  const [isGeneratingNode, setIsGeneratingNode] = useState(false);

  // Random sentences to generate when clicking a node
  const randomSentences = [
    "El tiempo fluye como un rio sin fin",
    "Las estrellas guardan secretos antiguos",
    "El viento susurra historias olvidadas",
    "Los suenos tejen realidades alternas",
    "La luna ilumina caminos invisibles",
    "El mar esconde tesoros infinitos",
    "Las montanas tocan el cielo",
    "El bosque respira con vida propia",
    "Los colores danzan en el atardecer",
    "La musica conecta almas distantes",
    "El silencio habla verdades profundas",
    "Las palabras construyen mundos nuevos",
    "El amor transforma todo a su paso",
    "La memoria guarda momentos preciosos",
    "El futuro espera con puertas abiertas",
    "Las ideas vuelan como pajaros libres",
    "El conocimiento ilumina la oscuridad",
    "La creatividad rompe todas las barreras",
    "El cambio trae nuevas oportunidades",
    "La naturaleza ensena grandes lecciones",
    "Los libros abren ventanas al mundo",
    "El arte refleja el alma humana",
    "La amistad supera cualquier distancia",
    "El coraje nace del corazon valiente",
    "La esperanza florece en tiempos dificiles",
  ];

  // Handle clicking on a network node - add a random sentence to the clicked node
  const handleNetworkNodeClick = useCallback((nodeId: string) => {
    const clickedNode = networkNodes.find(n => n.id === nodeId);
    if (!clickedNode) return;

    setIsGeneratingNode(true);
    
    // Pick a random sentence and add it to the clicked node
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * randomSentences.length);
      let newSentence = randomSentences[randomIndex];
      
      // Try to include a word from the clicked node for coherence
      const clickedWords = clickedNode.text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      if (clickedWords.length > 0 && Math.random() > 0.3) {
        const randomWord = clickedWords[Math.floor(Math.random() * clickedWords.length)];
        newSentence = newSentence.replace(
          /\b\w{4,}\b/i, 
          randomWord.charAt(0).toUpperCase() + randomWord.slice(1)
        );
      }
      
      handleAddSentenceToNode(nodeId, newSentence);
      setIsGeneratingNode(false);
    }, 500);
  }, [networkNodes, handleAddSentenceToNode]);

  // Save network nodes to localStorage
  useEffect(() => {
    localStorage.setItem(NETWORK_STORAGE_KEY, JSON.stringify(networkNodes));
  }, [networkNodes]);

  useEffect(() => {
    saveSession(session);
  }, [session, saveSession]);

  useEffect(() => {
    return () => {
      pendingEffectsRef.current.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    const driftInterval = setInterval(() => {
      setSession((prev) => {
        const newPanelStates = prev.panelStates.map((panel) => ({
          ...panel,
          elements: panel.elements.map((el) => ({
            ...el,
            x: Math.max(5, Math.min(95, el.x + (Math.random() - 0.5) * 0.3)),
            y: Math.max(5, Math.min(95, el.y + (Math.random() - 0.5) * 0.3)),
            rotation: el.rotation + (Math.random() - 0.5) * 2,
          })),
        }));

        return {
          ...prev,
          panelStates: newPanelStates,
        };
      });
    }, 3000);

    return () => clearInterval(driftInterval);
  }, []);

  return {
    panelStates: session.panelStates,
    handleInteraction,
    activeElementId,
    interactionCount: session.interactionCount,
    visitCount: session.visitCount,
    patternRecognitionScore: session.patternRecognitionScore,
    interactionMode,
    handleModeChange,
    handleElementDrag,
    handleElementDragEnd,
    handleTextInput,
    handleShapeCreated,
    isDrawingMode,
    toggleDrawingMode,
    cycleBackgroundPalette,
    mutateAllElements,
    resetSession,
    handlePanelZoom,
    handleConsequence,
    intensity,
    handleIntensityChange,
    networkNodes,
    handleAddNetworkNode,
    handleAddSentenceToNode,
    handleUpdateNetworkNodePosition,
    handleBatchUpdateNodePositions,
    handleNetworkNodeClick,
    isGeneratingNode,
  };
}
