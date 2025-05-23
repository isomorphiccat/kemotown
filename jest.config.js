// jest.config.js
module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1', // To match TypeScript path aliases
    '\.(css|less|scss|sass)$': 'identity-obj-proxy', // Mock CSS imports
  },
  transform: {
    '^.+\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }], // Use ts-jest for TypeScript
    '^.+\.(js|jsx)$': 'babel-jest', // If you have JS files to transform
  },
  // Automatically clear mock calls, instances and results before every test
  clearMocks: true,
};
