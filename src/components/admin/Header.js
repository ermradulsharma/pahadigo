'use client';
import { useRouter } from 'next/navigation';
import { removeToken, getRole } from '../../helpers/authUtils';
import { useEffect, useState, useRef } from 'react';

export default function Header({ title }) {
    const router = useRouter();
    const [role, setRole] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const fetchRole = () => {
            const storedRole = getRole();
            if (storedRole) {
                setRole(storedRole);
            }
        };
        fetchRole();

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        removeToken();
        router.push('/login');
    };

    return (
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
            <div className="flex items-center gap-4">
                {/* Mobile Menu Trigger could go here */}
                <h2 className="text-xl font-semibold text-gray-800 tracking-tight">{title || 'Dashboard'}</h2>
            </div>

            <div className="relative" ref={dropdownRef}>
                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors focus:outline-none group">
                    <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold border border-indigo-200 group-hover:bg-indigo-200 transition-colors">
                        {role ? role[0].toUpperCase() : 'A'}
                    </div>
                </button>

                {isDropdownOpen && (
                    <div className="absolute right-0 w-56 bg-white rounded-lg shadow-xl z-50 transform origin-top-right transition-all">
                        <div className="px-4 py-2 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-900">Admin Profile</p>
                            <p className="text-xs text-gray-500 truncate">{role || 'User'}</p>
                        </div>

                        <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                            <svg className="mr-3 h-4 w-4 text-gray-400 group-hover:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Profile
                        </a>
                        <a href="/admin/settings" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                            <svg className="mr-3 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Account Setting
                        </a>
                        <button onClick={handleLogout} className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                            <svg className="mr-3 h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}
