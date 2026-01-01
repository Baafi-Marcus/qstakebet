"use client";

import { useEffect, useState } from "react";

export function GiftWrapper() {
    const [state, setState] = useState({ isVisible: false, hasLoaded: false });

    useEffect(() => {
        // Check localStorage on mount
        const giftSeen = typeof window !== 'undefined' ? localStorage.getItem("qstake_gift_seen") : null;

        // Wrap in setTimeout to avoid "Calling setState synchronously within an effect" warning
        const timer = setTimeout(() => {
            setState({
                isVisible: !giftSeen,
                hasLoaded: true
            });
        }, 0);

        const handleMessage = (event: MessageEvent) => {
            if (event.data === "GIFT_COMPLETE") {
                setState(prev => ({ ...prev, isVisible: false }));
                localStorage.setItem("qstake_gift_seen", "true");
            }
        };

        window.addEventListener("message", handleMessage);
        return () => {
            window.removeEventListener("message", handleMessage);
            clearTimeout(timer);
        };
    }, []);

    const { isVisible, hasLoaded } = state;

    if (!hasLoaded || !isVisible) return null;

    return (
        <iframe
            src="/gift/index.html"
            className="fixed inset-0 w-full h-full border-none z-[100] pointer-events-auto"
        />
    );
}
