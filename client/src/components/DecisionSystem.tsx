import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Decision {
  id: string;
  question: string;
  options: {
    id: string;
    text: string;
    consequence: "war" | "peace" | "chaos" | "growth" | "decay" | "merge";
  }[];
}

interface DecisionSystemProps {
  isActive: boolean;
  onConsequence: (type: string, intensity: number) => void;
}

const DECISIONS: Decision[] = [
  {
    id: "conflict",
    question: ":: Elige tu camino ::",
    options: [
      { id: "a", text: "[X] Destruir", consequence: "war" },
      { id: "b", text: "[O] Preservar", consequence: "peace" },
      { id: "c", text: "[~] Fragmentar", consequence: "chaos" },
    ],
  },
  {
    id: "power",
    question: ":: Que deseas ::",
    options: [
      { id: "a", text: "[+] Expandir", consequence: "growth" },
      { id: "b", text: "[-] Reducir", consequence: "decay" },
      { id: "c", text: "[=] Fusionar", consequence: "merge" },
    ],
  },
  {
    id: "fate",
    question: ":: Tu destino ::",
    options: [
      { id: "a", text: "[/] Luz", consequence: "growth" },
      { id: "b", text: "[\\] Sombra", consequence: "decay" },
      { id: "c", text: "[!] Caos", consequence: "chaos" },
    ],
  },
  {
    id: "war",
    question: ":: La guerra es inevitable ::",
    options: [
      { id: "a", text: "[>>] Atacar", consequence: "war" },
      { id: "b", text: "[<<] Defender", consequence: "peace" },
      { id: "c", text: "[XX] Destruir todo", consequence: "chaos" },
    ],
  },
];

export function DecisionSystem({ isActive, onConsequence }: DecisionSystemProps) {
  const [currentDecision, setCurrentDecision] = useState<Decision | null>(null);
  const [showConsequence, setShowConsequence] = useState<string | null>(null);
  const [consequenceColor, setConsequenceColor] = useState("#ffffff");

  const consequenceMessages: Record<string, { text: string; color: string }> = {
    war: { text: "/// GUERRA ///", color: "#ff3333" },
    peace: { text: "::: PAZ :::", color: "#33ff88" },
    chaos: { text: "!!! CAOS !!!", color: "#ff33ff" },
    growth: { text: "+++ CRECIMIENTO +++", color: "#33ffff" },
    decay: { text: "--- DECAIMIENTO ---", color: "#8833ff" },
    merge: { text: "=== FUSION ===", color: "#ffff33" },
  };

  // Clear state when mode changes
  useEffect(() => {
    if (!isActive) {
      setShowConsequence(null);
      setCurrentDecision(null);
    }
  }, [isActive]);

  const presentNewDecision = useCallback(() => {
    const randomDecision = DECISIONS[Math.floor(Math.random() * DECISIONS.length)];
    setCurrentDecision(randomDecision);
  }, []);

  useEffect(() => {
    if (!isActive) {
      setCurrentDecision(null);
      return;
    }
    
    presentNewDecision();
    
    const interval = setInterval(() => {
      if (!showConsequence) {
        presentNewDecision();
      }
    }, 8000 + Math.random() * 4000);
    
    return () => clearInterval(interval);
  }, [isActive, presentNewDecision, showConsequence]);

  const handleChoice = useCallback((consequence: string) => {
    const info = consequenceMessages[consequence];
    setShowConsequence(info.text);
    setConsequenceColor(info.color);
    
    // Trigger consequence in panels
    const intensityMap: Record<string, number> = {
      war: 1.0,
      peace: 0.3,
      chaos: 0.9,
      growth: 0.6,
      decay: 0.5,
      merge: 0.7,
    };
    
    onConsequence(consequence, intensityMap[consequence] || 0.5);
    
    // Clear consequence message and show new decision
    setTimeout(() => {
      setShowConsequence(null);
      presentNewDecision();
    }, 2000);
  }, [onConsequence, presentNewDecision]);

  if (!isActive) return null;

  return (
    <>
      {/* Consequence flash - full screen overlay */}
      <AnimatePresence>
        {showConsequence && (
          <motion.div
            key="consequence"
            className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1.5 }}
              exit={{ scale: 3, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-6xl font-bold tracking-widest"
              style={{ 
                color: consequenceColor,
                textShadow: `0 0 30px ${consequenceColor}, 0 0 60px ${consequenceColor}`,
              }}
            >
              {showConsequence}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decision options - bottom left corner, compact */}
      <AnimatePresence>
        {currentDecision && !showConsequence && (
          <motion.div
            key={currentDecision.id}
            className="fixed bottom-4 left-4 z-40 pointer-events-auto"
            initial={{ opacity: 0, x: -20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-black/70 backdrop-blur-sm border border-white/20 rounded-lg p-3 max-w-[200px]">
              <div className="text-white/60 text-xs font-mono tracking-wider mb-2 text-center">
                {currentDecision.question}
              </div>
              
              <div className="space-y-1">
                {currentDecision.options.map((option) => (
                  <motion.button
                    key={option.id}
                    className={cn(
                      "w-full py-1.5 px-2 text-left font-mono text-xs",
                      "bg-white/5 border border-white/10 rounded",
                      "hover:bg-white/15 hover:border-white/30",
                      "transition-all duration-150",
                      "text-white/70 hover:text-white"
                    )}
                    onClick={() => handleChoice(option.consequence)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    data-testid={`decision-${option.id}`}
                  >
                    {option.text}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
