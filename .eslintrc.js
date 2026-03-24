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
    // Warn on any in all files
    '@typescript-eslint/no-explicit-any': 'warn',

    // Disable console rule completely
    'no-console': 'off',
  },

  overrides: [
    // ───────────────── SPEC FILE RULES ─────────────────
    {
      files: ['tests/**/*.spec.ts'],
      extends: ['plugin:playwright/recommended'],

      rules: {
        'playwright/no-wait-for-timeout': 'off',
        'playwright/expect-expect': 'error',
        'playwright/no-force-option': 'warn',
        'playwright/no-focused-test': 'error',

        'no-restricted-syntax': [
          'error',
          {
            selector:
              "CallExpression[callee.type='MemberExpression'][callee.object.name='page'][callee.property.name=/^(locator|click|fill|type|goto|getByRole|getByLabel|getByText|waitForSelector|frameLocator|pause)$/]",
            message: 'Do not call raw page methods in spec files. Use Page Objects instead.',
          },
          {
            selector: "CallExpression[callee.property.name='waitForTimeout'][arguments.0.type='Literal'][arguments.0.value>3000]",
            message: 'Hard wait > 3s is blocked. Use expect().toBeVisible() or smart waits.',
          },
        ],
      },
    },

    // ───────────────── PAGE OBJECT RULES ─────────────────
    {
      files: ['src/pages/**/*.ts'],

      rules: {
        'no-restricted-syntax': [
          'error',
          {
            selector:
              "MethodDefinition:not([kind='constructor']) CallExpression[callee.object.type='MemberExpression'][callee.object.property.name='page'][callee.property.object.type='ThisExpression'][callee.property.name='locator']",
            message: 'Define this.page.locator() as readonly properties in the constructor.',
          },
          {
            selector: "CallExpression[callee.property.name='waitForTimeout'][arguments.0.type='Literal'][arguments.0.value>3000]",
            message: 'Hard wait > 3s is blocked. Use expect().toBeVisible() or locator waits.',
          },
        ],

        'no-restricted-globals': ['error'],

        'no-restricted-properties': [
          'error',
          {
            object: 'page',
            property: 'pause',
            message: 'Remove page.pause() before committing — use debugger instead.',
          },
        ],
      },
    },

    // ───────────────── HELPERS / SETUP ─────────────────
    {
      files: ['src/helpers/**/*.ts', 'src/setup/**/*.ts'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
};
