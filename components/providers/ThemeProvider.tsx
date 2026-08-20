"use client"

import React, { createContext, useCallback, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark"

const THEME_STORAGE_KEY = "qstakebet-theme"

interface ThemeContextValue {
    theme: Theme
    setTheme: (theme: Theme) => void
    toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredTheme(): Theme {
    if (typeof document === "undefined") return "dark"
    return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(readStoredTheme)

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setThemeState(readStoredTheme())
    }, [])

    const setTheme = useCallback((next: Theme) => {
        setThemeState(next)
        document.documentElement.classList.toggle("dark", next === "dark")
        document.documentElement.style.colorScheme = next
        try {
            localStorage.setItem(THEME_STORAGE_KEY, next)
        } catch {
            // localStorage unavailable (private mode, etc.) — theme just won't persist
        }
    }, [])

    const toggleTheme = useCallback(() => {
        setTheme(theme === "dark" ? "light" : "dark")
    }, [theme, setTheme])

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error("useTheme must be used within a ThemeProvider")
    return ctx
}
