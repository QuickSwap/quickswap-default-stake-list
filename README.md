# @quickswap-defi/staking-list

[![npm version](https://img.shields.io/npm/v/@quickswap-defi/staking-list.svg)](https://www.npmjs.com/package/@quickswap-defi/staking-list)
[![npm downloads](https://img.shields.io/npm/dm/@quickswap-defi/staking-list.svg)](https://www.npmjs.com/package/@quickswap-defi/staking-list)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL%203.0-blue.svg)](https://opensource.org/licenses/GPL-3.0)
[![Security](https://img.shields.io/badge/provenance-verified-brightgreen)](https://docs.npmjs.com/generating-provenance-statements)

Official QuickSwap staking list for multi-chain DeFi applications. Includes curated Syrup pools, LP farms, and Dual farms metadata for Polygon, Base, and other supported networks.

---

## Migration Notice

**Former package name:** `quickswap-default-staking-list-address` (deprecated)  
**New package name:** `@quickswap-defi/staking-list`

---

## Installation

```bash
npm install @quickswap-defi/staking-list
```

## Supported Chains

| Chain   | chainId | Status |
|---------|---------|--------|
| Polygon | 137     | ✅     |
| Base    | 8453    | ✅     |

## Outputs

This package publishes pre-built JSON artifacts per chain:

```text
build/
  polygon.syrups.json
  polygon.lpfarms.json
  polygon.dualfarms.json
  base.syrups.json
  base.lpfarms.json
  base.dualfarms.json
```

Each file contains:

```json
{
  "name": "Quickswap Syrups - Polygon",
  "chainId": 137,
  "timestamp": "2025-01-08T...",
  "version": { "major": 1, "minor": 0, "patch": 0 },
  "active": [ ... ],
  "closed": [ ... ]
}
```

## Usage

```javascript
// Import specific chain/type
const polygonSyrups = require('@quickswap-defi/staking-list/build/polygon.syrups.json');
const baseSyrups = require('@quickswap-defi/staking-list/build/base.syrups.json');

console.log(`Active syrups on Polygon: ${polygonSyrups.active.length}`);
console.log(`Closed syrups on Polygon: ${polygonSyrups.closed.length}`);
```

## Adding New Staking Data

### Directory Structure

All staking data is stored in unified JSON files keyed by chainId:

```text
src/data/
  syrups.json      # All Syrup pools (all chains)
  lpfarms.json     # All LP farms (all chains)
  dualfarms.json   # All Dual farms (all chains)
```

Data is organized by chainId for easy navigation:

```json
{
  "137": [
    { "stakingRewardAddress": "0x...", ... },
    { "stakingRewardAddress": "0x...", ... }
  ],
  "8453": [
    { "stakingRewardAddress": "0x...", ... }
  ]
}
```

The build process reads each chain's array and generates per-chain output files.

### Syrup Pool Schema

Each syrup entry requires these fields (placed under the appropriate chainId key):

```json
{
  "token": "0x...",               // Reward token address
  "stakingRewardAddress": "0x...", // Staking contract address (unique per chain)
  "name": "Stake QUICK - Earn USDC",
  "stakingToken": "0x...",        // Token users stake
  "baseToken": "0x...",           // Base token for price calculation
  "rate": 0.000002,               // Reward rate per second
  "ending": 1764482107,           // Unix timestamp when pool ends
  "lp": "",                       // LP token address (if applicable)
  "sponsored": false,             // Whether pool is sponsored
  "link": ""                      // External link (optional)
}
```

### How to Add New Pools

#### Option 1: Sync from deployment file (recommended)

Import data directly from a deployment JSON file:

```bash
npm run sync -- --in <path-to-deployment.json> --chain <chain> --type <type>
```

**Example:** Import Base syrups from `syrup-staking-contract`:

```bash
npm run sync -- \
  --in ../syrup-staking-contract/deployments/syrup-base.json \
  --chain base \
  --type syrups

npm test
npm run build
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `--in` | Path to input deployment JSON file |
| `--chain` | Target chain: `polygon`, `base` |
| `--type` | Staking type: `syrups`, `lpfarms`, `dualfarms` |
| `--merge` | Merge with existing data (default: `true`) |

**Input file format** (from deployment repos):

```json
{
  "active": [ { ... } ],
  "closed": [ { ... } ]
}
```

The sync script:
1. Adds `chainId` to each item automatically
2. Merges into the unified data file (e.g., `src/data/syrups.json`)
3. Preserves items from other chains

#### Option 2: Edit source files directly

For manual additions:

```bash
# Edit the unified data file
vim src/data/syrups.json

# Make sure to include chainId in each new item!

# Validate and build
npm test
npm run build
```

#### Commit and publish

```bash
git add .
git commit -m "feat(base): add QUICK-USDC syrup pool"
git push
```

### Automatic Active/Closed Classification

Items are classified automatically at build time based on the `ending` timestamp:

| Condition | Classification |
|-----------|----------------|
| `ending` < now | `closed` |
| `ending` >= now | `active` |
| No `ending` field | `active` |

You never need to manually move items between active/closed — just set the `ending` timestamp correctly.

## Adding a New Chain

To add support for a new chain:

1. Add the chain configuration to `src/lib/constants.js`:

```javascript
const CHAINS = {
  polygon: { chainId: 137, name: 'Polygon', logoURI: '...' },
  base: { chainId: 8453, name: 'Base', logoURI: '...' },
  newchain: { chainId: 12345, name: 'NewChain', logoURI: '...' }  // Add here
};
```

2. Add staking items with the new `chainId` to the data files
3. Run `npm test && npm run build` to validate

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build all lists
npm run build

# Sync from deployment file
npm run sync -- --in <path> --chain <chain> --type <type>
```

## Disclaimer

Note filing an issue does not guarantee addition to this default staking list.
We do not review syrup/LP farm/Dual farm addition requests in any particular order, and we do not
guarantee that we will review your request to add the syrup/LP farm/Dual farm to the default list.
