// Helper for matching playoff stage names resiliently.
// NSMQ fixture stage labels vary across the codebase and imports
// (e.g. "Quarter Final", "Quarter-Final Stage", "One-Eighth Stage"),
// so we normalize and match loosely instead of relying on exact strings.

export type PlayoffStage = "quarterFinal" | "semiFinal" | "grandFinal";

function normalizeStage(stage: string): string {
    return stage
        .toLowerCase()
        .trim()
        .replace(/[^a-z]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

// Split normalized stage (lowercased, words only) into tokens.
function tokens(stage: string): string[] {
    return normalizeStage(stage).split(" ").filter(Boolean);
}

function hasTokens(stage: string, required: string[]): boolean {
    const toks = new Set(tokens(stage));
    return required.every((r) => toks.has(r));
}

/**
 * Whether a match stage belongs to the given playoff round.
 *
 * Matching is tolerant of label variations. We match on the presence of
 * distinguishing words rather than exact strings, and we guard against
 * over-matching (e.g. "Semi-Final" must NOT count as the Grand Final).
 */
export function isPlayoffStage(stage: string, target: PlayoffStage): boolean {
    const toks = tokens(stage);
    if (toks.length === 0) return false;
    const hasGrand = toks.includes("grand");
    const hasSemi = toks.some((t) => t === "semi" || t.startsWith("semi"));
    const hasQuarter = toks.some((t) => t.startsWith("quarter"));
    const hasFinal = toks.some((t) => t === "final" || t === "finals" || t === "finale" || t.startsWith("final"));
    const hasOneEighth = toks.includes("one") && toks.includes("eighth");
    const hasPrelim = toks.some((t) => t === "preliminary" || t.startsWith("prelim"));

    switch (target) {
        case "quarterFinal":
            // Must be a quarter-final (not a semi or grand final, not prelim)
            return hasQuarter && hasFinal && !hasSemi && !hasGrand && !hasPrelim;
        case "semiFinal":
            // Must be a semi-final (not quarter or grand)
            return hasSemi && hasFinal && !hasGrand && !hasQuarter && !hasPrelim;
        case "grandFinal":
            // Grand final(e) — but not any earlier round
            return hasFinal && !hasSemi && !hasQuarter && !hasOneEighth && !hasPrelim
                && (hasGrand || toks.length <= 2 && hasFinal);
        default:
            return false;
    }
}
