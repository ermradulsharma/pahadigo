'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getToken } from '@/core/Helpers/authUtils';
import { Search, Plus, Eye, Package as PackageIcon, ShieldAlert, CheckCircle2, Factory, X, User as UserIcon, Mail, Phone, Lock, Trash2 } from 'lucide-react';
import CyberTable from '@/components/admin/CyberTable';
import api from '@/core/Api';
import DynamicModal from '@/components/admin/DynamicModal';
import Loading from '@/components/admin/Loading';

export default function VendorsPage() {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

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
        } catch (e) {
            alert("Error executing bulk termination.");
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
        } catch (e) {
            alert("Error executing bulk authorization.");
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
            } else {
                alert("Failed: " + (data.error || data.message));
            }
        } catch (error) {
            alert("An error occurred.");
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
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3"><Factory className="w-7 h-7 text-indigo-400 opacity-80" /> Vendor Network</h1>
                    <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mt-1">Authorized Supply Chain Nodes</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative group hidden md:block">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input type="text" placeholder="Scan Nodes..." className="bg-[#0a0a0c]/80 backdrop-blur-xl pl-10 pr-4 py-2 border border-white/10 rounded-lg focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none text-sm text-slate-200 w-64 md:w-65 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all placeholder:text-slate-600" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-4 py-2 rounded-lg hover:bg-indigo-600/40 hover:text-white transition-all shadow-[0_0_15px_rgba(99,102,241,0.1)] hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] font-medium text-sm"><Plus className="w-4 h-4" /><span className="font-semibold tracking-wide">Register</span></button>
                </div>
            </div>

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
