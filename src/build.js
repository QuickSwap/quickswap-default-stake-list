#!/usr/bin/env node
/**
 * Build all staking lists.
 * 
 * Reads unified data files from src/data/<type>.json (keyed by chainId)
 * and outputs unified build files to build/<type>.json
 * 
 * Data file format (input and output):
 *   {
 *     "137": { "name": "...", "active": [...], "closed": [...] },
 *     "8453": { "name": "...", "active": [...], "closed": [...] }
 *   }
 * 
 * Output files:
 *   build/syrups.json
 *   build/lpfarms.json
 *   build/dualfarms.json
 */

const fs = require('fs');
const path = require('path');
const { CHAINS, STAKE_TYPES } = require('./lib/constants');
const { buildList } = require('./lib/buildList');

const DATA_DIR = path.join(__dirname, 'data');
const BUILD_DIR = path.join(__dirname, '..', 'build');

// Ensure build directory exists
fs.mkdirSync(BUILD_DIR, { recursive: true });

// Type display names
const TYPE_NAMES = {
  syrups: 'Syrups',
  lpfarms: 'LP Farms',
  dualfarms: 'Dual Farms'
};

const { version } = require('../package.json');
const parsedVersion = version.split('.');

let totalFiles = 0;

for (const stakeType of STAKE_TYPES) {
  const inputFile = path.join(DATA_DIR, `${stakeType}.json`);

  // Skip if file doesn't exist
  if (!fs.existsSync(inputFile)) {
    console.log(`⏭️  Skipping ${stakeType}: no data file`);
    continue;
  }

  const dataByChain = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  const typeName = TYPE_NAMES[stakeType] || stakeType;

  // Build output object with all chains
  const output = {
    name: `Quickswap ${typeName}`,
    timestamp: new Date().toISOString(),
    version: {
      major: +parsedVersion[0],
      minor: +parsedVersion[1],
      patch: +parsedVersion[2]
    },
    chains: {}
  };

  let totalActive = 0;
  let totalClosed = 0;

  // Process each chain
  for (const [chainKey, chainConfig] of Object.entries(CHAINS)) {
    const chainIdStr = String(chainConfig.chainId);
    const chainItems = dataByChain[chainIdStr] || [];

    const list = buildList({
      name: `Quickswap ${typeName} - ${chainConfig.name}`,
      chainId: chainConfig.chainId,
      logoURI: chainConfig.logoURI,
      items: chainItems
    });

    output.chains[chainIdStr] = {
      name: chainConfig.name,
      chainId: chainConfig.chainId,
      logoURI: chainConfig.logoURI,
      active: list.active,
      closed: list.closed
    };

    totalActive += list.active.length;
    totalClosed += list.closed.length;

    if (list.active.length > 0 || list.closed.length > 0) {
      console.log(`  📦 ${chainConfig.name}: ${list.active.length} active, ${list.closed.length} closed`);
    }
  }

  const outputFile = path.join(BUILD_DIR, `${stakeType}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2) + '\n', 'utf8');

  console.log(`✅ ${typeName}: ${totalActive} active, ${totalClosed} closed → ${path.basename(outputFile)}`);
  totalFiles++;
}

if (totalFiles === 0) {
  console.error('❌ No staking data found. Check src/data/<type>.json files.');
  process.exit(1);
}

console.log(`\n🎉 Built ${totalFiles} staking lists`);
