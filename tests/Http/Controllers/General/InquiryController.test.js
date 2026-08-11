import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Services/General/PolicyService.js', () => ({
    default: { submitInquiry: jest.fn() }
}));

jest.unstable_mockModule('@/core/Services/General/NotificationService.js', () => ({
    default: { sendNewsletterWelcomeEmail: jest.fn() }
}));

const { default: InquiryController } = await import('@/core/Http/Controllers/General/InquiryController.js');
const { default: PolicyService } = await import('@/core/Services/General/PolicyService.js');
const { default: NotificationService } = await import('@/core/Services/General/NotificationService.js');

describe('Industry Standard: InquiryController API Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('[submitInquiry]', () => {
        it('[Success] should submit inquiry with valid data', async () => {
            const body = { name: 'Joe', email: 'joe@test.com', message: 'Hello' };
            const req = { validData: body };
            const mockInquiry = { _id: 'inq1', ...body };
            PolicyService.submitInquiry.mockResolvedValue(mockInquiry);

            const response = await InquiryController.submitInquiry(req);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.data).toEqual(mockInquiry);
            expect(PolicyService.submitInquiry).toHaveBeenCalledWith(body);
        });

        it('[Failure] should return 400 if fields are missing', async () => {
            const req = { validData: { name: 'Joe' } };
            const response = await InquiryController.submitInquiry(req);
            expect(response.status).toBe(400);
        });

        it('[Failure] should return 500 if service throws error', async () => {
            const req = { validData: { name: 'Joe', email: 'j@t.com', message: 'Hi' } };
            PolicyService.submitInquiry.mockRejectedValue(new Error('DB Error'));
            
            const response = await InquiryController.submitInquiry(req);
            expect(response.status).toBe(500);
        });
    });

    describe('[subscribeNewsletter]', () => {
        it('[Success] should subscribe to newsletter with valid email', async () => {
            const req = { payload: { email: 'joe@test.com' } };
            NotificationService.sendNewsletterWelcomeEmail.mockResolvedValue(true);

            const response = await InquiryController.subscribeNewsletter(req);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.data).toBe(true);
            expect(NotificationService.sendNewsletterWelcomeEmail).toHaveBeenCalledWith('joe@test.com');
        });

        it('[Failure] should return 400 if email is missing', async () => {
            const req = { payload: {} };
            const response = await InquiryController.subscribeNewsletter(req);
            expect(response.status).toBe(400);
        });

        it('[Failure] should return 500 if notification service fails', async () => {
            const req = { payload: { email: 'joe@test.com' } };
            NotificationService.sendNewsletterWelcomeEmail.mockRejectedValue(new Error('SMTP Error'));
            
            const response = await InquiryController.subscribeNewsletter(req);
            expect(response.status).toBe(500);
        });
    });
});
