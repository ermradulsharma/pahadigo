'use client';
import { useState, useEffect } from 'react';

import withAuth from '../../components/withAuth';

function UserDashboard() {
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    // Fetch packages mock
    fetch('/api/user/packages')
      .then(res => res.json())
      .then(data => {
         if(data.packages) setPackages(data.packages);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
           <h1 className="text-2xl font-bold text-gray-900">Travels</h1>
           <div className="space-x-4">
             <a href="#" className="text-gray-600 hover:text-gray-900">My Bookings</a>
             <a href="#" className="text-gray-600 hover:text-gray-900">Profile</a>
           </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-xl font-bold mb-6">Explore Packages</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packages.length > 0 ? (
            packages.map(pkg => (
              <div key={pkg._id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="h-48 bg-gray-200">
                  {/* Image placeholder */}
                  {pkg.images && pkg.images[0] && <img src={pkg.images[0]} alt={pkg.title} className="w-full h-full object-cover"/>}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold">{pkg.title}</h3>
                  <p className="text-gray-500 text-sm mt-1">{pkg.duration}</p>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-indigo-600 font-bold">${pkg.price}</span>
                    <button className="text-sm bg-indigo-600 text-white px-3 py-1 rounded">Book Now</button>
                  </div>
                </div>
              </div>
            ))
          ) : (
             // Empty state / Loading
             [1, 2, 3].map(i => (
               <div key={i} className="bg-white rounded-lg shadow overflow-hidden animate-pulse">
                 <div className="h-48 bg-gray-200"></div>
                 <div className="p-4 space-y-3">
                   <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                   <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                 </div>
               </div>
             ))
          )}
        </div>
      </main>
    </div>
  );
}

export default withAuth(UserDashboard, 'user');
