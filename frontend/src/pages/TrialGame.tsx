import React from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDemoCredits } from '../hooks/useDemoCredits';
import { getTrialGame } from '../games/trial/registry';

const ChipHeader: React.FC = () => {
    const { credits, reset, STARTING_CREDITS } = useDemoCredits();
    return (
        <div className="flex items-center justify-between glass-panel rounded-2xl px-5 py-3 mb-6">
            <div className="flex items-center gap-2">
                <span className="text-2xl">🪙</span>
                <div>
                    <p className="text-xs uppercase tracking-wider text-gray-400">Trial Chips</p>
                    <p className="text-xl font-bold text-amber-300">{credits.toLocaleString()}</p>
                </div>
            </div>
            <button
                onClick={reset}
                className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-200 border border-amber-500/30 hover:bg-amber-500/30 transition text-sm font-semibold"
            >
                {credits < 10 ? `Reset to ${STARTING_CREDITS}` : 'Reset chips'}
            </button>
        </div>
    );
};

const TrialGame: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const game = slug ? getTrialGame(slug) : undefined;

    if (!game) {
        return <Navigate to="/games" replace />;
    }

    const Game = game.component;

    return (
        <div className="max-w-2xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <button onClick={() => navigate('/games')} className="text-sm text-gray-400 hover:text-white transition mb-4">← All games</button>

                <div className="text-center mb-6">
                    <div className="text-5xl mb-2">{game.emoji}</div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">
                        <span className={`bg-clip-text text-transparent bg-gradient-to-r ${game.accent}`}>{game.title}</span>
                    </h1>
                    <p className="text-gray-400">{game.desc}</p>
                    <div className="flex flex-wrap justify-center gap-2 mt-3">
                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300">🧠 {game.principle}</span>
                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300">👥 {game.players}</span>
                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">🎮 Free trial</span>
                    </div>
                </div>

                <ChipHeader />
                <Game />
            </motion.div>
        </div>
    );
};

export default TrialGame;
