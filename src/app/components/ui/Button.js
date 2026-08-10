import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
    children,
    variant = 'primary', // 'primary' | 'danger' | 'outline' | 'ghost' | 'success'
    size = 'md', // 'sm' | 'md' | 'lg' | 'icon'
    isLoading = false,
    disabled = false,
    className = '',
    icon: Icon,
    ...props
}) {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] border border-indigo-500/50',
        danger: 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.1)]',
        success: 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.1)]',
        outline: 'bg-transparent text-slate-300 hover:text-white border border-white/10 hover:border-white/20 hover:bg-white/5',
        ghost: 'bg-transparent text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs rounded-md gap-1.5',
        md: 'px-4 py-2 text-sm rounded-lg gap-2',
        lg: 'px-6 py-3 text-base rounded-xl gap-2',
        icon: 'p-1.5 rounded-md',
    };

    const variantStyles = variants[variant] || variants.primary;
    const sizeStyles = sizes[size] || sizes.md;

    return (
        <button
            className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : Icon ? (
                <Icon className={size === 'icon' ? 'w-4 h-4' : 'w-4 h-4'} />
            ) : null}
            {children}
        </button>
    );
}
