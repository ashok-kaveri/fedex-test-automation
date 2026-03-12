module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'playwright'],
  extends: ['plugin:@typescript-eslint/recommended'],

  rules: {
    // Warn on any in all files (the fixtures.ts `as unknown as any` is a known exception)
    '@typescript-eslint/no-explicit-any': 'warn',
    // No console.log in committed code
    'no-console': 'warn',
  },

  overrides: [
    // ─── Spec files ──────────────────────────────────────────────────────────
    {
      files: ['tests/**/*.spec.ts'],
      extends: ['plugin:playwright/recommended'],
      rules: {
        // WARN: any hard wait is a code smell — prefer smart waits
        // Commits are only blocked when the wait exceeds 3 s (see no-restricted-syntax below)
        'playwright/no-wait-for-timeout': 'warn',

        // BLOCK: every test must have at least one expect()
        'playwright/expect-expect': 'error',

        // WARN: force: true hides real issues, prefer fixing the locator
        'playwright/no-force-option': 'warn',

        // WARN: skipped tests should not be merged
        'playwright/no-skipped-test': 'warn',

        // BLOCK: test.only / it.only left in committed code
        'playwright/no-focused-test': 'error',

        // BLOCK: raw `page.*` calls in spec files — must use page objects.
        // Also blocks hard waits > 3 s (esquery numeric comparison on the literal argument).
        // Includes frameLocator so iframe access must also go through page objects.
        'no-restricted-syntax': [
          'error',
          {
            selector:
              "CallExpression[callee.type='MemberExpression'][callee.object.name='page'][callee.property.name=/^(locator|click|fill|type|goto|getByRole|getByLabel|getByText|waitForSelector|frameLocator|pause)$/]",
            message:
              'Do not call raw page methods in spec files. Use the page object (pages.xxx.method()) instead.',
          },
          {
            selector:
              "CallExpression[callee.property.name='waitForTimeout'][arguments.0.type='Literal'][arguments.0.value>3000]",
            message:
              'Hard wait > 3 s is blocked. Use smart waits (expect().toBeVisible(), waitFor({ state })) or keep the delay ≤ 3000 ms.',
          },
        ],

        // No console.log in final test files
        'no-console': 'warn',
      },
    },

    // ─── Page Object files ────────────────────────────────────────────────────
    {
      files: ['src/pages/**/*.ts'],
      rules: {
        // BLOCK: locators defined inside methods should be constructor properties,
        // and hard waits > 3 s are not allowed.
        'no-restricted-syntax': [
          'error',
          {
            // Catches: this.appFrame.locator(...) / this.page.locator(...) inside any method that isn't the constructor
            selector:
              "MethodDefinition:not([kind='constructor']) > FunctionExpression CallExpression[callee.type='MemberExpression'][callee.property.name='locator']",
            message:
              "Define locators as 'readonly' class properties in the constructor, not inside methods.",
          },
          {
            selector:
              "CallExpression[callee.property.name='waitForTimeout'][arguments.0.type='Literal'][arguments.0.value>3000]",
            message:
              'Hard wait > 3 s is blocked. Use smart waits (expect().toBeVisible(), waitFor({ state })) or keep the delay ≤ 3000 ms.',
          },
        ],

        'no-restricted-globals': ['error'],
        'no-restricted-properties': [
          'error',
          {
            object: 'page',
            property: 'pause',
            message: 'Remove page.pause() before committing — use breakpoints in the debugger instead.',
          },
        ],
      },
    },

    // ─── Helper / setup files ─────────────────────────────────────────────────
    {
      files: ['src/helpers/**/*.ts', 'src/setup/**/*.ts'],
      rules: {
        'no-console': 'off', // helpers can log
      },
    },
  ],
};
