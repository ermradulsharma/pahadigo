import Policy from '../models/Policy.js';

const defaultPolicies = [
    // Vendor Policies
    {
        target: 'vendor',
        type: 'privacy_policy',
        content: '<h1>Privacy Policy for Vendors</h1><p>We take your privacy seriously. This policy describes how we handle vendor data...</p>'
    },
    {
        target: 'vendor',
        type: 'terms_conditions',
        content: '<h1>Terms and Conditions for Vendors</h1><p>By registering as a vendor, you agree to the following terms...</p>'
    },
    // Traveller Policies
    {
        target: 'traveller',
        type: 'privacy_policy',
        content: '<h1>Privacy Policy for Travellers</h1><p>Your privacy is important. Here is how we protect traveller data...</p>'
    },
    {
        target: 'traveller',
        type: 'terms_conditions',
        content: '<h1>Terms and Conditions for Travellers</h1><p>As a traveller, your use of this platform is subject to these terms...</p>'
    },
    {
        target: 'traveller',
        type: 'refund_policy',
        content: '<h1>Refund Policy for Travellers</h1><p>Travellers are entitled to refunds under the following conditions...</p>'
    },
    {
        target: 'traveller',
        type: 'cancellation_policy',
        content: '<h1>Cancellation Policy for Travellers</h1><p>Bookings can be cancelled based on the following timeline...</p>'
    }
];

export const seedPolicies = async () => {
    try {
        console.log('Seeding policies...');
        const operations = defaultPolicies.map(p => ({
            updateOne: {
                filter: { target: p.target, type: p.type },
                update: { $setOnInsert: p },
                upsert: true
            }
        }));

        const result = await Policy.bulkWrite(operations);
        return {
            msg: 'Policies seeded successfully',
            matched: result.matchedCount,
            upserted: result.upsertedCount
        };
    } catch (error) {
        console.error('Policy Seeding Error:', error);
        throw error;
    }
};
