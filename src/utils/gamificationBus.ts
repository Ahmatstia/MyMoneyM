import { XpSourceKey } from "../types/gamification";

export type GamificationEvent =
  | { type: "award"; source: XpSourceKey; customXp?: number; label?: string }
  | { type: "check_milestones" };

type GamificationListener = (event: GamificationEvent) => void | Promise<void>;

class GamificationBus {
  private listeners: Set<GamificationListener> = new Set();

  /**
   * Subscribe to gamification events.
   * Returns an unsubscribe function.
   */
  subscribe(listener: GamificationListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Emit an event to all subscribers.
   */
  emit(event: GamificationEvent): void {
    this.listeners.forEach((listener) => {
      try {
        const result = listener(event);
        if (result && typeof (result as Promise<void>).catch === "function") {
          (result as Promise<void>).catch((err) => {
            console.warn("[GamificationBus] listener error:", err);
          });
        }
      } catch (err) {
        console.warn("[GamificationBus] listener error:", err);
      }
    });
  }

  /**
   * Convenience helper to trigger an XP award.
   */
  award(source: XpSourceKey, customXp?: number, label?: string): void {
    this.emit({ type: "award", source, customXp, label });
  }
}

export const gamificationBus = new GamificationBus();
