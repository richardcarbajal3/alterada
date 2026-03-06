import type { SessionState, InsertSession } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getSession(id: string): Promise<SessionState | undefined>;
  createSession(session: InsertSession): Promise<SessionState>;
  updateSession(id: string, session: SessionState): Promise<SessionState>;
}

export class MemStorage implements IStorage {
  private sessions: Map<string, SessionState>;

  constructor() {
    this.sessions = new Map();
  }

  async getSession(id: string): Promise<SessionState | undefined> {
    return this.sessions.get(id);
  }

  async createSession(insertSession: InsertSession): Promise<SessionState> {
    const id = randomUUID();
    const session: SessionState = { ...insertSession, id };
    this.sessions.set(id, session);
    return session;
  }

  async updateSession(id: string, sessionData: SessionState): Promise<SessionState> {
    // Simply store the full session data as provided by the client
    // This is an upsert - creates if doesn't exist, updates if it does
    this.sessions.set(id, sessionData);
    return sessionData;
  }
}

export const storage = new MemStorage();
