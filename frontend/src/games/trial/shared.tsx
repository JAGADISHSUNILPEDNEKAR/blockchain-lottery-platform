import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ------------------------------------------------------------------ */
/*  Small utilities shared by every trial (play-money) game.          */
/*  These games run entirely in the browser — no wallet, no chain —   */
/*  so "other players" are simulated with reasonable strategies.      */
/* ------------------------------------------------------------------ */

export function cx(...parts: Array<string | false | null | undefined>): string {
    return parts.filter(Boolean).join(' ');
}

export function randInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

export function pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

export function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

// Approximate normal distribution (sum of uniforms), clamped to [min, max].
export function gaussian(mean: number, stdev: number, min: number, max: number): number {
    const u = Math.random() + Math.random() + Math.random() + Math.random() - 2;
    return clamp(Math.round(mean + u * stdev), min, max);
}

/* ------------------------------------------------------------------ */
/*  Outcome helpers                                                   */
/* ------------------------------------------------------------------ */

export type Outcome = 'win' | 'lose' | 'push';

const outcomeStyles: Record<Outcome, string> = {
    win: 'from-emerald-500 to-green-500',
    lose: 'from-rose-500 to-red-600',
    push: 'from-slate-400 to-slate-500',
};

export const ResultBanner: React.FC<{ outcome: Outcome | null; message: string }> = ({ outcome, message }) => (
    <div className="min-h-[3rem] flex items-center justify-center">
        <AnimatePresence mode="wait">
            {outcome ? (
                <motion.div
                    key={message}
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={cx('px-6 py-2 rounded-full font-bold text-white text-center shadow-lg bg-gradient-to-r', outcomeStyles[outcome])}
                >
                    {message}
                </motion.div>
            ) : (
                <motion.p key={message} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gray-300 text-center">
                    {message}
                </motion.p>
            )}
        </AnimatePresence>
    </div>
);

/* ------------------------------------------------------------------ */
/*  Layout primitives                                                 */
/* ------------------------------------------------------------------ */

export const Panel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={cx('glass-panel rounded-2xl p-5', className)}>{children}</div>
);

export const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, children, ...rest }) => (
    <button
        {...rest}
        className={cx(
            'w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold text-lg transition',
            'hover:shadow-lg hover:shadow-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed',
            className,
        )}
    >
        {children}
    </button>
);

export const GhostButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, children, ...rest }) => (
    <button
        {...rest}
        className={cx(
            'px-5 py-2.5 rounded-xl bg-white/5 text-gray-200 border border-white/10 font-semibold transition',
            'hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed',
            className,
        )}
    >
        {children}
    </button>
);

// A selectable choice tile (used by most strategy games).
export const ChoiceButton: React.FC<{
    selected?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    accent?: string; // tailwind gradient, e.g. 'from-cyan-500 to-blue-500'
    children: React.ReactNode;
}> = ({ selected, disabled, onClick, accent = 'from-emerald-500 to-green-500', children }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={cx(
            'flex-1 min-w-[88px] px-4 py-4 rounded-2xl font-bold border transition text-center',
            selected
                ? cx('text-white border-transparent shadow-lg bg-gradient-to-r', accent)
                : 'bg-white/5 text-gray-200 border-white/10 hover:bg-white/10',
            disabled && 'opacity-40 cursor-not-allowed',
        )}
    >
        {children}
    </button>
);

export const StatRow: React.FC<{ label: string; value: React.ReactNode; className?: string }> = ({ label, value, className }) => (
    <div className={cx('flex items-center justify-between', className)}>
        <span className="text-gray-400">{label}</span>
        <span className="font-bold text-white">{value}</span>
    </div>
);

/* ------------------------------------------------------------------ */
/*  Bet selector — chip buttons, matches the Blackjack trial table.   */
/* ------------------------------------------------------------------ */

export const DEFAULT_CHIPS = [10, 25, 50, 100];

export const BetSelector: React.FC<{
    bet: number;
    setBet: (n: number) => void;
    options?: number[];
    disabled?: boolean;
    label?: string;
}> = ({ bet, setBet, options = DEFAULT_CHIPS, disabled, label = 'Stake' }) => (
    <div className="space-y-3">
        <div className="flex items-center justify-between">
            <span className="text-gray-400">{label}</span>
            <span className="text-lg font-bold text-amber-300">{bet} chips</span>
        </div>
        <div className="flex flex-wrap gap-2">
            {options.map((c) => (
                <button
                    key={c}
                    disabled={disabled}
                    onClick={() => setBet(c)}
                    className={cx(
                        'px-5 py-2 rounded-xl font-semibold border transition disabled:opacity-40',
                        bet === c ? 'bg-amber-500 text-slate-900 border-amber-400' : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10',
                    )}
                >
                    {c}
                </button>
            ))}
        </div>
    </div>
);

/* ------------------------------------------------------------------ */
/*  A compact bar/tally visual for crowd games.                       */
/* ------------------------------------------------------------------ */

export const Tally: React.FC<{ label: string; count: number; total: number; accent: string; highlight?: boolean }> = ({
    label,
    count,
    total,
    accent,
    highlight,
}) => {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
        <div className={cx('rounded-2xl p-4 border transition', highlight ? 'border-emerald-400/60 bg-emerald-500/10' : 'border-white/10 bg-white/5')}>
            <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-white">{label}</span>
                <span className="text-sm text-gray-400">{count} · {pct}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.5 }}
                    className={cx('h-full rounded-full bg-gradient-to-r', accent)}
                />
            </div>
        </div>
    );
};

export const TrialNote: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
    <p className="text-center text-xs text-gray-500">
        {children ?? 'Trial mode uses play chips only — no wallet, no real funds. Other players are simulated.'}
    </p>
);
