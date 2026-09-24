/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFiles: ['<rootDir>/jest.env-setup.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    '\\.(jpg|jpeg|png|gif|svg|woff|woff2)$': '<rootDir>/__mocks__/fileMock.js',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          allowJs: true,
          strict: false,
          skipLibCheck: true,
          module: 'commonjs',
          moduleResolution: 'node',
          target: 'es2017',
          lib: ['dom', 'dom.iterable', 'esnext'],
          paths: { '@/*': ['./src/*'] },
        },
        diagnostics: false,
      },
    ],
    '^.+\\.jsx?$': [
      'babel-jest',
      {
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          ['@babel/preset-react', { runtime: 'automatic' }],
          '@babel/preset-typescript',
        ],
      },
    ],
  },
  transformIgnorePatterns: ['/node_modules/(?!(uuid)/)'],
  testMatch: ['**/__tests__/**/*.test.[tj]s?(x)', '**/?(*.)+(test).[tj]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/out/', '/build/'],
  testTimeout: 10_000,
  maxWorkers: '50%',
  clearMocks: true,
  restoreMocks: true,
  collectCoverageFrom: [
    'src/lib/**/*.{ts,tsx}',
    'src/store/**/*.{ts,tsx}',
    'src/services/**/*.{ts,tsx}',
    'src/types/**/*.ts',
    'src/components/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/test-utils.tsx',
    '!**/*.d.ts',
  ],
  coverageProvider: 'v8',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: { branches: 40, functions: 40, lines: 50, statements: 50 },
  },
};
