import type { ChatSession } from "./types";
import { readStored, writeStored } from "./storage";

const KEY = "axiom.sessions.v1";
const EVENT = "axiom:sessions";
const MAX_SESSIONS = 40;

export function loadSessions(): ChatSession[] {
  return readStored<ChatSession[]>(KEY, []).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getSession(id: string): ChatSession | undefined {
  return loadSessions().find((session) => session.id === id);
}

function emit() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVENT));
}

export function saveSession(session: ChatSession) {
  const sessions = readStored<ChatSession[]>(KEY, []);
  const index = sessions.findIndex((item) => item.id === session.id);
  if (index >= 0) sessions[index] = session;
  else sessions.unshift(session);
  const trimmed = sessions.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_SESSIONS);
  writeStored(KEY, trimmed);
  emit();
}

export function deleteSession(id: string) {
  const sessions = readStored<ChatSession[]>(KEY, []).filter((session) => session.id !== id);
  writeStored(KEY, sessions);
  emit();
}

export function clearSessions() {
  writeStored(KEY, []);
  emit();
}

export function subscribeSessions(callback: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function visualCount(): number {
  return loadSessions().reduce(
    (total, session) => total + session.messages.reduce((count, message) => count + (message.artifacts?.length ?? 0), 0),
    0
  );
}
