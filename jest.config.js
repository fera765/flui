export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.jest.json',
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(nanoid|conf|dot-prop|env-paths|ajv|json-schema-traverse|require-from-string|uri-js|punycode)/)',
  ],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'source/**/*.ts',
    '!source/**/*.d.ts',
    '!source/**/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
};
