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
    clamp,
    gaussian,
    pick,
    randInt,
    randFloat,
    type Outcome,
} from './shared';

/* ================================================================== */
/*  1. Keynesian Beauty Contest — "Guess 2/3 of the average"          */
/* ================================================================== */

export const KeynesianContest: React.FC = () => {
    const { add, canAfford } = useDemoCredits();
    const FIELD = 20; // simulated opponents
    const [bet, setBet] = useState(25);
    const [guess, setGuess] = useState(33);
    const [done, setDone] = useState(false);
    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const [message, setMessage] = useState('Pick a number from 0 to 100. Win if you are closest to ⅔ of the average.');
    const [target, setTarget] = useState(0);
    const [avg, setAvg] = useState(0);

    const play = () => {
        if (!canAfford(bet)) return toast.error('Not enough chips.');
        add(-bet);
        // k-level reasoning field: mix of naive and sophisticated guesses.
        const picks = Array.from({ length: FIELD }, () => {
            const level = randInt(0, 3);
            if (level === 0) return randInt(0, 100); // naive / random
            const anchor = 50 * Math.pow(2 / 3, level);
            return gaussian(anchor, 8, 0, 100);
        });
        const all = [...picks, guess];
        const average = all.reduce((s, n) => s + n, 0) / all.length;
        const t = (2 / 3) * average;
        const myDist = Math.abs(guess - t);
        const bestOther = Math.min(...picks.map((p) => Math.abs(p - t)));
        setAvg(Math.round(average * 10) / 10);
        setTarget(Math.round(t * 10) / 10);
        setDone(true);
        if (myDist <= bestOther) {
            const pot = bet * (FIELD + 1);
            add(pot);
            setOutcome('win');
            setMessage(`Closest to ${t.toFixed(1)}! You win the ${pot}-chip pot.`);
        } else {
            setOutcome('lose');
            setMessage(`Target was ${t.toFixed(1)}. A sharper guesser took the pot.`);
        }
    };

    const reset = () => { setDone(false); setOutcome(null); setMessage('Pick a number from 0 to 100. Win if you are closest to ⅔ of the average.'); };

    return (
        <div className="space-y-5">
            <Panel>
                <ResultBanner outcome={outcome} message={message} />
                {done && (
                    <div className="mt-4 space-y-2">
                        <StatRow label="Field average" value={avg} />
                        <StatRow label="⅔ of average (target)" value={target} />
                        <StatRow label="Your guess" value={guess} />
                    </div>
                )}
            </Panel>

            {!done ? (
                <Panel className="space-y-5">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400">Your guess</span>
                            <span className="text-2xl font-bold text-cyan-300">{guess}</span>
                        </div>
                        <input
                            type="range" min={0} max={100} value={guess}
                            onChange={(e) => setGuess(Number(e.target.value))}
                            className="w-full accent-cyan-400"
                        />
                        <div className="flex justify-between text-xs text-gray-500"><span>0</span><span>50</span><span>100</span></div>
                    </div>
                    <BetSelector bet={bet} setBet={setBet} />
                    <PrimaryButton onClick={play} disabled={!canAfford(bet)}>Submit Guess · {FIELD} rivals</PrimaryButton>
                </Panel>
            ) : (
                <PrimaryButton onClick={reset}>Play Again</PrimaryButton>
            )}
            <TrialNote />
        </div>
    );
};

/* ================================================================== */
/*  2. Schelling Point Consensus — coordinate without talking         */
/* ================================================================== */

export const SchellingPoint: React.FC = () => {
    const { add, canAfford } = useDemoCredits();
    const FIELD = 12;
    const PROMPTS = [
        { q: 'Where in the city do you meet a stranger, no time agreed?', options: ['Central station', 'Main square', 'The big park', 'City hall'], focal: 0 },
        { q: 'Pick a positive number — match the crowd.', options: ['1', '7', '100', '42'], focal: 0 },
        { q: 'Choose a point on the map everyone will pick.', options: ['A corner', 'The exact center', 'An edge', 'Top-left'], focal: 1 },
    ];
    const [round, setRound] = useState(() => pick(PROMPTS));
    const [bet, setBet] = useState(25);
    const [choice, setChoice] = useState<number | null>(null);
    const [counts, setCounts] = useState<number[]>([]);
    const [done, setDone] = useState(false);
    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const [message, setMessage] = useState('Join the majority group — they split the losers’ stakes.');

    const play = () => {
        if (choice === null) return toast.error('Pick an option first.');
        if (!canAfford(bet)) return toast.error('Not enough chips.');
        add(-bet);
        const tally = new Array(round.options.length).fill(0);
        tally[choice] += 1;
        for (let i = 0; i < FIELD; i++) {
            // Strong pull toward the focal point, otherwise random.
            const sim = Math.random() < 0.6 ? round.focal : randInt(0, round.options.length - 1);
            tally[sim] += 1;
        }
        const maxCount = Math.max(...tally);
        const winners = tally.reduce((s, c) => s + (c === maxCount ? c : 0), 0);
        const pot = bet * (FIELD + 1);
        setCounts(tally);
        setDone(true);
        if (tally[choice] === maxCount) {
            const share = Math.round(pot / winners);
            add(share);
            setOutcome('win');
            setMessage(`You landed in the majority — ${share} chips.`);
        } else {
            setOutcome('lose');
            setMessage('You were in a minority group. Stakes go to the crowd.');
        }
    };

    const reset = () => { setRound(pick(PROMPTS)); setChoice(null); setCounts([]); setDone(false); setOutcome(null); setMessage('Join the majority group — they split the losers’ stakes.'); };

    return (
        <div className="space-y-5">
            <Panel>
                <p className="text-center text-white font-semibold mb-3">{round.q}</p>
                <ResultBanner outcome={outcome} message={message} />
            </Panel>

            {!done ? (
                <Panel className="space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                        {round.options.map((o, i) => (
                            <ChoiceButton key={o} selected={choice === i} accent="from-cyan-500 to-blue-500" onClick={() => setChoice(i)}>{o}</ChoiceButton>
                        ))}
                    </div>
                    <BetSelector bet={bet} setBet={setBet} />
                    <PrimaryButton onClick={play} disabled={!canAfford(bet)}>Lock In Choice</PrimaryButton>
                </Panel>
            ) : (
                <>
                    <div className="space-y-2">
                        {round.options.map((o, i) => (
                            <Tally key={o} label={o} count={counts[i]} total={FIELD + 1} accent="from-cyan-500 to-blue-500" highlight={choice === i} />
                        ))}
                    </div>
                    <PrimaryButton onClick={reset}>New Round</PrimaryButton>
                </>
            )}
            <TrialNote />
        </div>
    );
};

/* ================================================================== */
/*  3. Stag Hunt — payoff dominance vs. risk dominance                */
/* ================================================================== */

export const StagHunt: React.FC = () => {
    const { add, canAfford } = useDemoCredits();
    const [bet, setBet] = useState(25);
    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const [done, setDone] = useState(false);
    const [oppChoice, setOppChoice] = useState<'stag' | 'hare' | null>(null);
    const [message, setMessage] = useState('Hunt the Stag together for the big prize — or take the safe Hare alone.');

    const choose = (me: 'stag' | 'hare') => {
        if (!canAfford(bet)) return toast.error('Not enough chips.');
        add(-bet);
        const opp: 'stag' | 'hare' = Math.random() < 0.55 ? 'stag' : 'hare';
        setOppChoice(opp);
        setDone(true);
        if (me === 'hare') {
            add(Math.round(bet * 1.5));
            setOutcome('push');
            setMessage(`You took the Hare — a safe ${Math.round(bet * 0.5)}-chip gain. Partner chose ${opp}.`);
        } else if (opp === 'stag') {
            add(bet * 3);
            setOutcome('win');
            setMessage('Stag down! You both coordinated — triple payout.');
        } else {
            setOutcome('lose');
            setMessage('You hunted Stag alone. The partner bailed — stake lost.');
        }
    };

    const reset = () => { setDone(false); setOutcome(null); setOppChoice(null); setMessage('Hunt the Stag together for the big prize — or take the safe Hare alone.'); };

    return (
        <div className="space-y-5">
            <Panel>
                <ResultBanner outcome={outcome} message={message} />
                {done && oppChoice && <p className="text-center text-sm text-gray-400 mt-3">Partner chose: <span className="font-bold text-white">{oppChoice === 'stag' ? '🦌 Stag' : '🐇 Hare'}</span></p>}
            </Panel>
            {!done ? (
                <Panel className="space-y-5">
                    <BetSelector bet={bet} setBet={setBet} />
                    <div className="flex gap-3">
                        <ChoiceButton accent="from-emerald-500 to-green-500" disabled={!canAfford(bet)} onClick={() => choose('stag')}>🦌 Hunt Stag<br /><span className="text-xs font-normal opacity-80">3× if partner joins</span></ChoiceButton>
                        <ChoiceButton accent="from-amber-500 to-yellow-500" disabled={!canAfford(bet)} onClick={() => choose('hare')}>🐇 Catch Hare<br /><span className="text-xs font-normal opacity-80">safe 1.5×</span></ChoiceButton>
                    </div>
                </Panel>
            ) : (
                <PrimaryButton onClick={reset}>Hunt Again</PrimaryButton>
            )}
            <TrialNote />
        </div>
    );
};

/* ================================================================== */
/*  4. Battle of the Sexes — asymmetric coordination                  */
/* ================================================================== */

export const BattleOfSexes: React.FC = () => {
    const { add, canAfford } = useDemoCredits();
    const [bet, setBet] = useState(25);
    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const [done, setDone] = useState(false);
    const [oppChoice, setOppChoice] = useState<'A' | 'B' | null>(null);
    const [message, setMessage] = useState('You prefer the Match. Your date prefers the Opera. Coordinate — or you both get nothing.');

    const choose = (me: 'A' | 'B') => {
        if (!canAfford(bet)) return toast.error('Not enough chips.');
        add(-bet);
        // Partner leans toward their own preference (B) but wants to coordinate.
        const opp: 'A' | 'B' = Math.random() < clamp(randFloat(0.55, 0.65), 0, 1) ? 'B' : 'A';
        setOppChoice(opp);
        setDone(true);
        if (me !== opp) {
            setOutcome('lose');
            setMessage('Mismatch — you went different places. Both get nothing.');
        } else if (me === 'A') {
            add(bet * 2);
            setOutcome('win');
            setMessage('You both chose the Match — your favourite! Best payout.');
        } else {
            add(Math.round(bet * 1.4));
            setOutcome('win');
            setMessage('You both chose the Opera — coordinated, smaller payout.');
        }
    };

    const reset = () => { setDone(false); setOutcome(null); setOppChoice(null); setMessage('You prefer the Match. Your date prefers the Opera. Coordinate — or you both get nothing.'); };

    return (
        <div className="space-y-5">
            <Panel>
                <ResultBanner outcome={outcome} message={message} />
                {done && oppChoice && <p className="text-center text-sm text-gray-400 mt-3">Partner went to: <span className="font-bold text-white">{oppChoice === 'A' ? '⚽ Match' : '🎭 Opera'}</span></p>}
            </Panel>
            {!done ? (
                <Panel className="space-y-5">
                    <BetSelector bet={bet} setBet={setBet} />
                    <div className="flex gap-3">
                        <ChoiceButton accent="from-emerald-500 to-green-500" disabled={!canAfford(bet)} onClick={() => choose('A')}>⚽ Match<br /><span className="text-xs font-normal opacity-80">your 2× pick</span></ChoiceButton>
                        <ChoiceButton accent="from-purple-500 to-fuchsia-500" disabled={!canAfford(bet)} onClick={() => choose('B')}>🎭 Opera<br /><span className="text-xs font-normal opacity-80">their 1.4× pick</span></ChoiceButton>
                    </div>
                </Panel>
            ) : (
                <PrimaryButton onClick={reset}>Try Again</PrimaryButton>
            )}
            <TrialNote />
        </div>
    );
};
