'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Power, ExternalLink, MapPin, PackageIcon, Plus } from 'lucide-react';
import api from '@/core/Api/index.js';
import { useToast } from '@/components/ui/ToastContext.js';
import { getServiceName, getPrice } from '@/app/components/admin/PackageCard.js';
import CyberTable from '@/app/components/admin/CyberTable.js';
import { CATEGORY_MAP } from '@/core/Constants/categories.js';
import PageHeader from '@/components/admin/PageHeader';
import DynamicModal from '@/components/admin/DynamicModal.js';

const unflatten = (data) => {
    let result = {};
    for (let key in data) {
        let keys = key.split('.');
        keys.reduce((acc, k, i) => {
            if (i === keys.length - 1) acc[k] = data[key];
            else acc[k] = acc[k] || {};
            return acc[k];
        }, result);
    }
    return result;
};

export default function InventoryPage() {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [apiCategories, setApiCategories] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newItemData, setNewItemData] = useState({ vendorId: '', category: '' });
    const [addLoading, setAddLoading] = useState(false);
    const toast = useToast();

    useEffect(() => { fetchPackages(); fetchCategories(); fetchVendors(); }, []);

    const fetchVendors = async () => {
        try {
            const data = await api.admin.vendors.getAll();
            if (data.success && data.data?.vendors) setVendors(data.data.vendors);
        } catch (error) {}
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            const data = await res.json();
            if (data.success && data.data?.categories) setApiCategories(data.data.categories);
        } catch (error) {
            // failed to load categories
        }
    };

    const fetchPackages = async () => {
        try {
            const data = await api.admin.packages.getAll();
            if (data.success) setPackages(data.data.packages);
        } catch (error) {
            // failed to fetch packages
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (pkg, statusToSet) => {
        try {
            const data = await api.admin.packages.updateStatus(pkg._id, { vendorId: pkg.vendorId, serviceType: pkg.serviceType, status: statusToSet });
            if (data.success) {
                setPackages(prev => prev.map(p => (p._id === pkg._id && p.serviceType === pkg.serviceType) ? { ...p, isActive: statusToSet } : p));
                toast(`Package status updated to ${statusToSet ? 'Active' : 'Offline'}`, "success");
            }
        } catch (error) {
            toast("Failed to update status", "error");
        }
    };

    const handleAddPackageItem = async (e) => {
        e.preventDefault();
        setAddLoading(true);
        try {
            const payload = unflatten(newItemData);
            const res = await api.admin.packages.addItemOnBehalf(payload);
            if (res.success) {
                toast("Item added successfully", "success");
                setIsModalOpen(false);
                setNewItemData({ vendorId: '', category: '' });
                fetchPackages();
            } else {
                toast(res.message || "Failed to add item", "error");
            }
        } catch (error) {
            toast(error.message || "Something went wrong", "error");
        } finally {
            setAddLoading(false);
        }
    };

    // Dynamic Form Fields Builder
    const baseFields = [
        { name: 'vendorId', label: 'Select Vendor', type: 'select', required: true, options: vendors.map(v => ({ label: v.businessName || v.ownerName || 'Unknown Vendor', value: v._id })) },
        { name: 'category', label: 'Service Category', type: 'select', required: true, options: apiCategories.map(c => ({ label: c.name, value: c.slug })) },
    ];

    let categoryFields = [];
    if (newItemData.category) {
        categoryFields = [
            { name: 'title', label: 'Item Title', type: 'text', required: true, placeholder: 'e.g. Deluxe Room, River Rafting 16km' },
            { name: 'slug', label: 'Item Slug', type: 'text', required: true, placeholder: 'e.g. deluxe-room-xyz' },
            { name: 'pricing.basePrice', label: 'Base Price (₹)', type: 'number', required: true, placeholder: '1500' },
            { name: 'location.address', label: 'Address / Location', type: 'text', required: false, placeholder: 'Rishikesh, Uttarakhand' }
        ];

        // Specific overrides based on category
        if (['homestay', 'hotel'].includes(newItemData.category)) {
            categoryFields.push({ name: 'roomType', label: 'Room Type', type: 'text', required: true, placeholder: 'e.g. Deluxe' });
            categoryFields.push({ name: 'availability.total', label: 'Total Rooms', type: 'number', required: true, placeholder: '5' });
        } else if (newItemData.category === 'trekking') {
            categoryFields.push({ name: 'details.difficulty', label: 'Difficulty', type: 'select', options: [{label:'Easy', value:'Easy'}, {label:'Moderate', value:'Moderate'}, {label:'Hard', value:'Hard'}] });
        } else if (newItemData.category === 'vehicle-rental') {
            categoryFields.push({ name: 'vehicleType', label: 'Vehicle Type', type: 'text', placeholder: 'e.g. SUV, Sedan' });
        }
    }

    const packageFields = [...baseFields, ...categoryFields];

    const filteredPackages = packages.filter(pkg => {
        const matchesSearch = (pkg.trekkingName || pkg.roomType || pkg.stretchName || pkg.jumpName || pkg.model || pkg.tourName || '').toLowerCase().includes(searchTerm.toLowerCase()) || (pkg.vendor?.businessName || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'all' || pkg.serviceType === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const columns = [
        {
            header: 'Image', accessor: 'image', getValue: (pkg) => pkg.photos?.[0]?.url || 'No Image', render: (pkg) => (
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#111116] border border-white/10 flex items-center justify-center">
                    {pkg.photos?.[0]?.url ? (
                        <img src={pkg.photos[0].url} alt={getServiceName(pkg)} className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
                    ) : (
                        <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest text-center leading-tight">No<br />Img</span>
                    )}
                </div>
            )
        },
        { header: 'Package Name', accessor: 'name', getValue: (pkg) => getServiceName(pkg), render: (pkg) => <span className="font-bold text-white">{getServiceName(pkg)}</span> },
        { header: 'Type', accessor: 'serviceType', getValue: (pkg) => pkg.serviceType?.replace(/-/g, ' ') || 'Unknown', render: (pkg) => <span className="text-xs uppercase tracking-widest text-indigo-400">{pkg.serviceType?.replace(/-/g, ' ') || 'Unknown'}</span> },
        { header: 'Vendor', accessor: 'vendor', getValue: (pkg) => pkg.vendor?.businessName || 'Unknown Vendor', render: (pkg) => pkg.vendor?.businessName || 'Unknown Vendor' },
        { header: 'Location', accessor: 'location', exportOnly: true, getValue: (pkg) => typeof pkg.location === 'object' ? pkg.location?.address : (pkg.location || 'Location Not Defined'), render: () => null },
        { header: 'Price', accessor: 'price', getValue: (pkg) => Number(getPrice(pkg)), render: (pkg) => <span className="font-mono text-indigo-400">₹{Number(getPrice(pkg)).toLocaleString()}</span> },
        { header: 'Status', accessor: 'isActive', getValue: (pkg) => pkg.isActive ? 'Active' : 'Offline', render: (pkg) => (<span className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-widest ${pkg.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>{pkg.isActive ? 'Active' : 'Offline'}</span>) },
        {
            header: 'Actions', getValue: () => '', render: (pkg) => {
                const locationStr = typeof pkg.location === 'object' ? pkg.location?.address : (pkg.location || 'Location Not Defined');
                return (
                    <div className="flex gap-2 items-center">
                        <div className="w-8 h-8 flex items-center justify-center bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded transition-all cursor-help" title={locationStr}><MapPin size={14} strokeWidth={2.5} /></div>
                        <button onClick={() => toggleStatus(pkg, !pkg.isActive)} className={`w-8 h-8 flex items-center justify-center rounded transition-all ${pkg.isActive ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'}`} title={pkg.isActive ? 'Set Component Offline' : 'Activate Component'}><Power size={14} strokeWidth={2.5} /></button>
                        <Link href={`/admin/packages/item/${pkg._id}`} className="w-8 h-8 flex items-center justify-center bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded transition-all" title="Inspect Node"><ExternalLink size={14} strokeWidth={2.5} /></Link>
                    </div>
                );
            }
        }
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <PageHeader title="All Packages Items" titleBadge={`${packages.length} Items Total`} subtitle="Registered Package Items" icon={PackageIcon} searchQuery={searchTerm} onSearchChange={setSearchTerm} showAction={true} actionLabel="Add Item" actionIcon={Plus} onAction={() => setIsModalOpen(true)} />
            <main className="max-w-[1600px] mx-auto relative z-10">
                <CyberTable data={filteredPackages} columns={columns} loading={loading} loadingText="Fetching Packages Items..." emptyText="No Packages Items found matching criteria." searchable={false} />
            </main>
            
            <DynamicModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title="Add New Package Item" 
                fields={packageFields} 
                formData={newItemData} 
                onChange={setNewItemData} 
                onSubmit={handleAddPackageItem} 
                loading={addLoading} 
                submitText="Deploy Item" 
            />
        </div>
    );
}
