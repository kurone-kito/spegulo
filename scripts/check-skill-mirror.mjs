#!/usr/bin/env node
// Assert that every committed copy of the issue-authoring companion skill
// is byte-identical to the canonical bundle shipped by the pinned
// @kurone-kito/idd-skill helper package.
//
// Two agent runtimes read two different skill roots — Claude Code (and
// Grok Build, which auto-reads `.claude/`) read `.claude/skills/`, while
// Codex CLI reads `.agents/skills/` — so the bundle is committed twice.
// A symlink would collapse the duplication, but it does not survive a
// Windows checkout without `core.symlinks`, and this repository's CI
// matrix includes `windows-latest`. This check is the drift guard that
// buys back what the symlink would have given for free.
//
// Pure Node with no shell dependency, because `pnpm run lint` also runs
// under the CI matrix's `powershell` leg, where `diff` does not exist.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const CANONICAL = join(
  'node_modules',
  '@kurone-kito',
  'idd-skill',
  'skills',
  'issue-authoring',
);
const MIRRORS = [
  join('.claude', 'skills', 'issue-authoring'),
  join('.agents', 'skills', 'issue-authoring'),
];

/** @returns {string[]} POSIX-style paths relative to `root`, sorted. */
const listFiles = (root) => {
  const walk = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = join(dir, entry.name);
      return entry.isDirectory() ? walk(full) : [full];
    });
  return walk(root)
    .map((full) => relative(root, full).split(sep).join('/'))
    .sort();
};

const exists = (path) => {
  try {
    statSync(path);
    return true;
  } catch {
    return false;
  }
};

const failures = [];

if (!exists(CANONICAL)) {
  failures.push(
    `canonical bundle missing at ${CANONICAL}; run the install-deps command first`,
  );
} else {
  const canonicalFiles = listFiles(CANONICAL);
  for (const mirror of MIRRORS) {
    if (!exists(mirror)) {
      failures.push(`mirror missing: ${mirror}`);
      continue;
    }
    const mirrorFiles = listFiles(mirror);
    for (const missing of canonicalFiles.filter(
      (f) => !mirrorFiles.includes(f),
    )) {
      failures.push(`${mirror}: missing ${missing}`);
    }
    for (const extra of mirrorFiles.filter(
      (f) => !canonicalFiles.includes(f),
    )) {
      failures.push(`${mirror}: unexpected ${extra}`);
    }
    for (const file of canonicalFiles.filter((f) => mirrorFiles.includes(f))) {
      const a = readFileSync(join(CANONICAL, ...file.split('/')));
      const b = readFileSync(join(mirror, ...file.split('/')));
      if (!a.equals(b)) failures.push(`${mirror}: content differs at ${file}`);
    }
  }
}

if (failures.length > 0) {
  console.error('issue-authoring skill mirrors are out of sync:');
  for (const failure of failures) console.error(`  - ${failure}`);
  // Deliberately tool-agnostic: this check also runs under the CI
  // matrix's Windows/PowerShell leg, where a `cp -R` hint would name a
  // command that does not exist on the very platform the check failed on.
  console.error(
    `\nRe-sync by replacing each root listed above with a copy of every file under ${CANONICAL}, preserving relative paths.`,
  );
  process.exit(1);
}

console.log(
  `issue-authoring skill mirrors match ${CANONICAL} (${MIRRORS.length} roots)`,
);
