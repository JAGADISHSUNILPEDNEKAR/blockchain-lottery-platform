import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';

const HomePage: React.FC = () => {
    return (
        <div className="max-w-6xl mx-auto pt-12">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center mb-20"
            >
                <h1 className="text-6xl md:text-8xl font-bold mb-6 tracking-tighter">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-heist-red via-red-600 to-heist-red">
                        Blockchain
                    </span>
                    <br />
                    <span className="text-white">Lottery & Gaming</span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                    Fair, transparent, and decentralized gaming platform powered by <span className="text-heist-red">Ethereum</span> and <span className="text-red-500">Chainlink VRF</span>.
                </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 px-4">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="glass-panel p-8 rounded-3xl hover:bg-white/5 transition-colors group"
                >
                    <div className="w-16 h-16 rounded-2xl bg-heist-red/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <span className="text-4xl">🎲</span>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4">Lottery</h2>
                    <p className="text-gray-400 mb-8 text-lg">
                        Join our decentralized lottery. Buy tickets, wait for the draw, and win big!
                    </p>
                    <RouterLink
                        to="/lottery"
                        className="inline-block w-full py-4 text-center rounded-xl bg-gradient-to-r from-heist-red to-red-800 text-white font-bold hover:shadow-lg hover:shadow-heist-red/20 transition-all transform hover:-translate-y-1"
                    >
                        Play Lottery
                    </RouterLink>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="glass-panel p-8 rounded-3xl hover:bg-white/5 transition-colors group"
                >
                    <div className="w-16 h-16 rounded-2xl bg-heist-red/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <span className="text-4xl">🎮</span>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4">Games</h2>
                    <p className="text-gray-400 mb-8 text-lg">
                        Play Blackjack and Bingo with provably fair randomness.
                    </p>
                    <RouterLink
                        to="/games"
                        className="inline-block w-full py-4 text-center rounded-xl bg-gradient-to-r from-heist-red to-red-800 text-white font-bold hover:shadow-lg hover:shadow-heist-red/20 transition-all transform hover:-translate-y-1"
                    >
                        Play Games
                    </RouterLink>
                </motion.div>
            </div>
        </div>
    );
};

export default HomePage;
