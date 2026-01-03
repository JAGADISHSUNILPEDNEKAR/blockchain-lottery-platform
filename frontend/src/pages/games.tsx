import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const GamesPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="max-w-5xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-16"
            >
                <h1 className="text-5xl md:text-7xl font-bold mb-4">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-heist-red to-red-600">
                        Casino Games
                    </span>
                </h1>
                <p className="text-xl text-gray-400">Provably fair. Instant payouts.</p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-panel p-8 rounded-3xl relative overflow-hidden group hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => navigate('/games/blackjack')}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                    <div className="relative z-10">
                        <div className="text-4xl mb-4">🃏</div>
                        <h2 className="text-3xl font-bold text-white mb-2">Blackjack</h2>
                        <p className="text-gray-400 mb-6">
                            Play Blackjack against the smart contract dealer. Provably fair and transparent.
                        </p>
                        <button className="px-6 py-2 rounded-lg bg-heist-red/20 text-red-300 border border-heist-red/30 group-hover:bg-heist-red group-hover:text-white transition-all">
                            Play Now
                        </button>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-panel p-8 rounded-3xl relative overflow-hidden group hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => navigate('/games/bingo')}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-heist-red/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                    <div className="relative z-10">
                        <div className="text-4xl mb-4">🎱</div>
                        <h2 className="text-3xl font-bold text-white mb-2">Bingo</h2>
                        <p className="text-gray-400 mb-6">
                            Multiplayer Bingo with automated number drawing. Join rooms and win pots!
                        </p>
                        <button className="px-6 py-2 rounded-lg bg-heist-red/20 text-red-300 border border-heist-red/30 group-hover:bg-heist-red group-hover:text-white transition-all">
                            Play Now
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default GamesPage;
