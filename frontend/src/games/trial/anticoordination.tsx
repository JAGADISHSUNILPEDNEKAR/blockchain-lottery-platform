import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useDemoCredits } from '../../hooks/useDemoCredits';
import {
    BetSelector,
    ChoiceButton,
    Panel,
    PrimaryButton,
    ResultBanner,
    StatRow,
    Tally,
    TrialNote,
    randInt,
    type Outcome,
} from './shared';

/* ================================================================== */
/*  5. The Minority Game — win by joining the smaller room            */
/* ================================================================== */

export const MinorityGame: React.FC = () => {
    const { add, canAfford } = useDemoCredits();
    const FIELD = 15;
    const [bet, setBet] = useState(25);
    const [done, setDone] = useState(false);
    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const [counts, setCounts] = useState<[number, number]>([0, 0]);
    const [message, setMessage] = useState('Pick a room. The room with fewer players wins and splits the rest.');

    const choose = (room: 0 | 1) => {
        if (!canAfford(bet)) return toast.error('Not enough chips.');
        add(-bet);
        const tally: [number, number] = [0, 0];
        tally[room] += 1;
        for (let i = 0; i < FIELD; i++) tally[randInt(0, 1) as 0 | 1] += 1;
        setCounts(tally);
        setDone(true);
        const minRoom = tally[0] < tally[1] ? 0 : tally[1] < tally[0] ? 1 : -1;
        const pot = bet * (FIELD + 1);
        if (minRoom === room) {
            const share = Math.round(pot / tally[room]);
            add(share);
            setOutcome('win');
            setMessage(`Room ${room === 0 ? 'A' : 'B'} was the minority — you win ${share} chips.`);
        } else if (minRoom === -1) {
            add(bet);
            setOutcome('push');
            setMessage('Dead tie — stakes returned.');
        } else {
            setOutcome('lose');
            setMessage(`Your room was crowded. The minority took the pot.`);
        }
    };

    const reset = () => { setDone(false); setOutcome(null); setCounts([0, 0]); setMessage('Pick a room. The room with fewer players wins and splits the rest.'); };

    return (
        <div className="space-y-5">
            <Panel><ResultBanner outcome={outcome} message={message} /></Panel>
            {!done ? (
                <Panel className="space-y-5">
                    <BetSelector bet={bet} setBet={setBet} />
                    <div className="flex gap-3">
                        <ChoiceButton accent="from-cyan-500 to-blue-500" disabled={!canAfford(bet)} onClick={() => choose(0)}>🚪 Room A</ChoiceButton>
                        <ChoiceButton accent="from-orange-500 to-amber-500" disabled={!canAfford(bet)} onClick={() => choose(1)}>🚪 Room B</ChoiceButton>
                    </div>
                </Panel>
            ) : (
                <>
                    <div className="space-y-2">
                        <Tally label="Room A" count={counts[0]} total={FIELD + 1} accent="from-cyan-500 to-blue-500" highlight={counts[0] < counts[1]} />
                        <Tally label="Room B" count={counts[1]} total={FIELD + 1} accent="from-orange-500 to-amber-500" highlight={counts[1] < counts[0]} />
                    </div>
                    <PrimaryButton onClick={reset}>Play Again</PrimaryButton>
                </>
            )}
            <TrialNote />
        </div>
    );
};

/* ================================================================== */
/*  Shared unique-bid engine for LUBA / HUBA                          */
/* ================================================================== */

const UniqueBid: React.FC<{ mode: 'low' | 'high' }> = ({ mode }) => {
    const { add, canAfford } = useDemoCredits();
    const FIELD = 10;
    const RANGE = 9;
    const [bet, setBet] = useState(25);
    const [bid, setBid] = useState(mode === 'low' ? 1 : RANGE);
    const [done, setDone] = useState(false);
    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const [winning, setWinning] = useState<number | null>(null);
    const [freq, setFreq] = useState<number[]>([]);
    const [message, setMessage] = useState(
        mode === 'low'
            ? 'Bid the lowest number nobody else picks.'
            : 'Bid the highest number nobody else picks.',
    );

    const play = () => {
        if (!canAfford(bet)) return toast.error('Not enough chips.');
        add(-bet);
        const counts = new Array(RANGE + 1).fill(0); // index 1..RANGE
        counts[bid] += 1;
        for (let i = 0; i < FIELD; i++) {
            // naive crowd skews toward the "attractive" end of the range
            const base = mode === 'low' ? Math.min(randInt(1, 3), randInt(1, RANGE)) : Math.max(randInt(RANGE - 2, RANGE), randInt(1, RANGE));
            counts[base] += 1;
        }
        const uniques = [];
        for (let n = 1; n <= RANGE; n++) if (counts[n] === 1) uniques.push(n);
        const win = uniques.length ? (mode === 'low' ? Math.min(...uniques) : Math.max(...uniques)) : null;
        setFreq(counts);
        setWinning(win);
        setDone(true);
        if (win !== null && win === bid) {
            const pot = bet * (FIELD + 1);
            add(pot);
            setOutcome('win');
            setMessage(`${bid} was the ${mode === 'low' ? 'lowest' : 'highest'} unique bid — you win ${pot} chips!`);
        } else if (win === null) {
            setOutcome('lose');
            setMessage('No unique bid this round — the pot carries over to the house.');
        } else {
            setOutcome('lose');
            setMessage(`Your bid wasn’t the winner. ${win} took it.`);
        }
    };

    const reset = () => { setDone(false); setOutcome(null); setWinning(null); setFreq([]); setMessage(mode === 'low' ? 'Bid the lowest number nobody else picks.' : 'Bid the highest number nobody else picks.'); };

    return (
        <div className="space-y-5">
            <Panel>
                <ResultBanner outcome={outcome} message={message} />
                {done && (
                    <div className="mt-4 grid grid-cols-9 gap-1.5">
                        {Array.from({ length: RANGE }, (_, i) => i + 1).map((n) => (
                            <div key={n} className={`rounded-lg p-2 text-center border ${n === winning ? 'border-emerald-400 bg-emerald-500/20' : n === bid ? 'border-amber-400 bg-amber-500/10' : 'border-white/10 bg-white/5'}`}>
                                <div className="text-sm font-bold text-white">{n}</div>
                                <div className="text-[10px] text-gray-400">×{freq[n] ?? 0}</div>
                            </div>
                        ))}
                    </div>
                )}
            </Panel>
            {!done ? (
                <Panel className="space-y-5">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400">Your bid</span>
                            <span className="text-2xl font-bold text-cyan-300">{bid}</span>
                        </div>
                        <input type="range" min={1} max={RANGE} value={bid} onChange={(e) => setBid(Number(e.target.value))} className="w-full accent-cyan-400" />
                    </div>
                    <BetSelector bet={bet} setBet={setBet} />
                    <PrimaryButton onClick={play} disabled={!canAfford(bet)}>Place Sealed Bid</PrimaryButton>
                </Panel>
            ) : (
                <PrimaryButton onClick={reset}>Play Again</PrimaryButton>
            )}
            <TrialNote />
        </div>
    );
};

/* 6. Lowest Unique Bid Auction */
export const LowestUniqueBid: React.FC = () => <UniqueBid mode="low" />;
/* 7. Highest Unique Bid Auction */
export const HighestUniqueBid: React.FC = () => <UniqueBid mode="high" />;

/* ================================================================== */
/*  8. El Farol Bar — go only if it won't be crowded                  */
/* ================================================================== */

export const ElFarolBar: React.FC = () => {
    const { add, canAfford } = useDemoCredits();
    const FIELD = 49;
    const THRESHOLD = 30; // 60% capacity of 50
    const [bet, setBet] = useState(25);
    const [done, setDone] = useState(false);
    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const [goers, setGoers] = useState(0);
    const [message, setMessage] = useState(`The bar is fun only if fewer than ${THRESHOLD} of 50 show up. Go, or stay home?`);

    const decide = (go: boolean) => {
        if (go && !canAfford(bet)) return toast.error('Not enough chips for the cover charge.');
        if (go) add(-bet);
        let g = go ? 1 : 0;
        for (let i = 0; i < FIELD; i++) if (Math.random() < 0.6) g += 1;
        setGoers(g);
        setDone(true);
        const crowded = g >= THRESHOLD;
        if (go && !crowded) {
            add(bet * 2);
            setOutcome('win');
            setMessage(`Only ${g} showed up — great night! You double your stake.`);
        } else if (go && crowded) {
            setOutcome('lose');
            setMessage(`${g} crammed in — overcrowded. Cover charge lost to the stay-homers.`);
        } else if (!go && crowded) {
            // Stayers split the goers' lost cover charges.
            const stayers = FIELD + 1 - g;
            const share = Math.round((g * bet) / Math.max(1, stayers));
            add(share);
            setOutcome('win');
            setMessage(`It was packed (${g}). You stayed home and collected ${share} chips.`);
        } else {
            setOutcome('push');
            setMessage(`Only ${g} went — you missed a good night, but risked nothing.`);
        }
    };

    const reset = () => { setDone(false); setOutcome(null); setGoers(0); setMessage(`The bar is fun only if fewer than ${THRESHOLD} of 50 show up. Go, or stay home?`); };

    return (
        <div className="space-y-5">
            <Panel>
                <ResultBanner outcome={outcome} message={message} />
                {done && <div className="mt-4"><Tally label={`Attendance (fun below ${THRESHOLD})`} count={goers} total={FIELD + 1} accent={goers >= THRESHOLD ? 'from-rose-500 to-red-600' : 'from-emerald-500 to-green-500'} /></div>}
            </Panel>
            {!done ? (
                <Panel className="space-y-5">
                    <BetSelector bet={bet} setBet={setBet} label="Cover charge" />
                    <div className="flex gap-3">
                        <ChoiceButton accent="from-emerald-500 to-green-500" disabled={!canAfford(bet)} onClick={() => decide(true)}>🍻 Go to the bar</ChoiceButton>
                        <ChoiceButton accent="from-slate-500 to-slate-600" onClick={() => decide(false)}>🛋️ Stay home</ChoiceButton>
                    </div>
                    <StatRow label="Capacity threshold" value={`${THRESHOLD} / 50`} />
                </Panel>
            ) : (
                <PrimaryButton onClick={reset}>Next Night</PrimaryButton>
            )}
            <TrialNote />
        </div>
    );
};
