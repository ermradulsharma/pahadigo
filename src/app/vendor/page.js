'use client';
import { useState, useEffect } from 'react';

import withAuth from '../../components/withAuth';

function VendorDashboard() {
  const [activeTab, setActiveTab] = useState('packages');
  const [profile, setProfile] = useState(null);

  const getAuth = () => ({ 'Authorization': 'Bearer ' + localStorage.getItem('token') });

  // Fetch initial profile data if needed? 
  // currently we don't have a GET /vendor/profile, but we can assume we might add it or just submit

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <aside className="w-64 bg-white border-r flex flex-col shadow-sm">
        <div className="p-6 text-2xl font-bold text-indigo-700 tracking-tight">VendorPortal</div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavButton name="packages" label="My Packages" active={activeTab} set={setActiveTab} />
          <NavButton name="bookings" label="Bookings" active={activeTab} set={setActiveTab} />
          <NavButton name="profile" label="Profile & Bank" active={activeTab} set={setActiveTab} />
        </nav>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 capitalize">{activeTab}</h1>
          {activeTab === 'packages' && (
            <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 shadow-md transition-all">
              Create Package
            </button>
          )}
        </header>

        {activeTab === 'packages' && <PackagesList />}
        {activeTab === 'bookings' && <BookingsList />}
        {activeTab === 'profile' && <ProfileSettings getAuth={getAuth} />}
      </main>
    </div>
  );
}

function NavButton({ name, label, active, set }) {
  const isActive = active === name;
  return (
    <button
      onClick={() => set(name)}
      className={`w-full text-left py-2.5 px-4 rounded-lg transition-all duration-200 ${isActive ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-100 hover:pl-5'}`}
    >
      {label}
    </button>
  );
}

function PackagesList() {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-500">
      <p>No packages created yet. Click Create Package to start.</p>
    </div>
  );
}

function BookingsList() {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-500">
      <p>No bookings received yet.</p>
    </div>
  );
}

function ProfileSettings({ getAuth }) {
  const [form, setForm] = useState({
    businessName: '',
    category: 'Travel Agency',
    description: '',
    address: '',
    bankDetails: {
      accountHolder: '',
      accountNumber: '',
      ifscCode: '',
      bankName: ''
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/vendor/profile', {
        method: 'POST',
        headers: getAuth(),
        body: JSON.stringify(form)
      });
      if (res.ok) alert('Profile updated successfully!');
      else alert('Failed to update profile');
    } catch (err) {
      console.error(err);
      alert('Error updating profile');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-8 max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Business Info */}
        <section>
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Business Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
              <input type="text" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={form.businessName} onChange={e => setForm({ ...form, businessName: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select className="w-full border rounded-lg p-2.5 bg-white"
                value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option>Travel Agency</option>
                <option>Tour Guide</option>
                <option>Hotel</option>
                <option>Transport</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" rows="3"
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}></textarea>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input type="text" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>
        </section>

        {/* Bank Info */}
        <section>
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Bank Details (For Payouts)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
              <input type="text" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={form.bankDetails.accountHolder}
                onChange={e => setForm({ ...form, bankDetails: { ...form.bankDetails, accountHolder: e.target.value } })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
              <input type="text" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={form.bankDetails.accountNumber}
                onChange={e => setForm({ ...form, bankDetails: { ...form.bankDetails, accountNumber: e.target.value } })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
              <input type="text" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={form.bankDetails.ifscCode}
                onChange={e => setForm({ ...form, bankDetails: { ...form.bankDetails, ifscCode: e.target.value } })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
              <input type="text" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={form.bankDetails.bankName}
                onChange={e => setForm({ ...form, bankDetails: { ...form.bankDetails, bankName: e.target.value } })} />
            </div>
          </div>
        </section>

        <div className="flex justify-end pt-4">
          <button type="submit" className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-indigo-700 shadow-lg transition-transform hover:-translate-y-0.5">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

export default withAuth(VendorDashboard, 'vendor');
