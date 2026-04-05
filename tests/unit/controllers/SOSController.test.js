import SOSController from '../../../src/core/Http/Controllers/SOSController.js';
import User from '../../../src/core/Models/User.js';
import EmergencyAlert from '../../../src/core/Models/EmergencyAlert.js';
import { createMockReq, cleanDatabase, generateId } from '../../helpers/testUtils.js';
import { HTTP_STATUS, USER_ROLES } from '../../../src/core/Constants/index.js';
import { jest } from '@jest/globals';

describe('SOSController Test Suite', () => {
    let travelerId;

    beforeEach(async () => {
        await cleanDatabase();
        travelerId = generateId();
        jest.clearAllMocks();
    });

    describe('Safety: SOS & Emergency Alerts', () => {
        it('[Success] should store and retrieve valid emergency contacts', async () => {
             const req = createMockReq({ 
                 user: { id: travelerId.toString(), role: USER_ROLES.TRAVELLER },
                 jsonBody: { emergencyContacts: [{ name: 'Dad', phone: '123' }] } 
             });
             
             await User.create({ _id: travelerId, name: 'U1', role: USER_ROLES.TRAVELLER });
             const res = await SOSController.updateEmergencyContacts(req);
             expect(res.status).toBe(HTTP_STATUS.OK);
             
             const data = await User.findById(travelerId);
             expect(data.emergencyContacts[0].name).toBe('Dad');
        });

        it('[Validation] should strictly cap emergency contacts at 3', async () => {
            const req = createMockReq({ 
                 user: { id: travelerId.toString() },
                 jsonBody: { emergencyContacts: [{name:'c1'}, {name:'c2'}, {name:'c3'}, {name:'c4'}] } 
             });
             const res = await SOSController.updateEmergencyContacts(req);
             expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });

        it('[Critical] should successfully broadcast SOS event', async () => {
            await User.create({ _id: travelerId, name: 'U1' });
            const req = createMockReq({ 
                user: { id: travelerId.toString() },
                jsonBody: { latitude: 30, longitude: 78, address: 'Remote Area' } 
            });
            const res = await SOSController.triggerSOS(req);
            expect(res.status).toBe(HTTP_STATUS.CREATED);
            
            const alert = await EmergencyAlert.findOne({ userId: travelerId });
            expect(alert.status).toBe('active');
        });
    });
});
