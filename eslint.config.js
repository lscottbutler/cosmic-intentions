/* ── ESLint flat config (ESLint v9+) ───────────────────────────────────────
   Catches the silent-bug class — duplicate keys, unreachable code, redeclares,
   accidental assignment in conditions — across the shared JS, the serverless
   functions, and the scripts. No build step required:  npm run lint

   NOTE on `no-undef`: it's OFF for browser code on purpose. This app shares
   globals across files (sb, intentions, esc, toast, LS, getPB, ciApi, …) that
   are defined in index.html, so `no-undef` would be all false positives here.
   The rules below still catch the bugs that actually bite.
─────────────────────────────────────────────────────────────────────────── */

const sharedRules = {
  'no-dupe-keys': 'error',
  'no-dupe-args': 'error',
  'no-duplicate-case': 'error',
  'no-redeclare': 'error',
  'no-unreachable': 'error',
  'no-cond-assign': ['error', 'always'],
  'no-constant-condition': 'warn',
  'no-self-assign': 'error',
  'no-unsafe-negation': 'error',
  'valid-typeof': 'error',
  // vars:'local' so top-level functions called from HTML onclick (globals) aren't
  // false-flagged; caughtErrors:'none' so empty catch(e) blocks are fine. Still
  // catches genuinely-dead LOCAL variables.
  'no-unused-vars': ['warn', { args: 'none', vars: 'local', caughtErrors: 'none', varsIgnorePattern: '^_' }],
  'eqeqeq': ['warn', 'smart'],
};

export default [
  {
    // Browser code (shared modules + future extracted app JS)
    files: ['shared/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      ...sharedRules,
      'no-undef': 'off', // cross-file app globals — see note above
    },
  },
  {
    // Node code (serverless functions + tooling scripts)
    files: ['netlify/functions/**/*.js', 'scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        process: 'readonly', Buffer: 'readonly', console: 'readonly',
        fetch: 'readonly', URL: 'readonly', AbortController: 'readonly',
        setTimeout: 'readonly', clearTimeout: 'readonly',
        exports: 'writable', require: 'readonly', module: 'writable',
      },
    },
    rules: {
      ...sharedRules,
      'no-undef': 'error', // functions are self-contained — undef IS a real bug here
    },
  },
];
