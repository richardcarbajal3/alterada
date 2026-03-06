import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { sessionStateSchema } from "@shared/schema";
import OpenAI from "openai";

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY || "dummy",
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Session persistence endpoint
  app.post("/api/session", async (req, res) => {
    try {
      const parsed = sessionStateSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid session data" });
      }

      const session = await storage.updateSession(parsed.data.id, parsed.data);
      return res.json(session);
    } catch (error) {
      console.error("Session save error:", error);
      return res.status(500).json({ error: "Failed to save session" });
    }
  });

  app.get("/api/session/:id", async (req, res) => {
    try {
      const session = await storage.getSession(req.params.id);
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      return res.json(session);
    } catch (error) {
      console.error("Session load error:", error);
      return res.status(500).json({ error: "Failed to load session" });
    }
  });

  // AI text transformation endpoint
  app.post("/api/transform-text", async (req, res) => {
    const { text, panelId } = req.body;
    
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required" });
    }

    const textStr = text as string;
    const pId = (panelId ?? 0) as number;

    try {
      const prompts: Record<number, string> = {
        0: `Transforma esta palabra/frase en su opuesto conceptual o antónimo. Si es una frase, invierte su significado. Responde solo con 1-3 palabras, sin explicaciones. Palabra: "${textStr}"`,
        1: `Genera una palabra o frase corta que sea una variación temporal de esta (pasado, futuro, o fragmento incompleto). Responde solo con 1-3 palabras. Palabra: "${textStr}"`,
        2: `Distorsiona esta palabra en algo relacionado pero extraño o surrealista. Cambia letras, mezcla con conceptos inesperados. Responde solo con 1-3 palabras. Palabra: "${textStr}"`,
      };

      const response = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Eres un generador de transformaciones poéticas y abstractas. Solo respondes con palabras transformadas, sin explicaciones ni puntuación."
          },
          {
            role: "user",
            content: prompts[pId] || prompts[2]
          }
        ],
        max_tokens: 30,
      });

      const transformed = response.choices[0]?.message?.content?.trim() || textStr;
      
      return res.json({ transformed, original: textStr, panelId: pId });
    } catch (error) {
      console.error("Transform error:", error);
      // Fallback to simple transformation if AI fails
      const fallback = pId === 0 
        ? textStr.split("").reverse().join("")
        : pId === 1 
        ? `...${textStr.slice(0, Math.ceil(textStr.length * 0.6))}...`
        : textStr.split("").map((c: string) => Math.random() > 0.7 ? "*" : c).join("");
      
      return res.json({ transformed: fallback, original: textStr, panelId: pId, fallback: true });
    }
  });

  // Connect words into meaningful phrase
  app.post("/api/connect-words", async (req, res) => {
    const { words } = req.body;
    
    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ error: "Words array is required" });
    }

    const wordsList = words as string[];

    try {
      const response = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Eres un poeta que conecta palabras aparentemente sin sentido en frases poéticas cortas. Crea conexiones inesperadas pero evocadoras."
          },
          {
            role: "user",
            content: `Conecta estas palabras en una frase poética corta (máximo 10 palabras): ${wordsList.join(", ")}`
          }
        ],
        max_tokens: 50,
      });

      const connected = response.choices[0]?.message?.content?.trim() || wordsList.join(" ");
      
      return res.json({ connected, words: wordsList });
    } catch (error) {
      console.error("Connect error:", error);
      return res.json({ connected: wordsList.join(" ~ "), words: wordsList, fallback: true });
    }
  });

  return httpServer;
}
