import React from 'react';
import { Search } from 'lucide-react';

export default function PageHeader({
    title,
    titleBadge,
    subtitle,
    icon: Icon,
    iconClassName = "text-indigo-400 opacity-80",

    // Search props
    showSearch = true,
    searchQuery = "",
    onSearchChange,
    searchPlaceholder = "Search...",

    // Action props
    showAction = true,
    actionLabel = "Add New",
    actionIcon: ActionIcon,
    onAction
}) {
    return (
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2 gap-4">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">{Icon && <Icon className={`w-7 h-7 ${iconClassName}`} />}{title}
                    {titleBadge && (
                        <span className="px-2.5 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full text-[10px] font-bold tracking-widest uppercase ml-2">{titleBadge}</span>
                    )}
                </h1>
                {subtitle && (
                    <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mt-1">{subtitle}</p>
                )}
            </div>

            <div className="flex items-center gap-4">
                {showSearch && (
                    <div className="relative group hidden md:block">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input type="text" placeholder={searchPlaceholder} className="bg-[#0a0a0c]/80 backdrop-blur-xl pl-10 pr-4 py-2 border border-white/10 rounded-lg focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none text-sm text-slate-200 w-64 md:w-65 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all placeholder:text-slate-600" value={searchQuery} onChange={(e) => onSearchChange && onSearchChange(e.target.value)} />
                    </div>
                )}

                {showAction && (
                    <button onClick={onAction} className="flex items-center gap-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-4 py-2 rounded-lg hover:bg-indigo-600/40 hover:text-white transition-all shadow-[0_0_15px_rgba(99,102,241,0.1)] hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] font-medium text-sm"> {ActionIcon && <ActionIcon className="w-4 h-4" />} <span className="font-semibold tracking-wide">{actionLabel}</span> </button>
                )}
            </div>
        </div>
    );
}
