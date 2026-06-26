export function todayISO(offset = 0): string {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
}

export function formatDateline(d = new Date()): string {
    return d.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

export function daysBetween(aISO: string, bISO: string): number {
    const a = new Date(aISO).getTime();
    const b = new Date(bISO).getTime();
    return Math.round((b - a) / 86400000);
}

export const uid = (): string =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
