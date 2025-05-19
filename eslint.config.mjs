
// [Nest] 19324  - 10/04/2025, 23:37:41     LOG [RouterExplorer] Mapped {/api/v1/auth/register, POST} route +15ms
// [Nest] 19324  - 10/04/2025, 23:37:41     LOG [RouterExplorer] Mapped {/api/v1/auth/login, POST} route +11ms
// [Nest] 19324  - 10/04/2025, 23:37:41     LOG [RouterExplorer] Mapped {/api/v1/auth/google, POST} route +17ms
// [Nest] 19324  - 10/04/2025, 23:37:41     LOG [RouterExplorer] Mapped {/api/v1/auth/change-password, PATCH} route +21ms
// [Nest] 19324  - 10/04/2025, 23:37:41     LOG [RouterExplorer] Mapped {/api/v1/auth/forgot-password, POST} route +7ms
// [Nest] 19324  - 10/04/2025, 23:37:41     LOG [RouterExplorer] Mapped {/api/v1/auth/reset-password, POST} route +24ms

// [Nest] 19324  - 10/04/2025, 23:37:41     LOG [RouterExplorer] Mapped {/api/v1/notifications/settings, GET} route +28ms
// [Nest] 19324  - 10/04/2025, 23:37:41     LOG [RouterExplorer] Mapped {/api/v1/notifications/settings/enable, POST} route +15ms
// [Nest] 19324  - 10/04/2025, 23:37:41     LOG [RouterExplorer] Mapped {/api/v1/notifications/settings/disable, POST} route +19ms

// [Nest] 19324  - 10/04/2025, 23:37:41     LOG [RouterExplorer] Mapped {/api/v1/subscriptions/plans, GET} route +43ms
// [Nest] 19324  - 10/04/2025, 23:37:41     LOG [RouterExplorer] Mapped {/api/v1/subscriptions/plans, POST} route +21ms
// [Nest] 19324  - 10/04/2025, 23:37:41     LOG [RouterExplorer] Mapped {/api/v1/subscriptions/payments, POST} route +19ms

// [Nest] 19324  - 10/04/2025, 23:37:41     LOG [RouterExplorer] Mapped {/api/v1/courses, POST} route +12ms
// [Nest] 19324  - 10/04/2025, 23:37:41     LOG [RouterExplorer] Mapped {/api/v1/courses, GET} route +10ms
// [Nest] 19324  - 10/04/2025, 23:37:41     LOG [RouterExplorer] Mapped {/api/v1/courses/:id, GET} route +12ms
// [Nest] 19324  - 10/04/2025, 23:37:41     LOG [RouterExplorer] Mapped {/api/v1/courses/:id, PATCH} route +11ms
// [Nest] 19324  - 10/04/2025, 23:37:41     LOG [RouterExplorer] Mapped {/api/v1/courses/:id, DELETE} route +6ms

// [Nest] 19324  - 10/04/2025, 23:37:41     LOG [RouterExplorer] Mapped {/api/v1/course-module, GET} route +9ms
// [Nest] 19324  - 10/04/2025, 23:37:41     LOG [RouterExplorer] Mapped {/api/v1/course-module/:id, GET} route +11ms
// [Nest] 19324  - 10/04/2025, 23:37:41     LOG [RouterExplorer] Mapped {/api/v1/course-module, POST} route +11ms
// [Nest] 19324  - 10/04/2025, 23:37:41     LOG [RouterExplorer] Mapped {/api/v1/course-module/:id, PATCH} route +6ms
// [Nest] 19324  - 10/04/2025, 23:37:41     LOG [RouterExplorer] Mapped {/api/v1/course-module/:id, DELETE} route +9ms

// [Nest] 19324  - 10/04/2025, 23:37:41     LOG [RouterExplorer] Mapped {/api/v1/lesson, GET} route +25ms
// [Nest] 19324  - 10/04/2025, 23:37:41     LOG [RouterExplorer] Mapped {/api/v1/lesson/:moduleId, POST} route +13ms
// [Nest] 19324  - 10/04/2025, 23:37:41     LOG [RouterExplorer] Mapped {/api/v1/lesson/:id, GET} route +12ms
// [Nest] 19324  - 10/04/2025, 23:37:41     LOG [RouterExplorer] Mapped {/api/v1/lesson/:id, PATCH} route +13ms
// [Nest] 19324  - 10/04/2025, 23:37:41     LOG [RouterExplorer] Mapped {/api/v1/lesson/:id, DELETE} route +17ms

// [Nest] 19324  - 10/04/2025, 23:37:41     LOG [RouterExplorer] Mapped {/api/v1/quiz, POST} route +7ms
// [Nest] 19324  - 10/04/2025, 23:37:41     LOG [RouterExplorer] Mapped {/api/v1/quiz/lesson/:lessonId, GET} route +17ms
// [Nest] 19324  - 10/04/2025, 23:37:41     LOG [RouterExplorer] Mapped {/api/v1/quiz/:quizId, GET} route +34ms
// [Nest] 19324  - 10/04/2025, 23:37:41     LOG [RouterExplorer] Mapped {/api/v1/quiz/:quizId, PATCH} route +26ms
// [Nest] 19324  - 10/04/2025, 23:37:41     LOG [RouterExplorer] Mapped {/api/v1/quiz/:quizId, DELETE} route +37ms



import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'src/types/*.d.ts'],
  },

  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,

  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      ecmaVersion: 5,
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-unsafe-return': 'off'
    },
  },
);
