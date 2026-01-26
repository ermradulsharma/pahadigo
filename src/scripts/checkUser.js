import mongoose from 'mongoose';
import User from '../models/User.js';
import dbConnect from '../config/db.js';

const checkUser = async () => {
    await dbConnect();
    const email = 'admin@pahadigo.com';
    const user = await User.findOne({ email });
    console.log('User found:', user);
    if (user) {
        console.log('Role:', user.role);
    } else {
        console.log('User not found');
    }
    process.exit(0);
};

checkUser();
