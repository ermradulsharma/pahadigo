import User from '../../Models/User.js';
import { USER_ROLES, STATUS, AUTH_PROVIDERS, GENDER, SEED_ACCOUNTS, DEFAULTS } from '../../Constants/index.js';

export const seedUsers = async () => {
  try {
    const users = [
      {
        name: `${SEED_ACCOUNTS.SUPER_ADMIN.FIRST_NAME} ${SEED_ACCOUNTS.SUPER_ADMIN.LAST_NAME}`,
        email: SEED_ACCOUNTS.SUPER_ADMIN.EMAIL,
        password: 'password', // Hooks will hash this
        role: USER_ROLES.ADMIN,
        authProvider: AUTH_PROVIDERS.LOCAL,
        isVerified: true,
        status: STATUS.ACTIVE,
        phone: '1111111111',
        gender: GENDER.OTHER,
        dateOfBirth: new Date('1990-01-01'),
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        address: {
          addressLine1: 'Main HQ, Ground Floor',
          addressLine2: 'Civil Lines',
          city: 'Dehradun',
          state: 'Uttarakhand',
          country: 'India',
          pincode: '248001',
          latitude: '30.3165',
          longitude: '78.0322',
          location: { type: 'Point', coordinates: [78.0322, 30.3165] }
        }
      },
      {
        name: `${SEED_ACCOUNTS.DEVELOPER.FIRST_NAME} ${SEED_ACCOUNTS.DEVELOPER.LAST_NAME}`,
        email: SEED_ACCOUNTS.DEVELOPER.EMAIL,
        password: 'password',
        role: USER_ROLES.ADMIN,
        authProvider: AUTH_PROVIDERS.LOCAL,
        isVerified: true,
        status: STATUS.ACTIVE,
        phone: '2222222222',
        gender: GENDER.MALE,
        address: {
          addressLine1: 'Tech Hub V2',
          addressLine2: 'Outer Ring Road',
          city: 'Bangalore',
          state: 'Karnataka',
          country: 'India',
          pincode: '560100',
          latitude: '12.9716',
          longitude: '77.5946',
          location: { type: 'Point', coordinates: [77.5946, 12.9716] }
        }
      },
      {
        // Vendor User
        name: 'Jennifer Boyer',
        email: 'vendor@pahadigo.com',
        phone: '9876543210',
        role: USER_ROLES.VENDOR,
        authProvider: AUTH_PROVIDERS.PHONE,
        isVerified: true,
        isVendorVerified: false,
        status: STATUS.ACTIVE,
        gender: GENDER.FEMALE,
        address: {
          addressLine1: 'Market Road Cross',
          addressLine2: 'Near Mall Road',
          city: 'Manali',
          state: 'Himachal Pradesh',
          country: 'India',
          pincode: '175131',
          latitude: '32.2432',
          longitude: '77.1892',
          location: { type: 'Point', coordinates: [77.1892, 32.2432] }
        },
        rating: { average: 4.5, count: 10 }
      },
      {
        // Traveller User
        name: 'Happy Traveller',
        email: 'traveller@gmail.com',
        role: USER_ROLES.TRAVELLER,
        authProvider: AUTH_PROVIDERS.PHONE,
        isVerified: true,
        status: STATUS.ACTIVE,
        phone: '9998887776',
        preferences: {
          language: 'en',
          notifications: {
            email: true,
            sms: false,
            push: true,
            whatsapp: true
          }
        }
      }
    ];

    // Using loop with create to ensure pre-save hooks (password hashing) are executed
    for (const userData of users) {
      const query = [];
      if (userData.email) query.push({ email: userData.email });
      if (userData.phone) query.push({ phone: userData.phone });

      const existingUser = query.length > 0 ? await User.findOne({ $or: query }) : null;

      if (!existingUser) {
        await User.create(userData);
      }
    }

    return { count: users.length };
  } catch (error) {
    throw error;
  }
};

export default seedUsers;
