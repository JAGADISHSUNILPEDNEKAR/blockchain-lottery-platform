import React from 'react';

export type GameMode = 'trial' | 'onchain';

interface Props {
    mode: GameMode;
    onChange: (mode: GameMode) => void;
}

const ModeToggle: React.FC<Props> = ({ mode, onChange }) => {
    return (
        <div className="flex items-center gap-1 p-1 rounded-full bg-white/5 border border-white/10 w-full max-w-sm mx-auto">
            <button
                onClick={() => onChange('trial')}
                className={`flex-1 px-4 py-2 rounded-full text-sm font-semibold transition ${
                    mode === 'trial' ? 'bg-emerald-500 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
            >
                🎮 Trial · Free
            </button>
            <button
                onClick={() => onChange('onchain')}
                className={`flex-1 px-4 py-2 rounded-full text-sm font-semibold transition ${
                    mode === 'onchain' ? 'bg-purple-500 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
            >
                ⛓️ On-chain
            </button>
        </div>
    );
};

export default ModeToggle;
