import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useDemoCredits } from '../../hooks/useDemoCredits';
import {
    BetSelector,
    Panel,
    PrimaryButton,
    ResultBanner,
    StatRow,
    TrialNote,
    type Outcome,
} from './shared';

/* ================================================================== */
/*  19. FOMO Clock — buy keys, extend the timer, be the last buyer    */
/* ================================================================== */

export const FomoClock: React.FC = () => {
    const { add, canAfford } = useDemoCredits();
    const [timer, setTimer] = useState(15);
    const [jackpot, setJackpot] = useState(0);
    const [keyCost, setKeyCost] = useState(20);
    const [dividends, setDividends] = useState(0);
    const [lastBuyer, setLastBuyer] = useState<'you' | 'bot' | null>(null);
    const [running, setRunning] = useState(false);
    const [done, setDone] = useState(false);
    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const [message, setMessage] = useState('Buy keys to extend the clock. When it hits zero, the last buyer takes the jackpot.');

    // Live values live in refs so the interval/handlers never put side effects
    // inside a setState updater (which React StrictMode double-invokes in dev).
    const costRef = useRef(20);
    const lastRef = useRef<'you' | 'bot' | null>(null);
    const keysRef = useRef(0);
    const timerRef = useRef(15);
    const jackpotRef = useRef(0);
    const interval = useRef<ReturnType<typeof setInterval> | null>(null);

    const stop = () => { if (interval.current) { clearInterval(interval.current); interval.current = null; } };
    useEffect(() => stop, []);

    const start = () => {
        if (!canAfford(20)) return toast.error('Not enough chips to start.');
        timerRef.current = 15; jackpotRef.current = 0; costRef.current = 20; lastRef.current = null; keysRef.current = 0;
        setTimer(15); setJackpot(0); setKeyCost(20); setDividends(0); setLastBuyer(null);
        setRunning(true); setDone(false); setOutcome(null);
        setMessage('Clock is ticking — buy a key to take the lead!');
        interval.current = setInterval(() => {
            // Rival buyers sometimes jump in, bumping you out of the lead.
            if (Math.random() < 0.32) {
                const c = costRef.current;
                jackpotRef.current += Math.round(c * 0.9); setJackpot(jackpotRef.current);
                if (keysRef.current > 0) { const div = Math.round(c * 0.1); add(div); setDividends((d) => d + div); }
                lastRef.current = 'bot'; setLastBuyer('bot');
                costRef.current = Math.round(c * 1.12); setKeyCost(costRef.current);
                timerRef.current = Math.min(timerRef.current + 4, 30);
            }
            timerRef.current -= 1;
            if (timerRef.current <= 0) {
                stop(); setRunning(false); setDone(true); timerRef.current = 0; setTimer(0);
                if (lastRef.current === 'you') {
                    add(jackpotRef.current);
                    setOutcome('win');
                    setMessage('⏰ Time! You were the last buyer — the jackpot is yours!');
                } else {
                    setOutcome(keysRef.current > 0 ? 'push' : 'lose');
                    setMessage('⏰ Time! A rival was last. You keep only your dividends.');
                }
            } else {
                setTimer(timerRef.current);
            }
        }, 1000);
    };

    const buyKey = () => {
        const c = costRef.current;
        if (!canAfford(c)) return toast.error('Not enough chips for a key.');
        add(-c);
        keysRef.current += 1;
        jackpotRef.current += Math.round(c * 0.9); setJackpot(jackpotRef.current);
        lastRef.current = 'you'; setLastBuyer('you');
        costRef.current = Math.round(c * 1.12); setKeyCost(costRef.current);
        timerRef.current = Math.min(timerRef.current + 5, 30); setTimer(timerRef.current);
        setMessage('You’re in the lead! Hold on until the clock runs out.');
    };

    return (
        <div className="space-y-5">
            <Panel>
                <ResultBanner outcome={outcome} message={message} />
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    <div><p className="text-xs text-gray-400">Timer</p><p className="text-2xl font-bold text-rose-300">{timer}s</p></div>
                    <div><p className="text-xs text-gray-400">Jackpot</p><p className="text-2xl font-bold text-amber-300">{jackpot}</p></div>
                    <div><p className="text-xs text-gray-400">Dividends</p><p className="text-2xl font-bold text-emerald-300">{dividends}</p></div>
                </div>
                {running && <p className="text-center text-sm mt-3 text-gray-400">Lead: <span className="font-bold text-white">{lastBuyer === 'you' ? 'YOU' : lastBuyer === 'bot' ? 'a rival' : '—'}</span></p>}
            </Panel>
            {running ? (
                <PrimaryButton onClick={buyKey} disabled={!canAfford(keyCost)}>🔑 Buy Key · {keyCost} chips</PrimaryButton>
            ) : (
                <PrimaryButton onClick={start} disabled={!canAfford(20)}>{done ? 'Play Again' : 'Start the Clock'}</PrimaryButton>
            )}
            <TrialNote />
        </div>
    );
};

/* ================================================================== */
/*  20. Game of Chicken — rising multiplier, cash out before it crashes */
/* ================================================================== */

export const GameOfChicken: React.FC = () => {
    const { add, canAfford } = useDemoCredits();
    const [bet, setBet] = useState(25);
    const [mult, setMult] = useState(1);
    const [running, setRunning] = useState(false);
    const [done, setDone] = useState(false);
    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const [message, setMessage] = useState('The multiplier climbs. Cash out before the pool runs dry — or lose your stake.');
    const crashAt = useRef(0);
    const multRef = useRef(1);
    const interval = useRef<ReturnType<typeof setInterval> | null>(null);

    const stop = () => { if (interval.current) { clearInterval(interval.current); interval.current = null; } };
    useEffect(() => stop, []);

    const start = () => {
        if (!canAfford(bet)) return toast.error('Not enough chips.');
        add(-bet);
        // Heavy-tailed crash point: often early, occasionally huge.
        crashAt.current = 1 + -Math.log(1 - Math.random()) * 1.1;
        multRef.current = 1;
        setMult(1); setRunning(true); setDone(false); setOutcome(null);
        setMessage('Climbing… cash out any time!');
        interval.current = setInterval(() => {
            const next = +(multRef.current + 0.05 + multRef.current * 0.01).toFixed(2);
            if (next >= crashAt.current) {
                stop();
                multRef.current = +crashAt.current.toFixed(2);
                setMult(multRef.current); setRunning(false); setDone(true); setOutcome('lose');
                setMessage(`💥 Crashed at ${crashAt.current.toFixed(2)}×. Your stake is liquidated.`);
            } else {
                multRef.current = next; setMult(next);
            }
        }, 120);
    };

    const cashOut = () => {
        stop(); setRunning(false); setDone(true);
        const m = multRef.current;
        const payout = Math.round(bet * m);
        add(payout); setMult(m); setOutcome('win');
        setMessage(`Cashed out at ${m.toFixed(2)}× → ${payout} chips (+${payout - bet}).`);
    };

    return (
        <div className="space-y-5">
            <Panel>
                <ResultBanner outcome={outcome} message={message} />
                <div className="mt-4 text-center">
                    <p className="text-xs text-gray-400">Multiplier</p>
                    <p className={`text-6xl font-bold ${outcome === 'lose' ? 'text-rose-400' : 'text-emerald-300'}`}>{mult.toFixed(2)}×</p>
                </div>
            </Panel>
            {running ? (
                <PrimaryButton onClick={cashOut}>💸 Cash Out · {Math.round(bet * mult)} chips</PrimaryButton>
            ) : (
                <Panel className="space-y-5">
                    <BetSelector bet={bet} setBet={setBet} />
                    <PrimaryButton onClick={start} disabled={!canAfford(bet)}>{done ? 'Play Again' : 'Enter the Pool'}</PrimaryButton>
                </Panel>
            )}
            <TrialNote />
        </div>
    );
};

/* ================================================================== */
/*  21. Hot Potato / Time Bomb — pass it on before it explodes        */
/* ================================================================== */

export const HotPotato: React.FC = () => {
    const { add, canAfford } = useDemoCredits();
    const [bet, setBet] = useState(25);
    const [started, setStarted] = useState(false);
    const [passes, setPasses] = useState(0);
    const [premium, setPremium] = useState(0);
    const [done, setDone] = useState(false);
    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const [message, setMessage] = useState('Pass the potato for a 10% premium each time — but a hidden block detonates it. Cash out in time.');

    const begin = () => {
        if (!canAfford(bet)) return toast.error('Not enough chips.');
        add(-bet);
        setStarted(true); setPasses(0); setPremium(0); setDone(false); setOutcome(null);
        setMessage('You hold the potato. Pass it on, or cash out your stake now.');
    };

    const passOn = () => {
        const nextPass = passes + 1;
        // Detonation odds rise with every pass (VRF-style hidden block).
        const boomChance = 0.1 + nextPass * 0.07;
        if (Math.random() < boomChance) {
            setDone(true); setOutcome('lose'); setPasses(nextPass);
            setMessage(`💣 It exploded on you at pass ${nextPass}! Stake and premiums lost.`);
            return;
        }
        const newPremium = premium + Math.round(bet * 0.1);
        setPremium(newPremium); setPasses(nextPass);
        setMessage(`Survived pass ${nextPass}. Premium banked: ${newPremium}. Push on, or cash out?`);
    };

    const cashOut = () => {
        const payout = bet + premium;
        add(payout);
        setDone(true); setOutcome('win');
        setMessage(`Cashed out after ${passes} passes → ${payout} chips (+${premium}).`);
    };

    return (
        <div className="space-y-5">
            <Panel>
                <ResultBanner outcome={outcome} message={message} />
                {started && (
                    <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                        <div><p className="text-xs text-gray-400">Passes survived</p><p className="text-2xl font-bold text-white">{passes}</p></div>
                        <div><p className="text-xs text-gray-400">Premium banked</p><p className="text-2xl font-bold text-emerald-300">{premium}</p></div>
                    </div>
                )}
            </Panel>
            {!started || done ? (
                <Panel className="space-y-5">
                    <BetSelector bet={bet} setBet={setBet} />
                    <PrimaryButton onClick={begin} disabled={!canAfford(bet)}>{done ? 'Play Again' : 'Grab the Potato'}</PrimaryButton>
                </Panel>
            ) : (
                <Panel>
                    <div className="flex gap-3">
                        <button onClick={passOn} className="flex-1 py-4 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold hover:shadow-lg transition">🥔 Pass it on (+{Math.round(bet * 0.1)})</button>
                        <button onClick={cashOut} className="flex-1 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold hover:shadow-lg transition">💸 Cash out ({bet + premium})</button>
                    </div>
                    <div className="mt-3"><StatRow label="Next-pass detonation odds" value={`${Math.round((0.1 + (passes + 1) * 0.07) * 100)}%`} /></div>
                </Panel>
            )}
            <TrialNote />
        </div>
    );
};
