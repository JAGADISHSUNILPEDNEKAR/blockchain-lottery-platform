import { useCallback, useEffect, useState } from 'react';

// Play-money balance used by Trial Mode so anyone can play the games
// instantly, with no wallet, no tokens and no on-chain transactions.
const STORAGE_KEY = 'demoCredits';
const STARTING_CREDITS = 1000;

function readStored(): number {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw === null) return STARTING_CREDITS;
        const value = Number(raw);
        return Number.isFinite(value) ? value : STARTING_CREDITS;
    } catch {
        return STARTING_CREDITS;
    }
}

function writeStored(value: number) {
    try {
        localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
        /* ignore storage errors (private mode, etc.) */
    }
}

// Lightweight cross-component sync without a full context provider.
const listeners = new Set<(value: number) => void>();

function broadcast(value: number) {
    writeStored(value);
    listeners.forEach((fn) => fn(value));
}

export function useDemoCredits() {
    const [credits, setCredits] = useState<number>(() => readStored());

    useEffect(() => {
        const listener = (value: number) => setCredits(value);
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    }, []);

    const add = useCallback((amount: number) => {
        const next = Math.max(0, Math.round(readStored() + amount));
        broadcast(next);
    }, []);

    const reset = useCallback(() => {
        broadcast(STARTING_CREDITS);
    }, []);

    const canAfford = useCallback((amount: number) => readStored() >= amount, []);

    return { credits, add, reset, canAfford, STARTING_CREDITS };
}
