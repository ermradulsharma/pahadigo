import { jest } from '@jest/globals';

const mockCookies = {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn()
};

jest.unstable_mockModule('js-cookie', () => ({
    default: mockCookies
}));

const { getToken, getRole, setToken, removeToken } = await import('@/app/utils/authUtils.js');

describe('App Utils: authUtils.js', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Setup window object in test environment
        global.window = {
            location: {
                protocol: 'https:'
            }
        };
    });

    afterAll(() => {
        delete global.window;
    });

    describe('getToken & getRole', () => {
        it('should retrieve token and role from cookies in browser environment', () => {
            mockCookies.get.mockImplementation((key) => {
                if (key === 'token') return 'jwt_mock_token';
                if (key === 'role') return 'vendor';
                return null;
            });

            expect(getToken()).toBe('jwt_mock_token');
            expect(getRole()).toBe('vendor');
            expect(mockCookies.get).toHaveBeenCalledWith('token');
            expect(mockCookies.get).toHaveBeenCalledWith('role');
        });

        it('should return null when running in server-side environment (window is undefined)', () => {
            const tempWindow = global.window;
            delete global.window;

            expect(getToken()).toBeNull();
            expect(getRole()).toBeNull();

            global.window = tempWindow;
        });
    });

    describe('setToken', () => {
        it('should set cookies with session expiry when rememberMe is false', () => {
            setToken('token_123', 'traveller', false);

            expect(mockCookies.set).toHaveBeenCalledWith(
                'token',
                'token_123',
                expect.objectContaining({
                    secure: true,
                    sameSite: 'strict',
                    expires: undefined
                })
            );
            expect(mockCookies.set).toHaveBeenCalledWith(
                'role',
                'traveller',
                expect.objectContaining({
                    secure: true,
                    sameSite: 'strict',
                    expires: undefined
                })
            );
        });

        it('should set cookies with 30-day expiry when rememberMe is true', () => {
            setToken('token_persistent', 'admin', true);

            expect(mockCookies.set).toHaveBeenCalledWith(
                'token',
                'token_persistent',
                expect.objectContaining({
                    expires: 30
                })
            );
        });

        it('should do nothing when running server-side (window is undefined)', () => {
            const tempWindow = global.window;
            delete global.window;

            setToken('token_123', 'traveller');
            expect(mockCookies.set).not.toHaveBeenCalled();

            global.window = tempWindow;
        });
    });

    describe('removeToken', () => {
        it('should remove token and role cookies', () => {
            removeToken();

            expect(mockCookies.remove).toHaveBeenCalledWith('token');
            expect(mockCookies.remove).toHaveBeenCalledWith('role');
        });

        it('should do nothing when running server-side (window is undefined)', () => {
            const tempWindow = global.window;
            delete global.window;

            removeToken();
            expect(mockCookies.remove).not.toHaveBeenCalled();

            global.window = tempWindow;
        });
    });
});

