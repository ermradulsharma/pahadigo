import Link from 'next/link';

export default function Home() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-indigo-600 h-screen max-h-[600px] flex items-center justify-center text-center px-4">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
            Discover Your Next Adventure
          </h1>
          <p className="mt-4 text-xl text-indigo-100">
            Book the best travel packages from top rated vendors.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/user" className="bg-white text-indigo-600 px-8 py-3 rounded-full font-bold shadow hover:bg-gray-100 transition">
              Browse Packages
            </Link>
            <Link href="/vendor" className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full font-bold hover:bg-white hover:text-indigo-600 transition">
              Become a Vendor
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Popular Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {['Adventure', 'Relaxation', 'Honeymoon', 'Cultural'].map(cat => (
             <div key={cat} className="h-32 bg-gray-100 rounded-lg flex items-center justify-center text-xl font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition cursor-pointer">
               {cat}
             </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-gray-50">
         <div className="max-w-7xl mx-auto px-4">
           <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
           <div className="grid md:grid-cols-3 gap-8 text-center">
             <div>
               <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold mb-4">1</div>
               <h3 className="text-xl font-bold mb-2">Browse Packages</h3>
               <p className="text-gray-600">Find the perfect trip from hundreds of options.</p>
             </div>
             <div>
               <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold mb-4">2</div>
               <h3 className="text-xl font-bold mb-2">Book Securely</h3>
               <p className="text-gray-600">Pay safely and get instant confirmation.</p>
             </div>
             <div>
               <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold mb-4">3</div>
               <h3 className="text-xl font-bold mb-2">Enjoy Your Trip</h3>
               <p className="text-gray-600">Experience the world with peace of mind.</p>
             </div>
           </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 text-center">
        <p>&copy; 2024 Travels. All rights reserved.</p>
      </footer>
    </div>
  );
}
