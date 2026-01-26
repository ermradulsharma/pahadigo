import User from '../models/User.js';
import bcrypt from 'bcryptjs';

export const seedUsers = async () => {
    try {
        console.log('Seeding Users...');

        const users = [
            {
                name: 'System Admin',
                email: 'admin@pahadigo.com',
                password: await bcrypt.hash('password', 10),
                role: 'admin',
                authProvider: 'local',
                isVerified: true,
                status: 'active',
                phone: '1111111111',
                gender: 'other',
                dateOfBirth: new Date('1990-01-01'),
                address: {
                    line1: 'HQ',
                    city: 'Dehradun',
                    state: 'Uttarakhand',
                    country: 'India',
                    pincode: '248001'
                }
            },
            {
                name: 'Lead Developer',
                email: 'dev@pahadigo.com',
                password: await bcrypt.hash('password', 10),
                role: 'admin', // Developer as admin as requested
                authProvider: 'local',
                isVerified: true,
                status: 'active',
                phone: '2222222222',
                gender: 'male',
                address: {
                    line1: 'Tech Park',
                    city: 'Bangalore',
                    state: 'Karnataka',
                    country: 'India',
                    pincode: '560100'
                }
            },
            {
                name: 'Partner Vendor',
                phone: '9876543210',
                role: 'vendor',
                authProvider: 'phone',
                isVerified: true,
                status: 'active',
                email: 'vendor@pahadigo.com', // Optional but good for record
                gender: 'female',
                address: {
                    line1: 'Market Road',
                    city: 'Manali',
                    state: 'Himachal Pradesh',
                    country: 'India',
                    pincode: '175131'
                },
                rating: {
                    average: 4.5,
                    count: 10
                }
            },
            {
                name: 'Happy Traveller',
                email: 'traveller@gmail.com',
                role: 'traveller',
                authProvider: 'phone',
                isVerified: true,
                status: 'active',
                phone: '9998887776',
                preferences: {
                    language: 'en',
                    notifications: {
                        email: true,
                        sms: false,
                        push: true
                    }
                }
            }
        ];

        await User.insertMany(users);
        console.log('Users seeded successfully.');
        return { count: users.length };
    } catch (error) {
        console.error('Error seeding users:', error);
        throw error;
    }
};
