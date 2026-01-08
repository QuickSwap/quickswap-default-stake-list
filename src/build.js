#!/usr/bin/env node
/**
 * Build all staking lists for all chains.
 * 
 * Outputs:
 *   build/<chain>.<type>.json
 * 
 * Example:
 *   build/polygon.syrups.json
 *   build/polygon.lpfarms.json
 *   build/base.syrups.json
 */

const fs = require('fs');
const path = require('path');
const { CHAINS, STAKE_TYPES } = require('./lib/constants');
const { buildList } = require('./lib/buildList');

const SRC_DIR = path.join(__dirname, 'chains');
const BUILD_DIR = path.join(__dirname, '..', 'build');

// Ensure build directory exists
fs.mkdirSync(BUILD_DIR, { recursive: true });

// Type display names
const TYPE_NAMES = {
  syrups: 'Syrups',
  lpfarms: 'LP Farms',
  dualfarms: 'Dual Farms'
};

let totalFiles = 0;

for (const [chainKey, chainConfig] of Object.entries(CHAINS)) {
  const chainDir = path.join(SRC_DIR, chainKey);

  // Skip if chain directory doesn't exist
  if (!fs.existsSync(chainDir)) {
    console.log(`⏭️  Skipping ${chainConfig.name}: no data directory`);
    continue;
  }

  for (const stakeType of STAKE_TYPES) {
    const inputFile = path.join(chainDir, `${stakeType}.json`);

    // Skip if file doesn't exist
    if (!fs.existsSync(inputFile)) {
      continue;
    }

    const items = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
    const typeName = TYPE_NAMES[stakeType] || stakeType;

    const list = buildList({
      name: `Quickswap ${typeName} - ${chainConfig.name}`,
      chainId: chainConfig.chainId,
      logoURI: chainConfig.logoURI,
      items
    });

    const outputFile = path.join(BUILD_DIR, `${chainKey}.${stakeType}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(list, null, 2) + '\n', 'utf8');

    console.log(`✅ ${chainConfig.name} ${typeName}: ${list.active.length} active, ${list.closed.length} closed → ${path.basename(outputFile)}`);
    totalFiles++;
  }
}

if (totalFiles === 0) {
  console.error('❌ No staking data found. Check src/chains/<chain>/<type>.json files.');
  process.exit(1);
}

console.log(`\n🎉 Built ${totalFiles} staking lists`);
