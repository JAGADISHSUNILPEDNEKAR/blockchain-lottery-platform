import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import LotteryCard from '../components/LotteryCard';
import ModeToggle, { GameMode } from '../components/ModeToggle';
import { useDemoCredits } from '../hooks/useDemoCredits';

const TICKET_PRICE = 10;

/* ------------------------------------------------------------------ */
/*  Trial Mode – a simulated lottery round played with play chips     */
/* ------------------------------------------------------------------ */

const TrialLottery: React.FC = () => {
    const { credits, add, reset, canAfford, STARTING_CREDITS } = useDemoCredits();

    // A fresh round seeds some "other players" so the pool feels alive.
    const [botTickets, setBotTickets] = useState<number>(() => 6 + Math.floor(Math.random() * 10));
    const [myTickets, setMyTickets] = useState<number>(0);
    const [lastResult, setLastResult] = useState<string | null>(null);
    const [lastWin, setLastWin] = useState(false);
    const [drawing, setDrawing] = useState(false);

    const totalTickets = botTickets + myTickets;
    const prizePool = totalTickets * TICKET_PRICE;
    const odds = useMemo(() => (totalTickets ? Math.round((myTickets / totalTickets) * 100) : 0), [myTickets, totalTickets]);

    const buy = (n: number) => {
        const cost = n * TICKET_PRICE;
        if (!canAfford(cost)) {
            toast.error('Not enough chips.');
            return;
        }
        add(-cost);
        setMyTickets((t) => t + n);
        setLastResult(null);
    };

    const draw = () => {
        if (myTickets === 0) {
            toast.error('Buy at least one ticket first.');
            return;
        }
        setDrawing(true);
        setLastResult(null);
        // suspense
        setTimeout(() => {
            const winningTicket = Math.floor(Math.random() * totalTickets);
            const playerWon = winningTicket < myTickets; // player holds the first myTickets slots
            if (playerWon) {
                add(prizePool);
                setLastWin(true);
                setLastResult(`🎉 You won the ${prizePool.toLocaleString()} chip jackpot!`);
                toast.success(`You won ${prizePool.toLocaleString()} chips!`);
            } else {
                setLastWin(false);
                setLastResult('So close! A random holder took the pot this round.');
            }
            // reset the round
            setMyTickets(0);
            setBotTickets(6 + Math.floor(Math.random() * 10));
            setDrawing(false);
        }, 1400);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between glass-panel rounded-2xl px-5 py-3">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🪙</span>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-400">Trial Chips</p>
                        <p className="text-xl font-bold text-amber-300">{credits.toLocaleString()}</p>
                    </div>
                </div>
                {credits < TICKET_PRICE && (
                    <button onClick={reset} className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-200 border border-amber-500/30 hover:bg-amber-500/30 transition text-sm font-semibold">
                        Reset to {STARTING_CREDITS}
                    </button>
                )}
            </div>

            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="relative z-10 space-y-8">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="glass-card p-6 rounded-2xl">
                            <div className="flex items-center gap-2 text-cyan-400 mb-2 font-medium">💰 Prize Pool</div>
                            <div className="text-4xl lg:text-5xl font-bold text-white">{prizePool.toLocaleString()} <span className="text-lg text-gray-400">chips</span></div>
                        </div>
                        <div className="glass-card p-6 rounded-2xl">
                            <div className="flex items-center gap-2 text-pink-400 mb-2 font-medium">🎯 Your Win Odds</div>
                            <div className="text-4xl lg:text-5xl font-bold text-white">{odds}%</div>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-2 text-gray-400 mb-1">🎟️ Ticket Price</div>
                            <div className="text-2xl font-semibold text-white">{TICKET_PRICE} chips</div>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-2 text-gray-400 mb-1">👥 Tickets in Round</div>
                            <div className="text-2xl font-semibold text-white">{totalTickets} <span className="text-sm text-gray-400">(you: {myTickets})</span></div>
                        </div>
                    </div>

                    {lastResult && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-4 rounded-xl text-center font-bold ${lastWin ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-white/5 text-gray-300 border border-white/10'}`}
                        >
                            {lastResult}
                        </motion.div>
                    )}

                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    <div className="space-y-4">
                        <p className="text-gray-400 text-sm">Buy tickets, then draw. Each ticket is one entry in the pool — more tickets, better odds.</p>
                        <div className="flex flex-wrap gap-2">
                            {[1, 5, 10].map((n) => (
                                <button
                                    key={n}
                                    onClick={() => buy(n)}
                                    disabled={drawing || !canAfford(n * TICKET_PRICE)}
                                    className="px-5 py-2.5 rounded-xl bg-cyan-500/20 text-cyan-200 border border-cyan-500/30 font-semibold hover:bg-cyan-500 hover:text-white transition disabled:opacity-40"
                                >
                                    +{n} ticket{n > 1 ? 's' : ''} · {n * TICKET_PRICE}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={draw}
                            disabled={drawing || myTickets === 0}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg hover:shadow-lg hover:shadow-purple-500/30 transition disabled:opacity-50"
                        >
                            {drawing ? 'Drawing winner…' : 'Draw Now'}
                        </button>
                    </div>
                </div>
            </motion.div>

            <p className="text-center text-xs text-gray-500">Trial mode uses play chips only — no wallet, no real funds.</p>
        </div>
    );
};

/* ------------------------------------------------------------------ */

const LotteryPage: React.FC = () => {
    const [mode, setMode] = useState<GameMode>('trial');

    return (
        <div className="max-w-4xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-8"
            >
                <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tighter">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500">
                        Decentralized Lottery
                    </span>
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                    A transparent, provably fair lottery built on Ethereum.
                    <span className="text-white block mt-2">Win big with crypto — or try it free.</span>
                </p>
            </motion.div>

            <div className="mb-6">
                <ModeToggle mode={mode} onChange={setMode} />
            </div>

            {mode === 'trial' ? <TrialLottery /> : <LotteryCard />}
        </div>
    );
};

export default LotteryPage;
