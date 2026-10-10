#!/usr/bin/env node
// =============================================================================
// ConMart — Chunked ESLint Runner for Memory-Constrained Systems
// =============================================================================
const { spawnSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ESLINT_BIN = path.join(ROOT, 'node_modules', 'eslint', 'bin', 'eslint.js');

const TARGET_GROUPS = [
  ['src/lib'],
  ['src/components', 'src/middleware.ts'],
  ['src/app/actions'],
  ['src/app/api'],
  ['src/app/buyer'],
  ['src/app/seller'],
  ['src/app/admin'],
  [
    'src/app/agent',
    'src/app/auth',
    'src/app/(auth)',
    'src/app/about',
    'src/app/account',
    'src/app/dashboard',
    'src/app/notifications',
    'src/app/unauthorized',
    'src/app/*.tsx',
    'src/app/*.ts',
  ],
];

console.log('✦ ConMart ESLint — checking codebase in batches...');
let totalErrors = 0;

for (let i = 0; i < TARGET_GROUPS.length; i++) {
  const group = TARGET_GROUPS[i];
  const groupLabel = group.join(' ');
  process.stdout.write(`  [${i + 1}/${TARGET_GROUPS.length}] ${groupLabel}... `);

  let success = false;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const res = spawnSync(
      process.execPath,
      ['--max-old-space-size=4096', ESLINT_BIN, ...group],
      { cwd: ROOT, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }
    );

    if (res.status === 0) {
      success = true;
      process.stdout.write('✓\n');
      break;
    }

    const output = (res.stdout || '') + (res.stderr || '');
    const isOOM = output.includes('out of memory') || output.includes('Zone') || output.includes('JavaScript heap');

    if (isOOM && attempt === 1) {
      process.stdout.write('⟳ retrying... ');
      continue;
    }

    if (output.trim()) {
      process.stdout.write('✗\n');
      console.error(output);
    } else {
      process.stdout.write('✗ (exit code ' + res.status + ')\n');
    }
    totalErrors++;
    break;
  }
}

if (totalErrors > 0) {
  console.error(`\n❌ ESLint failed with ${totalErrors} error group(s)`);
  process.exit(1);
} else {
  console.log('\n✓ ESLint passed cleanly across all files\n');
  process.exit(0);
}
