export const CATEGORY_SLUGS = {
    HOMESTAY: 'homestay',
    HOTEL: 'hotel',
    CAMPING: 'camping',
    TREKKING: 'trekking',
    RAFTING: 'rafting',
    RIVER_RAFTING: 'river-rafting',
    BUNGEE_JUMPING: 'bungee-jumping',
    BIKE_SCOOTER_RENTAL: 'bike-scooter-rental',
    VEHICLE_RENTAL: 'vehicle-rental',
    CHARDHAM_TOUR: 'chardham-tour',
    CUSTOM_TRIP: 'custom-trip',
    SKIING: 'skiing',
    PARAGLIDING: 'paragliding'
};

export const SCHEMA_KEYS = {
    HOMESTAY: 'homestay',
    HOTEL: 'hotel',
    CAMPING: 'camping',
    TREKKING: 'trekking',
    RAFTING: 'rafting',
    BUNGEE_JUMPING: 'bungeeJumping',
    VEHICLE_RENTAL: 'vehicleRental',
    CHARDHAM_TOUR: 'chardhamTour',
    CUSTOM_TRIP: 'customTrip',
    SKIING: 'skiing',
    PARAGLIDING: 'paragliding'
};

export const CATEGORY_TITLES = {
    HOMESTAY: 'Homestay',
    HOTEL: 'Hotel',
    CAMPING: 'Camping',
    TREKKING: 'Trekking',
    RAFTING: 'Rafting',
    RIVER_RAFTING: 'River Rafting',
    BUNGEE_JUMPING: 'Bungee Jumping',
    BIKE_SCOOTER_RENTAL: 'Bike/Scooter Rental',
    VEHICLE_RENTAL: 'Vehicle Rental',
    CHARDHAM_TOUR: 'Chardham Tour',
    CUSTOM_TRIP: 'Custom Trip',
    SKIING: 'Skiing',
    PARAGLIDING: 'Paragliding'
};

export const CATEGORY_MAP = {
    [CATEGORY_SLUGS.HOMESTAY]: SCHEMA_KEYS.HOMESTAY,
    [CATEGORY_SLUGS.HOTEL]: SCHEMA_KEYS.HOTEL,
    [CATEGORY_SLUGS.CAMPING]: SCHEMA_KEYS.CAMPING,
    [CATEGORY_SLUGS.TREKKING]: SCHEMA_KEYS.TREKKING,
    [CATEGORY_SLUGS.RAFTING]: SCHEMA_KEYS.RAFTING,
    [CATEGORY_SLUGS.RIVER_RAFTING]: SCHEMA_KEYS.RAFTING,
    [CATEGORY_SLUGS.BUNGEE_JUMPING]: SCHEMA_KEYS.BUNGEE_JUMPING,
    [CATEGORY_SLUGS.BIKE_SCOOTER_RENTAL]: SCHEMA_KEYS.VEHICLE_RENTAL,
    [CATEGORY_SLUGS.VEHICLE_RENTAL]: SCHEMA_KEYS.VEHICLE_RENTAL,
    [CATEGORY_SLUGS.CHARDHAM_TOUR]: SCHEMA_KEYS.CHARDHAM_TOUR,
    [CATEGORY_SLUGS.CUSTOM_TRIP]: SCHEMA_KEYS.CUSTOM_TRIP,
    [CATEGORY_SLUGS.SKIING]: SCHEMA_KEYS.SKIING,
    [CATEGORY_SLUGS.PARAGLIDING]: SCHEMA_KEYS.PARAGLIDING
};

export default { CATEGORY_MAP, SCHEMA_KEYS, CATEGORY_TITLES, CATEGORY_SLUGS };
