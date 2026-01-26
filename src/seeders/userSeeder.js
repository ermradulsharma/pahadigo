import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { USER_ROLES, USER_STATUS, AUTH_PROVIDERS, GENDER, SEED_ACCOUNTS } from '../constants/index.js';

export const seedUsers = async () => {
    try {
        const users = [
            {
                name: `${SEED_ACCOUNTS.SUPER_ADMIN.FIRST_NAME} ${SEED_ACCOUNTS.SUPER_ADMIN.LAST_NAME}`,
                email: SEED_ACCOUNTS.SUPER_ADMIN.EMAIL,
                password: await bcrypt.hash('password', 10),
                role: USER_ROLES.ADMIN,
                authProvider: AUTH_PROVIDERS.LOCAL,
                isVerified: true,
                status: USER_STATUS.ACTIVE,
                phone: '1111111111',
                gender: GENDER.OTHER,
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
                name: `${SEED_ACCOUNTS.DEVELOPER.FIRST_NAME} ${SEED_ACCOUNTS.DEVELOPER.LAST_NAME}`,
                email: SEED_ACCOUNTS.DEVELOPER.EMAIL,
                password: await bcrypt.hash('password', 10),
                role: USER_ROLES.ADMIN, // Developer as admin as requested
                authProvider: AUTH_PROVIDERS.LOCAL,
                isVerified: true,
                status: USER_STATUS.ACTIVE,
                phone: '2222222222',
                gender: GENDER.MALE,
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
                role: USER_ROLES.VENDOR,
                authProvider: AUTH_PROVIDERS.PHONE,
                isVerified: true,
                status: USER_STATUS.ACTIVE,
                email: 'vendor@pahadigo.com', // Optional but good for record
                gender: GENDER.FEMALE,
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
                role: USER_ROLES.TRAVELLER,
                authProvider: AUTH_PROVIDERS.PHONE,
                isVerified: true,
                status: USER_STATUS.ACTIVE,
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
        return { count: users.length };
    } catch (error) {
        throw error;
    }
};
