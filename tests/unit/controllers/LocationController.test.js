import LocationController from '../../../src/core/Http/Controllers/LocationController.js';
import Country from '../../../src/core/Models/Country.js';
import State from '../../../src/core/Models/State.js';
import { createMockReq, cleanDatabase, generateId } from '../../helpers/testUtils.js';
import { HTTP_STATUS, USER_ROLES } from '../../../src/core/Constants/index.js';
import { jest } from '@jest/globals';
import mongoose from 'mongoose';

describe('Industry Standard: Geo-Context API', () => {
    let adminId;

    beforeEach(async () => {
        await cleanDatabase();
        adminId = generateId();
        jest.clearAllMocks();
    });

    describe('Feature: Geographical Entities', () => {
        it('[Success] should create a country with phone code context', async () => {
            const req = createMockReq({ 
                user: { role: USER_ROLES.ADMIN },
                jsonBody: { name: 'India', isoCode: 'IN', currency: 'INR', phoneCode: '+91' } 
            });
            
            const res = await LocationController.createCountry(req);
            expect(res.status).toBe(HTTP_STATUS.CREATED);
            
            const stored = await Country.findOne({ isoCode: 'IN' });
            expect(stored).not.toBeNull();
        });

        it('[Success] should nest states within countries', async () => {
             const country = await Country.create({ name: 'India', isoCode: 'IN', currency: 'INR', phoneCode: '+91' });
             const req = createMockReq({ 
                 user: { role: USER_ROLES.ADMIN },
                 jsonBody: { name: 'Goa', code: 'GA', country: country._id.toString() } 
             });
             
             const res = await LocationController.createState(req);
             expect(res.status).toBe(HTTP_STATUS.CREATED);
             
             const stored = await State.findOne({ code: 'GA' });
             expect(stored.country.toString()).toBe(country._id.toString());
        });

        it('[Security] should block non-admin geographical updates', async () => {
            const req = createMockReq({ user: { role: USER_ROLES.TRAVELLER } });
            const res = await LocationController.createCountry(req);
            expect(res.status).toBe(HTTP_STATUS.FORBIDDEN);
        });
    });

    describe('Feature: Location Information Retrieval', () => {
        it('[Success] should list all countries for public use', async () => {
             await Country.create({ name: 'Nepal', isoCode: 'NP', currency: 'NPR', phoneCode: '+977' });
             const req = createMockReq({ user: null });
             
             const res = await LocationController.getCountries(req);
             expect(res.status).toBe(HTTP_STATUS.OK);
             
             const body = await res.json();
             expect(body.data.countries.length).toBeGreaterThan(0);
        });
    });
});
