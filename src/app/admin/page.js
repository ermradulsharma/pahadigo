'use client';
import { useEffect, useState } from 'react';
import withAuth from '../../components/withAuth';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({ users: 0, vendors: 0, bookings: 0, revenue: 0 });
  const [bookings, setBookings] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // For Package Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [pkgForm, setPkgForm] = useState({ title: '', description: '', price: '', duration: '' });

  // Fetch helpers
  const getAuth = () => ({ 'Authorization': 'Bearer ' + localStorage.getItem('token') });

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'bookings') fetchBookings();
    if (activeTab === 'vendors') fetchVendors();
    if (activeTab === 'payments') fetchHistory();
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', { headers: getAuth() });
      if (res.ok) setStats((await res.json()));
    } catch (e) { console.error(e); }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/bookings', { headers: getAuth() });
      if (res.ok) setBookings((await res.json()).bookings);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/vendors', { headers: getAuth() });
      if (res.ok) setVendors((await res.json()).vendors);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  
  const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/payment-history', { headers: getAuth() });
        if (res.ok) setHistory((await res.json()).history);
      } catch (e) { console.error(e); }
      setLoading(false);
  };

  const approveVendor = async (id) => {
    await fetch('/api/admin/approve-vendor', {
      method: 'POST',
      headers: getAuth(),
      body: JSON.stringify({ vendorId: id })
    });
    fetchVendors();
  };

  const markPayout = async (bookingId) => {
    await fetch('/api/admin/payout', {
      method: 'POST',
      headers: getAuth(),
      body: JSON.stringify({ bookingId })
    });
    fetchBookings();
  };

  const refundBooking = async (bookingId) => {
      if(!confirm('Are you sure you want to refund this booking? This action cannot be undone.')) return;
      await fetch('/api/admin/refund', {
          method: 'POST',
          headers: getAuth(),
          body: JSON.stringify({ bookingId })
      });
      fetchBookings();
      fetchStats(); // Update revenue stats
  };

  const handleCreatePackage = async (e) => {
    e.preventDefault();
    if (!selectedVendor) return;
    
    await fetch('/api/admin/add-package', {
       method: 'POST',
       headers: getAuth(),
       body: JSON.stringify({ vendorId: selectedVendor, ...pkgForm })
    });
    setShowModal(false);
    setPkgForm({ title: '', description: '', price: '', duration: '' });
    alert('Package added successfully');
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-lg">
        <div className="p-6 text-2xl font-bold tracking-wide border-b border-slate-800">AdminPanel</div>
        <nav className="flex-1 px-4 space-y-3 mt-6">
          <TabButton name="dashboard" label="Dashboard" active={activeTab} set={setActiveTab} />
          <TabButton name="bookings" label="Bookings & Refunds" active={activeTab} set={setActiveTab} />
          <TabButton name="vendors" label="Vendor Management" active={activeTab} set={setActiveTab} />
          <TabButton name="payments" label="Payment History" active={activeTab} set={setActiveTab} />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white shadow p-6 mb-6">
           <h1 className="text-2xl font-bold text-gray-800 capitalize">{activeTab.replace('-', ' ')} Overview</h1>
        </header>
        
        <div className="px-8 pb-8">
          {activeTab === 'dashboard' && <StatsView stats={stats} />}
          {activeTab === 'bookings' && <BookingsView bookings={bookings} loading={loading} markPayout={markPayout} refundBooking={refundBooking} />}
          {activeTab === 'vendors' && (
             <VendorsView 
               vendors={vendors} 
               loading={loading} 
               onApprove={approveVendor} 
               onAddPackage={(vid) => { setSelectedVendor(vid); setShowModal(true); }} 
             />
          )}
          {activeTab === 'payments' && <HistoryView history={history} loading={loading} />}
        </div>
      </main>

      {/* Add Package Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
           <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Add Package for Vendor</h3>
              <form onSubmit={handleCreatePackage} className="space-y-4">
                <input placeholder="Title" className="w-full border p-2 rounded" 
                  value={pkgForm.title} onChange={e => setPkgForm({...pkgForm, title: e.target.value})} required />
                <textarea placeholder="Description" className="w-full border p-2 rounded" rows="3"
                  value={pkgForm.description} onChange={e => setPkgForm({...pkgForm, description: e.target.value})} required />
                <input type="number" placeholder="Price" className="w-full border p-2 rounded" 
                  value={pkgForm.price} onChange={e => setPkgForm({...pkgForm, price: e.target.value})} required />
                <input placeholder="Duration (e.g. 3 Days)" className="w-full border p-2 rounded" 
                  value={pkgForm.duration} onChange={e => setPkgForm({...pkgForm, duration: e.target.value})} required />
                
                <div className="flex justify-end gap-2 mt-4">
                   <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                   <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">create</button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ name, label, active, set }) {
  const isActive = active === name;
  return (
    <button 
      onClick={() => set(name)}
      className={`w-full text-left py-3 px-4 rounded transition-all duration-200 ${isActive ? 'bg-indigo-600 shadow-lg' : 'hover:bg-slate-800 text-gray-300'}`}
    >
      {label}
    </button>
  );
}

function StatsView({ stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <StatCard title="Total Users" value={stats.users} color="bg-gradient-to-r from-blue-500 to-blue-600" />
      <StatCard title="Active Vendors" value={stats.vendors} color="bg-gradient-to-r from-green-500 to-green-600" />
      <StatCard title="Bookings" value={stats.bookings} color="bg-gradient-to-r from-purple-500 to-purple-600" />
      <StatCard title="Revenue" value={`$${stats.revenue}`} color="bg-gradient-to-r from-amber-500 to-amber-600" />
    </div>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div className={`p-6 rounded-xl shadow-lg text-white ${color}`}>
      <h3 className="text-sm font-medium opacity-80 uppercase tracking-wider">{title}</h3>
      <p className="text-4xl font-bold mt-2">{value}</p>
    </div>
  );
}

function BookingsView({ bookings, loading, markPayout, refundBooking }) {
  if (loading) return <div className="text-center py-10">Loading...</div>;
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
       <table className="w-full text-left">
          <thead className="bg-gray-100 border-b">
             <tr>
               <th className="p-4">User</th>
               <th className="p-4">Package</th>
               <th className="p-4">Price</th>
               <th className="p-4">Status</th>
               <th className="p-4">Payout</th>
               <th className="p-4">Action</th>
             </tr>
          </thead>
          <tbody className="divide-y">
            {bookings.map(b => (
              <tr key={b._id} className="hover:bg-gray-50">
                 <td className="p-4">
                    <div className="font-bold">{b.user?.name || 'Guest'}</div>
                    <div className="text-xs text-gray-500">{b.user?.email}</div>
                 </td>
                 <td className="p-4">
                    <div>{b.package?.title}</div>
                    <div className="text-xs text-gray-500">by {b.package?.vendor?.businessName}</div>
                 </td>
                 <td className="p-4 font-bold text-green-600">${b.totalPrice}</td>
                 <td className="p-4">
                    {b.refundStatus === 'refunded' ? (
                         <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">Refunded</span>
                    ) : (
                        <span className={`px-2 py-1 rounded text-xs ${b.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {b.paymentStatus}
                        </span>
                    )}
                 </td>
                 <td className="p-4">
                   {b.refundStatus === 'refunded' ? (
                       <span className="text-gray-400 text-sm">N/A</span>
                   ) : (
                       <span className={`px-2 py-1 rounded text-xs ${b.payoutStatus === 'paid' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                         {b.payoutStatus}
                       </span>
                   )}
                 </td>
                 <td className="p-4 flex gap-2">
                    {b.paymentStatus === 'paid' && b.refundStatus !== 'refunded' && (
                        <>
                            {b.payoutStatus !== 'paid' && (
                                <button onClick={() => markPayout(b._id)} className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 shadow">
                                    Payout
                                </button>
                            )}
                            <button onClick={() => refundBooking(b._id)} className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 shadow">
                                Refund
                            </button>
                        </>
                    )}
                    {b.payoutStatus === 'paid' && <span className="text-green-600 text-sm font-bold">Paid Out</span>}
                 </td>
              </tr>
            ))}
          </tbody>
       </table>
       {bookings.length === 0 && <div className="p-8 text-center text-gray-500">No bookings found.</div>}
    </div>
  );
}

function VendorsView({ vendors, loading, onApprove, onAddPackage }) {
  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
       <table className="w-full text-left">
          <thead className="bg-gray-100 border-b">
             <tr>
               <th className="p-4">Business</th>
               <th className="p-4">Contact</th>
               <th className="p-4">Status</th>
               <th className="p-4">Bank Details</th>
               <th className="p-4">Actions</th>
             </tr>
          </thead>
          <tbody className="divide-y">
             {vendors.map(v => (
               <tr key={v._id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium">{v.businessName}</td>
                  <td className="p-4 text-sm">
                     <div>{v.user?.email}</div>
                     <div>{v.user?.phone}</div>
                  </td>
                  <td className="p-4">
                     {v.isApproved ? (
                       <span className="text-green-600 font-bold text-sm">Approved</span>
                     ) : (
                       <span className="text-yellow-600 font-bold text-sm">Pending</span>
                     )}
                  </td>
                   <td className="p-4 text-xs text-gray-500">
                     {v.bankDetails?.accountNumber ? (
                       <>
                         <div>Acc: {v.bankDetails.accountNumber}</div>
                         <div>IFSC: {v.bankDetails.ifscCode}</div>
                       </>
                     ) : 'Not Provided'}
                   </td>
                  <td className="p-4 flex gap-2">
                     {!v.isApproved && (
                       <button onClick={() => onApprove(v._id)} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                         Approve
                       </button>
                     )}
                     {v.isApproved && (
                        <button onClick={() => onAddPackage(v._id)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                          Add Pkg
                        </button>
                     )}
                  </td>
               </tr>
             ))}
          </tbody>
       </table>
    </div>
  );
}

function HistoryView({ history, loading }) {
    if (loading) return <div className="text-center py-10">Loading...</div>;
  
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
         <table className="w-full text-left">
            <thead className="bg-gray-100 border-b">
               <tr>
                 <th className="p-4">Date</th>
                 <th className="p-4">Description</th>
                 <th className="p-4">Type</th>
                 <th className="p-4">Amount</th>
                 <th className="p-4">Status</th>
               </tr>
            </thead>
            <tbody className="divide-y hidden md:table-row-group">
               {history.map(h => (
                   <tr key={h.id} className="hover:bg-gray-50">
                       <td className="p-4 text-sm text-gray-500">{new Date(h.date).toLocaleDateString()}</td>
                       <td className="p-4 font-medium">{h.description}</td>
                       <td className="p-4">
                           <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${h.type === 'inflow' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                               {h.type}
                           </span>
                       </td>
                       <td className={`p-4 font-bold ${h.type === 'inflow' ? 'text-green-600' : 'text-red-600'}`}>
                           {h.type === 'inflow' ? '+' : '-'}${h.amount}
                       </td>
                       <td className="p-4 text-sm capitalize">{h.status}</td>
                   </tr>
               ))}
            </tbody>
         </table>
         {history.length === 0 && <div className="p-8 text-center text-gray-500">No transaction history found.</div>}
      </div>
    );
  }

export default withAuth(AdminDashboard, 'admin');
