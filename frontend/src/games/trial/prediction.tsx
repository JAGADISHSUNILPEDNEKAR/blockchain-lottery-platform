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
    pick,
    randInt,
    type Outcome,
} from './shared';

/* ================================================================== */
/*  28. Parimutuel Market — bet on an outcome, split the pool          */
/* ================================================================== */

export const ParimutuelMarket: React.FC = () => {
    const { add, canAfford } = useDemoCredits();
    const FEE = 0.05;
    const EVENTS = [
        { q: 'Which horse wins the Derby?', outcomes: ['Thunderbolt', 'Sea Breeze', 'Midnight'] },
        { q: 'Who takes the title match?', outcomes: ['Red Corner', 'Blue Corner', 'Draw'] },
        { q: 'Where does the price close?', outcomes: ['Up', 'Flat', 'Down'] },
    ];
    const [event] = useState(() => pick(EVENTS));
    const [pools] = useState<number[]>(() => event.outcomes.map(() => randInt(80, 400)));
    const [choice, setChoice] = useState<number | null>(null);
    const [bet, setBet] = useState(50);
    const [done, setDone] = useState(false);
    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const [winner, setWinner] = useState<number | null>(null);
    const [message, setMessage] = useState('Back an outcome. Winners split the whole pool in proportion to their stake.');

    const total = pools.reduce((s, n) => s + n, 0);

    const play = () => {
        if (choice === null) return toast.error('Pick an outcome.');
        if (!canAfford(bet)) return toast.error('Not enough chips.');
        add(-bet);
        const myPools = [...pools];
        myPools[choice] += bet;
        const grand = myPools.reduce((s, n) => s + n, 0);
        // Crowd wisdom: likelier outcomes are the ones more money backed.
        const r = Math.random() * grand;
        let acc = 0, win = 0;
        for (let i = 0; i < myPools.length; i++) { acc += myPools[i]; if (r <= acc) { win = i; break; } }
        setWinner(win); setDone(true);
        if (win === choice) {
            const payout = Math.round(grand * (1 - FEE) * (bet / myPools[choice]));
            add(payout);
            setOutcome(payout > bet ? 'win' : 'lose');
            setMessage(`${event.outcomes[win]} wins! Your share of the pool: ${payout} chips.`);
        } else {
            setOutcome('lose');
            setMessage(`${event.outcomes[win]} came in. Your stake joins the winners’ pool.`);
        }
    };

    const reset = () => { setChoice(null); setDone(false); setOutcome(null); setWinner(null); setMessage('Back an outcome. Winners split the whole pool in proportion to their stake.'); };

    return (
        <div className="space-y-5">
            <Panel>
                <p className="text-center text-white font-semibold mb-3">{event.q}</p>
                <ResultBanner outcome={outcome} message={message} />
            </Panel>
            <Panel className="space-y-2">
                {event.outcomes.map((o, i) => (
                    <Tally key={o} label={`${o} — implied ${Math.round((pools[i] / total) * 100)}%`} count={pools[i]} total={total} accent="from-teal-400 to-emerald-500" highlight={done ? winner === i : choice === i} />
                ))}
            </Panel>
            {!done ? (
                <Panel className="space-y-5">
                    <div className="flex flex-wrap gap-2">
                        {event.outcomes.map((o, i) => (
                            <ChoiceButton key={o} selected={choice === i} accent="from-teal-400 to-emerald-500" onClick={() => setChoice(i)}>{o}</ChoiceButton>
                        ))}
                    </div>
                    <BetSelector bet={bet} setBet={setBet} options={[25, 50, 100, 200]} />
                    <PrimaryButton onClick={play} disabled={!canAfford(bet) || choice === null}>Place Bet</PrimaryButton>
                </Panel>
            ) : (
                <PrimaryButton onClick={reset}>New Market</PrimaryButton>
            )}
            <TrialNote />
        </div>
    );
};

/* ================================================================== */
/*  29. Quadratic Voting Jackpot — votes cost the square of their count */
/* ================================================================== */

export const QuadraticVoting: React.FC = () => {
    const { add, canAfford } = useDemoCredits();
    const SIMS = 8;
    const PROPOSALS = ['🎰 Bigger jackpots', '💸 Lower fees', '🔥 Weekly burns'];
    const [choice, setChoice] = useState(0);
    const [votes, setVotes] = useState(3);
    const cost = votes * votes;
    const [done, setDone] = useState(false);
    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const [tally, setTally] = useState<number[]>([]);
    const [winner, setWinner] = useState<number | null>(null);
    const [message, setMessage] = useState('Buy votes for a proposal — V votes cost V² chips. Backers of the winner split the treasury.');

    const play = () => {
        if (!canAfford(cost)) return toast.error(`You need ${cost} chips for ${votes} votes.`);
        add(-cost);
        const voteTally = new Array(PROPOSALS.length).fill(0);
        let jackpot = cost;
        voteTally[choice] += votes;
        let myWinnerVotes = votes;
        for (let i = 0; i < SIMS; i++) {
            const p = randInt(0, PROPOSALS.length - 1);
            const v = randInt(1, 6);
            voteTally[p] += v;
            jackpot += v * v;
        }
        const maxVotes = Math.max(...voteTally);
        const win = voteTally.indexOf(maxVotes);
        setTally(voteTally); setWinner(win); setDone(true);
        if (win === choice) {
            // My votes were already counted into the winning tally.
            const share = Math.round(jackpot * (myWinnerVotes / voteTally[win]));
            add(share);
            setOutcome(share > cost ? 'win' : 'lose');
            setMessage(`“${PROPOSALS[win]}” wins! Your share of the ${jackpot}-chip treasury: ${share}.`);
        } else {
            setOutcome('lose');
            setMessage(`“${PROPOSALS[win]}” won instead. Your votes are spent.`);
        }
    };

    const reset = () => { setDone(false); setOutcome(null); setTally([]); setWinner(null); setMessage('Buy votes for a proposal — V votes cost V² chips. Backers of the winner split the treasury.'); };

    const total = tally.reduce((s, n) => s + n, 0) || 1;

    return (
        <div className="space-y-5">
            <Panel><ResultBanner outcome={outcome} message={message} /></Panel>
            {!done ? (
                <Panel className="space-y-5">
                    <div className="flex flex-col gap-2">
                        {PROPOSALS.map((p, i) => (
                            <ChoiceButton key={p} selected={choice === i} accent="from-teal-400 to-emerald-500" onClick={() => setChoice(i)}>{p}</ChoiceButton>
                        ))}
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400">Votes</span>
                            <span className="text-2xl font-bold text-cyan-300">{votes}</span>
                        </div>
                        <input type="range" min={1} max={10} value={votes} onChange={(e) => setVotes(Number(e.target.value))} className="w-full accent-cyan-400" />
                        <StatRow label="Cost (V²)" value={<span className="text-amber-300">{cost} chips</span>} />
                    </div>
                    <PrimaryButton onClick={play} disabled={!canAfford(cost)}>Cast Votes · {SIMS} other voters</PrimaryButton>
                </Panel>
            ) : (
                <>
                    <Panel className="space-y-2">
                        {PROPOSALS.map((p, i) => (
                            <Tally key={p} label={p} count={tally[i]} total={total} accent="from-teal-400 to-emerald-500" highlight={winner === i} />
                        ))}
                    </Panel>
                    <PrimaryButton onClick={reset}>Vote Again</PrimaryButton>
                </>
            )}
            <TrialNote />
        </div>
    );
};
