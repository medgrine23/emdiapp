/**
 * Configuration Jest pour les tests unitaires de la logique métier.
 * Les services testés sont du TypeScript pur (sans dépendance native), compilés
 * par ts-jest. L'alias `@/` est résolu vers `src/`.
 */
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
