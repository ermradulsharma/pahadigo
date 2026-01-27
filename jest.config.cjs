module.exports = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['./tests/setup.js'],
    testTimeout: 30000,
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
};
