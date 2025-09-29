/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/tests'],

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@ai/(.*)$': '<rootDir>/src/ai/$1',
    '^@filesystem/(.*)$': '<rootDir>/src/filesystem/$1',
    '^@commands/(.*)$': '<rootDir>/src/commands/$1',
    '^@ui/(.*)$': '<rootDir>/src/ui/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@chat/(.*)$': '<rootDir>/src/chat/$1',
    '^@sandbox/(.*)$': '<rootDir>/src/sandbox/$1',
    '^@tools/(.*)$': '<rootDir>/src/tools/$1',
    '^@data/(.*)$': '<rootDir>/src/data/$1'
  },

  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        isolatedModules: true
      }
    }]
  },

  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
  testPathIgnorePatterns: ['/node_modules/', '/dist/', 'tests/e2e/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.ts',
    '!src/**/*.stories.ts'
  ],

  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 80,
      statements: 80
    }
  },

  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  testTimeout: 10000
};