'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Bell,
    CheckCheck,
    Trash2,
    Calendar,
    CreditCard,
    ShieldAlert,
    Package,
    MessageSquare,
    Info,
    X,
    ExternalLink,
    Clock,
    UserCheck
} from 'lucide-react';
import { getToken } from '@/app/utils/authUtils.js';

export default function NotificationBell({ theme = 'dark', apiPrefix = '/api/admin/notifications' }) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    // Fetch unread count for the bell badge
    const fetchUnreadCount = useCallback(async () => {
        try {
            const token = getToken();
            if (!token) return;

            const res = await fetch(`${apiPrefix}/unread-count`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                if (data?.data?.unreadCount !== undefined) {
                    setUnreadCount(data.data.unreadCount);
                }
            }
        } catch {
            // Silently handle network polling error
        }
    }, []);

    // Fetch notifications list
    const fetchNotifications = useCallback(async () => {
        try {
            const token = getToken();
            if (!token) return;

            setLoading(true);
            const queryParam = activeTab === 'unread' ? '?filter=unread' : '';
            const res = await fetch(`${apiPrefix}${queryParam}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (res.ok) {
                const result = await res.json();
                const items = result?.data || [];
                setNotifications(Array.isArray(items) ? items : []);
                if (result?.pagination?.unreadCount !== undefined) {
                    setUnreadCount(result.pagination.unreadCount);
                }
            }
        } catch {
            // Error fetching notifications
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    // Initial fetch on mount & establish true real-time SSE push stream (zero periodic polling!)
    useEffect(() => {
        fetchUnreadCount();

        const token = getToken();
        if (!token) return;

        let eventSource;
        try {
            eventSource = new EventSource(`${apiPrefix}/stream?token=${encodeURIComponent(token)}`);

            eventSource.onmessage = (event) => {
                try {
                    const newNotif = JSON.parse(event.data);
                    if (newNotif && (newNotif._id || newNotif.id)) {
                        setNotifications((prev) => [newNotif, ...prev.filter((n) => (n._id || n.id) !== (newNotif._id || newNotif.id))]);
                        setUnreadCount((prev) => prev + 1);
                    }
                } catch {
                    // Ignore non-json or heartbeat
                }
            };
        } catch {
            // Silently handle if EventSource fails
        }

        return () => {
            if (eventSource) {
                eventSource.close();
            }
        };
    }, [fetchUnreadCount]);

    // Fetch notifications when modal opens or tab changes
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen, fetchNotifications]);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Mark single notification as read & handle click
    const handleNotificationClick = async (notification) => {
        try {
            const token = getToken();
            if (token && !notification.isRead) {
                await fetch(`${apiPrefix}/${notification._id}/read`, {
                    method: 'PATCH',
                    headers: { Authorization: `Bearer ${token}` }
                });

                setNotifications((prev) =>
                    prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n))
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }

            if (notification.actionUrl) {
                setIsOpen(false);
                router.push(notification.actionUrl);
            }
        } catch {
            // Failure silently handled
        }
    };

    // Mark all as read
    const handleMarkAllRead = async () => {
        try {
            const token = getToken();
            if (!token) return;

            await fetch(`${apiPrefix}/read-all`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` }
            });

            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch {
            // Error handling
        }
    };

    // Clear / Dismiss single notification
    const handleDismiss = async (e, id) => {
        e.stopPropagation();
        try {
            const token = getToken();
            if (!token) return;

            await fetch(`${apiPrefix}/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            const dismissedItem = notifications.find((n) => n._id === id);
            if (dismissedItem && !dismissedItem.isRead) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
            setNotifications((prev) => prev.filter((n) => n._id !== id));
        } catch {
            // Error handling
        }
    };

    // Clear all notifications
    const handleClearAll = async () => {
        try {
            const token = getToken();
            if (!token) return;

            await fetch(`${apiPrefix}/clear-all`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            setNotifications([]);
            setUnreadCount(0);
        } catch {
            // Error handling
        }
    };

    // Format relative time
    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const now = new Date();
        const date = new Date(dateStr);
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;
        return date.toLocaleDateString();
    };

    // Category icon mapper
    const getCategoryIcon = (category) => {
        switch (category) {
            case 'booking':
                return <Calendar className="w-4 h-4 text-emerald-400" />;
            case 'payment':
                return <CreditCard className="w-4 h-4 text-cyan-400" />;
            case 'security':
            case 'sos':
                return <ShieldAlert className="w-4 h-4 text-rose-400" />;
            case 'package':
            case 'vendor':
                return <Package className="w-4 h-4 text-amber-400" />;
            case 'chat':
                return <MessageSquare className="w-4 h-4 text-indigo-400" />;
            case 'account':
                return <UserCheck className="w-4 h-4 text-purple-400" />;
            default:
                return <Info className="w-4 h-4 text-blue-400" />;
        }
    };

    const isDark = theme === 'dark';

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2.5 rounded-xl transition-all duration-200 focus:outline-none ${
                    isDark
                        ? 'text-slate-300 hover:text-white hover:bg-white/10 border border-white/5 active:scale-95'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 active:scale-95'
                }`}
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5 transition-transform group-hover:rotate-12" />

                {/* Unread Glowing Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center px-1 text-[10px] font-bold text-white bg-indigo-600 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.8)] animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Popover Modal */}
            {isOpen && (
                <div
                    className={`absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl shadow-2xl z-50 overflow-hidden transform origin-top-right transition-all animate-in fade-in zoom-in-95 duration-200 ${
                        isDark
                            ? 'bg-[#0a0a0c]/95 border border-white/10 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] text-slate-200'
                            : 'bg-white border border-gray-200 backdrop-blur-xl shadow-2xl text-gray-800'
                    }`}
                >
                    {/* Glowing Top Accent Line */}
                    <div className="h-0.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                    {/* Header */}
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-base tracking-tight">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="text-[11px] font-mono px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
                                    {unreadCount} unread
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    title="Mark all as read"
                                    className="p-1.5 text-xs text-slate-400 hover:text-indigo-400 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-1"
                                >
                                    <CheckCheck className="w-4 h-4" />
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button
                                    onClick={handleClearAll}
                                    title="Clear all"
                                    className="p-1.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-1"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex px-4 pt-2 border-b border-white/5 gap-4 text-xs font-medium">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`pb-2 border-b-2 transition-all ${
                                activeTab === 'all'
                                    ? 'border-indigo-500 text-indigo-400 font-semibold'
                                    : 'border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setActiveTab('unread')}
                            className={`pb-2 border-b-2 transition-all flex items-center gap-1.5 ${
                                activeTab === 'unread'
                                    ? 'border-indigo-500 text-indigo-400 font-semibold'
                                    : 'border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Unread
                            {unreadCount > 0 && (
                                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                            )}
                        </button>
                    </div>

                    {/* Notification Items List */}
                    <div className="max-h-96 overflow-y-auto divide-y divide-white/5 custom-scrollbar">
                        {loading ? (
                            <div className="p-8 text-center text-sm text-slate-400 animate-pulse">
                                Loading notifications...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-10 text-center flex flex-col items-center justify-center">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                                    <Bell className="w-6 h-6 opacity-60" />
                                </div>
                                <p className="text-sm font-medium text-slate-300">No notifications yet</p>
                                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                                    {activeTab === 'unread'
                                        ? "You've caught up with all your notifications!"
                                        : "We'll let you know when important updates arrive."}
                                </p>
                            </div>
                        ) : (
                            notifications.map((item) => (
                                <div
                                    key={item._id}
                                    onClick={() => handleNotificationClick(item)}
                                    className={`p-4 flex items-start gap-3 transition-colors cursor-pointer group relative ${
                                        item.isRead
                                            ? 'hover:bg-white/[0.03] opacity-80 hover:opacity-100'
                                            : 'bg-indigo-500/[0.04] hover:bg-indigo-500/[0.08]'
                                    }`}
                                >
                                    {/* Unread Glow Dot */}
                                    {!item.isRead && (
                                        <div className="absolute left-1.5 top-5 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,1)]" />
                                    )}

                                    {/* Icon */}
                                    <div className="p-2 rounded-xl bg-white/[0.05] border border-white/10 shrink-0 mt-0.5">
                                        {getCategoryIcon(item.category)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 pr-6">
                                        <div className="flex items-center justify-between gap-1 mb-1">
                                            <h4 className={`text-xs font-semibold truncate ${item.isRead ? 'text-slate-300' : 'text-white'}`}>
                                                {item.title}
                                            </h4>
                                        </div>
                                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                                            {item.message}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500 font-mono">
                                            <Clock className="w-3 h-3" />
                                            <span>{formatTime(item.createdAt)}</span>
                                            {item.actionUrl && (
                                                <span className="flex items-center gap-1 text-indigo-400 group-hover:underline ml-auto">
                                                    View details <ExternalLink className="w-2.5 h-2.5" />
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Dismiss Button */}
                                    <button
                                        onClick={(e) => handleDismiss(e, item._id)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg absolute right-2 top-3"
                                        title="Dismiss"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
