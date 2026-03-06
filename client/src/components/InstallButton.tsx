import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    const isStandalone = ('standalone' in window.navigator) && (window.navigator as { standalone?: boolean }).standalone;
    
    if (ios && !isStandalone) {
      setIsVisible(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setIsVisible(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <>
      <motion.button
        className={cn(
          "fixed top-4 right-4 z-50",
          "px-3 py-1.5 rounded-md",
          "flex items-center gap-2",
          "border border-foreground/20 bg-background/80 backdrop-blur-sm",
          "text-foreground/70 text-xs font-mono",
          "transition-all duration-200"
        )}
        onClick={handleInstall}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        data-testid="button-install-pwa"
      >
        <span className="text-sm">+</span>
        <span>instalar</span>
      </motion.button>

      <AnimatePresence>
        {showIOSInstructions && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowIOSInstructions(false)}
          >
            <motion.div
              className="bg-background border border-foreground/20 rounded-lg p-6 mx-4 max-w-sm"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-foreground/80 text-sm font-mono mb-4">
                Para instalar en iOS:
              </p>
              <ol className="text-foreground/60 text-xs font-mono space-y-2 list-decimal list-inside">
                <li>Toca el botón Compartir</li>
                <li>Selecciona "Añadir a pantalla de inicio"</li>
                <li>Confirma tocando "Añadir"</li>
              </ol>
              <button
                className="mt-4 w-full py-2 text-xs font-mono text-foreground/60 border border-foreground/20 rounded"
                onClick={() => setShowIOSInstructions(false)}
                data-testid="button-close-ios-instructions"
              >
                entendido
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
