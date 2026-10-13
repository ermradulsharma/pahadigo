import { jest } from '@jest/globals';

const mockCronService = {
    autoCompleteBookings: jest.fn(),
    autoExpireBookings: jest.fn(),
    autoResolveDisputes: jest.fn(),
    cleanupLogs: jest.fn()
};

const mockAppConfig = {
    secrets: {
        cron_secret: 'valid_cron_secret_123'
    }
};

jest.unstable_mockModule('@/core/Services/CronService.js', () => ({
    default: mockCronService
}));

jest.unstable_mockModule('@/core/Lib/appConfig.js', () => ({
    getAppConfig: jest.fn().mockResolvedValue(mockAppConfig)
}));

jest.unstable_mockModule('@/core/Lib/logger.js', () => ({
    getLogger: () => ({ error: jest.fn(), info: jest.fn() })
}));

const { default: CronController } = await import('@/core/Http/Controllers/General/CronController.js');
const { HTTP_STATUS } = await import('@/core/Constants/index.js');

describe('Industry Standard: CronController', () => {
    let mockReq;

    beforeEach(() => {
        jest.clearAllMocks();
        mockReq = {
            url: 'https://pahadigo.co.in/api/cron?job=dailyBookings',
            headers: {
                get: jest.fn((name) => {
                    if (name.toLowerCase() === 'authorization') {
                        return 'Bearer valid_cron_secret_123';
                    }
                    return null;
                })
            },
            query: {}
        };
    });

    it('[Security] should reject request with 401 when cron authorization secret is missing or invalid', async () => {
        mockReq.headers.get.mockReturnValue('Bearer wrong_secret');
        const res = await CronController.handleCron(mockReq);
        expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('[Validation] should return 400 when job param is unknown or missing', async () => {
        mockReq.query = { job: 'unknown_job' };
        mockReq.url = 'https://pahadigo.co.in/api/cron?job=unknown_job';
        const res = await CronController.handleCron(mockReq);
        expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    it('[Job: dailyBookings] should trigger autoCompleteBookings and return 200', async () => {
        mockReq.query = { job: 'dailyBookings' };
        mockCronService.autoCompleteBookings.mockResolvedValue({ completed: 5 });

        const res = await CronController.handleCron(mockReq);
        expect(res.status).toBe(HTTP_STATUS.OK);
        expect(mockCronService.autoCompleteBookings).toHaveBeenCalled();
    });

    it('[Job: expireBookings] should trigger autoExpireBookings and return 200', async () => {
        mockReq.query = { job: 'expireBookings' };
        mockCronService.autoExpireBookings.mockResolvedValue({ expired: 2 });

        const res = await CronController.handleCron(mockReq);
        expect(res.status).toBe(HTTP_STATUS.OK);
        expect(mockCronService.autoExpireBookings).toHaveBeenCalled();
    });

    it('[Job: all] should execute all automated maintenance pipelines and return aggregated results', async () => {
        mockReq.query = { job: 'all' };
        mockCronService.autoCompleteBookings.mockResolvedValue(5);
        mockCronService.autoExpireBookings.mockResolvedValue(2);
        mockCronService.autoResolveDisputes.mockResolvedValue(1);
        mockCronService.cleanupLogs.mockResolvedValue(100);

        const res = await CronController.handleCron(mockReq);
        expect(res.status).toBe(HTTP_STATUS.OK);
        expect(mockCronService.autoCompleteBookings).toHaveBeenCalled();
        expect(mockCronService.autoExpireBookings).toHaveBeenCalled();
        expect(mockCronService.autoResolveDisputes).toHaveBeenCalled();
        expect(mockCronService.cleanupLogs).toHaveBeenCalled();
    });
});
