import { jest } from '@jest/globals';

jest.unstable_mockModule('@/services/General/PolicyService.js', () => ({
    default: { submitInquiry: jest.fn() }
}));

const { default: InquiryController } = await import('@/controllers/General/InquiryController.js');
const { default: PolicyService } = await import('@/services/General/PolicyService.js');

describe('Industry Standard: InquiryController API Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('[submitInquiry]', () => {
        it('[Success] should submit inquiry with valid data', async () => {
            const body = { name: 'Joe', email: 'joe@test.com', message: 'Hello' };
            const req = { jsonBody: body };
            const mockInquiry = { _id: 'inq1', ...body };
            PolicyService.submitInquiry.mockResolvedValue(mockInquiry);

            const response = await InquiryController.submitInquiry(req);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.data).toEqual(mockInquiry);
            expect(PolicyService.submitInquiry).toHaveBeenCalledWith(body);
        });

        it('[Failure] should return 400 if fields are missing', async () => {
            const req = { jsonBody: { name: 'Joe' } };
            const response = await InquiryController.submitInquiry(req);
            expect(response.status).toBe(400);
        });
    });
});
