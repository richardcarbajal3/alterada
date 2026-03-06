import { useExplorerState } from "@/hooks/useExplorerState";
import { Panel } from "@/components/Panel";
import { OptionsMenu } from "@/components/OptionsMenu";
import { TextInput } from "@/components/TextInput";
import { InstallButton } from "@/components/InstallButton";
import { DecisionSystem } from "@/components/DecisionSystem";
import { NetworkView } from "@/components/NetworkView";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Explorer() {
  const { 
    panelStates, 
    handleInteraction, 
    activeElementId,
    patternRecognitionScore,
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
  } = useExplorerState();

  const showTextInput = interactionMode === "conversation";
  const showDecisions = interactionMode === "decisions";
  const showNetwork = interactionMode === "network";

  return (
    <div className="h-screen w-screen bg-background overflow-hidden">
      {/* Desktop triangular layout */}
      <div className="hidden lg:grid h-full w-full grid-cols-2 grid-rows-2">
        <Panel
          panelState={panelStates[0]}
          onInteraction={handleInteraction}
          activeElementId={activeElementId}
          className="col-span-1 row-span-1"
          mode={interactionMode}
          onElementDrag={handleElementDrag}
          onElementDragEnd={handleElementDragEnd}
          onShapeCreated={handleShapeCreated}
          isDrawingMode={isDrawingMode}
          onZoom={handlePanelZoom}
        />
        
        <Panel
          panelState={panelStates[1]}
          onInteraction={handleInteraction}
          activeElementId={activeElementId}
          className="col-span-1 row-span-1"
          mode={interactionMode}
          onElementDrag={handleElementDrag}
          onElementDragEnd={handleElementDragEnd}
          onShapeCreated={handleShapeCreated}
          isDrawingMode={isDrawingMode}
          onZoom={handlePanelZoom}
        />
        
        <Panel
          panelState={panelStates[2]}
          onInteraction={handleInteraction}
          activeElementId={activeElementId}
          className="col-span-2 row-span-1"
          mode={interactionMode}
          onElementDrag={handleElementDrag}
          onElementDragEnd={handleElementDragEnd}
          onShapeCreated={handleShapeCreated}
          isDrawingMode={isDrawingMode}
          onZoom={handlePanelZoom}
        />
      </div>

      {/* Tablet L-shaped layout */}
      <div className="hidden md:grid lg:hidden h-full w-full grid-cols-2 grid-rows-2">
        <Panel
          panelState={panelStates[0]}
          onInteraction={handleInteraction}
          activeElementId={activeElementId}
          className="col-span-1 row-span-2"
          mode={interactionMode}
          onElementDrag={handleElementDrag}
          onElementDragEnd={handleElementDragEnd}
          onShapeCreated={handleShapeCreated}
          isDrawingMode={isDrawingMode}
          onZoom={handlePanelZoom}
        />
        
        <Panel
          panelState={panelStates[1]}
          onInteraction={handleInteraction}
          activeElementId={activeElementId}
          className="col-span-1 row-span-1"
          mode={interactionMode}
          onElementDrag={handleElementDrag}
          onElementDragEnd={handleElementDragEnd}
          onShapeCreated={handleShapeCreated}
          isDrawingMode={isDrawingMode}
          onZoom={handlePanelZoom}
        />
        
        <Panel
          panelState={panelStates[2]}
          onInteraction={handleInteraction}
          activeElementId={activeElementId}
          className="col-span-1 row-span-1"
          mode={interactionMode}
          onElementDrag={handleElementDrag}
          onElementDragEnd={handleElementDragEnd}
          onShapeCreated={handleShapeCreated}
          isDrawingMode={isDrawingMode}
          onZoom={handlePanelZoom}
        />
      </div>

      {/* Mobile stacked layout */}
      <div className="flex flex-col md:hidden h-full w-full">
        <Panel
          panelState={panelStates[0]}
          onInteraction={handleInteraction}
          activeElementId={activeElementId}
          className="flex-1 min-h-[33vh]"
          mode={interactionMode}
          onElementDrag={handleElementDrag}
          onElementDragEnd={handleElementDragEnd}
          onShapeCreated={handleShapeCreated}
          isDrawingMode={isDrawingMode}
          onZoom={handlePanelZoom}
        />
        
        <Panel
          panelState={panelStates[1]}
          onInteraction={handleInteraction}
          activeElementId={activeElementId}
          className="flex-1 min-h-[33vh]"
          mode={interactionMode}
          onElementDrag={handleElementDrag}
          onElementDragEnd={handleElementDragEnd}
          onShapeCreated={handleShapeCreated}
          isDrawingMode={isDrawingMode}
          onZoom={handlePanelZoom}
        />
        
        <Panel
          panelState={panelStates[2]}
          onInteraction={handleInteraction}
          activeElementId={activeElementId}
          className="flex-1 min-h-[33vh]"
          mode={interactionMode}
          onElementDrag={handleElementDrag}
          onElementDragEnd={handleElementDragEnd}
          onShapeCreated={handleShapeCreated}
          isDrawingMode={isDrawingMode}
          onZoom={handlePanelZoom}
        />
      </div>

      {/* Control buttons */}
      <div className="fixed bottom-4 left-4 z-50 flex gap-2">
        {/* Drawing mode toggle */}
        <motion.button
          className={cn(
            "w-8 h-8 rounded-full",
            "flex items-center justify-center",
            "border border-foreground/20 bg-background/80 backdrop-blur-sm",
            "text-foreground/60 text-xs font-mono",
            "transition-all duration-200",
            isDrawingMode && "bg-foreground/10 border-foreground/40"
          )}
          onClick={toggleDrawingMode}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={isDrawingMode ? "Salir del modo dibujo" : "Modo dibujo"}
          data-testid="button-drawing-mode"
        >
          {isDrawingMode ? "×" : "✎"}
        </motion.button>

        {/* Background color toggle */}
        <motion.button
          className={cn(
            "w-8 h-8 rounded-full",
            "flex items-center justify-center",
            "border border-foreground/20 bg-background/80 backdrop-blur-sm",
            "text-foreground/60 text-xs font-mono",
            "transition-all duration-200"
          )}
          onClick={cycleBackgroundPalette}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Cambiar color de fondo"
          data-testid="button-background-color"
        >
          ◐
        </motion.button>

        {/* Mutate all elements */}
        <motion.button
          className={cn(
            "w-8 h-8 rounded-full",
            "flex items-center justify-center",
            "border border-foreground/20 bg-background/80 backdrop-blur-sm",
            "text-foreground/60 text-xs font-mono",
            "transition-all duration-200"
          )}
          onClick={mutateAllElements}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Transformar elementos"
          data-testid="button-mutate"
        >
          ⟳
        </motion.button>

        {/* Reset button */}
        <motion.button
          className={cn(
            "w-8 h-8 rounded-full",
            "flex items-center justify-center",
            "border border-foreground/20 bg-background/80 backdrop-blur-sm",
            "text-foreground/60 text-xs font-mono",
            "transition-all duration-200"
          )}
          onClick={resetSession}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Reiniciar"
          data-testid="button-reset"
        >
          ↺
        </motion.button>
      </div>

      {/* Text input for conversation mode */}
      <TextInput 
        onSubmit={handleTextInput} 
        isVisible={showTextInput} 
      />

      {/* Decision system for decisions mode */}
      <DecisionSystem
        isActive={showDecisions}
        onConsequence={handleConsequence}
      />

      {/* Network view for network mode */}
      {showNetwork && (
        <div className="fixed inset-0 z-10">
          <NetworkView
            nodes={networkNodes}
            onAddNode={handleAddNetworkNode}
            onAddSentenceToNode={handleAddSentenceToNode}
            onUpdateNodePosition={handleUpdateNetworkNodePosition}
            onBatchUpdatePositions={handleBatchUpdateNodePositions}
            onNodeClick={handleNetworkNodeClick}
            isGenerating={isGeneratingNode}
          />
        </div>
      )}

      {/* Options menu */}
      <OptionsMenu
        currentMode={interactionMode}
        onModeChange={handleModeChange}
        patternScore={patternRecognitionScore}
        intensity={intensity}
        onIntensityChange={handleIntensityChange}
      />

      {/* PWA install button */}
      <InstallButton />
    </div>
  );
}
