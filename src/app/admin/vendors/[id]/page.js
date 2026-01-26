'use client';
import { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '../../../../helpers/authUtils';

export default function VendorDetailsPage({ params }) {
    // Unwrapping params using React.use() as per recent Next.js patterns or just use(params)
    // For safety with older/newer Next versions, we'll try to treat it as a promise if needed,
    // but standard in Next 15+ is sync access or `use`.
    // Wait, in Next 15 params is a promise.
    const resolvedParams = use(params);
    const { id } = resolvedParams;

    const router = useRouter();
    const [vendor, setVendor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(null); // { field, index, type }
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const fetchVendor = async () => {
            try {
                const token = getToken(); // Use utility
                const res = await fetch('/api/admin/vendors', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                if (res.ok) {
                    const data = await res.json();
                    const vendors = data.data?.vendors || [];
                    const found = vendors.find(v => v._id === id);
                    if (found) setVendor(found);
                }
            } catch (e) { console.error(e); }
            setLoading(false);
        };
        fetchVendor();
    }, [id, refreshKey]);

    const verifyDocument = async (field, status, reason = '', index = null) => {
        try {
            const token = getToken();
            const body = { vendorId: id, documentField: field, status, reason, index };

            const res = await fetch('/api/admin/verify-document', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                // Optimistic update or refetch
                setRefreshKey(old => old + 1);
                setVerifying(null);
            } else {
                alert('Failed to update status');
            }
        } catch (e) { console.error(e); }
    };

    const toggleGlobalApproval = async (status) => {
        const confirmMsg = status === 'verified' ? 'Approve this vendor profile?' : 'Reject this vendor profile?';
        let rejectReason = '';
        if (status === 'rejected') {
            rejectReason = prompt('Enter rejection reason:');
            if (!rejectReason) return;
        } else if (!confirm(confirmMsg)) {
            return;
        }

        try {
            const token = getToken();
            const res = await fetch('/api/admin/approve-vendor', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    vendorId: id,
                    status,
                    rejectionReason: rejectReason
                })
            });

            if (res.ok) {
                setRefreshKey(old => old + 1);
            } else {
                alert('Failed to update profile status');
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading Vendor Details...</div>;
    if (!vendor) return <div className="p-10 text-center text-red-500">Vendor not found</div>;

    return (
        <>
            <header className="bg-white shadow p-6 mb-6 flex justify-between items-center">
                <div>
                    <button onClick={() => router.back()} className="text-sm text-indigo-600 font-medium hover:text-indigo-800 mb-2 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Back to List
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        {vendor.businessName}
                        {!vendor.isApproved && <span className="text-[11px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Needs Review</span>}
                    </h1>
                    <p className="text-gray-500">{vendor.user?.email}</p>
                </div>

                <div className="flex gap-3">
                    {!vendor.isApproved ? (
                        <div className="flex gap-2">
                            <button
                                onClick={() => toggleGlobalApproval('rejected')}
                                className="px-5 py-2.5 bg-red-50 text-red-700 border border-red-100 rounded-lg text-sm font-bold hover:bg-red-100 transition shadow-sm"
                            >
                                Reject Profile
                            </button>
                            <button
                                onClick={() => toggleGlobalApproval('verified')}
                                className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition shadow-md"
                            >
                                Approve Business
                            </button>
                        </div>
                    ) : (
                        <div className="text-right">
                            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold bg-green-100 text-green-800 border border-green-200">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                Profile Verified
                            </span>
                            <button
                                onClick={() => toggleGlobalApproval('rejected')}
                                className="block mt-2 text-xs text-red-500 hover:underline mx-auto"
                            >
                                Revoke Approval
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <div className="px-8 pb-12 space-y-6">
                {/* Business Info */}
                <section className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-bold border-b pb-2 mb-4">Business Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm text-gray-500">Owner Name</label>
                            <div className="font-medium">{vendor.ownerName || 'N/A'}</div>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-500">Contact</label>
                            <div className="font-medium">{vendor.businessPhone || 'N/A'}</div>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-500">Registration No.</label>
                            <div className="font-medium">{vendor.businessRegistration || 'N/A'}</div>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-500">Categories</label>
                            <div className="flex gap-2 flex-wrap mt-1">
                                {vendor.category.map(cat => (
                                    <span key={cat} className="px-2 py-1 bg-slate-100 rounded text-xs">{cat}</span>
                                ))}
                            </div>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm text-gray-500">Address</label>
                            <div className="font-medium">{vendor.address || 'N/A'}</div>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm text-gray-500">Description</label>
                            <p className="text-gray-700 text-sm mt-1">{vendor.description || 'No description provided.'}</p>
                        </div>
                    </div>
                </section>

                {/* Bank Details */}
                <section className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-bold border-b pb-2 mb-4">Bank Details</h2>
                    {vendor.bankDetails?.accountNumber ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm text-gray-500">Bank Name</label>
                                <div className="font-medium">{vendor.bankDetails.bankName}</div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-500">Account Number</label>
                                <div className="font-medium">{vendor.bankDetails.accountNumber}</div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-500">IFSC Code</label>
                                <div className="font-medium">{vendor.bankDetails.ifscCode}</div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-500">Holder Name</label>
                                <div className="font-medium">{vendor.bankDetails.accountHolder}</div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-500">Status</label>
                                <StatusBadge status={vendor.bankDetails.status} />
                            </div>
                        </div>
                    ) : (
                        <div className="text-gray-400 italic">No bank details provided.</div>
                    )}
                </section>

                {/* Documents Verification */}
                <section className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-bold border-b pb-2 mb-4">Documents</h2>

                    {/* Loop through document keys */}
                    <div className="space-y-6">
                        <DocumentGroup title="Aadhar Card" docs={vendor.documents?.aadharCard} field="aadharCard" onVerify={verifyDocument} />
                        <DocumentGroup title="PAN Card" doc={vendor.documents?.panCard} field="panCard" onVerify={verifyDocument} />
                        <DocumentGroup title="Business Registration" doc={vendor.documents?.businessRegistration} field="businessRegistration" onVerify={verifyDocument} />
                        <DocumentGroup title="GST Registration" doc={vendor.documents?.gstRegistration} field="gstRegistration" onVerify={verifyDocument} />

                        {/* Arrays */}
                        <DocumentGroup title="Travel Agent Permit" docs={vendor.documents?.travelAgentPermit} field="travelAgentPermit" onVerify={verifyDocument} />
                        <DocumentGroup title="Insurance Policy" docs={vendor.documents?.passengerInsurancePolicy} field="passengerInsurancePolicy" onVerify={verifyDocument} />
                        <DocumentGroup title="Homestay Cert." docs={vendor.documents?.homestayRegistrationCertificate} field="homestayRegistrationCertificate" onVerify={verifyDocument} />
                        {/* Add others as needed */}
                    </div>
                </section>
            </div>
        </>
    );
}

function StatusBadge({ status }) {
    const colors = {
        verified: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
        pending: 'bg-yellow-100 text-yellow-800'
    };
    return <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${colors[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
}

function DocumentGroup({ title, doc, docs, field, onVerify }) {
    // Determine if it's an array or single object
    const items = docs ? docs : (doc ? [doc] : []);

    if (items.length === 0) return null;

    return (
        <div className="border border-gray-100 rounded p-4 bg-gray-50">
            <h3 className="font-semibold text-gray-700 mb-3">{title}</h3>
            <div className="grid grid-cols-1 gap-4">
                {items.map((item, idx) => (
                    <div key={idx} className="bg-white p-3 rounded shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex-1 overflow-hidden">
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate block">
                                View Document {items.length > 1 ? `#${idx + 1}` : ''} ({item.url.split('/').pop()})
                            </a>
                            {item.reason && <p className="text-xs text-red-500 mt-1">Rejection Reason: {item.reason}</p>}
                        </div>
                        <div className="flex items-center gap-3">
                            <StatusBadge status={item.status} />
                            {item.status !== 'verified' && (
                                <button onClick={() => onVerify(field, 'verified', null, docs ? idx : null)} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700">
                                    Approve
                                </button>
                            )}
                            {item.status !== 'rejected' && (
                                <button onClick={() => {
                                    const reason = prompt('Enter rejection reason:');
                                    if (reason) onVerify(field, 'rejected', reason, docs ? idx : null);
                                }} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700">
                                    Reject
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
