'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getToken } from '@/core/Helpers/authUtils.js';
import { Search, Plus, Eye, Package as PackageIcon, ShieldAlert, CheckCircle2, Factory, X, User as UserIcon, Mail, Phone, Lock, Trash2 } from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import CyberTable from '@/components/admin/CyberTable.js';
import api from '@/core/Api/index.js';
import DynamicModal from '@/components/admin/DynamicModal.js';
import Loading from '@/components/admin/Loading.js';
import { useToast } from '@/components/ui/ToastContext.js';

export default function VendorsPage() {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const toast = useToast();

    // Add Vendor Modal State
    const [addLoading, setAddLoading] = useState(false);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [newVendor, setNewVendor] = useState({ businessName: '', ownerName: '', email: '', phone: '', password: '' });

    const vendorFields = [
        { name: 'businessName', label: 'Business Identity', type: 'text', required: true, placeholder: 'Aero Travels Protocol', icon: 'Factory' },
        { name: 'ownerName', label: 'Admin Operator', type: 'text', placeholder: 'Trinity', icon: 'User' },
        { name: 'email', label: 'Comm Link (Email)', type: 'email', required: true, placeholder: 'sys@domain.com', icon: 'Mail' },
        { name: 'phone', label: 'Data Frequency (Phone)', type: 'tel', required: true, placeholder: '+1...', icon: 'Phone' },
        { name: 'password', label: 'Master Key (Password)', type: 'password', required: true, placeholder: '••••••••', icon: 'Lock' }
    ];

    const handleBulkDelete = async (selectedVendors) => {
        if (!confirm(`WARNING: Are you sure you want to terminate ${selectedVendors.length} network nodes? This action is irreversible.`)) return;
        setBulkLoading(true);
        try {
            let successCount = 0;
            for (const vendor of selectedVendors) {
                const data = await api.admin.vendors.delete(vendor._id);
                if (data.success) successCount++;
            }
            const data = await getVendors();
            setVendors(data);
            toast(`Terminated ${successCount} nodes.`, "success");
        } catch (e) {
            toast("Error executing bulk termination.", "error");
        } finally {
            setBulkLoading(false);
        }
    };

    const handleBulkApprove = async (selectedVendors) => {
        if (!confirm(`Authorize ${selectedVendors.length} nodes for network access?`)) return;
        setBulkLoading(true);
        try {
            let successCount = 0;
            for (const vendor of selectedVendors) {
                const data = await api.admin.vendors.approve(vendor._id);
                if (data.success) successCount++;
                else {
                    // Fallback to update status if explicit endpoint fails
                    const fallbackData = await api.admin.vendors.update(vendor._id, { isApproved: true });
                    if (fallbackData.success) successCount++;
                }
            }
            const data = await getVendors();
            setVendors(data);
            toast(`Authorized ${successCount} nodes.`, "success");
        } catch (e) {
            toast("Error executing bulk authorization.", "error");
        } finally {
            setBulkLoading(false);
        }
    };

    const handleAddVendor = async (e) => {
        e.preventDefault();
        setAddLoading(true);
        try {
            const data = await api.admin.vendors.create(newVendor);
            if (data.success) {
                setIsModalOpen(false);
                setNewVendor({ businessName: '', ownerName: '', email: '', phone: '', password: '' });
                const updated = await getVendors();
                setVendors(updated);
                toast("Vendor successfully added.", "success");
            } else {
                toast("Failed: " + (data.error || data.message), "error");
            }
        } catch (error) {
            toast("An error occurred.", "error");
        } finally {
            setAddLoading(false);
        }
    };

    const getVendors = useCallback(async () => {
        try {
            const data = await api.admin.vendors.getAll();
            return data.data || [];
        } catch (e) {
            return [];
        }
    }, []);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            const data = await getVendors();
            if (mounted) {
                setVendors(data);
                setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, [getVendors]);

    const columns = [
        {
            header: 'S.No',
            className: 'w-[5%]',
            tdClassName: 'text-slate-500 font-mono text-[11px] text-center',
            render: (_, index) => index + 1
        },
        {
            header: 'Identifier',
            accessor: 'ownerName', // Used for sorting
            className: 'w-1/4',
            render: (v) => (
                <div className="flex flex-col items-start gap-1">
                    <div className="font-bold text-slate-200 group-hover:text-indigo-300 transition-colors flex items-center gap-2">{v.ownerName || v.businessName || 'Unknown Entity'}</div>
                </div>
            )
        },
        {
            header: 'Comm Link',
            tdClassName: 'text-sm text-slate-400 font-mono text-[13px]',
            render: (v) => v.email || v.businessEmail || 'OFFLINE'
        },
        {
            header: 'Telecom',
            tdClassName: 'text-sm text-slate-400 font-mono text-[13px]',
            render: (v) => v.phone || v.businessNumber || 'UNAVAILABLE'
        },
        {
            header: 'Clearance',
            accessor: 'isApproved',
            render: (v) => {
                if (v.hasProfile && v.isApproved) {
                    return <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-mono tracking-widest uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]"><CheckCircle2 className="w-3 h-3" /> Verified Node </div>;
                }
                if (v.hasProfile && !v.isApproved) {
                    return <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-mono tracking-widest uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]"><ShieldAlert className="w-3 h-3" /> Pending Scan </div>;
                }
                return <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-mono tracking-widest uppercase bg-slate-500/10 text-slate-400 border border-slate-500/20"><Lock className="w-3 h-3" /> Initialization </div>;
            }
        },
        {
            header: 'Telemetry',
            className: 'text-right',
            tdClassName: 'text-right',
            render: (v) => (
                <div className="flex justify-end gap-2 items-center opacity-70 group-hover:opacity-100 transition-opacity">
                    <Link href={`/admin/vendors/${v._id}`} title="Access Node Profile" className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg border border-transparent hover:border-indigo-500/20 transition-all hover:shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                        <Eye className="w-4 h-4" />
                    </Link>
                </div>
            )
        }
    ];

    if (loading) return <Loading message="Decrypting Vendor Nodes..." />;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <PageHeader title="Vendor Network" subtitle="Authorized Supply Chain Nodes" icon={Factory} searchQuery={searchQuery} onSearchChange={setSearchQuery} actionLabel="Register" actionIcon={Plus} onAction={() => setIsModalOpen(true)} />
            <CyberTable data={vendors} columns={columns} itemsPerPage={10} searchTerm={searchQuery} searchKeys={['user.name', 'ownerName', 'user.email', 'businessName']} emptyText="NULL OUTPUT: No nodes found in current vector." exportFilename="vendor_nodes"
                bulkActions={(selectedVendors) => (
                    <div className="flex items-center gap-2">
                        <button onClick={() => handleBulkDelete(selectedVendors)} disabled={bulkLoading} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 rounded-lg text-xs font-mono tracking-wider transition-all shadow-[0_0_10px_rgba(244,63,94,0.1)] disabled:opacity-50 disabled:cursor-not-allowed">
                            <Trash2 className="w-3.5 h-3.5" /> Terminate
                        </button>
                        <button onClick={() => handleBulkApprove(selectedVendors)} disabled={bulkLoading} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 rounded-lg text-xs font-mono tracking-wider transition-all shadow-[0_0_10px_rgba(16,185,129,0.1)] disabled:opacity-50 disabled:cursor-not-allowed">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Authorize
                        </button>
                    </div>
                )}
                renderExpandableRow={(v) => (
                    <div className="grid grid-cols-1">
                        <div className="space-y-2">
                            <h4 className="text-xs font-mono text-indigo-400 uppercase tracking-widest border-b border-indigo-500/20 pb-2 mb-3">System Identity</h4>
                            <p className="font-mono text-[11px] text-slate-400"><span className="text-slate-500 inline-block w-24">UUID:</span> {v._id}</p>
                            <p className="font-mono text-[11px] text-slate-400"><span className="text-slate-500 inline-block w-24">Business Name:</span> {v.businessName}</p>
                            <p className="font-mono text-[11px] text-slate-400"><span className="text-slate-500 inline-block w-24">Owner Name:</span> {v.ownerName}</p>
                            <p className="font-mono text-[11px] text-slate-400"><span className="text-slate-500 inline-block w-24">Registration:</span> {v.businessRegistration}</p>
                            <p className="font-mono text-[11px] text-slate-400"><span className="text-slate-500 inline-block w-24">GSTTIN:</span> {v.gstNumber}</p>
                            <p className="font-mono text-[11px] text-slate-400"><span className="text-slate-500 inline-block w-24">Created:</span> {new Date(v.createdAt).toUTCString()}</p>
                        </div>
                    </div>
                )}
            />
            <DynamicModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New Node" fields={vendorFields} formData={newVendor} onChange={setNewVendor} onSubmit={handleAddVendor} loading={addLoading} submitText="Deploy Node" />
        </div>
    );
}
