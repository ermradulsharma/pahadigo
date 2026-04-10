import { jest } from '@jest/globals';
import SOSController from '@/controllers/General/SOSController.js';
import { HTTP_STATUS } from '@/constants/index.js';

describe('SOSController (Root)', () => {
    let mockReq;
    let mockUser;

    beforeEach(() => {
        mockUser = {
            emergencyContacts: [],
            save: jest.fn().mockResolvedValue(true)
        };
        mockReq = {
            jsonBody: {},
            user: mockUser
        };
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('updateEmergencyContacts should update contacts for authenticated user', async () => {
        const contacts = [{ name: 'Test', phone: '123' }];
        mockReq.jsonBody = { emergencyContacts: contacts };

        const response = await SOSController.updateEmergencyContacts(mockReq);
        const body = await response.json();

        expect(response.status).toBe(HTTP_STATUS.OK);
        expect(body.data.emergencyContacts).toEqual(contacts);
        expect(mockUser.save).toHaveBeenCalled();
    });

    test('updateEmergencyContacts should return 400 if emergencyContacts is missing', async () => {
        mockReq.jsonBody = {};

        const response = await SOSController.updateEmergencyContacts(mockReq);
        const body = await response.json();

        expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        expect(body.message).toContain('must be an array');
    });

    test('updateEmergencyContacts should return 401 if user is not authenticated', async () => {
        mockReq.user = null;
        mockReq.jsonBody = { emergencyContacts: [] };

        const response = await SOSController.updateEmergencyContacts(mockReq);
        const body = await response.json();

        expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    test('updateEmergencyContacts should return 500 on server error', async () => {
        mockReq.jsonBody = { emergencyContacts: [] };
        mockUser.save.mockRejectedValue(new Error('DB Error'));

        const response = await SOSController.updateEmergencyContacts(mockReq);

        expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    });
});
