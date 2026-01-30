'use client';

import { useState, useEffect } from 'react';
import { getToken } from '@/helpers/authUtils';

export default function SupportPage() {
    const [inquiries, setInquiries] = useState([]);
    const [selectedInquiry, setSelectedInquiry] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInquiries();
    }, []);

    const fetchInquiries = async () => {
        try {
            const token = getToken();
            const res = await fetch('/api/admin/inquiries', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setInquiries(data.data.inquiries || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            const token = getToken();
            const res = await fetch(`/api/admin/inquiries/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status })
            });
            const data = await res.json();
            if (data.success) {
                setInquiries(prev => prev.map(i => i._id === id ? { ...i, status } : i));
                if (selectedInquiry && selectedInquiry._id === id) {
                    setSelectedInquiry({ ...selectedInquiry, status });
                }
            }
        } catch (error) {
            alert("Failed to update status");
        }
    };

    const deleteInquiry = async (id) => {
        if (!confirm("Delete this inquiry?")) return;
        try {
            const token = getToken();
            await fetch(`/api/admin/inquiries/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setInquiries(prev => prev.filter(i => i._id !== id));
            if (selectedInquiry && selectedInquiry._id === id) {
                setSelectedInquiry(null);
            }
        } catch (error) {
            alert("Failed to delete");
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Support Inbox</h1>
            </div>
            <div className="flex h-screen overflow-hidden bg-gray-50">
                {/* Sidebar list */}
                <div className="w-1/3 min-w-[320px] bg-white border-r border-gray-200 flex flex-col">
                    <div className="p-4 border-b border-gray-100">
                        <h1 className="text-xl font-bold text-gray-800">Support Inbox</h1>
                        <div className="text-xs text-gray-500 mt-1">{inquiries.length} Messages</div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-gray-400">Loading...</div>
                        ) : inquiries.length === 0 ? (
                            <div className="p-10 text-center text-gray-400 italic">No inquiries found</div>
                        ) : (
                            inquiries.map(inquiry => (
                                <div
                                    key={inquiry._id}
                                    onClick={() => setSelectedInquiry(inquiry)}
                                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${selectedInquiry?._id === inquiry._id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : 'border-l-4 border-l-transparent'}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${inquiry.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {inquiry.status}
                                        </span>
                                        <span className="text-[10px] text-gray-400">{new Date(inquiry.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <h4 className="font-bold text-gray-800 text-sm truncate">{inquiry.subject || 'No Subject'}</h4>
                                    <div className="text-xs text-gray-500 mt-1 truncate">{inquiry.name}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Detail View */}
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    {selectedInquiry ? (
                        <div className="flex-1 overflow-y-auto p-8">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-3xl mx-auto">
                                <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-100">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedInquiry.subject || 'No Subject'}</h2>
                                        <div className="text-sm text-gray-600 flex flex-col gap-1">
                                            <div><span className="font-bold">From:</span> {selectedInquiry.name} &lt;{selectedInquiry.email}&gt;</div>
                                            {selectedInquiry.phone && <div><span className="font-bold">Phone:</span> {selectedInquiry.phone}</div>}
                                            <div className="text-gray-400 text-xs mt-1">{new Date(selectedInquiry.createdAt).toLocaleString()}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {selectedInquiry.status !== 'resolved' && (
                                            <button
                                                onClick={() => updateStatus(selectedInquiry._id, 'resolved')}
                                                className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700"
                                            >
                                                Mark Resolved
                                            </button>
                                        )}
                                        <button
                                            onClick={() => deleteInquiry(selectedInquiry._id)}
                                            className="px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-bold rounded-lg hover:bg-red-50"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                <div className="prose max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                                    {selectedInquiry.message}
                                </div>

                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50">
                            <div className="text-center">
                                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                <p>Select a message to read</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
