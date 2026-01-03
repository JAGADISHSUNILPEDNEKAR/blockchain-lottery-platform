import React from 'react';
import { motion } from 'framer-motion';
import LotteryCard from '../components/LotteryCard';

const LotteryPage: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-12"
            >
                <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tighter">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500">
                        Decentralized Lottery
                    </span>
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                    A transparent, provably fair lottery built on Ethereum.
                    <span className="text-white block mt-2">Win big with crypto.</span>
                </p>
            </motion.div>

            <LotteryCard />
        </div>
    );
};

export default LotteryPage;
