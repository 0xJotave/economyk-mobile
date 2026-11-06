module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  clearMocks: true,
  restoreMocks: true,
  maxWorkers: 2,
  collectCoverageFrom: [
    'src/utils/{financial-summary,balance,fixed,month}.ts',
    'src/features/transactions/services/{installment-service,fixed-transaction-service,transaction-management-service}.ts',
  ],
  coverageReporters: ['text', 'html', 'lcov'],
};
