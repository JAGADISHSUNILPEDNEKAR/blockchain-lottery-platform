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
    randInt,
    type Outcome,
} from './shared';

/* ================================================================== */
/*  22. Colonel Blotto — spread 100 troops across 3 fronts            */
/* ================================================================== */

export const ColonelBlotto: React.FC = () => {
    const { add, canAfford } = useDemoCredits();
    const TOTAL = 100;
    const [bet, setBet] = useState(25);
    const [a, setA] = useState(40);
    const [b, setB] = useState(35);
    const c = TOTAL - a - b;
    const [done, setDone] = useState(false);
    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const [enemy, setEnemy] = useState<[number, number, number]>([0, 0, 0]);
    const [message, setMessage] = useState('Divide 100 troops across 3 fronts. Win the majority of fronts to win the battle.');

    const randomArmy = (): [number, number, number] => {
        const cuts = [randInt(0, TOTAL), randInt(0, TOTAL)].sort((x, y) => x - y);
        return [cuts[0], cuts[1] - cuts[0], TOTAL - cuts[1]];
    };

    const play = () => {
        if (c < 0) return toast.error('Fronts must total 100.');
        if (!canAfford(bet)) return toast.error('Not enough chips.');
        add(-bet);
        const foe = randomArmy();
        const mine = [a, b, c];
        let wins = 0;
        for (let i = 0; i < 3; i++) { if (mine[i] > foe[i]) wins++; else if (mine[i] < foe[i]) wins--; }
        setEnemy(foe);
        setDone(true);
        if (wins > 0) { add(bet * 2); setOutcome('win'); setMessage(`You won ${wins > 0 ? 'the majority of' : ''} fronts — victory!`); }
        else if (wins === 0) { add(bet); setOutcome('push'); setMessage('Fronts split evenly — stalemate, stake returned.'); }
        else { setOutcome('lose'); setMessage('The enemy took more fronts. Defeat.'); }
    };

    const reset = () => { setDone(false); setOutcome(null); setEnemy([0, 0, 0]); setMessage('Divide 100 troops across 3 fronts. Win the majority of fronts to win the battle.'); };

    const Front: React.FC<{ i: number; label: string; mine: number; foe: number }> = ({ label, mine, foe }) => (
        <div className={`rounded-xl p-3 border ${done ? (mine > foe ? 'border-emerald-400/60 bg-emerald-500/10' : mine < foe ? 'border-rose-400/60 bg-rose-500/10' : 'border-white/10 bg-white/5') : 'border-white/10 bg-white/5'}`}>
            <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">{label}</span>
                <span className="text-sm text-gray-300">You {mine}{done && <span className="text-gray-500"> · Foe {foe}</span>}</span>
            </div>
        </div>
    );

    return (
        <div className="space-y-5">
            <Panel><ResultBanner outcome={outcome} message={message} /></Panel>
            <Panel className="space-y-3">
                <Front i={0} label="⚔️ Front I" mine={a} foe={enemy[0]} />
                <Front i={1} label="🛡️ Front II" mine={b} foe={enemy[1]} />
                <Front i={2} label="🏰 Front III" mine={c} foe={enemy[2]} />
            </Panel>
            {!done ? (
                <Panel className="space-y-5">
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm"><span className="text-gray-400">Front I</span><span className="font-bold text-cyan-300">{a}</span></div>
                        <input type="range" min={0} max={TOTAL} value={a} onChange={(e) => setA(Math.min(Number(e.target.value), TOTAL - b))} className="w-full accent-cyan-400" />
                        <div className="flex justify-between text-sm"><span className="text-gray-400">Front II</span><span className="font-bold text-cyan-300">{b}</span></div>
                        <input type="range" min={0} max={TOTAL} value={b} onChange={(e) => setB(Math.min(Number(e.target.value), TOTAL - a))} className="w-full accent-cyan-400" />
                        <StatRow label="Front III (remainder)" value={<span className={c < 0 ? 'text-rose-400' : 'text-cyan-300'}>{c}</span>} />
                    </div>
                    <BetSelector bet={bet} setBet={setBet} />
                    <PrimaryButton onClick={play} disabled={!canAfford(bet) || c < 0}>Deploy Troops</PrimaryButton>
                </Panel>
            ) : (
                <PrimaryButton onClick={reset}>Battle Again</PrimaryButton>
            )}
            <TrialNote />
        </div>
    );
};

/* ================================================================== */
/*  23. Matching Pennies — pure zero-sum conflict                     */
/* ================================================================== */

export const MatchingPennies: React.FC = () => {
    const { add, canAfford } = useDemoCredits();
    const [bet, setBet] = useState(25);
    const [done, setDone] = useState(false);
    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const [opp, setOpp] = useState<'H' | 'T' | null>(null);
    const [message, setMessage] = useState('You’re the Matcher — win if both coins match. Your rival wins on a mismatch.');

    const choose = (me: 'H' | 'T') => {
        if (!canAfford(bet)) return toast.error('Not enough chips.');
        add(-bet);
        const o: 'H' | 'T' = Math.random() < 0.5 ? 'H' : 'T';
        setOpp(o); setDone(true);
        if (me === o) { add(bet * 2); setOutcome('win'); setMessage('Match! You win.'); }
        else { setOutcome('lose'); setMessage('Mismatch — the rival wins.'); }
    };

    const reset = () => { setDone(false); setOutcome(null); setOpp(null); setMessage('You’re the Matcher — win if both coins match. Your rival wins on a mismatch.'); };

    return (
        <div className="space-y-5">
            <Panel>
                <ResultBanner outcome={outcome} message={message} />
                {done && opp && <p className="text-center text-sm text-gray-400 mt-3">Rival played: <span className="font-bold text-white">{opp === 'H' ? '🪙 Heads' : '🪙 Tails'}</span></p>}
            </Panel>
            {!done ? (
                <Panel className="space-y-5">
                    <BetSelector bet={bet} setBet={setBet} />
                    <div className="flex gap-3">
                        <ChoiceButton accent="from-amber-500 to-yellow-500" disabled={!canAfford(bet)} onClick={() => choose('H')}>🪙 Heads</ChoiceButton>
                        <ChoiceButton accent="from-slate-400 to-slate-500" disabled={!canAfford(bet)} onClick={() => choose('T')}>🪙 Tails</ChoiceButton>
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
/*  24. Rock-Paper-Scissors-Lizard-Spock — cyclic dominance           */
/* ================================================================== */

const RPSLS_LABELS = ['🪨 Rock', '📄 Paper', '✂️ Scissors', '🦎 Lizard', '🖖 Spock'];
const RPSLS_BEATS: number[][] = [[2, 3], [0, 4], [1, 3], [1, 4], [2, 0]];

export const RockPaperScissorsLizardSpock: React.FC = () => {
    const { add, canAfford } = useDemoCredits();
    const [bet, setBet] = useState(25);
    const [done, setDone] = useState(false);
    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const [opp, setOpp] = useState<number | null>(null);
    const [message, setMessage] = useState('Five choices, cyclic dominance. Pick your move.');

    const choose = (me: number) => {
        if (!canAfford(bet)) return toast.error('Not enough chips.');
        add(-bet);
        const o = randInt(0, 4);
        setOpp(o); setDone(true);
        if (me === o) { add(bet); setOutcome('push'); setMessage(`Both chose ${RPSLS_LABELS[me]} — push.`); }
        else if (RPSLS_BEATS[me].includes(o)) { add(bet * 2); setOutcome('win'); setMessage(`${RPSLS_LABELS[me]} beats ${RPSLS_LABELS[o]} — you win!`); }
        else { setOutcome('lose'); setMessage(`${RPSLS_LABELS[o]} beats ${RPSLS_LABELS[me]} — you lose.`); }
    };

    const reset = () => { setDone(false); setOutcome(null); setOpp(null); setMessage('Five choices, cyclic dominance. Pick your move.'); };

    return (
        <div className="space-y-5">
            <Panel>
                <ResultBanner outcome={outcome} message={message} />
                {done && opp !== null && <p className="text-center text-sm text-gray-400 mt-3">Rival played: <span className="font-bold text-white">{RPSLS_LABELS[opp]}</span></p>}
            </Panel>
            {!done ? (
                <Panel className="space-y-5">
                    <BetSelector bet={bet} setBet={setBet} />
                    <div className="flex flex-wrap gap-2">
                        {RPSLS_LABELS.map((l, i) => (
                            <ChoiceButton key={l} accent="from-purple-500 to-fuchsia-500" disabled={!canAfford(bet)} onClick={() => choose(i)}>{l}</ChoiceButton>
                        ))}
                    </div>
                </Panel>
            ) : (
                <PrimaryButton onClick={reset}>Play Again</PrimaryButton>
            )}
            <TrialNote />
        </div>
    );
};
