import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

export interface NetworkNode {
  id: string;
  text: string;
  sentences: string[];
  x: number;
  y: number;
  connections: string[];
  similarity: number;
  createdAt: number;
}

interface NetworkViewProps {
  nodes: NetworkNode[];
  onAddNode: (text: string) => void;
  onAddSentenceToNode: (nodeId: string, sentence: string) => void;
  onUpdateNodePosition: (nodeId: string, x: number, y: number) => void;
  onBatchUpdatePositions: (updates: Array<{ id: string; x: number; y: number }>) => void;
  onNodeClick: (nodeId: string) => void;
  isGenerating?: boolean;
  className?: string;
}

export function NetworkView({ nodes, onAddNode, onAddSentenceToNode, onUpdateNodePosition, onBatchUpdatePositions, onNodeClick, isGenerating, className }: NetworkViewProps) {
  const [expandedNode, setExpandedNode] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [nodeInputText, setNodeInputText] = useState("");
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const hasDraggedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const repulsionFrameRef = useRef<number | null>(null);
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  // Continuous repulsion to prevent overlapping
  useEffect(() => {
    let isRunning = true;

    const runRepulsion = () => {
      if (!isRunning) return;
      
      const currentNodes = nodesRef.current;
      if (currentNodes.length < 2 || !containerRef.current) {
        repulsionFrameRef.current = requestAnimationFrame(runRepulsion);
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const nodeWidth = 140;
      const nodeHeight = 90;
      const minDistX = (nodeWidth / rect.width) * 100 * 1.6;
      const minDistY = (nodeHeight / rect.height) * 100 * 1.6;
      
      const updates: Array<{ id: string; x: number; y: number }> = [];
      const positions = new Map(currentNodes.map(n => [n.id, { x: n.x, y: n.y }]));

      for (const node of currentNodes) {
        let newX = node.x;
        let newY = node.y;
        let totalPushX = 0;
        let totalPushY = 0;
        let collisionCount = 0;

        for (const other of currentNodes) {
          if (other.id === node.id) continue;
          
          const otherPos = positions.get(other.id) || { x: other.x, y: other.y };
          const dx = newX - otherPos.x;
          const dy = newY - otherPos.y;

          const overlapX = Math.abs(dx) < minDistX;
          const overlapY = Math.abs(dy) < minDistY;

          if (overlapX && overlapY) {
            collisionCount++;
            const gapX = minDistX - Math.abs(dx);
            const gapY = minDistY - Math.abs(dy);
            
            if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
              const angle = (node.id > other.id ? 0.5 : -0.5) * Math.PI + Math.random() * 0.2;
              totalPushX += Math.cos(angle) * minDistX * 0.5;
              totalPushY += Math.sin(angle) * minDistY * 0.5;
            } else {
              const pushX = (dx >= 0 ? 1 : -1) * gapX * 0.5;
              const pushY = (dy >= 0 ? 1 : -1) * gapY * 0.5;
              totalPushX += pushX;
              totalPushY += pushY;
            }
          }
        }

        if (collisionCount > 0) {
          newX += totalPushX / collisionCount;
          newY += totalPushY / collisionCount;
          
          const marginX = minDistX * 0.25;
          const marginY = minDistY * 0.25;
          newX = Math.max(marginX, Math.min(100 - marginX, newX));
          newY = Math.max(marginY, Math.min(100 - marginY, newY));
          updates.push({ id: node.id, x: newX, y: newY });
          positions.set(node.id, { x: newX, y: newY });
        }
      }

      if (updates.length > 0) {
        onBatchUpdatePositions(updates);
      }

      repulsionFrameRef.current = requestAnimationFrame(runRepulsion);
    };

    repulsionFrameRef.current = requestAnimationFrame(runRepulsion);

    return () => {
      isRunning = false;
      if (repulsionFrameRef.current) {
        cancelAnimationFrame(repulsionFrameRef.current);
      }
    };
  }, [onBatchUpdatePositions]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onAddNode(inputText.trim());
      setInputText("");
    }
  }, [inputText, onAddNode]);

  const handleNodeClick = useCallback((nodeId: string) => {
    if (!draggingNode) {
      onNodeClick(nodeId);
      setExpandedNode(prev => prev === nodeId ? null : nodeId);
    }
  }, [draggingNode, onNodeClick]);

  const checkCollision = useCallback((nodeId: string, newX: number, newY: number): { x: number; y: number } => {
    if (!containerRef.current) return { x: newX, y: newY };
    
    const rect = containerRef.current.getBoundingClientRect();
    const nodeWidth = 130;
    const nodeHeight = 80;
    
    const minDistX = (nodeWidth / rect.width) * 100 * 1.4;
    const minDistY = (nodeHeight / rect.height) * 100 * 1.4;
    
    let adjustedX = newX;
    let adjustedY = newY;
    
    for (let iteration = 0; iteration < 25; iteration++) {
      let hasCollision = false;
      
      for (const other of nodes) {
        if (other.id === nodeId) continue;
        
        const dx = adjustedX - other.x;
        const dy = adjustedY - other.y;
        
        const overlapX = Math.abs(dx) < minDistX;
        const overlapY = Math.abs(dy) < minDistY;
        
        if (overlapX && overlapY) {
          hasCollision = true;
          
          const gapX = minDistX - Math.abs(dx);
          const gapY = minDistY - Math.abs(dy);
          
          if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
            const randomAngle = Math.random() * Math.PI * 2;
            adjustedX += Math.cos(randomAngle) * minDistX * 0.6;
            adjustedY += Math.sin(randomAngle) * minDistY * 0.6;
          } else {
            const pushStrength = 0.55;
            if (gapX < gapY) {
              adjustedX += (dx >= 0 ? 1 : -1) * gapX * pushStrength;
            } else {
              adjustedY += (dy >= 0 ? 1 : -1) * gapY * pushStrength;
            }
          }
        }
      }
      
      const marginX = minDistX * 0.35;
      const marginY = minDistY * 0.35;
      adjustedX = Math.max(marginX, Math.min(100 - marginX, adjustedX));
      adjustedY = Math.max(marginY, Math.min(100 - marginY, adjustedY));
      
      if (!hasCollision) break;
    }
    
    return { x: adjustedX, y: adjustedY };
  }, [nodes]);

  const getNodeColor = (similarity: number) => {
    const hue = 200 + similarity * 60;
    return `hsl(${hue}, 50%, 50%)`;
  };

  const visibleConnections = useMemo(() => {
    const connections: { from: NetworkNode; to: NetworkNode }[] = [];
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    nodes.forEach(node => {
      node.connections.forEach(connId => {
        const targetNode = nodeMap.get(connId);
        if (targetNode && node.id < connId) {
          connections.push({ from: node, to: targetNode });
        }
      });
    });
    
    return connections;
  }, [nodes]);

  const expandedNodeData = expandedNode ? nodes.find(n => n.id === expandedNode) : null;
  const connectedNodes = expandedNodeData 
    ? nodes.filter(n => expandedNodeData.connections.includes(n.id))
    : [];

  return (
    <div ref={containerRef} className={cn("relative w-full h-full overflow-hidden bg-background/50", className)}>
      {isGenerating && (
        <div className="absolute top-4 right-4 z-40 flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-md border border-foreground/20">
          <motion.div 
            className="w-2 h-2 rounded-full bg-foreground/60"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span className="text-[10px] font-mono text-foreground/60">generando...</span>
        </div>
      )}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="neuron-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
            <stop offset="50%" stopColor="currentColor" stopOpacity="0.4" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        
        {visibleConnections.map(({ from, to }, idx) => {
          const isHighlighted = 
            hoveredNode === from.id || 
            hoveredNode === to.id ||
            expandedNode === from.id ||
            expandedNode === to.id;
          
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;
          const curvature = 5 + Math.sin(idx * 0.5) * 3;
          const controlX = midX + Math.cos(idx) * curvature;
          const controlY = midY + Math.sin(idx) * curvature;
          
          return (
            <g key={`${from.id}-${to.id}`}>
              <motion.path
                d={`M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={isHighlighted ? 0.5 : 0.2}
                vectorEffect="non-scaling-stroke"
                className={cn(
                  "text-foreground/30 transition-all duration-300",
                  isHighlighted && "text-foreground/60"
                )}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, delay: idx * 0.05 }}
              />
              
              {isHighlighted && (
                <motion.circle
                  cx={midX}
                  cy={midY}
                  r="0.8"
                  fill="currentColor"
                  className="text-foreground/60"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </g>
          );
        })}
      </svg>

      {nodes.map((node, idx) => {
        const isExpanded = expandedNode === node.id;
        const isConnectedToExpanded = expandedNodeData?.connections.includes(node.id);
        const isHovered = hoveredNode === node.id;
        const isDragging = draggingNode === node.id;
        
        return (
          <motion.div
            key={node.id}
            className={cn(
              "absolute select-none touch-none",
              "transform -translate-x-1/2 -translate-y-1/2",
              isDragging ? "cursor-grabbing z-50" : "cursor-grab"
            )}
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: 1, 
              scale: isDragging ? 1.15 : isExpanded ? 1.2 : isConnectedToExpanded ? 1.1 : 1,
              zIndex: isDragging ? 50 : isExpanded ? 20 : isConnectedToExpanded ? 10 : 1
            }}
            transition={{ 
              duration: 0.3, 
              delay: idx * 0.05,
              type: "spring",
              stiffness: 300
            }}
            drag
            dragMomentum={false}
            dragElastic={0}
            onDragStart={() => {
              setDraggingNode(node.id);
              hasDraggedRef.current = false;
            }}
            onDrag={(e, info) => {
              if (!containerRef.current) return;
              hasDraggedRef.current = true;
              const rect = containerRef.current.getBoundingClientRect();
              const newX = ((info.point.x - rect.left) / rect.width) * 100;
              const newY = ((info.point.y - rect.top) / rect.height) * 100;
              const adjusted = checkCollision(node.id, newX, newY);
              onUpdateNodePosition(node.id, adjusted.x, adjusted.y);
            }}
            onDragEnd={(e, info) => {
              setDraggingNode(null);
              
              if (!containerRef.current || !hasDraggedRef.current) return;
              
              const rect = containerRef.current.getBoundingClientRect();
              const newX = ((info.point.x - rect.left) / rect.width) * 100;
              const newY = ((info.point.y - rect.top) / rect.height) * 100;
              const adjusted = checkCollision(node.id, newX, newY);
              onUpdateNodePosition(node.id, adjusted.x, adjusted.y);
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (!hasDraggedRef.current) {
                onNodeClick(node.id);
                setExpandedNode(prev => prev === node.id ? null : node.id);
              }
              hasDraggedRef.current = false;
            }}
            onMouseEnter={() => !isDragging && setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
            data-testid={`network-node-${node.id}`}
          >
            <motion.div
              className={cn(
                "relative rounded-md border transition-all duration-200",
                "flex items-center justify-center",
                isExpanded 
                  ? "bg-foreground/20 border-foreground/40 shadow-lg" 
                  : isConnectedToExpanded
                    ? "bg-foreground/15 border-foreground/30"
                    : "bg-foreground/10 border-foreground/20",
                isHovered && !isExpanded && "bg-foreground/15 border-foreground/30"
              )}
              style={{
                width: isExpanded ? 180 : 100,
                height: isExpanded ? 80 : 50,
                borderColor: isExpanded ? getNodeColor(node.similarity) : undefined
              }}
              layout
            >
              <span 
                className={cn(
                  "font-mono text-center px-2 break-words overflow-hidden",
                  isExpanded ? "text-xs" : "text-[10px]",
                  "text-foreground/80"
                )}
                style={{ 
                  display: "-webkit-box",
                  WebkitLineClamp: isExpanded ? 3 : 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden"
                }}
              >
                {node.text}
              </span>
              
              {node.sentences && node.sentences.length > 1 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary/60 text-[8px] flex items-center justify-center text-primary-foreground font-bold">
                  {node.sentences.length}
                </span>
              )}
              {node.connections.length > 0 && !isExpanded && !node.sentences?.length && (
                <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-foreground/30 text-[8px] flex items-center justify-center text-foreground/70">
                  {node.connections.length}
                </span>
              )}
            </motion.div>
          </motion.div>
        );
      })}

      <AnimatePresence>
        {expandedNodeData && (
          <motion.div
            className="fixed bottom-24 left-4 right-4 md:left-auto md:right-4 md:w-80 z-30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="bg-background/95 backdrop-blur-md border border-foreground/20 rounded-md p-3">
              {expandedNodeData.sentences && expandedNodeData.sentences.length > 0 && (
                <>
                  <div className="text-[10px] text-foreground/40 font-mono mb-2">
                    oraciones ({expandedNodeData.sentences.length})
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto mb-3">
                    {expandedNodeData.sentences.map((sentence, idx) => (
                      <div
                        key={idx}
                        className="p-2 text-xs font-mono text-foreground/80 bg-foreground/5 rounded"
                        data-testid={`sentence-${idx}`}
                      >
                        {sentence}
                      </div>
                    ))}
                  </div>
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (nodeInputText.trim() && expandedNodeData) {
                        onAddSentenceToNode(expandedNodeData.id, nodeInputText.trim());
                        setNodeInputText("");
                      }
                    }}
                    className="mb-3"
                  >
                    <input
                      type="text"
                      value={nodeInputText}
                      onChange={(e) => setNodeInputText(e.target.value)}
                      placeholder="agregar oracion..."
                      className={cn(
                        "w-full px-3 py-1.5 bg-foreground/5",
                        "border border-foreground/20 rounded",
                        "text-xs font-mono text-foreground/80 placeholder:text-foreground/30",
                        "focus:outline-none focus:border-foreground/40"
                      )}
                      data-testid="node-sentence-input"
                    />
                  </form>
                </>
              )}
              {connectedNodes.length > 0 && (
                <>
                  <div className="text-[10px] text-foreground/40 font-mono mb-2">
                    conexiones ({connectedNodes.length})
                  </div>
                  <div className="space-y-2 max-h-24 overflow-y-auto">
                    {connectedNodes.map(cn => (
                      <button
                        key={cn.id}
                        className="w-full text-left p-2 text-xs font-mono text-foreground/70 bg-foreground/5 rounded hover:bg-foreground/10 transition-colors"
                        onClick={() => handleNodeClick(cn.id)}
                        data-testid={`connected-node-${cn.id}`}
                      >
                        {cn.text}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-20">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="escribe una oracion..."
          className={cn(
            "w-full px-4 py-2 bg-background/80 backdrop-blur-sm",
            "border border-foreground/20 rounded-md",
            "text-sm font-mono text-foreground/80 placeholder:text-foreground/30",
            "focus:outline-none focus:border-foreground/40",
            "transition-all duration-200"
          )}
          data-testid="network-input"
        />
      </form>

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-foreground/20 font-mono text-sm mb-2">
              red vacia
            </div>
            <div className="text-foreground/10 font-mono text-xs">
              escribe oraciones para crear nodos
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
