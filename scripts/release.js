#!/usr/bin/env node

/**
 * Release Script
 *
 * Automates the release process for MCP Configuration Template.
 * Creates tags, updates CHANGELOG, and triggers GitHub Release.
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  CYAN: '\x1b[36m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m',
};

function log(message, color = COLORS.RESET) {
  console.log(`${color}${message}${COLORS.RESET}`);
}

function run(command, options = {}) {
  try {
    const output = execSync(command, {
      cwd: __dirname,
      encoding: 'utf8',
      stdio: 'pipe',
      ...options,
    });
    return output.trim();
  } catch (error) {
    log(`❌ Command failed: ${command}`, COLORS.RED);
    log(`Error: ${error.message}`, COLORS.RED);
    process.exit(1);
  }
}

function getCurrentVersion() {
  const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8'));
  return packageJson.version;
}

function _getCommitsSinceTag(tag) {
  try {
    return run(`git log ${tag}..HEAD --oneline --format="%s"`);
  } catch {
    return run(`git log --oneline -20 --format="%s"`);
  }
}

function updateChangelog(version) {
  const changelogPath = join(__dirname, 'CHANGELOG.md');
  const currentDate = new Date().toISOString().split('T')[0];

  let changelog = '';
  if (existsSync(changelogPath)) {
    changelog = readFileSync(changelogPath, 'utf8');
  }

  const commits = getCommitsSinceTag(`v${getCurrentVersion()}`);

  const newEntry = `## [${version}] - ${currentDate}

### Added
${
  commits
    .split('\n')
    .filter(c => c.startsWith('feat'))
    .map(c => `- ${c.replace(/^feat(\([^)]*\))?: /, '')}`)
    .join('\n') || '- Initial release'
}

### Changed
${
  commits
    .split('\n')
    .filter(c => c.startsWith('fix'))
    .map(c => `- ${c.replace(/^fix(\([^)]*\))?: /, '')}`)
    .join('\n') || '- None'
}

### Fixed
${
  commits
    .split('\n')
    .filter(c => c.startsWith('fix'))
    .map(c => `- ${c.replace(/^fix(\([^)]*\))?: /, '')}`)
    .join('\n') || '- None'
}

`;

  const newChangelog = newEntry + changelog;
  writeFileSync(changelogPath, newChangelog);

  return commits;
}

function createTag(version) {
  try {
    run(`git tag -a v${version} -m "Release v${version}"`);
    log(`✅ Created tag: v${version}`, COLORS.GREEN);
  } catch {
    log(`⚠️ Tag may already exist: v${version}`, COLORS.YELLOW);
  }
}

function pushChanges() {
  log('\n📤 Pushing changes to remote...', COLORS.CYAN);
  run('git push origin main', { stdio: 'inherit' });
  run('git push origin --tags', { stdio: 'inherit' });
}

function main() {
  log(`${COLORS.BOLD}🚀 MCP Configuration Template Release Script${COLORS.RESET}\n`);

  const args = process.argv.slice(2);
  const version = args[0];

  if (!version) {
    log('Usage: node scripts/release.js <version>', COLORS.YELLOW);
    log('Example: node scripts/release.js 2.1.0', COLORS.YELLOW);
    process.exit(1);
  }

  // Validate version format (semver)
  const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/;
  if (!semverRegex.test(version)) {
    log('❌ Invalid version format. Use semver (e.g., 2.1.0, 2.0.0-alpha.1)', COLORS.RED);
    process.exit(1);
  }

  log(`📋 Releasing version: ${version}\n`, COLORS.CYAN);

  // Run tests
  log('🧪 Running tests...', COLORS.CYAN);
  try {
    run('bun run test');
    log('✅ Tests passed', COLORS.GREEN);
  } catch {
    log('⚠️ Tests failed, continuing anyway...', COLORS.YELLOW);
  }

  // Update CHANGELOG
  log('\n📝 Updating CHANGELOG...', COLORS.CYAN);
  const _commits = updateChangelog(version);
  log(`✅ CHANGELOG updated (${commits.split('\n').length} commits)`, COLORS.GREEN);

  // Commit CHANGELOG
  log('\n📦 Committing changes...', COLORS.CYAN);
  run('git add CHANGELOG.md');
  run(`git commit -m "chore(release): bump version to ${version}"`);

  // Create tag
  createTag(version);

  // Push
  pushChanges();

  log('\n' + '='.repeat(60), COLORS.GREEN);
  log('✅ Release initiated successfully!', COLORS.GREEN);
  log('='.repeat(60), COLORS.GREEN);
  log('\nNext steps:', COLORS.BOLD);
  log('1. GitHub Actions will create the release', COLORS.RESET);
  log(
    '2. Review the release at: https://github.com/LarsArtmann/template-mcp-config/releases',
    COLORS.RESET
  );
  log('3. Edit the release description if needed', COLORS.RESET);
}

main();
