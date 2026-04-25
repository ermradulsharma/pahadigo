import React from 'react';

const Loading = ({ message = "Establishing Neural Link..." }) => {
    return (
        <div className="p-8 h-[calc(100vh-80px)] flex flex-col items-center justify-center space-y-4">
            <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
                <div className="absolute inset-2 rounded-full border-r-2 border-cyan-500 animate-spin-reverse opacity-70"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
            </div>
            <div className="text-xs font-mono text-indigo-400 tracking-[0.3em] uppercase animate-pulse">{message}</div>
        </div>
    );
};

export default Loading;
