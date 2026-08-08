import { Clock, Mountain, ShieldCheck, Users, Home as HomeIcon, Car } from 'lucide-react';

export default function QuickStatsBar({ service }) {
    if (!service) return null;

    const category = (service.category || service.serviceType || '').toLowerCase();
    
    return (
        <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/40 mb-12 flex flex-wrap items-center justify-around gap-6">

            {/* Hotel & Homestay Stats */}
            {['hotel', 'homestay'].includes(category) && (
                <>
                    {(service.maxAdults || service.maxGuests) && (
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Capacity</p>
                                <p className="text-lg font-black text-gray-900">Up to {service.maxAdults || service.maxGuests} Guests</p>
                            </div>
                        </div>
                    )}
                    <div className="hidden md:block w-px h-12 bg-gray-200"></div>
                    {service.roomType && (
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <HomeIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Room</p>
                                <p className="text-lg font-black text-gray-900">{service.roomType}</p>
                            </div>
                        </div>
                    )}
                    <div className="hidden md:block w-px h-12 bg-gray-200"></div>
                </>
            )}

            {/* Vehicle Rental Stats */}
            {['vehiclerental', 'vehicle_rental', 'bike_scooter_rental'].includes(category) && (
                <>
                    {service.vehicleType && (
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <Car className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Vehicle</p>
                                <p className="text-lg font-black text-gray-900">{service.vehicleType}</p>
                            </div>
                        </div>
                    )}
                    <div className="hidden md:block w-px h-12 bg-gray-200"></div>
                    {service.seatingCapacity && (
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Seats</p>
                                <p className="text-lg font-black text-gray-900">{service.seatingCapacity} Seater</p>
                            </div>
                        </div>
                    )}
                    <div className="hidden md:block w-px h-12 bg-gray-200"></div>
                </>
            )}

            {/* Adventure & Tour Stats (Trekking, Camping, Rafting, Chardham, Custom) */}
            {!['hotel', 'homestay', 'vehiclerental', 'vehicle_rental', 'bike_scooter_rental'].includes(category) && (
                <>
                    {(service.duration || service.details?.duration) && (
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Duration</p>
                                <p className="text-lg font-black text-gray-900">{service.duration || service.details?.duration}</p>
                            </div>
                        </div>
                    )}

                    {(service.difficultyLevel || service.details?.difficulty) && (
                        <>
                            <div className="hidden md:block w-px h-12 bg-gray-200"></div>
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
                                    <Mountain className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Difficulty</p>
                                    <p className="text-lg font-black text-gray-900">{service.difficultyLevel || service.details?.difficulty}</p>
                                </div>
                            </div>
                        </>
                    )}
                    {(service.duration || service.details?.duration || service.difficultyLevel || service.details?.difficulty) && (
                        <div className="hidden md:block w-px h-12 bg-gray-200"></div>
                    )}
                </>
            )}

            {/* Universal Assurance Badge */}
            <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
                    <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Assurance</p>
                    <p className="text-lg font-black text-gray-900">PahadiGo Verified</p>
                </div>
            </div>
        </div>
    );
}
