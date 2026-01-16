#!/usr/bin/env node
/**
 * Build all staking lists for all chains.
 * 
 * Reads unified data files from src/data/<type>.json (keyed by chainId)
 * and outputs per-chain files to build/<chain>.<type>.json
 * 
 * Data file format:
 *   {
 *     "137": [...polygon items...],
 *     "8453": [...base items...]
 *   }
 * 
 * Example output:
 *   build/polygon.syrups.json
 *   build/polygon.lpfarms.json
 *   build/base.syrups.json
 */

const fs = require('fs');
const path = require('path');
const { CHAINS, STAKE_TYPES, getChainKeyByChainId } = require('./lib/constants');
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

  // Build output for each chain in the data file
  for (const [chainIdStr, chainItems] of Object.entries(dataByChain)) {
    const chainId = parseInt(chainIdStr, 10);
    const chainKey = getChainKeyByChainId(chainId);
    
    if (!chainKey) {
      console.warn(`⚠️  Unknown chainId ${chainId} in ${stakeType}.json, skipping`);
      continue;
    }

    const chainConfig = CHAINS[chainKey];

    // Skip if no items for this chain
    if (!chainItems || chainItems.length === 0) {
      continue;
    }

    const list = buildList({
      name: `Quickswap ${typeName} - ${chainConfig.name}`,
      chainId: chainConfig.chainId,
      logoURI: chainConfig.logoURI,
      items: chainItems
    });

    const outputFile = path.join(BUILD_DIR, `${chainKey}.${stakeType}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(list, null, 2) + '\n', 'utf8');

    console.log(`✅ ${chainConfig.name} ${typeName}: ${list.active.length} active, ${list.closed.length} closed → ${path.basename(outputFile)}`);
    totalFiles++;
  }
}

if (totalFiles === 0) {
  console.error('❌ No staking data found. Check src/data/<type>.json files.');
  process.exit(1);
}

console.log(`\n🎉 Built ${totalFiles} staking lists`);
