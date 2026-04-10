import { jest } from '@jest/globals';

const mockGet = jest.fn();
const mockSet = jest.fn();
const mockRemove = jest.fn();

jest.unstable_mockModule('js-cookie', () => {
    return {
        default: {
            get: mockGet,
            set: mockSet,
            remove: mockRemove
        }
    };
});

const { getToken, getRole, setToken, removeToken } = await import('../../../src/core/Helpers/authUtils.js');

describe('AuthUtils Helper Test Suite', () => {
    const originalWindow = global.window;

    beforeEach(() => {
        jest.clearAllMocks();
        global.window = originalWindow;
    });

    afterAll(() => {
        global.window = originalWindow;
    });

    describe('getToken', () => {
        it('should return null if window is undefined (SSR)', () => {
            delete global.window;
            expect(getToken()).toBeNull();
        });

        it('should return token if window is defined', () => {
            global.window = { location: { protocol: 'http:' } };
            mockGet.mockReturnValue('test-token');
            expect(getToken()).toBe('test-token');
            expect(mockGet).toHaveBeenCalledWith('token');
        });
    });

    describe('getRole', () => {
        it('should return null if window is undefined', () => {
            delete global.window;
            expect(getRole()).toBeNull();
        });

        it('should return role if window is defined', () => {
            global.window = { location: { protocol: 'http:' } };
            mockGet.mockReturnValue('admin');
            expect(getRole()).toBe('admin');
            expect(mockGet).toHaveBeenCalledWith('role');
        });
    });

    describe('setToken', () => {
        it('should do nothing if window is undefined', () => {
            delete global.window;
            setToken('tk', 'rl');
            expect(mockSet).not.toHaveBeenCalled();
        });

        it('should set cookies with secure option on https', () => {
            global.window = { location: { protocol: 'https:' } };
            setToken('tk', 'rl', true);
            expect(mockSet).toHaveBeenCalledTimes(2);
            expect(mockSet).toHaveBeenCalledWith('token', 'tk', expect.objectContaining({ secure: true, expires: 30 }));
        });

        it('should set cookies without expires if rememberMe is false', () => {
            global.window = { location: { protocol: 'http:' } };
            setToken('tk', 'rl', false);
            expect(mockSet).toHaveBeenCalledWith('token', 'tk', expect.objectContaining({ secure: false, expires: undefined }));
        });
    });

    describe('removeToken', () => {
        it('should do nothing if window is undefined', () => {
            delete global.window;
            removeToken();
            expect(mockRemove).not.toHaveBeenCalled();
        });

        it('should remove cookies if window is defined', () => {
            global.window = { location: { protocol: 'http:' } };
            removeToken();
            expect(mockRemove).toHaveBeenCalledWith('token');
            expect(mockRemove).toHaveBeenCalledWith('role');
        });
    });
});
