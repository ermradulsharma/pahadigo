import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Services/Traveller/SOSService.js', () => ({
    __esModule: true,
    default: {
        updateEmergencyContacts: jest.fn(),
        triggerSOS: jest.fn()
    }
}));

const { default: SOSController } = await import('@/core/Http/Controllers/Traveller/SOSController.js');
const { default: SOSService } = await import('@/core/Services/Traveller/SOSService.js');
const { HTTP_STATUS } = await import('@/core/Constants/index.js');
const { createMockReq } = await import('../../../Helpers/testUtils.js');

describe('Traveller SOSController Unit Tests', () => {
    let mockReq;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('updateEmergencyContacts', () => {
        it('should update emergency contact list for traveller', async () => {
            mockReq = createMockReq({ user: { id: 'u123' } });
            mockReq.jsonBody = {
                emergencyContacts: [{ name: 'Father', phone: '9876543210', relation: 'Parent' }]
            };

            SOSService.updateEmergencyContacts.mockResolvedValue({
                emergencyContacts: [{ name: 'Father', phone: '9876543210' }]
            });

            const response = await SOSController.updateEmergencyContacts(mockReq);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.data.emergencyContacts).toHaveLength(1);
        });
    });

    describe('triggerSOS', () => {
        it('should trigger emergency alert and return 201 Created', async () => {
            mockReq = createMockReq({ user: { id: 'u123' } });
            mockReq.jsonBody = { latitude: 30.5312, longitude: 79.5665 };

            SOSService.triggerSOS.mockResolvedValue({ _id: 'sos_alert_1' });

            const response = await SOSController.triggerSOS(mockReq);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.CREATED);
            expect(body.data.alertId).toBe('sos_alert_1');
            expect(SOSService.triggerSOS).toHaveBeenCalledWith('u123', { latitude: 30.5312, longitude: 79.5665 });
        });
    });
});
