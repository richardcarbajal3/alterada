import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export type InteractionMode = "shapes" | "words" | "mixed" | "conversation" | "pattern" | "decisions" | "physics" | "gravity" | "repel" | "network";

interface OptionsMenuProps {
  currentMode: InteractionMode;
  onModeChange: (mode: InteractionMode) => void;
  patternScore: number;
  intensity: number;
  onIntensityChange: (intensity: number) => void;
}

const modeLabels: Record<InteractionMode, string> = {
  shapes: "formas",
  words: "palabras",
  mixed: "mixto",
  conversation: "conversacion",
  pattern: "patron",
  decisions: "decisiones",
  physics: "fisica",
  gravity: "gravedad",
  repel: "agua/aceite",
  network: "red neuronal",
};

export function OptionsMenu({ currentMode, onModeChange, patternScore, intensity, onIntensityChange }: OptionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const modes: InteractionMode[] = ["shapes", "words", "mixed", "conversation", "pattern", "decisions", "physics", "gravity", "repel", "network"];
  
  const intensityLabels = ["minimo", "bajo", "medio", "alto", "maximo"];

  return (
    <div className="fixed top-4 left-4 z-50">
      <motion.button
        className={cn(
          "w-8 h-8 rounded-full border border-foreground/20 bg-background/80 backdrop-blur-sm",
          "flex items-center justify-center cursor-pointer",
          "transition-all duration-300 hover:border-foreground/40",
          "focus:outline-none focus:ring-1 focus:ring-foreground/30"
        )}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Opciones"
        data-testid="button-options"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className="text-foreground/60"
        >
          <circle cx="7" cy="2" r="1.5" fill="currentColor" />
          <circle cx="7" cy="7" r="1.5" fill="currentColor" />
          <circle cx="7" cy="12" r="1.5" fill="currentColor" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              className={cn(
                "absolute top-12 left-0 z-50",
                "min-w-[140px] py-2 px-1",
                "bg-background/95 backdrop-blur-md border border-foreground/10 rounded-md"
              )}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              {modes.map((mode) => (
                <button
                  key={mode}
                  className={cn(
                    "w-full px-3 py-1.5 text-left text-xs font-mono",
                    "transition-colors duration-150 rounded-sm",
                    "focus:outline-none focus:bg-foreground/5",
                    currentMode === mode
                      ? "text-foreground bg-foreground/10"
                      : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
                  )}
                  onClick={() => {
                    onModeChange(mode);
                    setIsOpen(false);
                  }}
                  data-testid={`option-${mode}`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "w-1 h-1 rounded-full",
                        currentMode === mode ? "bg-foreground/60" : "bg-transparent"
                      )}
                    />
                    {modeLabels[mode]}
                    {mode === "pattern" && patternScore > 0.3 && (
                      <span className="ml-auto text-foreground/30">
                        {Math.round(patternScore * 100)}%
                      </span>
                    )}
                  </span>
                </button>
              ))}

              <div className="mt-2 pt-2 border-t border-foreground/5 px-3">
                <div className="text-[10px] text-foreground/30 font-mono mb-2">
                  vibracion: {intensityLabels[intensity]}
                </div>
                <div className="flex items-center gap-1">
                  {[0, 1, 2, 3, 4].map((level) => (
                    <button
                      key={level}
                      className={cn(
                        "w-4 h-4 rounded-sm transition-all duration-150",
                        "focus:outline-none",
                        level <= intensity
                          ? "bg-foreground/40"
                          : "bg-foreground/10 hover:bg-foreground/20"
                      )}
                      onClick={() => onIntensityChange(level)}
                      data-testid={`intensity-${level}`}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-foreground/5 px-3">
                <div className="text-[10px] text-foreground/30 font-mono">
                  modo: {modeLabels[currentMode]}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
