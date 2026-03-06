import { motion } from "framer-motion";

interface GlyphProps {
  symbol: string;
  x: number;
  y: number;
  opacity: number;
}

export function Glyph({ symbol, x, y, opacity }: GlyphProps) {
  return (
    <motion.div
      className="absolute text-xs text-foreground/40 pointer-events-none select-none font-mono"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        opacity,
      }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {symbol}
    </motion.div>
  );
}
