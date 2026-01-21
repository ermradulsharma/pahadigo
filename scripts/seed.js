const mongoose = require('mongoose');
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');

const seed = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/travels_db');
        console.log('MongoDB connected');

        // Create Admin
        const adminEmail = 'admin@travels.com';
        const hashedPassword = await bcrypt.hash('password123', 10);

        let admin = await User.findOne({ email: adminEmail });
        if (!admin) {
            admin = await User.create({
                email: adminEmail,
                phone: '0000000000',
                role: 'admin',
                isVerified: true,
                name: 'Super Admin',
                password: hashedPassword
            });
            console.log('Admin created:', adminEmail);
        } else {
            admin.password = hashedPassword;
            await admin.save();
            console.log('Admin password updated');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seed();
