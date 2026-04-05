import AuthEvents from '../../../src/core/Events/AuthEvents.js';
import NotificationService from '../../../src/core/Services/NotificationService.js';
import { jest } from '@jest/globals';

describe('AuthEvents Test Suite', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should trigger sendOTPEmail for email identifiers', async () => {
        const spyEmail = jest.spyOn(NotificationService, 'sendOTPEmail').mockResolvedValue({});
        
        AuthEvents.emit('otp.requested', { identifier: 'user@test.com', otp: '123456' });
        
        // Wait for async handler
        await new Promise(resolve => setTimeout(resolve, 50));
        expect(spyEmail).toHaveBeenCalledWith('user@test.com', '123456');
    });

    it('should trigger sendSMS for phone identifiers', async () => {
        const spySMS = jest.spyOn(NotificationService, 'sendSMS').mockResolvedValue({});
        
        AuthEvents.emit('otp.requested', { identifier: '9876543210', otp: '654321' });
        
        await new Promise(resolve => setTimeout(resolve, 50));
        expect(spySMS).toHaveBeenCalled();
        expect(spySMS.mock.calls[0][1]).toContain('654321');
    });

    it('should trigger login alert for success login', async () => {
        const spyAlert = jest.spyOn(NotificationService, 'sendLoginAlertEmail').mockResolvedValue({});
        
        AuthEvents.emit('auth.login_success', { 
            user: { email: 'user@test.com' }, 
            metadata: { identifier: 'user@test.com', ip: '127.0.0.1', device: 'Mobile' } 
        });
        
        await new Promise(resolve => setTimeout(resolve, 50));
        expect(spyAlert).toHaveBeenCalled();
    });
});
