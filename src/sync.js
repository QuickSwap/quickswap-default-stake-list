#!/usr/bin/env node
/**
 * Sync staking data from external deployment files.
 *
 * Usage:
 *   node src/sync.js --in <path> --chain <chain> --type <type>
 *
 * Examples:
 *   node src/sync.js --in ../syrup-staking-contract/deployments/syrup-base.json --chain base --type syrups
 *   node src/sync.js --in ./polygon-farms.json --chain polygon --type lpfarms
 *
 * Input file format (from deployment repos):
 *   {
 *     "name": "...",
 *     "active": [ { ... } ],
 *     "closed": [ { ... } ]
 *   }
 *
 * Data is stored in unified files keyed by chainId:
 *   {
 *     "137": [...polygon items...],
 *     "8453": [...base items...]
 *   }
 */

const fs = require('fs');
const path = require('path');
const { CHAINS, STAKE_TYPES } = require('./lib/constants');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const val = argv[i + 1];
    if (!val || val.startsWith('--')) continue;
    args[key] = val;
    i++;
  }
  return args;
}

function normalizeAddress(addr) {
  return typeof addr === 'string' ? addr.toLowerCase() : addr;
}

function stableSort(items) {
  return [...items].sort((a, b) => {
    const keyA = normalizeAddress(a.stakingRewardAddress) || '';
    const keyB = normalizeAddress(b.stakingRewardAddress) || '';
    return keyA.localeCompare(keyB);
  });
}

function printUsage() {
  console.log(`
Usage:
  node src/sync.js --in <path> --chain <chain> --type <type>

Arguments:
  --in      Path to input deployment JSON file (required)
  --chain   Target chain: ${Object.keys(CHAINS).join(', ')} (required)
  --type    Staking type: ${STAKE_TYPES.join(', ')} (required)
  --merge   Merge with existing data instead of replacing (optional, default: true)

Examples:
  node src/sync.js --in ../syrup-staking-contract/deployments/syrup-base.json --chain base --type syrups
  node src/sync.js --in ./polygon-farms.json --chain polygon --type lpfarms --merge false
`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  const inputPath = args.in;
  const chain = args.chain;
  const type = args.type;
  const merge = args.merge !== 'false'; // Default: true

  if (!inputPath || !chain || !type) {
    console.error('❌ Missing required arguments\n');
    printUsage();
    process.exit(1);
  }

  if (!CHAINS[chain]) {
    console.error(`❌ Unknown chain: ${chain}`);
    console.error(`   Valid chains: ${Object.keys(CHAINS).join(', ')}`);
    process.exit(1);
  }

  if (!STAKE_TYPES.includes(type)) {
    console.error(`❌ Unknown type: ${type}`);
    console.error(`   Valid types: ${STAKE_TYPES.join(', ')}`);
    process.exit(1);
  }

  const chainConfig = CHAINS[chain];
  const chainIdStr = String(chainConfig.chainId);

  const absoluteInput = path.resolve(inputPath);
  if (!fs.existsSync(absoluteInput)) {
    console.error(`❌ Input file not found: ${absoluteInput}`);
    process.exit(1);
  }

  const inputData = JSON.parse(fs.readFileSync(absoluteInput, 'utf8'));

  // Accept either a bare array or an { active, closed } object
  let newItems = [];
  if (Array.isArray(inputData)) {
    newItems = inputData;
  } else {
    const active = Array.isArray(inputData.active) ? inputData.active : [];
    const closed = Array.isArray(inputData.closed) ? inputData.closed : [];
    newItems = [...active, ...closed];
  }

  for (const [idx, item] of newItems.entries()) {
    if (!item || typeof item !== 'object') {
      console.error(`❌ Item ${idx} is not an object`);
      process.exit(1);
    }
    if (!item.stakingRewardAddress) {
      console.error(`❌ Item ${idx} missing required field: stakingRewardAddress`);
      process.exit(1);
    }
  }

  const outputPath = path.join(__dirname, 'data', `${type}.json`);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  let dataByChain = {};
  if (fs.existsSync(outputPath)) {
    dataByChain = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  }

  const existingItems = dataByChain[chainIdStr] || [];

  let finalItems = [];
  if (merge && existingItems.length > 0) {
    const existingMap = new Map();
    for (const item of existingItems) {
      const key = normalizeAddress(item.stakingRewardAddress);
      existingMap.set(key, item);
    }

    for (const item of newItems) {
      const key = normalizeAddress(item.stakingRewardAddress);
      existingMap.set(key, item); // Overwrites existing entry with same address
    }

    finalItems = Array.from(existingMap.values());
    console.log(`📦 Merged ${newItems.length} items into existing ${existingItems.length} items`);
  } else {
    finalItems = newItems;
    console.log(`📦 Replacing ${chain} with ${newItems.length} items`);
  }

  dataByChain[chainIdStr] = stableSort(finalItems);

  fs.writeFileSync(outputPath, JSON.stringify(dataByChain, null, 2) + '\n', 'utf8');

  console.log(`✅ Wrote ${finalItems.length} items for ${chainConfig.name} → ${outputPath}`);
  console.log(`\nNext steps:`);
  console.log(`  npm test        # Validate`);
  console.log(`  npm run build   # Build all lists`);
}

main();
