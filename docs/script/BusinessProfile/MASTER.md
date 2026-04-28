// 1. Helper Functions
const randNum = (n) => Math.floor(Math.pow(10, n - 1) + Math.random() * 9 * Math.pow(10, n - 1));
const randChar = () => String.fromCharCode(97 + Math.floor(Math.random() * 26));
const randArr = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randSubArr = (arr, count) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};
const slugify = (text) => {
    return text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
};
const randomDOB = (minAge = 18, maxAge = 60) => {
    const today = new Date();
    const minDate = new Date(today.getFullYear() - maxAge, today.getMonth(), today.getDate());
    const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
    const dob = new Date(minDate.getTime() + Math.random() * (maxDate.getTime() - minDate.getTime()));
    return dob.toISOString().split("T")[0];
}

// 2. Generate Indian Phone Number
const prefixes = [98, 99, 97, 96, 95, 94, 88, 89, 87, 86, 85, 81, 77, 78, 79, 70, 72, 73, 63, 62, 64, 69];
const phone = randArr(prefixes) + randNum(8);

// 3. Generate Boolean
const isActive = [true, false];
const boolean = randArr(isActive);

// 4. Generate Dates
const randomDaysAhead = Math.floor(Math.random() * 20) + 5;
const startDate = new Date();
startDate.setDate(startDate.getDate() + randomDaysAhead);
const endDate = new Date(startDate);
endDate.setDate(startDate.getDate() + (Math.floor(Math.random() * 7) + 3));


// 5. Generate Location Data (Verified Indian Cities)
const locations = [
    { state: "Uttarakhand", city: "Rishikesh", zip: "249201", stCode: "05", shortCode: "UK", lat: 30.0869, lng: 78.2676, add1: "Swarg Ashram", add2: "Near Ram Jhula" },
    { state: "Uttarakhand", city: "Mussoorie", zip: "248179", stCode: "05", shortCode: "UK", lat: 30.4599, lng: 78.0664, add1: "Library Chowk", add2: "Near Mall Road" },
    { state: "Uttarakhand", city: "Nainital", zip: "263001", stCode: "05", shortCode: "UK", lat: 29.3910, lng: 79.4545, add1: "Zoo Road", add2: "Near Tallital Bus Stand" },
    { state: "Uttarakhand", city: "Haridwar", zip: "249401", stCode: "05", shortCode: "UK", lat: 29.9457, lng: 78.1642, add1: "Kankhal", add2: "Near Har Ki Pauri" },
    { state: "Himachal Pradesh", city: "Manali", zip: "175131", stCode: "02", shortCode: "HP", lat: 32.2432, lng: 77.1892, add1: "Old Manali", add2: "Near Hadimba Temple" },
    { state: "Himachal Pradesh", city: "Shimla", zip: "171001", stCode: "02", shortCode: "HP", lat: 31.1048, lng: 77.1734, add1: "The Ridge", add2: "Near Mall Road" },
    { state: "Himachal Pradesh", city: "Dharamshala", zip: "176219", stCode: "02", shortCode: "HP", lat: 32.2190, lng: 76.3234, add1: "McLeod Ganj", add2: "Near Dalai Lama Temple" },
    { state: "Himachal Pradesh", city: "Kasol", zip: "175105", stCode: "02", shortCode: "HP", lat: 32.0100, lng: 77.3150, add1: "Main Market", add2: "Parvati Valley" },
    { state: "Uttarakhand", city: "Auli", zip: "246443", stCode: "05", shortCode: "UK", lat: 30.5312, lng: 79.5665, add1: "Ski Resort", add2: "Near Ropeway" },
    { state: "Uttarakhand", city: "Kedarnath", zip: "246445", stCode: "05", shortCode: "UK", lat: 30.7346, lng: 79.0669, add1: "Kedarnath Temple Road", add2: "Near Mandakini River" },
    { state: "Uttarakhand", city: "Badrinath", zip: "246422", stCode: "05", shortCode: "UK", lat: 30.7433, lng: 79.4938, add1: "Temple Marg", add2: "Near Tapt Kund" },
    { state: "Uttarakhand", city: "Gangotri", zip: "249135", stCode: "05", shortCode: "UK", lat: 30.9947, lng: 78.9398, add1: "Gangotri Temple Road", add2: "Near Bhagirathi River" },
    { state: "Himachal Pradesh", city: "Chamba", zip: "176310", stCode: "02", shortCode: "HP", lat: 32.5534, lng: 76.1258, add1: "Chaugan Bazaar", add2: "Near Bhuri Singh Museum" },
    { state: "Himachal Pradesh", city: "Dalhousie", zip: "176304", stCode: "02", shortCode: "HP", lat: 32.5387, lng: 75.9710, add1: "Subhash Chowk", add2: "Near Gandhi Chowk" },
    { state: "Himachal Pradesh", city: "Spiti Valley", zip: "172114", stCode: "02", shortCode: "HP", lat: 32.2461, lng: 78.0349, add1: "Kaza Main Market", add2: "Near Kaza Monastery" },
    { state: "Himachal Pradesh", city: "Bir Billing", zip: "176077", stCode: "02", shortCode: "HP", lat: 32.0468, lng: 76.7176, add1: "Chougan", add2: "Near Paragliding Landing Site" },
    { state: "Himachal Pradesh", city: "Kullu", zip: "175101", stCode: "02", shortCode: "HP", lat: 31.9579, lng: 77.1095, add1: "Akhara Bazaar", add2: "Near Raghunath Temple" },
    { state: "Himachal Pradesh", city: "Jibhi", zip: "175123", stCode: "02", shortCode: "HP", lat: 31.6350, lng: 77.3486, add1: "Jibhi Valley", add2: "Near Jibhi Waterfall" },
    { state: "Uttarakhand", city: "Chopta", zip: "246419", stCode: "05", shortCode: "UK", lat: 30.4851, lng: 79.1748, add1: "Ukhimath Road", add2: "Base of Tungnath" },
    { state: "Uttarakhand", city: "Pangot", zip: "263001", stCode: "05", shortCode: "UK", lat: 29.4184, lng: 79.4262, add1: "Kilbury Road", add2: "Bird Watching Point" },
    { state: "Uttarakhand", city: "Sattal", zip: "263136", stCode: "05", shortCode: "UK", lat: 29.3503, lng: 79.5310, add1: "Sattal Lake Road", add2: "Near 7 Lakes" },
    { state: "Uttarakhand", city: "Binsar", zip: "263628", stCode: "05", shortCode: "UK", lat: 29.7042, lng: 79.7595, add1: "Binsar Wildlife Sanctuary", add2: "Near Zero Point" },
    { state: "Uttarakhand", city: "Munsyari", zip: "262554", stCode: "05", shortCode: "UK", lat: 30.0700, lng: 80.2000, add1: "Munsiyari Main Market", add2: "Near Panchachuli Peaks View" }
];

const loc = randArr(locations);
const address={
    addressLine1: loc.add1,
    addressLine2: loc.add2,
    city: loc.city,
    state: loc.state,
    country: "IN",
    pincode: loc.zip,
    latitude: loc.lat.toString(),
    longitude: loc.lng.toString(),
}

const fullAddress = `${address.addressLine1}, ${address.addressLine2}, ${address.city}, ${address.state}, ${address.country} - ${address.pincode}`;

// 4. Enviroment Variables
pm.environment.set("addressLine1", address.addressLine1);
pm.environment.set("addressLine2", address.addressLine2);
pm.environment.set("city", address.city);
pm.environment.set("state", address.state);
pm.environment.set("country", address.country);
pm.environment.set("zip", address.pincode);
pm.environment.set("latitude", address.latitude);
pm.environment.set("longitude", address.longitude);

pm.environment.set("fullAddress", fullAddress);
pm.environment.set("start_date", startDate.toISOString().split('T')[0]);
pm.environment.set("end_date", endDate.toISOString().split('T')[0]);
pm.environment.set("boolean", boolean);
pm.environment.set("dob", randomDOB());
