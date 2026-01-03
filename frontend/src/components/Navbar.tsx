import React, { useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Lottery', path: '/lottery' },
        { name: 'Games', path: '/games' },
    ];

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="sticky top-4 z-50 mx-4"
        >
            <div className="glass-panel rounded-full px-6 py-3 flex items-center justify-between max-w-7xl mx-auto">
                {/* Logo */}
                <RouterLink to="/" className="text-xl font-bold flex items-center gap-2 group">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-heist-red to-red-800 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                        B
                    </span>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                        Blockchain Lottery
                    </span>
                </RouterLink>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8">
                    <div className="flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/5">
                        {navLinks.map((link) => (
                            <RouterLink
                                key={link.name}
                                to={link.path}
                                className="relative px-4 py-2 rounded-full text-sm font-medium transition-colors"
                            >
                                {location.pathname === link.path && (
                                    <motion.div
                                        layoutId="nav-pill"
                                        className="absolute inset-0 bg-white/10 rounded-full"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className={location.pathname === link.path ? "text-white" : "text-gray-400 hover:text-white"}>
                                    {link.name}
                                </span>
                            </RouterLink>
                        ))}
                    </div>
                </div>

                {/* Wallet & Mobile Toggle */}
                <div className="flex items-center gap-4">
                    <div className="hidden md:block">
                        <ConnectButton
                            accountStatus={{
                                smallScreen: 'avatar',
                                largeScreen: 'full',
                            }}
                            showBalance={false}
                        />
                    </div>

                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {isOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className="absolute top-full left-0 right-0 mt-2 p-4 glass-panel rounded-2xl md:hidden flex flex-col gap-2"
                    >
                        {navLinks.map((link) => (
                            <RouterLink
                                key={link.name}
                                to={link.path}
                                onClick={() => setIsOpen(false)}
                                className={`p-3 rounded-xl transition-colors ${location.pathname === link.path
                                    ? "bg-white/10 text-white"
                                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                                    }`}
                            >
                                {link.name}
                            </RouterLink>
                        ))}
                        <div className="pt-2 border-t border-white/10 flex justify-center">
                            <ConnectButton showBalance={false} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
};

export default Navbar;
