import React, { useState } from 'react';
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
/*  9. Prisoner's Dilemma — Split or Steal                            */
/* ================================================================== */

export const SplitOrSteal: React.FC = () => {
    const { add, canAfford } = useDemoCredits();
    const [bet, setBet] = useState(25);
    const [done, setDone] = useState(false);
    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const [opp, setOpp] = useState<'split' | 'steal' | null>(null);
    const [message, setMessage] = useState('Split to share, or Steal to grab it all — if your rival also splits.');

    const choose = (me: 'split' | 'steal') => {
        if (!canAfford(bet)) return toast.error('Not enough chips.');
        add(-bet);
        const rival: 'split' | 'steal' = Math.random() < 0.55 ? 'steal' : 'split';
        setOpp(rival);
        setDone(true);
        if (me === 'split' && rival === 'split') {
            add(bet * 2);
            setOutcome('win');
            setMessage('You both split — the pot is shared. Clean win.');
        } else if (me === 'steal' && rival === 'split') {
            add(bet * 3);
            setOutcome('win');
            setMessage('You stole while they trusted — you take everything!');
        } else if (me === 'split' && rival === 'steal') {
            setOutcome('lose');
            setMessage('You trusted; they stole. Stake lost.');
        } else {
            setOutcome('lose');
            setMessage('Both stole — mutual destruction. Pot goes to the house.');
        }
    };

    const reset = () => { setDone(false); setOutcome(null); setOpp(null); setMessage('Split to share, or Steal to grab it all — if your rival also splits.'); };

    return (
        <div className="space-y-5">
            <Panel>
                <ResultBanner outcome={outcome} message={message} />
                {done && opp && <p className="text-center text-sm text-gray-400 mt-3">Rival chose: <span className="font-bold text-white">{opp === 'split' ? '🤝 Split' : '😈 Steal'}</span></p>}
            </Panel>
            {!done ? (
                <Panel className="space-y-5">
                    <BetSelector bet={bet} setBet={setBet} />
                    <div className="flex gap-3">
                        <ChoiceButton accent="from-emerald-500 to-green-500" disabled={!canAfford(bet)} onClick={() => choose('split')}>🤝 Split</ChoiceButton>
                        <ChoiceButton accent="from-rose-500 to-red-600" disabled={!canAfford(bet)} onClick={() => choose('steal')}>😈 Steal</ChoiceButton>
                    </div>
                </Panel>
            ) : (
                <PrimaryButton onClick={reset}>Play Again</PrimaryButton>
            )}
            <TrialNote />
        </div>
    );
};

/* ================================================================== */
/*  10. Iterated Prisoner's Dilemma — 10 rounds vs Tit-for-Tat        */
/* ================================================================== */

export const IteratedPD: React.FC = () => {
    const { add, canAfford } = useDemoCredits();
    const ROUNDS = 10;
    const [bet, setBet] = useState(25);
    const [started, setStarted] = useState(false);
    const [round, setRound] = useState(0);
    const [myScore, setMyScore] = useState(0);
    const [botScore, setBotScore] = useState(0);
    const [lastMine, setLastMine] = useState<'C' | 'D' | null>(null);
    const [botNext, setBotNext] = useState<'C' | 'D'>('C'); // tit-for-tat starts nice
    const [log, setLog] = useState<string[]>([]);
    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const [message, setMessage] = useState('Buy in, then play 10 rounds. Opponent is Tit-for-Tat: it copies your last move.');

    const begin = () => {
        if (!canAfford(bet)) return toast.error('Not enough chips.');
        add(-bet);
        setStarted(true); setRound(0); setMyScore(0); setBotScore(0); setLastMine(null); setBotNext('C'); setLog([]); setOutcome(null);
        setMessage('Round 1 — Cooperate or Defect?');
    };

    const playMove = (me: 'C' | 'D') => {
        const bot = botNext;
        let ms = 0, bs = 0;
        if (me === 'C' && bot === 'C') { ms = 3; bs = 3; }
        else if (me === 'D' && bot === 'C') { ms = 5; bs = 0; }
        else if (me === 'C' && bot === 'D') { ms = 0; bs = 5; }
        else { ms = 1; bs = 1; }
        const nextRound = round + 1;
        const newMy = myScore + ms, newBot = botScore + bs;
        setMyScore(newMy); setBotScore(newBot);
        setLog((l) => [`R${nextRound}: you ${me} / bot ${bot} → +${ms}`, ...l]);
        setLastMine(me);
        setBotNext(me); // tit-for-tat copies you next round
        setRound(nextRound);
        if (nextRound >= ROUNDS) {
            // Convert points to chips: break-even at full mutual cooperation (30).
            const payout = Math.round((bet * newMy) / 30);
            add(payout);
            setOutcome(newMy > 30 ? 'win' : newMy === 30 ? 'push' : 'lose');
            setMessage(`Final: you ${newMy} pts vs bot ${newBot}. Payout ${payout} chips.`);
        } else {
            setMessage(`Round ${nextRound + 1} — Cooperate or Defect?`);
        }
    };

    const finished = started && round >= ROUNDS;

    return (
        <div className="space-y-5">
            <Panel>
                <ResultBanner outcome={outcome} message={message} />
                {started && (
                    <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                        <div><p className="text-xs text-gray-400">Round</p><p className="text-xl font-bold text-white">{Math.min(round + (finished ? 0 : 1), ROUNDS)}/{ROUNDS}</p></div>
                        <div><p className="text-xs text-gray-400">You</p><p className="text-xl font-bold text-emerald-300">{myScore}</p></div>
                        <div><p className="text-xs text-gray-400">Bot</p><p className="text-xl font-bold text-rose-300">{botScore}</p></div>
                    </div>
                )}
            </Panel>

            {!started || finished ? (
                <Panel className="space-y-5">
                    <BetSelector bet={bet} setBet={setBet} label="Tournament buy-in" />
                    <PrimaryButton onClick={begin} disabled={!canAfford(bet)}>{finished ? 'New Tournament' : 'Start Tournament'}</PrimaryButton>
                </Panel>
            ) : (
                <Panel className="space-y-4">
                    <div className="flex gap-3">
                        <ChoiceButton accent="from-emerald-500 to-green-500" onClick={() => playMove('C')}>🤝 Cooperate</ChoiceButton>
                        <ChoiceButton accent="from-rose-500 to-red-600" onClick={() => playMove('D')}>⚔️ Defect</ChoiceButton>
                    </div>
                    {lastMine && <StatRow label="Your last move" value={lastMine === 'C' ? 'Cooperate' : 'Defect'} />}
                </Panel>
            )}

            {log.length > 0 && (
                <Panel>
                    <div className="max-h-40 overflow-y-auto space-y-1 text-sm text-gray-400">
                        {log.map((l, i) => <div key={i}>{l}</div>)}
                    </div>
                </Panel>
            )}
            <TrialNote />
        </div>
    );
};

/* ================================================================== */
/*  11. Public Goods Game — contribute, pool ×1.5, redistributed      */
/* ================================================================== */

export const PublicGoods: React.FC = () => {
    const { add, canAfford } = useDemoCredits();
    const N = 4;
    const MULT = 1.5;
    const ENDOW = 100;
    const [contribution, setContribution] = useState(50);
    const [done, setDone] = useState(false);
    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const [detail, setDetail] = useState<{ others: number[]; share: number; payout: number } | null>(null);
    const [message, setMessage] = useState(`Everyone has ${ENDOW} chips. Contributions are multiplied ×${MULT} and shared equally.`);

    const play = () => {
        if (!canAfford(ENDOW)) return toast.error(`You need ${ENDOW} chips to join.`);
        add(-ENDOW);
        const others = Array.from({ length: N - 1 }, () => randInt(0, ENDOW)); // some free-ride, some give
        const totalContrib = contribution + others.reduce((s, n) => s + n, 0);
        const share = (totalContrib * MULT) / N;
        const payout = Math.round(ENDOW - contribution + share);
        add(payout);
        setDetail({ others, share: Math.round(share), payout });
        setOutcome(payout > ENDOW ? 'win' : payout === ENDOW ? 'push' : 'lose');
        setDone(true);
        setMessage(`You kept ${ENDOW - contribution}, got ${Math.round(share)} back → ${payout} chips (started ${ENDOW}).`);
    };

    const reset = () => { setDone(false); setOutcome(null); setDetail(null); setMessage(`Everyone has ${ENDOW} chips. Contributions are multiplied ×${MULT} and shared equally.`); };

    return (
        <div className="space-y-5">
            <Panel>
                <ResultBanner outcome={outcome} message={message} />
                {done && detail && (
                    <div className="mt-4 space-y-2">
                        <StatRow label="Others contributed" value={detail.others.join(' · ')} />
                        <StatRow label="Your share of the pool" value={detail.share} />
                        <StatRow label="Total returned" value={detail.payout} />
                    </div>
                )}
            </Panel>
            {!done ? (
                <Panel className="space-y-5">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400">Your contribution</span>
                            <span className="text-2xl font-bold text-cyan-300">{contribution}</span>
                        </div>
                        <input type="range" min={0} max={ENDOW} step={5} value={contribution} onChange={(e) => setContribution(Number(e.target.value))} className="w-full accent-cyan-400" />
                        <div className="flex justify-between text-xs text-gray-500"><span>Free-ride (0)</span><span>All in ({ENDOW})</span></div>
                    </div>
                    <PrimaryButton onClick={play} disabled={!canAfford(ENDOW)}>Contribute · {N} players</PrimaryButton>
                </Panel>
            ) : (
                <PrimaryButton onClick={reset}>Play Again</PrimaryButton>
            )}
            <TrialNote>Trial mode uses play chips only. Each round costs a {ENDOW}-chip endowment.</TrialNote>
        </div>
    );
};

/* ================================================================== */
/*  12. Volunteer's Dilemma — someone must step up                    */
/* ================================================================== */

export const VolunteersDilemma: React.FC = () => {
    const { add, canAfford } = useDemoCredits();
    const OTHERS = 4;
    const [bet, setBet] = useState(25);
    const [done, setDone] = useState(false);
    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const [message, setMessage] = useState('If at least one person volunteers, everyone keeps their reward. If nobody does, all deposits are lost.');

    const decide = (volunteer: boolean) => {
        if (!canAfford(bet)) return toast.error('Not enough chips.');
        add(-bet);
        const someoneElse = Array.from({ length: OTHERS }, () => Math.random() < 0.25).some(Boolean);
        setDone(true);
        if (volunteer) {
            add(Math.round(bet * 1.7));
            setOutcome('win');
            setMessage('You volunteered — everyone is saved, but you bore the cost. Modest win.');
        } else if (someoneElse) {
            add(bet * 2);
            setOutcome('win');
            setMessage('Someone else volunteered — you free-rode to the full reward!');
        } else {
            setOutcome('lose');
            setMessage('Nobody volunteered. Everyone loses their deposit.');
        }
    };

    const reset = () => { setDone(false); setOutcome(null); setMessage('If at least one person volunteers, everyone keeps their reward. If nobody does, all deposits are lost.'); };

    return (
        <div className="space-y-5">
            <Panel><ResultBanner outcome={outcome} message={message} /></Panel>
            {!done ? (
                <Panel className="space-y-5">
                    <BetSelector bet={bet} setBet={setBet} label="Deposit" />
                    <div className="flex gap-3">
                        <ChoiceButton accent="from-emerald-500 to-green-500" disabled={!canAfford(bet)} onClick={() => decide(true)}>🙋 Volunteer<br /><span className="text-xs font-normal opacity-80">safe 1.7×, you pay the cost</span></ChoiceButton>
                        <ChoiceButton accent="from-amber-500 to-orange-500" disabled={!canAfford(bet)} onClick={() => decide(false)}>🙈 Wait<br /><span className="text-xs font-normal opacity-80">2× if someone else acts</span></ChoiceButton>
                    </div>
                    <StatRow label="Other players" value={OTHERS} />
                </Panel>
            ) : (
                <PrimaryButton onClick={reset}>Play Again</PrimaryButton>
            )}
            <TrialNote />
        </div>
    );
};

/* ================================================================== */
/*  13. Centipede Game — take now, or pass to grow the pot            */
/* ================================================================== */

export const CentipedeGame: React.FC = () => {
    const { add, canAfford } = useDemoCredits();
    const MAX_TURNS = 6;
    const GROWTH = 1.5;
    const [bet, setBet] = useState(25);
    const [started, setStarted] = useState(false);
    const [pot, setPot] = useState(0);
    const [turn, setTurn] = useState(0);
    const [done, setDone] = useState(false);
    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const [message, setMessage] = useState('Each pass grows the pot but hands control to your rival. Take the bigger share — or trust and pass.');

    const begin = () => {
        if (!canAfford(bet)) return toast.error('Not enough chips.');
        add(-bet);
        setStarted(true); setDone(false); setOutcome(null); setPot(bet * 2); setTurn(0);
        setMessage('Your move: Take 60% now, or Pass to grow the pot?');
    };

    const finish = (payoutShare: number, result: Outcome, msg: string, finalPot: number) => {
        add(Math.round(finalPot * payoutShare));
        setPot(finalPot);
        setOutcome(result);
        setDone(true);
        setMessage(msg);
    };

    const take = () => {
        finish(0.6, pot >= bet * 2 ? 'win' : 'lose', `You took the pot early — ${Math.round(pot * 0.6)} chips.`, pot);
    };

    const pass = () => {
        const grown = Math.round(pot * GROWTH);
        const nextTurn = turn + 1;
        if (nextTurn >= MAX_TURNS) {
            // Reached the end cooperatively — generous split in your favour.
            finish(0.55, 'win', `You cooperated to the end — the pot grew to ${grown}. You take 55%.`, grown);
            return;
        }
        // Rival decides: greedier as the pot grows.
        const grabChance = 0.2 + nextTurn * 0.15;
        if (Math.random() < grabChance) {
            finish(0.4, grown * 0.4 >= bet ? 'win' : 'lose', `Rival grabbed the pot — you get the 40% leftover (${Math.round(grown * 0.4)}).`, grown);
        } else {
            const grown2 = Math.round(grown * GROWTH);
            setPot(grown2);
            setTurn(nextTurn + 1);
            setMessage(`Rival passed! Pot is now ${grown2}. Take 60%, or push your luck again?`);
        }
    };

    return (
        <div className="space-y-5">
            <Panel>
                <ResultBanner outcome={outcome} message={message} />
                {started && <div className="mt-4 text-center"><p className="text-xs text-gray-400">Current pot</p><p className="text-3xl font-bold text-amber-300">{pot}</p></div>}
            </Panel>
            {!started || done ? (
                <Panel className="space-y-5">
                    <BetSelector bet={bet} setBet={setBet} label="Buy-in" />
                    <PrimaryButton onClick={begin} disabled={!canAfford(bet)}>{done ? 'Play Again' : 'Start'}</PrimaryButton>
                </Panel>
            ) : (
                <Panel>
                    <div className="flex gap-3">
                        <ChoiceButton accent="from-amber-500 to-orange-500" onClick={take}>💰 Take 60%<br /><span className="text-xs font-normal opacity-80">{Math.round(pot * 0.6)} chips now</span></ChoiceButton>
                        <ChoiceButton accent="from-emerald-500 to-green-500" onClick={pass}>➡️ Pass<br /><span className="text-xs font-normal opacity-80">grow ×{GROWTH}</span></ChoiceButton>
                    </div>
                    <div className="mt-3"><GhostButton className="w-full" onClick={take}>Secure the pot and end</GhostButton></div>
                </Panel>
            )}
            <TrialNote />
        </div>
    );
};
