import { jest } from '@jest/globals';

let QueueServiceModule;
let ClientMock;
let getAppConfigMock;
let publishJSONMock;

describe('QueueService', () => {
    const originalEnv = process.env;

    beforeAll(async () => {
        process.env = { ...originalEnv, NEXT_PUBLIC_APP_URL: 'http://localhost:3000' };
        publishJSONMock = jest.fn().mockResolvedValue({ messageId: '123' });
        ClientMock = jest.fn().mockImplementation(() => ({
            publishJSON: publishJSONMock
        }));
        
        getAppConfigMock = jest.fn().mockResolvedValue({ qstash: { token: 'mock-token' } });

        jest.unstable_mockModule('@upstash/qstash', () => ({
            Client: ClientMock
        }));

        jest.unstable_mockModule('@/core/Lib/appConfig.js', () => ({
            getAppConfig: getAppConfigMock
        }));

        QueueServiceModule = await import('@/core/Lib/Queue/QueueService.js');
    });

    beforeEach(() => {
        jest.clearAllMocks();
        getAppConfigMock.mockResolvedValue({ qstash: { token: 'mock-token' } });
        publishJSONMock.mockResolvedValue({ messageId: '123' });
    });

    it('should initialize QStash client', async () => {
        const client = await QueueServiceModule.getQStashClient();
        expect(ClientMock).toHaveBeenCalled();
        expect(client).toBeDefined();
    });

    it('should enqueue invoice', async () => {
        const result = await QueueServiceModule.enqueueInvoice('test@example.com', 'b_123', 'traveller');
        expect(result).toBe(true);
    });

    it('should enqueue push notification', async () => {
        const result = await QueueServiceModule.enqueuePushNotification('token123', { title: 'Test' });
        expect(result).toBe(true);
    });
    
    it('should handle enqueue failure', async () => {
        publishJSONMock.mockRejectedValue(new Error('Failed'));
        const result = await QueueServiceModule.enqueuePushNotification('token123', { title: 'Test' });
        expect(result).toBe(false);
    });

    afterAll(() => {
        process.env = originalEnv;
    });
});
