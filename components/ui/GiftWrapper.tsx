"use client";

import { useEffect, useState } from "react";

export function GiftWrapper() {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data === "GIFT_COMPLETE") {
                setIsVisible(false);
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, []);

    if (!isVisible) return null;

    return (
        <iframe
            src="/gift/index.html"
            className="fixed inset-0 w-full h-full border-none z-[100] pointer-events-auto"
        />
    );
}
