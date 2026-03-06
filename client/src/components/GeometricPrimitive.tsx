import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface GeometricPrimitiveProps {
  type: "circle" | "square" | "triangle" | "line" | "glyph";
  x: number;
  y: number;
  size: number;
  rotation: number;
  opacity: number;
  scale: number;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onDrag?: (x: number, y: number) => void;
  onDragEnd?: (x: number, y: number) => void;
  isActive?: boolean;
  panelId: number;
  value?: string;
  isDraggable?: boolean;
  color?: string;
}

export function GeometricPrimitive({
  type,
  x,
  y,
  size,
  rotation,
  opacity,
  scale,
  onClick,
  onMouseEnter,
  onDrag,
  onDragEnd,
  isActive,
  panelId,
  value,
  isDraggable = true,
  color,
}: GeometricPrimitiveProps) {
  const baseClasses = cn(
    "absolute cursor-pointer transition-colors duration-300",
    "focus:outline-none focus:ring-1 focus:ring-foreground/20 focus:ring-offset-2",
    isActive && "animate-causality",
    isDraggable && "cursor-grab active:cursor-grabbing"
  );

  const baseStyle = {
    left: `${x}%`,
    top: `${y}%`,
    transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
    opacity,
  };

  const colorStyle = color 
    ? { borderColor: color, backgroundColor: `${color}20` }
    : {};

  const style = { ...baseStyle, ...colorStyle };

  const panelColors = [
    "border-foreground/30 bg-foreground/5",
    "border-foreground/25 bg-foreground/8",
    "border-foreground/35 bg-foreground/3",
  ];

  const colorClass = color ? "" : (panelColors[panelId] || panelColors[0]);

  const dragProps = isDraggable ? {
    drag: true,
    dragMomentum: false,
    dragElastic: 0,
    onDrag: (_: any, info: any) => {
      if (onDrag) {
        onDrag(info.point.x, info.point.y);
      }
    },
    onDragEnd: (_: any, info: any) => {
      if (onDragEnd) {
        onDragEnd(info.point.x, info.point.y);
      }
    },
    whileDrag: { scale: scale * 1.1, zIndex: 50 },
  } : {};

  if (type === "glyph" && value) {
    return (
      <motion.div
        className={cn(
          baseClasses,
          "text-foreground/70 font-mono select-none",
          "px-2 py-1 rounded-sm border border-foreground/10 bg-foreground/5"
        )}
        style={{ ...style, fontSize: size }}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        whileHover={{ scale: scale * 1.05 }}
        whileTap={{ scale: scale * 0.95 }}
        tabIndex={0}
        role="button"
        aria-label={`Interactive word: ${value}`}
        data-testid={`primitive-word-${panelId}`}
        {...dragProps}
      >
        {value}
      </motion.div>
    );
  }

  if (type === "circle") {
    return (
      <motion.div
        className={cn(baseClasses, colorClass, "rounded-full border")}
        style={{ ...style, width: size, height: size }}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        whileHover={{ scale: scale * 1.03 }}
        whileTap={{ scale: scale * 0.97 }}
        tabIndex={0}
        role="button"
        aria-label="Interactive circle element"
        data-testid={`primitive-circle-${panelId}`}
        {...dragProps}
      />
    );
  }

  if (type === "square") {
    return (
      <motion.div
        className={cn(baseClasses, colorClass, "border")}
        style={{ ...style, width: size, height: size }}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        whileHover={{ scale: scale * 1.03 }}
        whileTap={{ scale: scale * 0.97 }}
        tabIndex={0}
        role="button"
        aria-label="Interactive square element"
        data-testid={`primitive-square-${panelId}`}
        {...dragProps}
      />
    );
  }

  if (type === "triangle") {
    const triangleStroke = color || undefined;
    return (
      <motion.div
        className={cn(baseClasses, "border-0")}
        style={baseStyle}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        whileHover={{ scale: scale * 1.03 }}
        whileTap={{ scale: scale * 0.97 }}
        tabIndex={0}
        role="button"
        aria-label="Interactive triangle element"
        data-testid={`primitive-triangle-${panelId}`}
        {...dragProps}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className="overflow-visible pointer-events-none"
        >
          <polygon
            points="50,10 90,90 10,90"
            fill={color ? `${color}20` : "none"}
            stroke={triangleStroke || "currentColor"}
            strokeWidth="1"
            className={cn(
              !color && panelId === 0 && "stroke-foreground/30",
              !color && panelId === 1 && "stroke-foreground/25",
              !color && panelId === 2 && "stroke-foreground/35"
            )}
          />
        </svg>
      </motion.div>
    );
  }

  if (type === "line") {
    return (
      <motion.div
        className={cn(baseClasses, "h-px bg-foreground/20")}
        style={{ ...style, width: size }}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        tabIndex={0}
        role="button"
        aria-label="Interactive line element"
        data-testid={`primitive-line-${panelId}`}
        {...dragProps}
      />
    );
  }

  return null;
}
