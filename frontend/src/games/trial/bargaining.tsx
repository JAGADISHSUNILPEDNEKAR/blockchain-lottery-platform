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
    TrialNote,
    gaussian,
    randInt,
    type Outcome,
} from './shared';

/* ================================================================== */
/*  25. The Pirate Game — sequential bargaining, 5 pirates            */
/* ================================================================== */

export const PirateGame: React.FC = () => {
    const { add, canAfford } = useDemoCredits();
    const COINS = 100;
    // Backward-induction fallbacks for pirates 2..5 if the captain is thrown overboard.
    const FALLBACK = [99, 0, 1, 0]; // p2, p3, p4, p5
    const [bet, setBet] = useState(25);
    const [offers, setOffers] = useState<[number, number, number, number]>([0, 1, 0, 1]); // to p2..p5
    const captainShare = COINS - offers.reduce((s, n) => s + n, 0);
    const [done, setDone] = useState(false);
    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const [votes, setVotes] = useState<boolean[]>([]);
    const [message, setMessage] = useState('You are the captain. Propose how to split 100 coins — you need at least half the votes.');

    const setOffer = (i: number, v: number) => {
        const next = [...offers] as [number, number, number, number];
        next[i] = v;
        setOffers(next);
    };

    const play = () => {
        if (captainShare < 0) return toast.error('Your offers exceed 100 coins.');
        if (!canAfford(bet)) return toast.error('Not enough chips.');
        add(-bet);
        // Each pirate votes yes if the offer beats their fallback; a little bloodthirst adds noise.
        const v = offers.map((offer, i) => {
            const base = offer > FALLBACK[i] || (offer === FALLBACK[i] && Math.random() < 0.3);
            return base && Math.random() > 0.08; // 8% betray even a fair offer
        });
        const yes = 1 + v.filter(Boolean).length; // captain votes for himself
        const passed = yes >= 3; // 3 of 5
        setVotes(v); setDone(true);
        if (passed) {
            add(captainShare);
            setOutcome(captainShare > bet ? 'win' : 'lose');
            setMessage(`Approved with ${yes}/5 votes! You keep ${captainShare} coins.`);
        } else {
            setOutcome('lose');
            setMessage(`Rejected (${yes}/5) — overboard you go. Stake lost.`);
        }
    };

    const reset = () => { setDone(false); setOutcome(null); setVotes([]); setMessage('You are the captain. Propose how to split 100 coins — you need at least half the votes.'); };

    return (
        <div className="space-y-5">
            <Panel>
                <ResultBanner outcome={outcome} message={message} />
                <div className="mt-4"><StatRow label="🏴‍☠️ Your share (Captain)" value={<span className={captainShare < 0 ? 'text-rose-400' : 'text-amber-300'}>{captainShare} coins</span>} /></div>
            </Panel>
            {!done ? (
                <Panel className="space-y-4">
                    {([0, 1, 2, 3] as const).map((i) => (
                        <div key={i} className="space-y-1">
                            <div className="flex justify-between text-sm"><span className="text-gray-400">Pirate {i + 2}</span><span className="font-bold text-cyan-300">{offers[i]}</span></div>
                            <input type="range" min={0} max={COINS} value={offers[i]} onChange={(e) => setOffer(i, Number(e.target.value))} className="w-full accent-cyan-400" />
                        </div>
                    ))}
                    <BetSelector bet={bet} setBet={setBet} />
                    <PrimaryButton onClick={play} disabled={!canAfford(bet) || captainShare < 0}>Propose the Split</PrimaryButton>
                </Panel>
            ) : (
                <>
                    <Panel>
                        <div className="grid grid-cols-4 gap-2 text-center">
                            {votes.map((v, i) => (
                                <div key={i} className={`rounded-xl p-2 border ${v ? 'border-emerald-400/60 bg-emerald-500/10' : 'border-rose-400/60 bg-rose-500/10'}`}>
                                    <div className="text-xs text-gray-400">P{i + 2}</div>
                                    <div className="text-lg">{v ? '✅' : '❌'}</div>
                                </div>
                            ))}
                        </div>
                    </Panel>
                    <PrimaryButton onClick={reset}>Play Again</PrimaryButton>
                </>
            )}
            <TrialNote />
        </div>
    );
};

/* ================================================================== */
/*  26. Ultimatum Game — fair offer, or risk rejection               */
/* ================================================================== */

export const UltimatumGame: React.FC = () => {
    const { add, canAfford } = useDemoCredits();
    const POT = 100;
    const [bet, setBet] = useState(25);
    const [offer, setOffer] = useState(40); // to the responder
    const [done, setDone] = useState(false);
    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const [threshold, setThreshold] = useState(0);
    const [message, setMessage] = useState('Split 100 chips with a responder. Offer too little and they’ll reject out of spite — both get nothing.');

    const play = () => {
        if (!canAfford(bet)) return toast.error('Not enough chips.');
        add(-bet);
        const t = gaussian(32, 12, 0, 70); // responder's spite threshold
        setThreshold(t); setDone(true);
        if (offer >= t) {
            const keep = POT - offer;
            add(keep);
            setOutcome(keep > bet ? 'win' : 'lose');
            setMessage(`Accepted! You keep ${keep} chips (they took ${offer}).`);
        } else {
            setOutcome('lose');
            setMessage(`Rejected — they wanted at least ${t}. Both walk away with nothing.`);
        }
    };

    const reset = () => { setDone(false); setOutcome(null); setThreshold(0); setMessage('Split 100 chips with a responder. Offer too little and they’ll reject out of spite — both get nothing.'); };

    return (
        <div className="space-y-5">
            <Panel>
                <ResultBanner outcome={outcome} message={message} />
                {done && <div className="mt-3"><StatRow label="Responder’s hidden threshold" value={threshold} /></div>}
            </Panel>
            {!done ? (
                <Panel className="space-y-5">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400">Offer to responder</span>
                            <span className="text-2xl font-bold text-cyan-300">{offer} <span className="text-sm text-gray-500">(you keep {POT - offer})</span></span>
                        </div>
                        <input type="range" min={0} max={POT} step={5} value={offer} onChange={(e) => setOffer(Number(e.target.value))} className="w-full accent-cyan-400" />
                    </div>
                    <BetSelector bet={bet} setBet={setBet} />
                    <PrimaryButton onClick={play} disabled={!canAfford(bet)}>Make the Offer</PrimaryButton>
                </Panel>
            ) : (
                <PrimaryButton onClick={reset}>Play Again</PrimaryButton>
            )}
            <TrialNote />
        </div>
    );
};

/* ================================================================== */
/*  27. Liar's Dice (Perudo) — bid and bluff, or call the liar        */
/* ================================================================== */

const DICE_FACES = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
const rollDie = () => randInt(1, 6);

export const LiarsDice: React.FC = () => {
    const { add, canAfford } = useDemoCredits();
    const [bet, setBet] = useState(25);
    const [phase, setPhase] = useState<'idle' | 'bidding' | 'done'>('idle');
    const [myDice, setMyDice] = useState<number[]>([]);
    const [botDice, setBotDice] = useState<number[]>([]);
    const [reveal, setReveal] = useState(false);
    const [bid, setBid] = useState<{ qty: number; face: number; by: 'you' | 'bot' } | null>(null);
    const [qty, setQty] = useState(2);
    const [face, setFace] = useState(3);
    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const [message, setMessage] = useState('Each side has 5 hidden dice. Bid on the total count of a face across all 10 — or call a bluff.');

    const begin = () => {
        if (!canAfford(bet)) return toast.error('Not enough chips.');
        add(-bet);
        const mine = Array.from({ length: 5 }, rollDie);
        const theirs = Array.from({ length: 5 }, rollDie);
        setMyDice(mine); setBotDice(theirs); setReveal(false); setBid(null);
        setQty(2); setFace(3); setOutcome(null); setPhase('bidding');
        setMessage('Your turn: make the opening bid.');
    };

    const finish = (iWin: boolean, msg: string) => {
        setReveal(true); setPhase('done');
        if (iWin) { add(bet * 2); setOutcome('win'); } else setOutcome('lose');
        setMessage(msg);
    };

    const actualCount = (f: number) => [...myDice, ...botDice].filter((d) => d === f).length;

    // Bot decides whether to raise your bid or call you a liar.
    const botTurn = (b: { qty: number; face: number }) => {
        const known = botDice.filter((d) => d === b.face).length;
        const expectedTotal = known + 5 / 6; // bot guesses your contribution
        if (b.qty > expectedTotal + 1.3 || b.qty >= 9) {
            // Bot calls liar.
            const actual = actualCount(b.face);
            const truthful = actual >= b.qty;
            finish(!truthful ? true : false,
                truthful
                    ? `Bot called liar — but there really were ${actual} ${DICE_FACES[b.face]}. You win!`
                    : `Bot called liar and was right: only ${actual} ${DICE_FACES[b.face]}. You lose.`);
            return;
        }
        // Bot raises.
        let nq = b.qty, nf = b.face;
        const strongFace = [1, 2, 3, 4, 5, 6].sort((x, y) => botDice.filter((d) => d === y).length - botDice.filter((d) => d === x).length)[0];
        if (b.face < 6 && Math.random() < 0.5) { nf = Math.max(b.face + 1, strongFace > b.face ? strongFace : b.face + 1); }
        else { nq = b.qty + 1; nf = b.face; }
        if (nq > 10) { nq = 10; }
        const newBid = { qty: nq, face: nf, by: 'bot' as const };
        setBid(newBid);
        setQty(nq); setFace(nf);
        setMessage(`Bot bids ${nq} × ${DICE_FACES[nf]}. Raise the bid, or call liar?`);
    };

    const isRaiseValid = (q: number, f: number) => {
        if (!bid) return q >= 1 && f >= 1;
        return q > bid.qty || (q === bid.qty && f > bid.face);
    };

    const makeBid = () => {
        if (!isRaiseValid(qty, face)) return toast.error('New bid must be higher (more dice, or same count on a higher face).');
        const mine = { qty, face, by: 'you' as const };
        setBid(mine);
        setMessage('Bid placed — bot is thinking…');
        setTimeout(() => botTurn({ qty, face }), 450);
    };

    const callLiar = () => {
        if (!bid || bid.by !== 'bot') return toast.error('There is no bot bid to challenge yet.');
        const actual = actualCount(bid.face);
        const truthful = actual >= bid.qty;
        finish(!truthful,
            truthful
                ? `You called liar, but there were ${actual} ${DICE_FACES[bid.face]}. You lose.`
                : `You called liar — only ${actual} ${DICE_FACES[bid.face]}. You win!`);
    };

    const DiceRow: React.FC<{ dice: number[]; label: string; hidden?: boolean }> = ({ dice, label, hidden }) => (
        <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">{label}</p>
            <div className="flex gap-2">
                {dice.map((d, i) => (
                    <div key={i} className="w-11 h-11 rounded-lg bg-white/90 text-slate-900 flex items-center justify-center text-3xl leading-none">
                        {hidden ? <span className="text-slate-400 text-xl">?</span> : DICE_FACES[d]}
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-5">
            <Panel><ResultBanner outcome={outcome} message={message} /></Panel>

            {phase !== 'idle' && (
                <Panel className="space-y-4">
                    <DiceRow dice={botDice} label="Bot's dice" hidden={!reveal} />
                    <DiceRow dice={myDice} label="Your dice" />
                    {bid && <StatRow label="Current bid" value={`${bid.qty} × ${DICE_FACES[bid.face]} (by ${bid.by})`} />}
                </Panel>
            )}

            {phase === 'bidding' ? (
                <Panel className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm"><span className="text-gray-400">Quantity</span><span className="font-bold text-cyan-300">{qty}</span></div>
                            <input type="range" min={1} max={10} value={qty} onChange={(e) => setQty(Number(e.target.value))} className="w-full accent-cyan-400" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm"><span className="text-gray-400">Face</span><span className="font-bold text-cyan-300">{DICE_FACES[face]}</span></div>
                            <input type="range" min={1} max={6} value={face} onChange={(e) => setFace(Number(e.target.value))} className="w-full accent-cyan-400" />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <ChoiceButton accent="from-emerald-500 to-green-500" onClick={makeBid}>📣 Bid {qty} × {DICE_FACES[face]}</ChoiceButton>
                        <ChoiceButton accent="from-rose-500 to-red-600" disabled={!bid || bid.by !== 'bot'} onClick={callLiar}>🗣️ Call Liar</ChoiceButton>
                    </div>
                </Panel>
            ) : (
                <Panel className="space-y-5">
                    <BetSelector bet={bet} setBet={setBet} />
                    <PrimaryButton onClick={begin} disabled={!canAfford(bet)}>{phase === 'done' ? 'Play Again' : 'Roll & Start'}</PrimaryButton>
                </Panel>
            )}
            <TrialNote />
        </div>
    );
};
