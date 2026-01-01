"use client";

import { useEffect, useState } from "react";

export function GiftWrapper() {
    const [isVisible, setIsVisible] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);

    useEffect(() => {
        // Check localStorage on mount
        const giftSeen = localStorage.getItem("qstake_gift_seen");
        if (!giftSeen) {
            setIsVisible(true);
        }
        setHasLoaded(true);

        const handleMessage = (event: MessageEvent) => {
            if (event.data === "GIFT_COMPLETE") {
                setIsVisible(false);
                localStorage.setItem("qstake_gift_seen", "true");
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, []);

    if (!hasLoaded || !isVisible) return null;

    return (
        <iframe
            src="/gift/index.html"
            className="fixed inset-0 w-full h-full border-none z-[100] pointer-events-auto"
        />
    );
}
