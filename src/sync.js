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
 * The script merges active + closed into a single array (classification happens at build time).
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

  // Validate arguments
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

  // Read input file
  const absoluteInput = path.resolve(inputPath);
  if (!fs.existsSync(absoluteInput)) {
    console.error(`❌ Input file not found: ${absoluteInput}`);
    process.exit(1);
  }

  const inputData = JSON.parse(fs.readFileSync(absoluteInput, 'utf8'));

  // Extract items from input (support both formats)
  let newItems = [];
  if (Array.isArray(inputData)) {
    // Direct array format
    newItems = inputData;
  } else {
    // Object with active/closed arrays
    const active = Array.isArray(inputData.active) ? inputData.active : [];
    const closed = Array.isArray(inputData.closed) ? inputData.closed : [];
    newItems = [...active, ...closed];
  }

  // Validate items
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

  // Output file
  const outputPath = path.join(__dirname, 'chains', chain, `${type}.json`);

  // Merge or replace
  let finalItems = [];
  if (merge && fs.existsSync(outputPath)) {
    const existingItems = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    
    // Create map of existing items by stakingRewardAddress
    const existingMap = new Map();
    for (const item of existingItems) {
      const key = normalizeAddress(item.stakingRewardAddress);
      existingMap.set(key, item);
    }

    // Add/update with new items
    for (const item of newItems) {
      const key = normalizeAddress(item.stakingRewardAddress);
      existingMap.set(key, item); // Overwrites if exists
    }

    finalItems = Array.from(existingMap.values());
    console.log(`📦 Merged ${newItems.length} items into existing ${existingItems.length} items`);
  } else {
    finalItems = newItems;
    console.log(`📦 Replacing with ${newItems.length} items`);
  }

  // Sort and write
  const sorted = stableSort(finalItems);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(sorted, null, 2) + '\n', 'utf8');

  console.log(`✅ Wrote ${sorted.length} items → ${outputPath}`);
  console.log(`\nNext steps:`);
  console.log(`  npm test        # Validate`);
  console.log(`  npm run build   # Build all lists`);
}

main();
