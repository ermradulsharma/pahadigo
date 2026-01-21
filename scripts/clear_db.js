const mongoose = require('mongoose');
const path = require('path');

// Models
const User = require('../src/models/User');
const Vendor = require('../src/models/Vendor');
const Package = require('../src/models/Package');
const Booking = require('../src/models/Booking');

// Connection String (Hardcoded for safety/simplicity in script)
const MONGO_URI = 'mongodb://localhost:27017/travels_db';

const clearDatabase = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB Connected...');

        console.log('Clearing Users...');
        await User.deleteMany({});
        
        console.log('Clearing Vendors...');
        await Vendor.deleteMany({});

        console.log('Clearing Packages...');
        await Package.deleteMany({}); // Assuming Package model exists
        
        console.log('Clearing Bookings...');
        await Booking.deleteMany({}); // Assuming Booking model exists

        console.log('Database Cleared Successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error clearing database:', err);
        process.exit(1);
    }
};

clearDatabase();
