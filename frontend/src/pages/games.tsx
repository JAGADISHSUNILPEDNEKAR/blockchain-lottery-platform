import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface GameDef {
    title: string;
    emoji: string;
    desc: string;
    path: string;
    glow: string;
    accent: string;
    tags: string[];
}

const games: GameDef[] = [
    {
        title: 'Blackjack',
        emoji: '🃏',
        desc: 'Beat the dealer to 21. Hit, stand, or double down. Blackjack pays 3:2.',
        path: '/games/blackjack',
        glow: 'bg-emerald-500/20',
        accent: 'from-emerald-400 to-cyan-500',
        tags: ['Free trial', 'Instant', '1 player'],
    },
    {
        title: 'Bingo',
        emoji: '🎱',
        desc: 'Daub your card as numbers are called. Complete a line for the win.',
        path: '/games/bingo',
        glow: 'bg-orange-500/20',
        accent: 'from-orange-400 to-amber-500',
        tags: ['Free trial', 'Auto-draw', 'Live caller'],
    },
];

const GamesPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="max-w-5xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-12"
            >
                <h1 className="text-5xl md:text-7xl font-bold mb-4">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500">
                        Casino Games
                    </span>
                </h1>
                <p className="text-xl text-gray-400 mb-4">Provably fair. Instant payouts.</p>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Play free in Trial Mode — no wallet or tokens needed
                </span>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
                {games.map((game, i) => (
                    <motion.div
                        key={game.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * (i + 1) }}
                        className="glass-panel p-8 rounded-3xl relative overflow-hidden group hover:bg-white/10 transition-colors cursor-pointer"
                        onClick={() => navigate(game.path)}
                    >
                        <div className={`absolute top-0 right-0 w-32 h-32 ${game.glow} rounded-full blur-3xl -translate-y-1/2 translate-x-1/2`} />

                        <div className="relative z-10">
                            <div className="text-5xl mb-4">{game.emoji}</div>
                            <h2 className="text-3xl font-bold text-white mb-2">{game.title}</h2>
                            <p className="text-gray-400 mb-4">{game.desc}</p>
                            <div className="flex flex-wrap gap-2 mb-6">
                                {game.tags.map((t) => (
                                    <span key={t} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300">
                                        {t}
                                    </span>
                                ))}
                            </div>
                            <button className={`px-6 py-2.5 rounded-xl bg-gradient-to-r ${game.accent} text-white font-bold group-hover:shadow-lg transition-all`}>
                                Play Now →
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default GamesPage;
