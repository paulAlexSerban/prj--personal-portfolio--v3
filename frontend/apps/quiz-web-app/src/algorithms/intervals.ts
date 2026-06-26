import type { CardState, StudyConfig, Rating } from "../store/types";
import { applyReview } from "./sm2";

export function formatInterval(days: number, minutes?: number): string {
    if (minutes !== undefined && minutes < 60) return `${Math.max(1, Math.round(minutes))}m`;
    if (minutes !== undefined && minutes < 60 * 24) return `${Math.round(minutes / 60)}h`;
    if (days < 1) return `<1d`;
    if (days < 30) return `${days}d`;
    if (days < 365) return `${Math.round(days / 30)}mo`;
    return `${Math.round(days / 365)}y`;
}

export function previewInterval(card: CardState, rating: Rating, config: StudyConfig): string {
    const { card: next } = applyReview(card, rating, config);
    if (next.cardType === "learning" || next.cardType === "relearning") {
        const mins = next.learningDueAt ? Math.max(1, (next.learningDueAt - Date.now()) / 60000) : 1;
        return formatInterval(0, mins);
    }
    return formatInterval(next.interval);
}
