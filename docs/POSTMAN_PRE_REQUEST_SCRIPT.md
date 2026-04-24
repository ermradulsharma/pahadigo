// =============================================================================
// POSTMAN PRE-REQUEST SCRIPT (Collection Level)
// =============================================================================
// HOW TO USE:
// 1. Copy this entire script.
// 2. Open your Postman Collection -> Click 'Pre-request Script' tab.
// 3. Paste the script there.
// 4. In your request bodies, use {{variableName}} (e.g., {{businessName}}).
// 5. To REUSE data across requests (e.g., Create then Get), set an environment 
//    variable 'lock_data' to 'true' in the first request's Tests script.
// =============================================================================

// Check if data is locked to prevent regeneration during sequential requests
if (pm.environment.get("lock_data") === "true") {
    console.log("Data is locked. Skipping generation.");
} else {
    // -----------------------------------------------------------------------------
    // 1. HELPER FUNCTIONS
    // -----------------------------------------------------------------------------

    /**
     * Generates a highly realistic Indian mobile number using valid operator prefixes.
     */
    const genGenuinePhone = () => {
        const prefixes = [
            "98", "99", "97", "96", "95", "94", // Classic Airtel/Vodafone/BSNL
            "88", "89", "87", "86", "85", "81", // More recent
            "77", "78", "79", "70", "72", "73", // Jio/Idea
            "63", "62", "64", "69"              // Newest ranges
        ];
        const prefix = randArr(prefixes);
        const remainingDigits = Math.floor(Math.random() * 90000000 + 10000000).toString().substring(0, 8);
        return prefix + remainingDigits;
    };

    const randNum = (n) => Math.floor(Math.pow(10, n - 1) + Math.random() * 9 * Math.pow(10, n - 1));
    const randChar = () => String.fromCharCode(97 + Math.floor(Math.random() * 26));
    const randArr = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const randSubArr = (arr, count) => {
        const shuffled = [...arr].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    };

    const slugify = (text) => { 
        return text.toString().toLowerCase().trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-');
    };

    const randomDOB = (minAge = 18, maxAge = 60) => {
        const today = new Date();
        const minDate = new Date(today.getFullYear() - maxAge, today.getMonth(), today.getDate());
        const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
        const dob = new Date(minDate.getTime() + Math.random() * (maxDate.getTime() - minDate.getTime()));
        return dob.toISOString().split("T")[0];
    }

    // -----------------------------------------------------------------------------
    // 2. LOCATION DATA (Verified Indian Cities)
    // -----------------------------------------------------------------------------
    const locations = [
      { state: "Uttarakhand", city: "Rishikesh", zip: "249201", stCode: "05", shortCode: "UK", lat: 30.0869, lng: 78.2676, add1: "Swarg Ashram", add2: "Near Ram Jhula" },
      { state: "Uttarakhand", city: "Mussoorie", zip: "248179", stCode: "05", shortCode: "UK", lat: 30.4599, lng: 78.0664, add1: "Library Chowk", add2: "Near Mall Road" },
      { state: "Uttarakhand", city: "Nainital", zip: "263001", stCode: "05", shortCode: "UK", lat: 29.3910, lng: 79.4545, add1: "Zoo Road", add2: "Near Tallital Bus Stand" },
      { state: "Uttarakhand", city: "Haridwar", zip: "249401", stCode: "05", shortCode: "UK", lat: 29.9457, lng: 78.1642, add1: "Kankhal", add2: "Near Har Ki Pauri" },
      { state: "Himachal Pradesh", city: "Manali", zip: "175131", stCode: "02", shortCode: "HP", lat: 32.2432, lng: 77.1892, add1: "Old Manali", add2: "Near Hadimba Temple" },
      { state: "Himachal Pradesh", city: "Shimla", zip: "171001", stCode: "02", shortCode: "HP", lat: 31.1048, lng: 77.1734, add1: "The Ridge", add2: "Near Mall Road" },
      { state: "Himachal Pradesh", city: "Dharamshala", zip: "176219", stCode: "02", shortCode: "HP", lat: 32.2190, lng: 76.3234, add1: "McLeod Ganj", add2: "Near Dalai Lama Temple" },
      { state: "Himachal Pradesh", city: "Kasol", zip: "175105", stCode: "02", shortCode: "HP", lat: 32.0100, lng: 77.3150, add1: "Main Market", add2: "Parvati Valley" },
    ];

    const loc = randArr(locations);
    const address = {
        addressLine1: loc.add1,
        addressLine2: loc.add2,
        city: loc.city,
        state: loc.state,
        country: "IN",
        pincode: loc.zip,
        latitude: loc.lat.toString(),
        longitude: loc.lng.toString(),
    }

    // -----------------------------------------------------------------------------
    // 3. GENUINE IDENTITY DATA
    // -----------------------------------------------------------------------------
    const firstNames = ["Rohan", "Siddharth", "Vikram", "Arjun", "Aditya", "Ishaan", "Kabir", "Aryan", "Ananya", "Ishita", "Kavya", "Sana", "Meera", "Riya", "Priyanka", "Deepika"];
    const lastNames = ["Sharma", "Verma", "Gupta", "Malhotra", "Kapoor", "Rawat", "Negi", "Chauhan", "Bhatt", "Joshi", "Thakur", "Singh", "Bisht", "Pandey"];

    const selectedFirstName = randArr(firstNames);
    const selectedLastName = randArr(lastNames);
    const fullName = `${selectedFirstName} ${selectedLastName}`;
    const username = `${selectedFirstName.toLowerCase()}${selectedLastName.toLowerCase()}${randNum(3)}`;
    const email = `${username}@gmail.com`;
    const personalNumber = genGenuinePhone();

    const personalIdentity = {
        personalPan: Array.from({ length: 3 }, randChar).join('').toUpperCase() + "P" + randChar().toUpperCase() + randNum(4) + randChar().toUpperCase(),
        passportNumber: randChar().toUpperCase() + randNum(7),
    }

    // -----------------------------------------------------------------------------
    // 4. BUSINESS LOGIC
    // -----------------------------------------------------------------------------
    const prefixes = ["Himalayan", "Alpine", "Summit", "Everest", "Ganges", "Mystic", "Nomadic", "Highland", "Northern", "BlueSky", "River", "Valley", "Mountain", "Peak", "Eternal", "Golden", "Silver", "Hidden", "Ancient", "Majestic", "Rugged"];
    const niches = ["Expeditions", "Tours", "Travels", "Adventures", "Holidays", "Journeys", "Getaways", "Trekkers", "Escapes", "Voyages", "Trails", "Safaris", "Backpackers"];
    const suffixes = ["Pvt Ltd", "Group", "India", "Uttarakhand", "Ventures", "Solutions", "International", "Connect", "Specialist"];

    const businessName = `${randArr(prefixes)} ${randArr(niches)} ${randArr(suffixes)}`;
    const businessNumber = genGenuinePhone();
    const website = `www.${slugify(businessName)}.com`;
    const businessEmail = `info@${slugify(businessName)}.com`;

    const categories = ["bike-scooter-rental", "bungee-jumping", "camping", "chardham-tour", "custom-trip", "homestay", "hotel", "rafting", "trekking", "skiing", "paragliding"];

    // Construct a genuine 'About' text based on location and categories
    const categoryText = "various adventure and hospitality services";
    const businessAbout = `${businessName} is a verified travel agency based in ${loc.city}, ${loc.state}. We offer a complete range of services including ${categories.slice(0, 3).join(", ")} and more, ensuring a safe and memorable Himalayan experience for all travelers.`;

    const businessRegistration = `UDYAM-${loc.shortCode}-${loc.stCode}-${randNum(7)}`;
    const businessPan = Array.from({ length: 3 }, randChar).join('').toUpperCase() + "C" + randChar().toUpperCase() + randNum(4) + randChar().toUpperCase();
    const gstNumber = loc.stCode + businessPan + "1Z" + Math.floor(Math.random() * 9);

    const businessDetails = {
        ownerName: fullName,
        businessName: businessName,
        businessNumber: businessNumber,
        businessRegistration: businessRegistration,
        businessAbout: businessAbout,
        businessCategory: categories, // Using ALL categories
        website: website,
        email: businessEmail
    }

    // -----------------------------------------------------------------------------
    // 5. SET POSTMAN VARIABLES
    // -----------------------------------------------------------------------------
    
    // Environment Variables (Mapped to user's {{variable}} placeholders)
    pm.environment.set("ownerName", fullName);
    pm.environment.set("profileType", "business");
    pm.environment.set("personalMobile", personalNumber); // Mapped from {{personalMobile}}
    pm.environment.set("personalPanCard", personalIdentity.personalPan);
    pm.environment.set("personalAbout", `I am ${fullName}, a dedicated travel expert with years of experience in ${loc.state} tourism.`);

    pm.environment.set("businessName", businessName);
    pm.environment.set("businessNumber", businessNumber);
    pm.environment.set("businessRegistrationNumber", businessRegistration); // Mapped from {{businessRegistrationNumber}}
    pm.environment.set("gstNumber", gstNumber);
    pm.environment.set("businessAbout", businessAbout);

    // Business Categories (Includes ALL categories as requested)
    categories.forEach((cat, index) => {
        pm.environment.set(`businessCategory[${index}]`, cat);
    });

    // Address (Mapped to user's {{variable}} placeholders)
    pm.environment.set("addressLine1", address.addressLine1);
    pm.environment.set("addressLine2", address.addressLine2);
    pm.environment.set("city", address.city);
    pm.environment.set("state", address.state);
    pm.environment.set("country", address.country);
    pm.environment.set("zip", address.pincode);
    pm.environment.set("latitude", address.latitude);
    pm.environment.set("longitude", address.longitude);

    // --- ALIASES FOR COLLECTION COMPATIBILITY ---
    // Some requests in the collection use different placeholder names
    pm.environment.set("phone", personalNumber);           // Alias for {{phone}}
    pm.environment.set("panNumber", personalIdentity.personalPan); // Alias for {{panNumber}}
    pm.environment.set("lat", address.latitude);           // Alias for {{lat}}
    pm.environment.set("lng", address.longitude);          // Alias for {{lng}}
    pm.environment.set("businessRegistrationNumber", businessRegistration); // Alias for {{businessRegistrationNumber}}

    // --- ADDITIONAL IDENTITY FIELDS ---
    pm.environment.set("username", username);
    pm.environment.set("email", email);
    pm.environment.set("gender", randArr(["male", "female", "other"]));
    pm.environment.set("designation", randArr(["Tour Manager", "Adventure Guide", "Trek Leader"]));
    pm.environment.set("relationship", randArr(["Father", "Mother", "Brother", "Spouse"]));
    pm.environment.set("dateOfBirth", randomDOB());

    // --- BANK DETAILS ---
    const banks = [
        { name: "HDFC Bank", code: "HDFC" },
        { name: "ICICI Bank", code: "ICIC" },
        { name: "State Bank of India", code: "SBIN" }
    ];
    const bank = randArr(banks);
    pm.environment.set("bankName", bank.name);
    pm.environment.set("bankAccount", (Math.floor(Math.pow(10, 11) + Math.random() * 9 * Math.pow(10, 11))).toString());
    pm.environment.set("ifscCode", `${bank.code}0${Math.floor(100000 + Math.random() * 900000)}`);

    // --- DATES ---
    const randomDaysAhead = Math.floor(Math.random() * 20) + 5;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + randomDaysAhead);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + (Math.floor(Math.random() * 7) + 3));

    pm.environment.set("start_date", startDate.toISOString().split('T')[0]);
    pm.environment.set("end_date", endDate.toISOString().split('T')[0]);

    // --- SOCIAL & MAPS ---
    pm.environment.set("website", website);
    pm.environment.set("whatsapp", `https://wa.me/91${personalNumber}`);
    pm.environment.set("map", `https://maps.google.com/?q=${loc.city}`);
    pm.environment.set("linkedin", `https://www.linkedin.com/in/${username}`);
    pm.environment.set("instagram", `https://instagram.com/${username}`);
}
