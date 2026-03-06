import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface TextInputProps {
  onSubmit: (text: string) => void;
  isVisible: boolean;
}

export function TextInput({ onSubmit, isVisible }: TextInputProps) {
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text.trim());
      setText("");
    }
  }, [text, onSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && text.trim()) {
      onSubmit(text.trim());
      setText("");
    }
  }, [text, onSubmit]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-16 left-1/2 z-50"
          initial={{ opacity: 0, y: 20, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: 20, x: "-50%" }}
          transition={{ duration: 0.2 }}
        >
          <form onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="escribe una oracion..."
              className={cn(
                "w-72 px-4 py-2 text-sm font-mono",
                "bg-background/95 backdrop-blur-md",
                "border border-foreground/20 rounded-md",
                "text-foreground placeholder:text-foreground/40",
                "focus:outline-none focus:border-foreground/40",
                "transition-all duration-200",
                isFocused && "w-96"
              )}
              data-testid="input-text"
            />
          </form>
          <div className="mt-1 text-[10px] text-foreground/30 font-mono text-center">
            presiona enter para reflejar
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
