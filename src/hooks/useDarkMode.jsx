import { useState, useEffect, useCallback } from 'react';

export default function useDarkMode() {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            return savedTheme === 'dark';
        }
        return false; // Default to dark mode
    });

    // Toggle dark mode
    const toggleDarkMode = useCallback(() => {
        setIsDarkMode((prev) => {
            const newMode = !prev;
            const html = document.documentElement;
            if (newMode) {
                html.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                html.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
            return newMode;
        
        });
    }, []);

    // Sync theme with html elements
    useEffect(() => {
        const html = document.documentElement;
        if (isDarkMode) {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
    }, [isDarkMode]);

    return {
        isDarkMode,
        toggleDarkMode,
    };
}