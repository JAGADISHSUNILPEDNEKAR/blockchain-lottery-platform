import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi';
import { formatEther } from 'viem';
import { toast } from 'react-hot-toast';
import { BINGO_ADDRESS, BINGO_ABI } from '../utils/contracts';
import { useDemoCredits } from '../hooks/useDemoCredits';
import ModeToggle, { GameMode } from '../components/ModeToggle';

const COLUMN_LETTERS = ['B', 'I', 'N', 'G', 'O'];
const CARD_PRICE = 50;
const WIN_REWARD = 250;

// Standard bingo columns: B 1-15, I 16-30, N 31-45, G 46-60, O 61-75.
function makeCard(): number[] {
    const card: number[] = [];
    for (let col = 0; col < 5; col++) {
        const pool: number[] = [];
        for (let n = col * 15 + 1; n <= col * 15 + 15; n++) pool.push(n);
        // pick 5 unique numbers for this column
        for (let row = 0; row < 5; row++) {
            const idx = Math.floor(Math.random() * pool.length);
            card[row * 5 + col] = pool.splice(idx, 1)[0];
        }
    }
    return card;
}

const FREE_INDEX = 12;

// Winning lines over a 5x5 grid.
const LINES: number[][] = (() => {
    const lines: number[][] = [];
    for (let r = 0; r < 5; r++) lines.push([0, 1, 2, 3, 4].map((c) => r * 5 + c));
    for (let c = 0; c < 5; c++) lines.push([0, 1, 2, 3, 4].map((r) => r * 5 + c));
    lines.push([0, 6, 12, 18, 24]);
    lines.push([4, 8, 12, 16, 20]);
    return lines;
})();

/* ------------------------------------------------------------------ */
/*  Trial Mode – single-player bingo with auto-drawn numbers          */
/* ------------------------------------------------------------------ */

const TrialBingo: React.FC = () => {
    const { credits, add, reset, canAfford, STARTING_CREDITS } = useDemoCredits();
    const [card, setCard] = useState<number[]>([]);
    const [marked, setMarked] = useState<boolean[]>([]);
    const [drawn, setDrawn] = useState<number[]>([]);
    const [running, setRunning] = useState(false);
    const [won, setWon] = useState(false);
    const [autoDaub, setAutoDaub] = useState(true);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const markedRef = useRef<boolean[]>([]);
    const wonRef = useRef(false);

    const lastDrawn = drawn[drawn.length - 1];

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    useEffect(() => stopTimer, []);

    const hasBingo = (m: boolean[]) => LINES.some((line) => line.every((i) => m[i]));

    const start = () => {
        if (!canAfford(CARD_PRICE)) {
            toast.error('Not enough chips to buy a card.');
            return;
        }
        add(-CARD_PRICE);
        const newCard = makeCard();
        const newMarked = Array(25).fill(false);
        newMarked[FREE_INDEX] = true; // free center
        markedRef.current = newMarked;
        wonRef.current = false;
        setCard(newCard);
        setMarked(newMarked);
        setDrawn([]);
        setWon(false);
        setRunning(true);

        const remaining = Array.from({ length: 75 }, (_, i) => i + 1);
        // shuffle
        for (let i = remaining.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
        }

        const win = () => {
            stopTimer();
            setRunning(false);
            wonRef.current = true;
            setWon(true);
            add(WIN_REWARD);
            toast.success(`BINGO! +${WIN_REWARD} chips`);
        };

        stopTimer();
        timerRef.current = setInterval(() => {
            const next = remaining.shift();
            if (next === undefined) {
                stopTimer();
                setRunning(false);
                return;
            }
            setDrawn((d) => [...d, next]);
            if (autoDaub && !wonRef.current) {
                const idx = newCard.indexOf(next);
                if (idx >= 0) {
                    const copy = [...markedRef.current];
                    copy[idx] = true;
                    markedRef.current = copy;
                    setMarked(copy);
                    if (hasBingo(copy)) win();
                }
            }
        }, 1800);
    };

    const toggleMark = (i: number) => {
        if (i === FREE_INDEX || won) return;
        if (!drawn.includes(card[i])) {
            toast.error('That number hasn’t been drawn yet.');
            return;
        }
        const copy = [...marked];
        copy[i] = !copy[i];
        markedRef.current = copy;
        setMarked(copy);
    };

    const claim = () => {
        if (wonRef.current) return;
        if (hasBingo(marked)) {
            stopTimer();
            setRunning(false);
            wonRef.current = true;
            setWon(true);
            add(WIN_REWARD);
            toast.success(`BINGO! +${WIN_REWARD} chips`);
        } else {
            toast.error('No completed line yet — keep daubing!');
        }
    };

    return (
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
            {/* Card */}
            <div className="glass-panel rounded-3xl p-6">
                {card.length === 0 ? (
                    <div className="text-center py-16 space-y-4">
                        <div className="text-6xl">🎱</div>
                        <h3 className="text-xl font-bold text-white">Buy a card to play</h3>
                        <p className="text-gray-400">A trial card costs {CARD_PRICE} chips. Fill any row, column, or diagonal to win {WIN_REWARD}.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-5 gap-2 mb-2">
                            {COLUMN_LETTERS.map((l) => (
                                <div key={l} className="text-center font-bold text-lg text-cyan-300">{l}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                            {card.map((num, i) => {
                                const isFree = i === FREE_INDEX;
                                const isMarked = marked[i];
                                const justDrawn = num === lastDrawn && !isFree;
                                return (
                                    <motion.button
                                        key={i}
                                        onClick={() => toggleMark(i)}
                                        whileTap={{ scale: 0.9 }}
                                        animate={justDrawn ? { scale: [1, 1.12, 1] } : {}}
                                        className={`aspect-square rounded-xl font-bold text-sm md:text-base flex items-center justify-center transition
                                            ${isMarked
                                                ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg'
                                                : 'bg-white/5 text-gray-200 border border-white/10 hover:bg-white/10'}`}
                                    >
                                        {isFree ? '★' : num}
                                    </motion.button>
                                );
                            })}
                        </div>
                        <button
                            onClick={claim}
                            disabled={won}
                            className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold hover:shadow-lg hover:shadow-orange-500/30 transition disabled:opacity-50"
                        >
                            {won ? '🎉 You won!' : 'Claim BINGO!'}
                        </button>
                    </>
                )}
            </div>

            {/* Side panel */}
            <div className="space-y-4">
                <div className="glass-panel rounded-2xl px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🪙</span>
                        <div>
                            <p className="text-xs uppercase tracking-wider text-gray-400">Trial Chips</p>
                            <p className="text-xl font-bold text-amber-300">{credits.toLocaleString()}</p>
                        </div>
                    </div>
                    {credits < CARD_PRICE && !running && (
                        <button onClick={reset} className="px-3 py-2 rounded-lg bg-amber-500/20 text-amber-200 border border-amber-500/30 hover:bg-amber-500/30 transition text-xs font-semibold">
                            Reset {STARTING_CREDITS}
                        </button>
                    )}
                </div>

                <div className="glass-panel rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-white">Caller</h3>
                        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                            <input type="checkbox" checked={autoDaub} onChange={(e) => setAutoDaub(e.target.checked)} className="accent-emerald-500" />
                            Auto-daub
                        </label>
                    </div>
                    <div className="h-24 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 mb-3">
                        {lastDrawn ? (
                            <motion.div key={lastDrawn} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                                <div className="text-xs text-cyan-300 font-bold">{COLUMN_LETTERS[Math.floor((lastDrawn - 1) / 15)]}</div>
                                <div className="text-4xl font-bold text-white">{lastDrawn}</div>
                            </motion.div>
                        ) : (
                            <span className="text-gray-500 text-sm">{running ? 'Drawing…' : 'Not started'}</span>
                        )}
                    </div>
                    <button
                        onClick={start}
                        disabled={running || !canAfford(CARD_PRICE)}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold hover:shadow-lg hover:shadow-cyan-500/30 transition disabled:opacity-50"
                    >
                        {running ? 'Game in progress…' : card.length ? `New Card · ${CARD_PRICE}` : `Buy Card · ${CARD_PRICE}`}
                    </button>
                </div>

                <div className="glass-panel rounded-2xl p-5">
                    <h3 className="font-bold text-white mb-2">Drawn ({drawn.length})</h3>
                    <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                        {drawn.length === 0 && <span className="text-gray-500 text-sm">None yet.</span>}
                        {drawn.map((n) => (
                            <span key={n} className="w-7 h-7 rounded-full bg-white/10 text-xs flex items-center justify-center text-gray-200">{n}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  On-chain Mode                                                     */
/* ------------------------------------------------------------------ */

const OnChainBingo: React.FC = () => {
    const { isConnected } = useAccount();

    const { data: currentGameId } = useContractRead({
        address: BINGO_ADDRESS, abi: BINGO_ABI, functionName: 'currentGameId', watch: true,
    }) as { data: bigint };

    const { data: gameInfo, isError, refetch } = useContractRead({
        address: BINGO_ADDRESS, abi: BINGO_ABI, functionName: 'getGameInfo',
        args: [currentGameId || BigInt(0)], enabled: !!currentGameId, watch: true,
    }) as { data: any; isError: boolean; refetch: () => void };

    const { data: cardPrice } = useContractRead({ address: BINGO_ADDRESS, abi: BINGO_ABI, functionName: 'cardPrice' });
    const { write: buyCard, data: buyData } = useContractWrite({ address: BINGO_ADDRESS, abi: BINGO_ABI, functionName: 'buyCard' });
    const { isLoading: isBuying } = useWaitForTransaction({ hash: buyData?.hash, onSuccess: () => { toast.success('Card purchased!'); refetch(); } });

    if (!isConnected) {
        return (
            <div className="glass-panel rounded-2xl p-10 text-center space-y-3">
                <div className="text-5xl">🔗</div>
                <h3 className="text-xl font-bold text-white">Connect a wallet for on-chain bingo</h3>
                <p className="text-gray-400">On-chain rooms pool real Sepolia ETH. Prefer no setup? Switch back to Trial mode above.</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="glass-panel rounded-2xl p-10 text-center space-y-3">
                <div className="text-5xl">⚠️</div>
                <h3 className="text-xl font-bold text-white">Contract not reachable</h3>
                <p className="text-gray-400">The Bingo contract isn’t deployed on this network yet. Trial mode works right now with no setup.</p>
                <button onClick={refetch} className="px-5 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition">Retry</button>
            </div>
        );
    }

    const pool = gameInfo ? gameInfo[2] : BigInt(0);

    return (
        <div className="glass-panel rounded-2xl p-8 text-center space-y-4 max-w-md mx-auto">
            <h3 className="text-xl font-bold text-white">Live Bingo Room</h3>
            <p className="text-gray-400">Prize pool: <span className="text-emerald-300 font-bold">{formatEther(pool)} ETH</span></p>
            <p className="text-gray-400">Card price: {cardPrice ? formatEther(cardPrice as bigint) : '0'} ETH</p>
            <button
                onClick={() => cardPrice && buyCard({ value: cardPrice as bigint })}
                disabled={isBuying}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold hover:shadow-lg hover:shadow-orange-500/30 transition disabled:opacity-50"
            >
                {isBuying ? 'Buying…' : 'Buy Card'}
            </button>
        </div>
    );
};

/* ------------------------------------------------------------------ */

const BingoGame: React.FC = () => {
    const [mode, setMode] = useState<GameMode>('trial');

    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-6">
                <h1 className="text-4xl md:text-5xl font-bold mb-2">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-400">Bingo</span>
                    <span className="ml-3">🎱</span>
                </h1>
                <p className="text-gray-400">Daub a full line to win. Play free, or join an on-chain room.</p>
            </div>

            <ModeToggle mode={mode} onChange={setMode} />

            <div className="mt-6">
                {mode === 'trial' ? <TrialBingo /> : <OnChainBingo />}
            </div>
        </div>
    );
};

export default BingoGame;
