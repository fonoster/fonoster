import { createContext, useMemo, useState, ReactNode, useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { fnLight, fnDark } from "./theme";

interface ThemeContextProps {
    toggleTheme: () => void;
    isDarkMode: boolean;
}

export const ThemeContext = createContext<ThemeContextProps>({
    toggleTheme: () => { },
    isDarkMode: false
});

const THEME_STORAGE_KEY = 'fonoster-theme-preference';

const getInitialTheme = (): boolean => {
    if (typeof window === 'undefined') return false;

    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme !== null) {
        return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

export const ThemeProviderWrapper = ({ children }: { children: ReactNode }) => {
    const [isDarkMode, setIsDarkMode] = useState<boolean>(getInitialTheme);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
            if (savedTheme === null) {
                setIsDarkMode(e.matches);
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const toggleTheme = () => {
        setIsDarkMode((prev) => {
            const newTheme = !prev;
            if (typeof window !== 'undefined') {
                localStorage.setItem(THEME_STORAGE_KEY, newTheme ? 'dark' : 'light');
            }
            return newTheme;
        });
    };

    const theme = useMemo(() => (isDarkMode ? fnDark : fnLight), [isDarkMode]);

    return (
        <ThemeContext.Provider value={{ toggleTheme, isDarkMode }}>
            <ThemeProvider theme={theme}>
                {children}
            </ThemeProvider>
        </ThemeContext.Provider>
    );
}; 