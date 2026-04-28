// 1. Helper Functions
const randNum = (n) => Math.floor(Math.pow(10, n - 1) + Math.random() * 9 * Math.pow(10, n - 1));
const randChar = () => String.fromCharCode(97 + Math.floor(Math.random() * 26));
const randArr = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randSubArr = (arr, count) => { const shuffled = [...arr].sort(() => 0.5 - Math.random()); return shuffled.slice(0, count); };
const slugify = (text) => { return text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-'); };
const randomDOB = (minAge = 18, maxAge = 60) => {
    const today = new Date();
    const minDate = new Date(today.getFullYear() - maxAge, today.getMonth(), today.getDate());
    const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
    const dob = new Date(minDate.getTime() + Math.random() * (maxDate.getTime() - minDate.getTime()));
    return dob.toISOString().split("T")[0];
}

// 3. First Names (Indian)
const firstNames = ["Rohan", "Siddharth", "Vikram", "Arjun", "Aditya", "Ishaan", "Kabir", "Aryan", "Ananya", "Ishita", "Kavya", "Sana", "Meera", "Riya", "Priyanka", "Deepika"];

// 4. Last Names (Indian)
const lastNames = ["Sharma", "Verma", "Gupta", "Malhotra", "Kapoor", "Rawat", "Negi", "Chauhan", "Bhatt", "Joshi", "Thakur", "Singh", "Bisht", "Pandey"];

// 5. Business Name Prefixes (Location-Based)
const prefixes = ["Himalayan", "Alpine", "Summit", "Everest", "Ganges", "Mystic", "Nomadic", "Highland", "Northern", "BlueSky", "River", "Valley", "Mountain", "Peak", "Eternal", "Golden", "Silver", "Hidden", "Ancient", "Majestic", "Rugged"];

// 6. Business Name Niches (Industry-Specific)
const niches = ["Expeditions", "Tours", "Travels", "Adventures", "Holidays", "Journeys", "Getaways", "Trekkers", "Escapes", "Voyages", "Trails", "Safaris", "Backpackers"];

// 7. Business Name Suffixes (Legal/Geographic)
const suffixes = ["Pvt Ltd", "Group", "India", "Uttarakhand", "Ventures", "Solutions", "International", "Connect", "Specialist"];

// 8. Categories
const categories = ["bike-scooter-rental", "bungee-jumping", "camping", "chardham-tour", "custom-trip", "homestay", "hotel", "rafting", "trekking", "skiing", "paragliding"];

