import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useDemoCredits } from '../../hooks/useDemoCredits';
import {
    BetSelector,
    ChoiceButton,
    GhostButton,
    Panel,
    PrimaryButton,
    ResultBanner,
    StatRow,
    TrialNote,
    randInt,
    type Outcome,
} from './shared';

/* ================================================================== */
/*  14. Shubik's Dollar Auction — the escalation trap                 */
/* ================================================================== */

export const DollarAuction: React.FC = () => {
    const { add, canAfford } = useDemoCredits();
    const PRIZE = 100;
    const INC = 10;
    const [started, setStarted] = useState(false);
    const [myBid, setMyBid] = useState(0);
    const [botBid, setBotBid] = useState(0);
    const [done, setDone] = useState(false);
    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const [message, setMessage] = useState(`Win the ${PRIZE}-chip prize — but the 2nd-highest bidder also pays and gets nothing.`);
    const tolerance = useRef(PRIZE + randInt(0, 40));

    const begin = () => {
        tolerance.current = PRIZE + randInt(0, 40);
        setBotBid(INC); setMyBid(0); setStarted(true); setDone(false); setOutcome(null);
        setMessage(`Rival opened at ${INC}. Raise to ${INC * 2}, or walk away?`);
    };

    const raise = () => {
        const newMy = botBid + INC;
        if (!canAfford(newMy)) return toast.error('You can’t cover that bid.');
        setMyBid(newMy);
        // Rival keeps raising until its (rising) tolerance is passed.
        if (newMy + INC <= tolerance.current) {
            const nb = newMy + INC;
            setBotBid(nb);
            setMessage(`Rival raised to ${nb}. You’re losing ${newMy}. Raise to ${nb + INC}?`);
        } else {
            // Rival quits — you win the prize but pay your bid.
            add(PRIZE - newMy);
            setDone(true);
            setOutcome(PRIZE - newMy > 0 ? 'win' : 'lose');
            setMessage(PRIZE - newMy > 0
                ? `Rival folded! You win ${PRIZE} for ${newMy} → +${PRIZE - newMy} net.`
                : `You won, but overpaid: ${newMy} for a ${PRIZE} prize. Net ${PRIZE - newMy}.`);
        }
    };

    const walk = () => {
        // You stop while rival leads: you are the 2nd-highest bidder and still pay.
        if (myBid > 0) add(-myBid);
        setDone(true);
        setOutcome(myBid > 0 ? 'lose' : 'push');
        setMessage(myBid > 0 ? `You walked away as 2nd-highest — you still pay ${myBid} for nothing.` : 'You never bid. No harm done.');
    };

    return (
        <div className="space-y-5">
            <Panel>
                <ResultBanner outcome={outcome} message={message} />
                {started && (
                    <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                        <div><p className="text-xs text-gray-400">Your bid</p><p className="text-2xl font-bold text-amber-300">{myBid}</p></div>
                        <div><p className="text-xs text-gray-400">Rival bid</p><p className="text-2xl font-bold text-rose-300">{botBid}</p></div>
                    </div>
                )}
            </Panel>
            {!started || done ? (
                <PrimaryButton onClick={begin} disabled={!canAfford(INC)}>{done ? 'Play Again' : `Enter the Auction (${PRIZE}-chip prize)`}</PrimaryButton>
            ) : (
                <Panel>
                    <div className="flex gap-3">
                        <ChoiceButton accent="from-emerald-500 to-green-500" onClick={raise}>⬆️ Raise to {botBid + INC}</ChoiceButton>
                        <ChoiceButton accent="from-slate-500 to-slate-600" onClick={walk}>🚪 Walk away</ChoiceButton>
                    </div>
                </Panel>
            )}
            <TrialNote />
        </div>
    );
};

/* ================================================================== */
/*  15. Vickrey Auction — sealed bid, winner pays 2nd price           */
/* ================================================================== */

export const VickreyAuction: React.FC = () => {
    const { add, canAfford } = useDemoCredits();
    const [value, setValue] = useState(() => randInt(60, 140));
    const [bet, setBet] = useState(25);
    const [bid, setBid] = useState(100);
    const [done, setDone] = useState(false);
    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const [message, setMessage] = useState('The item is worth your private value. Bid your true value — it’s the dominant strategy.');

    const play = () => {
        if (!canAfford(bet)) return toast.error('Not enough chips for the entry fee.');
        add(-bet);
        const rivals = Array.from({ length: 3 }, () => randInt(50, 150)); // rivals bid ~their value
        const allBids = [{ me: true, b: bid }, ...rivals.map((b) => ({ me: false, b }))].sort((a, b) => b.b - a.b);
        const winner = allBids[0];
        const price = allBids[1].b; // second price
        setDone(true);
        if (winner.me) {
            const net = value - price;
            add(value > 0 ? value : 0); // you receive the item's value
            add(-price); // and pay the second price
            setOutcome(net > 0 ? 'win' : 'lose');
            setMessage(`You won! Item worth ${value}, paid 2nd price ${price} → ${net >= 0 ? '+' : ''}${net} on the item.`);
        } else {
            setOutcome('lose');
            setMessage(`You lost — top rival bid ${winner.b}. Entry fee gone. Your value was ${value}.`);
        }
    };

    const reset = () => { setValue(randInt(60, 140)); setDone(false); setOutcome(null); setMessage('The item is worth your private value. Bid your true value — it’s the dominant strategy.'); };

    return (
        <div className="space-y-5">
            <Panel>
                <ResultBanner outcome={outcome} message={message} />
                <div className="mt-4"><StatRow label="Your private value" value={<span className="text-emerald-300">{value} chips</span>} /></div>
            </Panel>
            {!done ? (
                <Panel className="space-y-5">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400">Your sealed bid</span>
                            <span className="text-2xl font-bold text-cyan-300">{bid}</span>
                        </div>
                        <input type="range" min={0} max={200} step={5} value={bid} onChange={(e) => setBid(Number(e.target.value))} className="w-full accent-cyan-400" />
                    </div>
                    <BetSelector bet={bet} setBet={setBet} label="Entry fee" />
                    <PrimaryButton onClick={play} disabled={!canAfford(bet)}>Submit Sealed Bid · 3 rivals</PrimaryButton>
                </Panel>
            ) : (
                <PrimaryButton onClick={reset}>Play Again</PrimaryButton>
            )}
            <TrialNote />
        </div>
    );
};

/* ================================================================== */
/*  16. All-Pay Auction — everyone pays their bid                     */
/* ================================================================== */

export const AllPayAuction: React.FC = () => {
    const { add, canAfford } = useDemoCredits();
    const PRIZE = 150;
    const [bid, setBid] = useState(50);
    const [done, setDone] = useState(false);
    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const [rivalsBids, setRivalsBids] = useState<number[]>([]);
    const [message, setMessage] = useState(`Highest bid wins ${PRIZE} chips — but everyone pays their bid, win or lose.`);

    const play = () => {
        if (!canAfford(bid)) return toast.error('Not enough chips.');
        add(-bid); // you always pay your bid
        const rivals = Array.from({ length: 3 }, () => randInt(0, PRIZE));
        setRivalsBids(rivals);
        const topRival = Math.max(...rivals);
        setDone(true);
        if (bid > topRival) {
            add(PRIZE);
            setOutcome(PRIZE - bid > 0 ? 'win' : 'lose');
            setMessage(`You won the ${PRIZE}-chip prize for a ${bid} bid → net ${PRIZE - bid}.`);
        } else {
            setOutcome('lose');
            setMessage(`A rival bid ${topRival} and took the prize. Your ${bid}-chip bid is gone.`);
        }
    };

    const reset = () => { setDone(false); setOutcome(null); setRivalsBids([]); setMessage(`Highest bid wins ${PRIZE} chips — but everyone pays their bid, win or lose.`); };

    return (
        <div className="space-y-5">
            <Panel>
                <ResultBanner outcome={outcome} message={message} />
                {done && <div className="mt-3"><StatRow label="Rival bids" value={rivalsBids.join(' · ')} /></div>}
            </Panel>
            {!done ? (
                <Panel className="space-y-5">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400">Your bid (non-refundable)</span>
                            <span className="text-2xl font-bold text-rose-300">{bid}</span>
                        </div>
                        <input type="range" min={0} max={PRIZE} step={5} value={bid} onChange={(e) => setBid(Number(e.target.value))} className="w-full accent-rose-400" />
                    </div>
                    <PrimaryButton onClick={play} disabled={!canAfford(bid)}>Commit Bid · 3 rivals</PrimaryButton>
                </Panel>
            ) : (
                <PrimaryButton onClick={reset}>Play Again</PrimaryButton>
            )}
            <TrialNote />
        </div>
    );
};

/* ================================================================== */
/*  17. Reverse Dutch Clock — price falls, first to buy wins          */
/* ================================================================== */

export const ReverseDutchAuction: React.FC = () => {
    const { add, canAfford } = useDemoCredits();
    const VALUE = 100;
    const START = 160;
    const FLOOR = 20;
    const [bet, setBet] = useState(25);
    const [price, setPrice] = useState(START);
    const [running, setRunning] = useState(false);
    const [done, setDone] = useState(false);
    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const [message, setMessage] = useState(`Item is worth ${VALUE}. Price falls each tick — buy low, but rivals may snipe first.`);
    const timer = useRef<ReturnType<typeof setInterval> | null>(null);
    const priceRef = useRef(START);

    const stop = () => { if (timer.current) { clearInterval(timer.current); timer.current = null; } };
    useEffect(() => stop, []);

    const endRound = (o: Outcome, msg: string) => { stop(); setRunning(false); setDone(true); setOutcome(o); setMessage(msg); };

    const start = () => {
        if (!canAfford(bet)) return toast.error('Not enough chips for the entry fee.');
        add(-bet);
        priceRef.current = START;
        setPrice(START); setRunning(true); setDone(false); setOutcome(null);
        setMessage('Price is falling… click Buy Now when it’s low enough.');
        timer.current = setInterval(() => {
            const next = priceRef.current - 10;
            // Rivals grow more likely to snipe as the price drops below value.
            const snipeChance = next < VALUE ? (VALUE - next) / 160 : 0;
            priceRef.current = Math.max(next, FLOOR);
            setPrice(priceRef.current);
            if (next <= FLOOR) { endRound('lose', `Price hit the floor (${FLOOR}) unsold — entry fee lost.`); return; }
            if (Math.random() < snipeChance) { endRound('lose', `A rival sniped it at ${next}! You missed out.`); }
        }, 700);
    };

    const buy = () => {
        const p = priceRef.current;
        const net = VALUE - p;
        if (net > 0) { add(VALUE); add(-p); }
        endRound(net > 0 ? 'win' : 'lose', net > 0 ? `Bought at ${p}! Item worth ${VALUE} → +${net}.` : `Bought at ${p} — above its ${VALUE} value. Net ${net}.`);
    };

    const reset = () => { setDone(false); setOutcome(null); setPrice(START); setMessage(`Item is worth ${VALUE}. Price falls each tick — buy low, but rivals may snipe first.`); };

    return (
        <div className="space-y-5">
            <Panel>
                <ResultBanner outcome={outcome} message={message} />
                <div className="mt-4 text-center">
                    <p className="text-xs text-gray-400">Current price</p>
                    <p className={`text-5xl font-bold ${price < VALUE ? 'text-emerald-300' : 'text-amber-300'}`}>{price}</p>
                    <p className="text-xs text-gray-500 mt-1">Item value: {VALUE}</p>
                </div>
            </Panel>
            {running ? (
                <PrimaryButton onClick={buy}>🛒 Buy Now at {price}</PrimaryButton>
            ) : (
                <Panel className="space-y-5">
                    <BetSelector bet={bet} setBet={setBet} label="Entry fee" />
                    <PrimaryButton onClick={done ? reset : start} disabled={!canAfford(bet)}>{done ? 'Play Again' : 'Start the Clock'}</PrimaryButton>
                </Panel>
            )}
            <TrialNote />
        </div>
    );
};

/* ================================================================== */
/*  18. Candle Auction — random termination beats snipers            */
/* ================================================================== */

export const CandleAuction: React.FC = () => {
    const { add, canAfford } = useDemoCredits();
    const PRIZE = 120;
    const INC = 15;
    const [started, setStarted] = useState(false);
    const [myBid, setMyBid] = useState(0);
    const [botBid, setBotBid] = useState(0);
    const [done, setDone] = useState(false);
    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const [message, setMessage] = useState(`Bid for the ${PRIZE}-chip prize. The candle goes out at a random moment — lead when it does.`);

    const begin = () => { setStarted(true); setDone(false); setOutcome(null); setMyBid(0); setBotBid(INC); setMessage(`Rival leads at ${INC}. Outbid to take the lead before the candle dies.`); };

    const settleIfCandleDies = (leadIsMine: boolean, mine: number): boolean => {
        if (Math.random() < 0.3) {
            if (leadIsMine) {
                add(PRIZE - mine);
                setOutcome(PRIZE - mine > 0 ? 'win' : 'lose');
                setMessage(`🕯️ Candle out! You led at ${mine} → win ${PRIZE}, net ${PRIZE - mine}.`);
            } else {
                setOutcome('lose');
                setMessage(`🕯️ Candle out while the rival led. You pay nothing, but win nothing.`);
            }
            setDone(true);
            return true;
        }
        return false;
    };

    const raise = () => {
        const newMy = botBid + INC;
        if (!canAfford(newMy)) return toast.error('You can’t cover that bid.');
        setMyBid(newMy);
        if (settleIfCandleDies(true, newMy)) return;
        // Rival counters, then candle may die on their lead.
        const nb = newMy + INC;
        setBotBid(nb);
        if (settleIfCandleDies(false, newMy)) return;
        setMessage(`Rival countered to ${nb}. Raise to ${nb + INC}, or hold?`);
    };

    const hold = () => {
        if (settleIfCandleDies(myBid > botBid, myBid)) return;
        // You hold; rival may extend; candle keeps flickering.
        if (settleIfCandleDies(false, myBid)) return;
        setMessage(`You held at ${myBid}. Rival still leads at ${botBid} — the candle flickers on. Raise?`);
    };

    return (
        <div className="space-y-5">
            <Panel>
                <ResultBanner outcome={outcome} message={message} />
                {started && (
                    <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                        <div><p className="text-xs text-gray-400">Your bid</p><p className="text-2xl font-bold text-amber-300">{myBid}</p></div>
                        <div><p className="text-xs text-gray-400">Rival bid</p><p className="text-2xl font-bold text-rose-300">{botBid}</p></div>
                    </div>
                )}
            </Panel>
            {!started || done ? (
                <PrimaryButton onClick={begin} disabled={!canAfford(INC)}>{done ? 'Play Again' : 'Light the Candle'}</PrimaryButton>
            ) : (
                <Panel>
                    <div className="flex gap-3">
                        <ChoiceButton accent="from-emerald-500 to-green-500" onClick={raise}>⬆️ Raise to {botBid + INC}</ChoiceButton>
                        <ChoiceButton accent="from-slate-500 to-slate-600" onClick={hold}>✋ Hold</ChoiceButton>
                    </div>
                    <div className="mt-3"><GhostButton className="w-full" onClick={hold}>Wait and hope the candle dies</GhostButton></div>
                </Panel>
            )}
            <TrialNote />
        </div>
    );
};
