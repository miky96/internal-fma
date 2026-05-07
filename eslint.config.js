// Flat config per ESLint 9. Substitueix .eslintrc.json + tsconfig.eslint.json.
// Sense Airbnb: regles modernes amb typescript-eslint + react + hooks + a11y.
// Si en el futur volem regles més estrictes, és més fàcil afegir des d'aquí
// que no pas debugar herència d'Airbnb amb plugins antics.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: ['dist/**', 'build/**', 'node_modules/**', '*.config.js', '*.config.cjs'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,

      // No cal importar React amb new JSX transform.
      'react/react-in-jsx-scope': 'off',
      // L'app té molts spreads sobre props MUI/Mantine; no els penalitzem.
      'react/jsx-props-no-spreading': 'off',
      // Avis suau sobre destructuring, no error.
      'react/destructuring-assignment': 'warn',
      // Permetem `console.error`, no `console.log`.
      'no-console': ['error', { allow: ['error'] }],
      // 100 és massa restrictiu per l'estil del repo.
      'max-len': ['error', 300],
      'no-nested-ternary': 'off',
      // El codi té algun useEffect amb deps incompletes intencionadament.
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'warn',
      // El TS plugin reporta `any` però en codi amb errors de Firebase és pràctic.
      '@typescript-eslint/no-explicit-any': 'warn',
      // Permetem variables prefixades amb `_` sense ús.
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
);
