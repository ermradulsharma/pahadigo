import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import { loadEnv } from '../../Helpers/env.js';
import connectDB from '../../Config/db.js';
import User from '../../Models/User.js';
import Vendor from '../../Models/Vendor.js';
import { USER_ROLES, STATUS } from '../../Constants/index.js';

const parseArgs = () => {
    const args = process.argv.slice(2);
    const options = { vendors: 5000, users: 10000, batchSize: 500 };
    args.forEach(arg => {
        if (arg.startsWith('--vendors=')) options.vendors = parseInt(arg.split('=')[1], 10);
        if (arg.startsWith('--users=')) options.users = parseInt(arg.split('=')[1], 10);
        if (arg.startsWith('--batchSize=')) options.batchSize = parseInt(arg.split('=')[1], 10);
    });
    return options;
};

const generateUsers = (count, role, startIndex = 0) => {
    const users = [];
    for (let i = 0; i < count; i++) {
        const uniquePhone = `9${(startIndex + i).toString().padStart(9, '0')}`;
        users.push({
            name: faker.person.fullName(),
            email: faker.internet.email(),
            phone: uniquePhone,
            password: 'hashed_password_placeholder', // Skipping actual hash for massive seed speed
            role: role,
            status: STATUS.ACTIVE,
            isVerified: true
        });
    }
    return users;
};

const generateVendors = (users) => {
    return users.map(user => ({
        user: user._id,
        ownerName: user.name,
        businessName: faker.company.name(),
        address: {
            street: faker.location.streetAddress(),
            city: faker.location.city(),
            state: faker.location.state(),
            country: 'India',
            zipCode: faker.location.zipCode(),
            location: {
                type: 'Point',
                coordinates: [faker.location.longitude(), faker.location.latitude()]
            }
        },
        isApproved: true,
        status: STATUS.ACTIVE
    }));
};

const seedMass = async () => {
    try {
        const options = parseArgs();
        console.log(`Starting Mass Seed: ${options.vendors} Vendors, ${options.users} Travellers`);

        loadEnv();
        await connectDB();

        console.log('Clearing existing data (Mass Seed Mode)...');
        await User.deleteMany({ role: { $in: [USER_ROLES.VENDOR, USER_ROLES.TRAVELLER] } });
        await Vendor.deleteMany({});

        // 1. Seed Travellers
        console.log(`Seeding ${options.users} Travellers...`);
        let totalUsersSeeded = 0;
        let globalPhoneIndex = 0;
        for (let i = 0; i < options.users; i += options.batchSize) {
            const batchCount = Math.min(options.batchSize, options.users - i);
            const userBatch = generateUsers(batchCount, USER_ROLES.TRAVELLER, globalPhoneIndex);
            await User.insertMany(userBatch, { lean: true });
            totalUsersSeeded += batchCount;
            globalPhoneIndex += batchCount;
            process.stdout.write(`\rSeeded ${totalUsersSeeded}/${options.users} Travellers`);
        }
        console.log('\nTravellers Seeded.');

        // 2. Seed Vendors
        console.log(`Seeding ${options.vendors} Vendors...`);
        let totalVendorsSeeded = 0;
        for (let i = 0; i < options.vendors; i += options.batchSize) {
            const batchCount = Math.min(options.batchSize, options.vendors - i);
            
            // Create user records for vendors
            const userBatch = generateUsers(batchCount, USER_ROLES.VENDOR, globalPhoneIndex);
            const insertedUsers = await User.insertMany(userBatch, { lean: true });
            
            // Generate corresponding vendor profiles
            const vendorBatch = generateVendors(insertedUsers);
            await Vendor.insertMany(vendorBatch, { lean: true });
            
            totalVendorsSeeded += batchCount;
            globalPhoneIndex += batchCount;
            process.stdout.write(`\rSeeded ${totalVendorsSeeded}/${options.vendors} Vendors`);
        }
        console.log('\nVendors Seeded.');

        console.log('Mass Seeding Completed Successfully.');
        process.exit(0);
    } catch (error) {
        console.error('\nMass Seeding Failed:', error);
        process.exit(1);
    }
};

if (process.env.NODE_ENV !== 'test') {
    seedMass();
}

export { seedMass };
