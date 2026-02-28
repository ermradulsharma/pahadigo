module.exports = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['./tests/setup.js'],
    testTimeout: 30000,
    moduleNameMapper: {
        '^@/controllers/(.*)$': '<rootDir>/src/core/Http/Controllers/$1',
        '^@/models/(.*)$': '<rootDir>/src/core/Models/$1',
        '^@/services/(.*)$': '<rootDir>/src/core/Services/$1',
        '^@/middleware/(.*)$': '<rootDir>/src/core/Http/Middleware/$1',
        '^@/routes/(.*)$': '<rootDir>/src/core/Routes/$1',
        '^@/config/(.*)$': '<rootDir>/src/core/Config/$1',
        '^@/helpers/(.*)$': '<rootDir>/src/core/Helpers/$1',
        '^@/constants/(.*)$': '<rootDir>/src/core/Constants/$1',
        '^@/lib/(.*)$': '<rootDir>/src/core/Lib/$1',
        '^@/(.*)$': '<rootDir>/src/$1',
    },
};
