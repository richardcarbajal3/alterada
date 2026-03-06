import { useCallback, useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { PanelState, InteractionEvent } from "@shared/schema";
import type { InteractionMode } from "./OptionsMenu";
import { GeometricPrimitive } from "./GeometricPrimitive";
import { Glyph } from "./Glyph";
import { DrawingCanvas } from "./DrawingCanvas";
import { getPanelLogicName } from "@/lib/panelLogic";

interface RippleEffect {
  id: string;
  x: number;
  y: number;
}

interface PanelProps {
  panelState: PanelState;
  onInteraction: (event: InteractionEvent) => void;
  activeElementId: string | null;
  className?: string;
  mode?: InteractionMode;
  onElementDrag?: (panelId: number, elementId: string, relX: number, relY: number) => void;
  onElementDragEnd?: (panelId: number, elementId: string, relX: number, relY: number) => void;
  onShapeCreated?: (panelId: number, shape: { type: "circle" | "square" | "triangle"; x: number; y: number; size: number }) => void;
  isDrawingMode?: boolean;
  onZoom?: (panelId: number, delta: number) => void;
}

export function Panel({
  panelState,
  onInteraction,
  activeElementId,
  className,
  mode = "shapes",
  onElementDrag,
  onElementDragEnd,
  onShapeCreated,
  isDrawingMode = false,
  onZoom,
}: PanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [ripples, setRipples] = useState<RippleEffect[]>([]);
  const [glowIntensity, setGlowIntensity] = useState(0);
  
  // Clean up ripples after animation
  useEffect(() => {
    if (ripples.length > 0) {
      const timer = setTimeout(() => {
        setRipples((prev) => prev.slice(1));
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [ripples]);

  // Periodic glow pulse effect - each panel pulses differently
  useEffect(() => {
    const pulseGlow = () => {
      const baseDelay = panelState.id === 0 ? 3000 : panelState.id === 1 ? 5000 : 1500;
      const randomDelay = baseDelay + Math.random() * 2000;
      
      setGlowIntensity(panelState.id === 2 ? 0.4 : 0.25);
      setTimeout(() => setGlowIntensity(0), panelState.id === 2 ? 150 : 400);
      
      return setTimeout(pulseGlow, randomDelay);
    };
    
    const initialDelay = setTimeout(pulseGlow, 1000 + Math.random() * 2000);
    return () => clearTimeout(initialDelay);
  }, [panelState.id]);
  
  const addRipple = useCallback((x: number, y: number) => {
    setRipples((prev) => [...prev.slice(-3), { id: `${Date.now()}-${Math.random()}`, x, y }]);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!onZoom) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    onZoom(panelState.id, delta);
  }, [onZoom, panelState.id]);

  const convertToRelative = useCallback((viewportX: number, viewportY: number) => {
    if (!panelRef.current) return { x: 50, y: 50 };
    const rect = panelRef.current.getBoundingClientRect();
    const relX = ((viewportX - rect.left) / rect.width) * 100;
    const relY = ((viewportY - rect.top) / rect.height) * 100;
    return {
      x: Math.max(5, Math.min(95, relX)),
      y: Math.max(5, Math.min(95, relY)),
    };
  }, []);
  
  const handleElementClick = useCallback(
    (elementId: string, x: number, y: number) => {
      if (isDrawingMode) return;
      const event: InteractionEvent = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        panelId: panelState.id,
        type: "click",
        elementId,
        position: { x, y },
        timestamp: Date.now(),
      };
      onInteraction(event);
    },
    [panelState.id, onInteraction, isDrawingMode]
  );

  const handleElementHover = useCallback(
    (elementId: string, x: number, y: number) => {
      if (isDrawingMode) return;
      const event: InteractionEvent = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        panelId: panelState.id,
        type: "hover",
        elementId,
        position: { x, y },
        timestamp: Date.now(),
      };
      onInteraction(event);
    },
    [panelState.id, onInteraction, isDrawingMode]
  );

  const handlePanelClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isDrawingMode) return;
      if (e.target === panelRef.current) {
        const { x, y } = convertToRelative(e.clientX, e.clientY);
        
        const event: InteractionEvent = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          panelId: panelState.id,
          type: "click",
          elementId: "panel-bg",
          position: { x, y },
          timestamp: Date.now(),
        };
        onInteraction(event);
      }
    },
    [panelState.id, onInteraction, isDrawingMode, convertToRelative]
  );

  const handleDrag = useCallback(
    (elementId: string, viewportX: number, viewportY: number) => {
      if (!onElementDrag) return;
      const { x, y } = convertToRelative(viewportX, viewportY);
      onElementDrag(panelState.id, elementId, x, y);
    },
    [panelState.id, onElementDrag, convertToRelative]
  );

  const handleDragEnd = useCallback(
    (elementId: string, viewportX: number, viewportY: number) => {
      if (!onElementDragEnd) return;
      const { x, y } = convertToRelative(viewportX, viewportY);
      addRipple(x, y);
      onElementDragEnd(panelState.id, elementId, x, y);
    },
    [panelState.id, onElementDragEnd, convertToRelative, addRipple]
  );

  const handleShapeCreated = useCallback(
    (shape: { type: "circle" | "square" | "triangle"; x: number; y: number; size: number }) => {
      if (onShapeCreated) {
        onShapeCreated(panelState.id, shape);
      }
    },
    [panelState.id, onShapeCreated]
  );

  const patternOpacity = panelState.patternDensity * 0.15;
  const zoomLevel = panelState.zoomLevel || 1;

  // Panel-specific glow colors
  const glowColors = ["#00ffff", "#8855ff", "#ff3366"];
  const glowColor = glowColors[panelState.id] || "#ffffff";

  const panelStyle: React.CSSProperties = {
    ...(panelState.backgroundColor ? { backgroundColor: panelState.backgroundColor } : {}),
    boxShadow: glowIntensity > 0 
      ? `inset 0 0 ${30 * glowIntensity}px ${glowColor}${Math.round(glowIntensity * 80).toString(16).padStart(2, '0')}, 0 0 ${20 * glowIntensity}px ${glowColor}${Math.round(glowIntensity * 60).toString(16).padStart(2, '0')}`
      : undefined,
    transition: "box-shadow 0.15s ease-out",
  };

  return (
    <motion.div
      ref={panelRef}
      className={cn(
        "relative overflow-hidden border border-foreground/5",
        isDrawingMode ? "cursor-crosshair" : "cursor-default",
        "select-none",
        !panelState.backgroundColor && "bg-background",
        className
      )}
      style={panelStyle}
      onClick={handlePanelClick}
      onWheel={handleWheel}
      aria-label={`Zone ${panelState.id + 1}`}
      tabIndex={0}
      data-testid={`panel-${panelState.id}`}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, hsl(var(--foreground) / ${patternOpacity}) 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
      />
      
      <div
        className="absolute top-2 left-2 w-1 h-1 rounded-full bg-foreground/10"
        title={getPanelLogicName(panelState.id)}
      />

      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.div
            key={ripple.id}
            className="absolute pointer-events-none rounded-full border-2"
            style={{
              left: `${ripple.x}%`,
              top: `${ripple.y}%`,
              transform: "translate(-50%, -50%)",
              borderColor: panelState.id === 0 ? "#00ffff" : panelState.id === 1 ? "#ff00ff" : "#ffff00",
            }}
            initial={{ width: "0%", height: "0%", opacity: 0.8 }}
            animate={{ 
              width: "60%", 
              height: "60%", 
              opacity: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>

      {panelState.glyphs.map((glyph) => (
        <Glyph
          key={glyph.id}
          symbol={glyph.symbol}
          x={glyph.x}
          y={glyph.y}
          opacity={glyph.opacity}
        />
      ))}

      {panelState.elements.map((element) => (
        <GeometricPrimitive
          key={element.id}
          type={element.type}
          x={element.x}
          y={element.y}
          size={element.size * zoomLevel}
          rotation={element.rotation}
          opacity={element.opacity}
          scale={element.scale * zoomLevel}
          onClick={() => handleElementClick(element.id, element.x, element.y)}
          onMouseEnter={() => handleElementHover(element.id, element.x, element.y)}
          onDrag={(vx, vy) => handleDrag(element.id, vx, vy)}
          onDragEnd={(vx, vy) => handleDragEnd(element.id, vx, vy)}
          isActive={activeElementId === element.id}
          panelId={panelState.id}
          value={element.value as string | undefined}
          isDraggable={!isDrawingMode}
          color={element.color}
        />
      ))}

      <DrawingCanvas
        isActive={isDrawingMode}
        onShapeCreated={handleShapeCreated}
        panelId={panelState.id}
      />
    </motion.div>
  );
}
