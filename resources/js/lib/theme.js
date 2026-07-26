// Theme runtime : 3 modes (system / dark / light), persisted in localStorage
// and applied by toggling the `dark` class on <html>. Tailwind's darkMode:'class'
// picks it up automatically. The pre-boot script in app.blade.php mirrors this
// logic to avoid FOUC (flash of unstyled content).

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'theme';
export const THEME_MODES = ['system', 'dark', 'light'];

function readStoredMode() {
    try {
        const v = window.localStorage.getItem(STORAGE_KEY);
        return THEME_MODES.includes(v) ? v : 'system';
    } catch {
        return 'system';
    }
}

function prefersDark() {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolveEffective(mode) {
    if (mode === 'dark') return 'dark';
    if (mode === 'light') return 'light';
    return prefersDark() ? 'dark' : 'light';
}

function applyEffective(effective) {
    const root = document.documentElement;
    if (effective === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
}

/**
 * useTheme : returns [mode, effective, setMode, cycleMode].
 * - `mode` is the user's selection ('system'|'dark'|'light')
 * - `effective` is the resolved theme actually applied ('dark'|'light')
 * - `setMode(next)` persists + applies
 * - `cycleMode()` rotates system → dark → light → system
 */
export function useTheme() {
    const [mode, setModeState] = useState(() => readStoredMode());
    const [effective, setEffective] = useState(() => resolveEffective(mode));

    useEffect(() => {
        const eff = resolveEffective(mode);
        setEffective(eff);
        applyEffective(eff);
    }, [mode]);

    // Follow OS setting live when in system mode
    useEffect(() => {
        if (mode !== 'system') return;
        if (!window.matchMedia) return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => {
            const eff = resolveEffective('system');
            setEffective(eff);
            applyEffective(eff);
        };
        mq.addEventListener?.('change', handler);
        return () => mq.removeEventListener?.('change', handler);
    }, [mode]);

    const setMode = (next) => {
        const value = THEME_MODES.includes(next) ? next : 'system';
        try { window.localStorage.setItem(STORAGE_KEY, value); } catch { /* ignore */ }
        setModeState(value);
    };

    const cycleMode = () => {
        const idx = THEME_MODES.indexOf(mode);
        setMode(THEME_MODES[(idx + 1) % THEME_MODES.length]);
    };

    return [mode, effective, setMode, cycleMode];
}
