import React from 'react';
import { BattleOfSexes, KeynesianContest, SchellingPoint, StagHunt } from './coordination';
import { ElFarolBar, HighestUniqueBid, LowestUniqueBid, MinorityGame } from './anticoordination';
import { CentipedeGame, IteratedPD, PublicGoods, SplitOrSteal, VolunteersDilemma } from './dilemma';
import { AllPayAuction, CandleAuction, DollarAuction, ReverseDutchAuction, VickreyAuction } from './auction';
import { FomoClock, GameOfChicken, HotPotato } from './timedecay';
import { ColonelBlotto, MatchingPennies, RockPaperScissorsLizardSpock } from './allocation';
import { LiarsDice, PirateGame, UltimatumGame } from './bargaining';
import { ParimutuelMarket, QuadraticVoting } from './prediction';

export interface TrialGameDef {
    slug: string;
    title: string;
    emoji: string;
    desc: string;
    principle: string;
    players: string;
    accent: string; // tailwind gradient
    component: React.FC;
}

export interface TrialCategory {
    name: string;
    blurb: string;
    accent: string;
    games: TrialGameDef[];
}

export const trialCategories: TrialCategory[] = [
    {
        name: 'Coordination & Focal Points',
        blurb: 'Win by aligning your choice with others — no talking allowed.',
        accent: 'from-cyan-400 to-blue-500',
        games: [
            { slug: 'keynesian-beauty-contest', title: 'Keynesian Beauty Contest', emoji: '🎯', desc: 'Guess ⅔ of the average. Out-think the field, not the number.', principle: 'k-level reasoning', players: 'Pool', accent: 'from-cyan-400 to-blue-500', component: KeynesianContest },
            { slug: 'schelling-point', title: 'Schelling Point', emoji: '🧭', desc: 'Pick the obvious answer everyone else will pick too.', principle: 'Focal points', players: 'Pool', accent: 'from-cyan-400 to-blue-500', component: SchellingPoint },
            { slug: 'stag-hunt', title: 'Stag Hunt', emoji: '🦌', desc: 'Risk the big cooperative prize, or take the safe solo payout.', principle: 'Payoff vs. risk dominance', players: '1v1', accent: 'from-cyan-400 to-blue-500', component: StagHunt },
            { slug: 'battle-of-the-sexes', title: 'Battle of the Sexes', emoji: '🎭', desc: 'Coordinate on a plan when you each prefer a different one.', principle: 'Asymmetric coordination', players: '1v1', accent: 'from-cyan-400 to-blue-500', component: BattleOfSexes },
        ],
    },
    {
        name: 'Anti-Coordination & Congestion',
        blurb: 'Win by doing the opposite of the crowd.',
        accent: 'from-orange-400 to-amber-500',
        games: [
            { slug: 'minority-game', title: 'The Minority Game', emoji: '🚪', desc: 'Join the smaller room — the crowd always loses.', principle: 'Anti-coordination', players: 'Pool', accent: 'from-orange-400 to-amber-500', component: MinorityGame },
            { slug: 'lowest-unique-bid', title: 'Lowest Unique Bid', emoji: '🔽', desc: 'Bid the smallest number nobody else picks.', principle: 'Mixed-strategy NE', players: 'Pool', accent: 'from-orange-400 to-amber-500', component: LowestUniqueBid },
            { slug: 'highest-unique-bid', title: 'Highest Unique Bid', emoji: '🔼', desc: 'Bid the biggest number nobody else picks.', principle: 'Reverse congestion', players: 'Pool', accent: 'from-orange-400 to-amber-500', component: HighestUniqueBid },
            { slug: 'el-farol-bar', title: 'El Farol Bar', emoji: '🍻', desc: 'Go to the bar only if it won’t be overcrowded.', principle: 'Capacity threshold', players: 'Pool', accent: 'from-orange-400 to-amber-500', component: ElFarolBar },
        ],
    },
    {
        name: 'Trust, Cooperation & Dilemmas',
        blurb: 'Individual greed against collective benefit.',
        accent: 'from-emerald-400 to-green-500',
        games: [
            { slug: 'split-or-steal', title: 'Split or Steal', emoji: '🤝', desc: 'The classic Prisoner’s Dilemma, 1v1 for the pot.', principle: 'Nash vs. Pareto', players: '1v1', accent: 'from-emerald-400 to-green-500', component: SplitOrSteal },
            { slug: 'iterated-prisoners-dilemma', title: 'Iterated Prisoner’s Dilemma', emoji: '🔁', desc: '10 rounds against Tit-for-Tat. History matters.', principle: 'Repeated games', players: 'vs. Bot', accent: 'from-emerald-400 to-green-500', component: IteratedPD },
            { slug: 'public-goods', title: 'Public Goods Game', emoji: '🏛️', desc: 'Contribute to a pool that’s multiplied and shared.', principle: 'Free-rider problem', players: '4 players', accent: 'from-emerald-400 to-green-500', component: PublicGoods },
            { slug: 'volunteers-dilemma', title: 'Volunteer’s Dilemma', emoji: '🙋', desc: 'Someone must step up — or everyone loses.', principle: 'Diffusion of responsibility', players: 'Group', accent: 'from-emerald-400 to-green-500', component: VolunteersDilemma },
            { slug: 'centipede', title: 'Centipede Game', emoji: '🐛', desc: 'Take the growing pot now, or trust and pass it on.', principle: 'Backward induction', players: '1v1', accent: 'from-emerald-400 to-green-500', component: CentipedeGame },
        ],
    },
    {
        name: 'Auctions & Escalation',
        blurb: 'Rationality under competitive bidding and sunk costs.',
        accent: 'from-amber-400 to-yellow-500',
        games: [
            { slug: 'dollar-auction', title: 'Shubik’s Dollar Auction', emoji: '💵', desc: 'Win the prize — but the runner-up pays too.', principle: 'Sunk-cost escalation', players: 'Multi', accent: 'from-amber-400 to-yellow-500', component: DollarAuction },
            { slug: 'vickrey-auction', title: 'Vickrey Auction', emoji: '✉️', desc: 'Sealed bids; the winner pays the second price.', principle: 'Truthful bidding', players: 'Multi', accent: 'from-amber-400 to-yellow-500', component: VickreyAuction },
            { slug: 'all-pay-auction', title: 'All-Pay Auction', emoji: '💸', desc: 'Everyone pays their bid; highest bid wins.', principle: 'Rent-seeking', players: 'Multi', accent: 'from-amber-400 to-yellow-500', component: AllPayAuction },
            { slug: 'reverse-dutch-auction', title: 'Reverse Dutch Clock', emoji: '⏬', desc: 'Price falls each tick — buy before a rival snipes it.', principle: 'Imperfect information', players: 'Real-time', accent: 'from-amber-400 to-yellow-500', component: ReverseDutchAuction },
            { slug: 'candle-auction', title: 'Candle Auction', emoji: '🕯️', desc: 'Bidding ends at a random moment. Lead when it does.', principle: 'Sniping resistance', players: 'Multi', accent: 'from-amber-400 to-yellow-500', component: CandleAuction },
        ],
    },
    {
        name: 'Time-Decay & War of Attrition',
        blurb: 'Countdowns, patience, and knowing when to exit.',
        accent: 'from-rose-400 to-red-500',
        games: [
            { slug: 'fomo-clock', title: 'FOMO Clock', emoji: '⏰', desc: 'Buy keys to be the last buyer when the timer dies.', principle: 'War of attrition', players: 'Pool', accent: 'from-rose-400 to-red-500', component: FomoClock },
            { slug: 'game-of-chicken', title: 'Game of Chicken', emoji: '🐔', desc: 'The multiplier rises — cash out before it crashes.', principle: 'Hawk-Dove', players: 'Pool', accent: 'from-rose-400 to-red-500', component: GameOfChicken },
            { slug: 'hot-potato', title: 'Hot Potato', emoji: '🥔', desc: 'Pass the bomb for a premium before it detonates.', principle: 'Passing sunk cost', players: 'Multi', accent: 'from-rose-400 to-red-500', component: HotPotato },
        ],
    },
    {
        name: 'Strategic Resource Allocation',
        blurb: 'Multi-dimensional zero-sum strategy.',
        accent: 'from-indigo-400 to-purple-500',
        games: [
            { slug: 'colonel-blotto', title: 'Colonel Blotto', emoji: '⚔️', desc: 'Spread 100 troops across 3 fronts to win the majority.', principle: 'Zero-sum minimax', players: '1v1', accent: 'from-indigo-400 to-purple-500', component: ColonelBlotto },
            { slug: 'matching-pennies', title: 'Matching Pennies', emoji: '🪙', desc: 'Pure conflict — win on a match, lose on a mismatch.', principle: 'Zero-sum mixing', players: '1v1', accent: 'from-indigo-400 to-purple-500', component: MatchingPennies },
            { slug: 'rpsls', title: 'Rock·Paper·Scissors·Lizard·Spock', emoji: '🖖', desc: 'Five choices, cyclic dominance, winner takes the pot.', principle: 'Non-transitive cycles', players: '1v1', accent: 'from-indigo-400 to-purple-500', component: RockPaperScissorsLizardSpock },
        ],
    },
    {
        name: 'Bargaining, Bluffing & Deduction',
        blurb: 'Fairness, hidden information, and nerve.',
        accent: 'from-fuchsia-400 to-pink-500',
        games: [
            { slug: 'pirate-game', title: 'The Pirate Game', emoji: '🏴‍☠️', desc: 'Propose a split of 100 coins and survive the vote.', principle: 'Subgame perfection', players: '5 players', accent: 'from-fuchsia-400 to-pink-500', component: PirateGame },
            { slug: 'ultimatum', title: 'Ultimatum Game', emoji: '⚖️', desc: 'Offer a split — too stingy and they reject out of spite.', principle: 'Fairness vs. rationality', players: '1v1', accent: 'from-fuchsia-400 to-pink-500', component: UltimatumGame },
            { slug: 'liars-dice', title: 'Liar’s Dice (Perudo)', emoji: '🎲', desc: 'Bid on hidden dice across the table — or call the bluff.', principle: 'Hidden information', players: '1v1', accent: 'from-fuchsia-400 to-pink-500', component: LiarsDice },
        ],
    },
    {
        name: 'Prediction & Parimutuel Markets',
        blurb: 'Crowd wisdom and collective preference.',
        accent: 'from-teal-400 to-emerald-500',
        games: [
            { slug: 'parimutuel-market', title: 'Parimutuel Market', emoji: '📈', desc: 'Bet on an outcome; winners split the pool by odds.', principle: 'Wisdom of crowds', players: 'Pool', accent: 'from-teal-400 to-emerald-500', component: ParimutuelMarket },
            { slug: 'quadratic-voting', title: 'Quadratic Voting Jackpot', emoji: '🗳️', desc: 'Votes cost the square of their count — spend your conviction.', principle: 'Quadratic cost', players: 'Pool', accent: 'from-teal-400 to-emerald-500', component: QuadraticVoting },
        ],
    },
];

export const allTrialGames: TrialGameDef[] = trialCategories.flatMap((c) => c.games);

export function getTrialGame(slug: string): TrialGameDef | undefined {
    return allTrialGames.find((g) => g.slug === slug);
}
