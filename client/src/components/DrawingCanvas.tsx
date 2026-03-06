import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ShapeType = "circle" | "square" | "triangle";

interface DrawingCanvasProps {
  isActive: boolean;
  onShapeCreated: (shape: {
    type: ShapeType;
    x: number;
    y: number;
    size: number;
  }) => void;
  panelId: number;
}

export function DrawingCanvas({ isActive, onShapeCreated, panelId }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentSize, setCurrentSize] = useState(0);
  const [shapeType, setShapeType] = useState<ShapeType>("circle");

  const getRelativePosition = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isActive) return;
    const pos = getRelativePosition(e.clientX, e.clientY);
    setStartPoint(pos);
    setIsDrawing(true);
    setCurrentSize(0);
  }, [isActive, getRelativePosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !startPoint) return;
    const pos = getRelativePosition(e.clientX, e.clientY);
    const dx = pos.x - startPoint.x;
    const dy = pos.y - startPoint.y;
    const size = Math.sqrt(dx * dx + dy * dy) * 2;
    setCurrentSize(Math.min(100, Math.max(10, size)));
  }, [isDrawing, startPoint, getRelativePosition]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !startPoint || currentSize < 15) {
      setIsDrawing(false);
      setStartPoint(null);
      return;
    }

    onShapeCreated({
      type: shapeType,
      x: startPoint.x,
      y: startPoint.y,
      size: currentSize,
    });

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentSize(0);
  }, [isDrawing, startPoint, currentSize, shapeType, onShapeCreated]);

  const cycleShapeType = useCallback(() => {
    const types: ShapeType[] = ["circle", "square", "triangle"];
    const currentIndex = types.indexOf(shapeType);
    setShapeType(types[(currentIndex + 1) % types.length]);
  }, [shapeType]);

  if (!isActive) return null;

  return (
    <div
      ref={canvasRef}
      className="absolute inset-0 z-10"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {isDrawing && startPoint && (
        <div
          className={cn(
            "absolute pointer-events-none border border-foreground/40",
            shapeType === "circle" && "rounded-full",
            shapeType === "square" && "rounded-none",
            shapeType === "triangle" && "border-0"
          )}
          style={{
            left: `${startPoint.x}%`,
            top: `${startPoint.y}%`,
            width: currentSize,
            height: currentSize,
            transform: "translate(-50%, -50%)",
          }}
        >
          {shapeType === "triangle" && (
            <svg
              width={currentSize}
              height={currentSize}
              viewBox="0 0 100 100"
              className="overflow-visible"
            >
              <polygon
                points="50,10 90,90 10,90"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="stroke-foreground/40"
              />
            </svg>
          )}
        </div>
      )}

      <motion.button
        className={cn(
          "absolute bottom-2 right-2 w-8 h-8",
          "flex items-center justify-center",
          "border border-foreground/20 rounded-full",
          "bg-background/80 backdrop-blur-sm",
          "text-foreground/60 text-xs font-mono"
        )}
        onClick={cycleShapeType}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        data-testid={`button-shape-type-${panelId}`}
      >
        {shapeType === "circle" && "○"}
        {shapeType === "square" && "□"}
        {shapeType === "triangle" && "△"}
      </motion.button>
    </div>
  );
}
