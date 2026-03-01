/**
 * Haptic feedback utility for mobile devices.
 * Uses the navigator.vibrate API.
 */
export const haptics = {
    /**
     * Subtle light tap for button presses or selections.
     */
    light: () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10);
        }
    },

    /**
     * Medium tap for opening menus or important actions.
     */
    medium: () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(25);
        }
    },

    /**
     * Double tap pattern for successful actions (e.g., bet placed).
     */
    success: () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([30, 50, 30]);
        }
    },

    /**
     * Pattern for errors or warnings.
     */
    error: () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([50, 100, 50, 100, 50]);
        }
    },

    /**
     * Strong bullseye pulse.
     */
    bullseye: () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
    },

    /**
     * Heavy tap for big hits.
     */
    heavy: () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(50);
        }
    },

    /**
     * Generic wrapper for custom patterns.
     */
    vibrate: (pattern: number | number[]) => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }
};
