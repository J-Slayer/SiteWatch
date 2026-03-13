/**
 * Metro configuration for SiteWatch mobile.
 *
 * Extends the default Expo Metro config to:
 * 1. Watch the shared `packages/types` folder from the monorepo root
 * 2. Resolve the `@sitewatch/types` alias to the local package source
 *
 * Without this, Metro won't pick up changes in packages outside the
 * mobile/ directory, and the `file:` npm reference won't be bundled.
 */

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Tell Metro to also watch the monorepo packages folder
config.watchFolders = [monorepoRoot];

// Resolve modules from both mobile/node_modules and the monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Map the package name to its source so Metro bundles TypeScript directly
config.resolver.extraNodeModules = {
  '@sitewatch/types': path.resolve(monorepoRoot, 'packages', 'types', 'src'),
};

module.exports = config;
