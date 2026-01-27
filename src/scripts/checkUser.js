import mongoose from 'mongoose';
import User from '../models/User.js';
import dbConnect from '../config/db.js';

const checkUser = async () => {
    await dbConnect();
    const email = 'admin@pahadigo.com';
    const user = await User.findOne({ email });
    if (user) {
    } else {
    }
    process.exit(0);
};

checkUser();
