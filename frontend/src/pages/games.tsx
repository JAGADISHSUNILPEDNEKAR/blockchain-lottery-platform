import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { trialCategories, allTrialGames } from '../games/trial/registry';

interface ClassicGame {
    title: string;
    emoji: string;
    desc: string;
    path: string;
    accent: string;
    tags: string[];
}

const classics: ClassicGame[] = [
    {
        title: 'Blackjack',
        emoji: '🃏',
        desc: 'Beat the dealer to 21. Hit, stand, or double down. Blackjack pays 3:2.',
        path: '/games/blackjack',
        accent: 'from-emerald-400 to-cyan-500',
        tags: ['Free trial', 'On-chain', '1 player'],
    },
    {
        title: 'Bingo',
        emoji: '🎱',
        desc: 'Daub your card as numbers are called. Complete a line for the win.',
        path: '/games/bingo',
        accent: 'from-orange-400 to-amber-500',
        tags: ['Free trial', 'Auto-draw', 'Live caller'],
    },
];

const GamesPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="max-w-6xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-12"
            >
                <h1 className="text-5xl md:text-7xl font-bold mb-4">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500">
                        Game Library
                    </span>
                </h1>
                <p className="text-xl text-gray-400 mb-4">Casino classics plus {allTrialGames.length} game-theory games. Provably fair, instant.</p>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Play free in Trial Mode — no wallet or tokens needed
                </span>
            </motion.div>

            {/* Casino classics */}
            <section className="mb-14">
                <h2 className="text-sm uppercase tracking-widest text-gray-500 mb-5">Casino Classics</h2>
                <div className="grid md:grid-cols-2 gap-6">
                    {classics.map((game, i) => (
                        <motion.div
                            key={game.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 * (i + 1) }}
                            className="glass-panel p-8 rounded-3xl relative overflow-hidden group hover:bg-white/10 transition-colors cursor-pointer"
                            onClick={() => navigate(game.path)}
                        >
                            <div className="text-5xl mb-4">{game.emoji}</div>
                            <h3 className="text-3xl font-bold text-white mb-2">{game.title}</h3>
                            <p className="text-gray-400 mb-4">{game.desc}</p>
                            <div className="flex flex-wrap gap-2 mb-6">
                                {game.tags.map((t) => (
                                    <span key={t} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300">{t}</span>
                                ))}
                            </div>
                            <button className={`px-6 py-2.5 rounded-xl bg-gradient-to-r ${game.accent} text-white font-bold group-hover:shadow-lg transition-all`}>
                                Play Now →
                            </button>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Game-theory categories */}
            {trialCategories.map((cat) => (
                <section key={cat.name} className="mb-14">
                    <div className="mb-5">
                        <h2 className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${cat.accent}`}>{cat.name}</h2>
                        <p className="text-gray-500 text-sm mt-1">{cat.blurb}</p>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {cat.games.map((game, i) => (
                            <motion.div
                                key={game.slug}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-40px' }}
                                transition={{ delay: 0.03 * i }}
                                onClick={() => navigate(`/games/${game.slug}`)}
                                className="glass-card p-5 rounded-2xl cursor-pointer group hover:bg-white/5 hover:border-white/20 relative overflow-hidden"
                            >
                                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${game.accent} opacity-10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2`} />
                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-3">
                                        <span className="text-3xl">{game.emoji}</span>
                                        <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-gray-400">{game.players}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/70 transition">{game.title}</h3>
                                    <p className="text-sm text-gray-400 mb-3 leading-snug">{game.desc}</p>
                                    <span className="text-xs text-gray-500">🧠 {game.principle}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
};

export default GamesPage;
