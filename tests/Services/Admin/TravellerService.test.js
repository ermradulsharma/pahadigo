import { jest } from '@jest/globals';

const mockQuery = {
    sort: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    then: jest.fn(function(resolve) {
        resolve(this._resolvedValue || []);
    })
};

jest.unstable_mockModule('@/models/User.js', () => ({
    default: {
        find: jest.fn(() => mockQuery),
        findOne: jest.fn(),
        create: jest.fn(),
        findByIdAndUpdate: jest.fn(),
        findByIdAndDelete: jest.fn()
    }
}));

jest.unstable_mockModule('@/services/Admin/AuditService.js', () => ({
    default: { logAction: jest.fn() }
}));

const { default: TravellerService } = await import('@/services/Admin/TravellerService.js');
const { default: User } = await import('@/models/User.js');
const { default: AuditService } = await import('@/services/Admin/AuditService.js');

describe('Industry Standard: TravellerService Business Logic Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockQuery._resolvedValue = [];
    });

    describe('[getAllTravellers]', () => {
        it('[Success] should fetch all travellers', async () => {
            const mockUsers = [{ _id: 'u1', name: 'Joe' }];
            mockQuery._resolvedValue = mockUsers;

            const result = await TravellerService.getAllTravellers();

            expect(User.find).toHaveBeenCalledWith({ role: 'traveller' });
            expect(result).toEqual(mockUsers);
        });
    });

    describe('[createTraveller]', () => {
        it('[Success] should create a new traveller and log action', async () => {
            const data = { email: 'joe@test.com', name: 'Joe' };
            const req = { user: { id: 'admin1' } };
            User.findOne.mockResolvedValue(null);
            User.create.mockResolvedValue({ _id: 'u1', ...data });

            const result = await TravellerService.createTraveller(data, req);

            expect(User.create).toHaveBeenCalled();
            expect(AuditService.logAction).toHaveBeenCalled();
            expect(result.email).toBe(data.email);
        });

        it('[Failure] should throw error if email exists', async () => {
            User.findOne.mockResolvedValue({ _id: 'u1' });
            await expect(TravellerService.createTraveller({ email: 'joe@test.com' }))
                .rejects.toThrow();
        });
    });

    describe('[updateTraveller]', () => {
        it('[Success] should update traveller and log action', async () => {
            const id = 'u1';
            const req = { user: { id: 'admin1' } };
            User.findByIdAndUpdate.mockResolvedValue({ _id: id });

            await TravellerService.updateTraveller(id, { name: 'Joe Updated' }, req);

            expect(User.findByIdAndUpdate).toHaveBeenCalled();
            expect(AuditService.logAction).toHaveBeenCalled();
        });
    });
});
