import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { toast } from 'react-hot-toast';
import { BLACKJACK_ADDRESS, BLACKJACK_ABI } from '../utils/contracts';
import { useDemoCredits } from '../hooks/useDemoCredits';
import ModeToggle, { GameMode } from '../components/ModeToggle';

/* ------------------------------------------------------------------ */
/*  Shared card rendering                                             */
/* ------------------------------------------------------------------ */

const suitSymbols = ['♥', '♦', '♣', '♠'];
const rankLabels = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

interface Card {
    suit: number; // 0: Hearts, 1: Diamonds, 2: Clubs, 3: Spades
    rank: number; // 1-13
}

const PlayingCard: React.FC<{ card?: Card; hidden?: boolean; delay?: number }> = ({ card, hidden, delay = 0 }) => {
    const isRed = card ? card.suit < 2 : false;
    return (
        <motion.div
            initial={{ opacity: 0, y: -24, rotateY: 90 }}
            animate={{ opacity: 1, y: 0, rotateY: 0 }}
            transition={{ duration: 0.35, delay }}
            className="relative w-[64px] h-[92px] md:w-[72px] md:h-[104px] rounded-xl shadow-lg select-none"
        >
            {hidden || !card ? (
                <div className="w-full h-full rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 border border-white/20 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-2 border-white/40" />
                </div>
            ) : (
                <div className={`w-full h-full rounded-xl bg-white flex flex-col items-center justify-center font-bold ${isRed ? 'text-rose-500' : 'text-slate-900'}`}>
                    <span className="text-xl leading-none">{rankLabels[card.rank]}</span>
                    <span className="text-2xl leading-none">{suitSymbols[card.suit]}</span>
                </div>
            )}
        </motion.div>
    );
};

const EmptySlot: React.FC = () => (
    <div className="w-[64px] h-[92px] md:w-[72px] md:h-[104px] rounded-xl border-2 border-dashed border-white/15" />
);

/* ------------------------------------------------------------------ */
/*  Trial Mode – full blackjack running locally with play chips       */
/* ------------------------------------------------------------------ */

function freshDeck(): Card[] {
    const deck: Card[] = [];
    for (let suit = 0; suit < 4; suit++) {
        for (let rank = 1; rank <= 13; rank++) deck.push({ suit, rank });
    }
    // Fisher–Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function handValue(cards: Card[]): number {
    let total = 0;
    let aces = 0;
    for (const c of cards) {
        if (c.rank === 1) {
            aces++;
            total += 11;
        } else if (c.rank >= 10) {
            total += 10;
        } else {
            total += c.rank;
        }
    }
    while (total > 21 && aces > 0) {
        total -= 10;
        aces--;
    }
    return total;
}

type Phase = 'betting' | 'player' | 'dealer' | 'done';
type Outcome = 'win' | 'lose' | 'push' | 'blackjack';

const chipOptions = [10, 25, 50, 100];

const TrialBlackjack: React.FC = () => {
    const { credits, add, reset, canAfford, STARTING_CREDITS } = useDemoCredits();

    const [deck, setDeck] = useState<Card[]>([]);
    const [playerCards, setPlayerCards] = useState<Card[]>([]);
    const [dealerCards, setDealerCards] = useState<Card[]>([]);
    const [bet, setBet] = useState<number>(25);
    const [phase, setPhase] = useState<Phase>('betting');
    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const [message, setMessage] = useState<string>('Place your bet to deal.');

    const playerTotal = useMemo(() => handValue(playerCards), [playerCards]);
    const dealerTotal = useMemo(() => handValue(dealerCards), [dealerCards]);
    const canDouble = phase === 'player' && playerCards.length === 2 && canAfford(bet);

    const settle = (result: Outcome, payout: number, msg: string) => {
        if (payout > 0) add(payout);
        setOutcome(result);
        setMessage(msg);
        setPhase('done');
    };

    const deal = () => {
        if (!canAfford(bet)) {
            toast.error('Not enough chips for that bet.');
            return;
        }
        add(-bet); // chips go on the table
        const d = freshDeck();
        const p = [d.pop()!, d.pop()!];
        const de = [d.pop()!, d.pop()!];
        setDeck(d);
        setPlayerCards(p);
        setDealerCards(de);
        setOutcome(null);

        const pv = handValue(p);
        const dv = handValue(de);
        if (pv === 21 || dv === 21) {
            // Natural resolves immediately
            setPhase('done');
            if (pv === 21 && dv === 21) {
                add(bet); // push: return stake
                setOutcome('push');
                setMessage('Both have Blackjack — push.');
            } else if (pv === 21) {
                add(Math.round(bet * 2.5)); // 3:2 blackjack
                setOutcome('blackjack');
                setMessage('Blackjack! You win 3:2.');
            } else {
                setOutcome('lose');
                setMessage('Dealer has Blackjack. You lose.');
            }
            return;
        }
        setPhase('player');
        setMessage('Your move: Hit, Stand, or Double.');
    };

    const dealerPlay = (startDeck: Card[], dealer: Card[], finalBet: number, player: Card[]) => {
        const d = [...startDeck];
        const dh = [...dealer];
        while (handValue(dh) < 17) dh.push(d.pop()!);
        setDeck(d);
        setDealerCards(dh);

        const pv = handValue(player);
        const dv = handValue(dh);
        if (dv > 21 || pv > dv) {
            settle('win', finalBet * 2, dv > 21 ? 'Dealer busts — you win!' : 'You win!');
        } else if (pv < dv) {
            settle('lose', 0, 'Dealer wins.');
        } else {
            settle('push', finalBet, 'Push — your stake is returned.');
        }
    };

    const hit = () => {
        const d = [...deck];
        const p = [...playerCards, d.pop()!];
        setDeck(d);
        setPlayerCards(p);
        if (handValue(p) > 21) {
            settle('lose', 0, 'Bust! You lose.');
        }
    };

    const stand = () => {
        setPhase('dealer');
        dealerPlay(deck, dealerCards, bet, playerCards);
    };

    const double = () => {
        if (!canAfford(bet)) {
            toast.error('Not enough chips to double.');
            return;
        }
        add(-bet);
        const d = [...deck];
        const p = [...playerCards, d.pop()!];
        setDeck(d);
        setPlayerCards(p);
        const doubled = bet * 2;
        setBet(doubled);
        if (handValue(p) > 21) {
            settle('lose', 0, 'Bust on double! You lose.');
        } else {
            setPhase('dealer');
            dealerPlay(d, dealerCards, doubled, p);
        }
    };

    const newHand = () => {
        setPhase('betting');
        setPlayerCards([]);
        setDealerCards([]);
        setOutcome(null);
        setBet((b) => Math.max(10, Math.min(b, 100)));
        setMessage('Place your bet to deal.');
    };

    const outcomeStyles: Record<Outcome, string> = {
        win: 'from-emerald-500 to-green-500',
        blackjack: 'from-amber-400 to-yellow-500',
        lose: 'from-rose-500 to-red-600',
        push: 'from-slate-400 to-slate-500',
    };

    return (
        <div className="space-y-6">
            {/* Chip balance */}
            <div className="flex items-center justify-between glass-panel rounded-2xl px-5 py-3">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🪙</span>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-400">Trial Chips</p>
                        <p className="text-xl font-bold text-amber-300">{credits.toLocaleString()}</p>
                    </div>
                </div>
                {credits < 10 && (
                    <button onClick={reset} className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-200 border border-amber-500/30 hover:bg-amber-500/30 transition text-sm font-semibold">
                        Reset to {STARTING_CREDITS}
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="relative rounded-3xl p-6 md:p-10 bg-gradient-to-b from-emerald-900/40 to-slate-900/60 border border-emerald-500/20 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.15),transparent_60%)]" />

                <div className="relative z-10 space-y-8">
                    {/* Dealer */}
                    <div className="text-center">
                        <p className="text-sm uppercase tracking-widest text-gray-400 mb-3">
                            Dealer {phase === 'done' || phase === 'dealer' ? `· ${dealerTotal}` : dealerCards.length ? '· ?' : ''}
                        </p>
                        <div className="flex justify-center gap-2 md:gap-3 min-h-[92px]">
                            {dealerCards.length === 0 ? (
                                <><EmptySlot /><EmptySlot /></>
                            ) : (
                                dealerCards.map((c, i) => (
                                    <PlayingCard key={i} card={c} hidden={i === 1 && phase !== 'done' && phase !== 'dealer'} delay={i * 0.08} />
                                ))
                            )}
                        </div>
                    </div>

                    {/* Result banner */}
                    <div className="h-12 flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            {outcome ? (
                                <motion.div
                                    key={message}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className={`px-6 py-2 rounded-full font-bold text-white bg-gradient-to-r ${outcomeStyles[outcome]} shadow-lg`}
                                >
                                    {message}
                                </motion.div>
                            ) : (
                                <motion.p key={message} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gray-300">
                                    {message}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Player */}
                    <div className="text-center">
                        <div className="flex justify-center gap-2 md:gap-3 min-h-[92px]">
                            {playerCards.length === 0 ? (
                                <><EmptySlot /><EmptySlot /></>
                            ) : (
                                playerCards.map((c, i) => <PlayingCard key={i} card={c} delay={i * 0.08} />)
                            )}
                        </div>
                        <p className="text-sm uppercase tracking-widest text-gray-400 mt-3">
                            You {playerCards.length ? `· ${playerTotal}` : ''}
                        </p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="glass-panel rounded-2xl p-5">
                {phase === 'betting' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400">Bet amount</span>
                            <span className="text-xl font-bold text-white">{bet} chips</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {chipOptions.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setBet(c)}
                                    className={`px-5 py-2 rounded-xl font-semibold border transition ${bet === c ? 'bg-amber-500 text-slate-900 border-amber-400' : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'}`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={deal}
                            disabled={!canAfford(bet)}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold text-lg hover:shadow-lg hover:shadow-emerald-500/30 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Deal
                        </button>
                    </div>
                )}

                {phase === 'player' && (
                    <div className="grid grid-cols-3 gap-3">
                        <button onClick={hit} className="py-4 rounded-xl bg-cyan-500/20 text-cyan-200 border border-cyan-500/30 font-bold hover:bg-cyan-500 hover:text-white transition">
                            Hit
                        </button>
                        <button onClick={stand} className="py-4 rounded-xl bg-amber-500/20 text-amber-200 border border-amber-500/30 font-bold hover:bg-amber-500 hover:text-white transition">
                            Stand
                        </button>
                        <button onClick={double} disabled={!canDouble} className="py-4 rounded-xl bg-purple-500/20 text-purple-200 border border-purple-500/30 font-bold hover:bg-purple-500 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed">
                            Double
                        </button>
                    </div>
                )}

                {(phase === 'dealer' || phase === 'done') && (
                    <button
                        onClick={newHand}
                        disabled={phase === 'dealer'}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-lg hover:shadow-lg hover:shadow-purple-500/30 transition disabled:opacity-60"
                    >
                        {phase === 'dealer' ? 'Dealer drawing…' : 'New Hand'}
                    </button>
                )}
            </div>

            <p className="text-center text-xs text-gray-500">
                Trial mode uses play chips only — no wallet, no real funds. Blackjack pays 3:2.
            </p>
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  On-chain Mode – plays against the deployed smart contract         */
/* ------------------------------------------------------------------ */

enum ChainState { WAITING = 0, PLAYER_TURN = 1, DEALER_TURN = 2, ENDED = 3 }

const OnChainBlackjack: React.FC = () => {
    const { address, isConnected } = useAccount();
    const [betAmount, setBetAmount] = useState('0.01');

    const { data: gameState, refetch, isError } = useContractRead({
        address: BLACKJACK_ADDRESS,
        abi: BLACKJACK_ABI,
        functionName: 'getGameState',
        args: [address!],
        enabled: !!address,
        watch: true,
    }) as { data: any; refetch: () => void; isError: boolean };

    const { write: startGame, data: startData } = useContractWrite({ address: BLACKJACK_ADDRESS, abi: BLACKJACK_ABI, functionName: 'startGame' });
    const { write: hit, data: hitData } = useContractWrite({ address: BLACKJACK_ADDRESS, abi: BLACKJACK_ABI, functionName: 'hit' });
    const { write: stand, data: standData } = useContractWrite({ address: BLACKJACK_ADDRESS, abi: BLACKJACK_ABI, functionName: 'stand' });
    const { write: doubleDown, data: doubleData } = useContractWrite({ address: BLACKJACK_ADDRESS, abi: BLACKJACK_ABI, functionName: 'doubleDown' });
    const { write: withdraw, data: withdrawData } = useContractWrite({ address: BLACKJACK_ADDRESS, abi: BLACKJACK_ABI, functionName: 'withdraw' });

    const { isLoading: isStarting } = useWaitForTransaction({ hash: startData?.hash, onSuccess: () => { toast.success('Game started!'); refetch(); } });
    useWaitForTransaction({ hash: hitData?.hash, onSuccess: () => refetch() });
    useWaitForTransaction({ hash: standData?.hash, onSuccess: () => refetch() });
    useWaitForTransaction({ hash: doubleData?.hash, onSuccess: () => refetch() });
    const { isLoading: isWithdrawing } = useWaitForTransaction({ hash: withdrawData?.hash, onSuccess: () => toast.success('Winnings withdrawn!') });

    if (!isConnected) {
        return (
            <div className="glass-panel rounded-2xl p-10 text-center space-y-3">
                <div className="text-5xl">🔗</div>
                <h3 className="text-xl font-bold text-white">Connect a wallet for on-chain play</h3>
                <p className="text-gray-400">On-chain mode wagers real Sepolia ETH against the smart-contract dealer. Prefer no setup? Switch back to Trial mode above.</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="glass-panel rounded-2xl p-10 text-center space-y-3">
                <div className="text-5xl">⚠️</div>
                <h3 className="text-xl font-bold text-white">Contract not reachable</h3>
                <p className="text-gray-400">The Blackjack contract isn’t deployed on this network yet. Trial mode works right now with no setup.</p>
                <button onClick={refetch} className="px-5 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition">Retry</button>
            </div>
        );
    }

    const currentBet = gameState ? gameState[0] : BigInt(0);
    const playerTotal = gameState ? Number(gameState[1]) : 0;
    const dealerTotal = gameState ? Number(gameState[2]) : 0;
    const roundState = gameState ? Number(gameState[3]) : 0;
    const playerCards: Card[] = gameState ? gameState[4] : [];
    const dealerCards: Card[] = gameState ? gameState[5] : [];
    const isPlayerTurn = roundState === ChainState.PLAYER_TURN;
    const isEnded = roundState === ChainState.ENDED;
    const isWaiting = roundState === ChainState.WAITING;

    return (
        <div className="space-y-6">
            <div className="rounded-3xl p-6 md:p-10 bg-gradient-to-b from-emerald-900/40 to-slate-900/60 border border-emerald-500/20 space-y-8">
                <div className="text-center">
                    <p className="text-sm uppercase tracking-widest text-gray-400 mb-3">Dealer {isEnded ? `· ${dealerTotal}` : '· ?'}</p>
                    <div className="flex justify-center gap-3 min-h-[92px]">
                        {dealerCards.length === 0 ? <><EmptySlot /><EmptySlot /></> : dealerCards.map((c, i) => <PlayingCard key={i} card={c} hidden={i === 1 && !isEnded} />)}
                    </div>
                </div>
                {isEnded && (
                    <div className="text-center">
                        <span className="px-6 py-2 rounded-full font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-500">
                            {playerTotal > 21 ? 'Bust! You lose' : dealerTotal > 21 ? 'Dealer busts — you win!' : playerTotal > dealerTotal ? 'You win!' : playerTotal === dealerTotal ? 'Push' : 'Dealer wins'}
                        </span>
                    </div>
                )}
                <div className="text-center">
                    <div className="flex justify-center gap-3 min-h-[92px]">
                        {playerCards.length === 0 ? <><EmptySlot /><EmptySlot /></> : playerCards.map((c, i) => <PlayingCard key={i} card={c} />)}
                    </div>
                    <p className="text-sm uppercase tracking-widest text-gray-400 mt-3">You · {playerTotal}</p>
                    {currentBet > BigInt(0) && <p className="text-amber-300 mt-1">Bet: {formatEther(currentBet)} ETH</p>}
                </div>
            </div>

            <div className="glass-panel rounded-2xl p-5">
                {isWaiting || isEnded ? (
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                        <input
                            type="number"
                            step="0.001"
                            value={betAmount}
                            onChange={(e) => setBetAmount(e.target.value)}
                            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500/50"
                            placeholder="Bet (ETH)"
                        />
                        <button
                            onClick={() => { try { startGame({ value: parseEther(betAmount) }); } catch { toast.error('Invalid bet'); } }}
                            disabled={isStarting}
                            className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold hover:shadow-lg hover:shadow-emerald-500/30 transition disabled:opacity-50"
                        >
                            {isStarting ? 'Placing…' : 'Place Bet'}
                        </button>
                        {isEnded && (
                            <button onClick={() => withdraw?.()} disabled={isWithdrawing} className="px-6 py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition disabled:opacity-50">
                                {isWithdrawing ? 'Withdrawing…' : 'Withdraw'}
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-3">
                        <button onClick={() => hit?.()} disabled={!isPlayerTurn} className="py-4 rounded-xl bg-cyan-500/20 text-cyan-200 border border-cyan-500/30 font-bold hover:bg-cyan-500 hover:text-white transition disabled:opacity-40">Hit</button>
                        <button onClick={() => stand?.()} disabled={!isPlayerTurn} className="py-4 rounded-xl bg-amber-500/20 text-amber-200 border border-amber-500/30 font-bold hover:bg-amber-500 hover:text-white transition disabled:opacity-40">Stand</button>
                        <button onClick={() => doubleDown?.({ value: currentBet })} disabled={!isPlayerTurn || playerCards.length !== 2} className="py-4 rounded-xl bg-purple-500/20 text-purple-200 border border-purple-500/30 font-bold hover:bg-purple-500 hover:text-white transition disabled:opacity-40">Double</button>
                    </div>
                )}
            </div>
        </div>
    );
};

/* ------------------------------------------------------------------ */

const BlackjackGame: React.FC = () => {
    const [mode, setMode] = useState<GameMode>('trial');

    return (
        <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
                <h1 className="text-4xl md:text-5xl font-bold mb-2">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">Blackjack</span>
                    <span className="ml-3">🃏</span>
                </h1>
                <p className="text-gray-400">Beat the dealer to 21. Play free, or wager on-chain.</p>
            </div>

            <ModeToggle mode={mode} onChange={setMode} />

            <div className="mt-6">
                {mode === 'trial' ? <TrialBlackjack /> : <OnChainBlackjack />}
            </div>
        </div>
    );
};

export default BlackjackGame;
