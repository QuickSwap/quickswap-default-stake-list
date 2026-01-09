# @quickswap-defi/staking-list

Official Quickswap staking list (Syrups, LP farms, Dual farms) for multiple chains.

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

```text
src/chains/
  polygon/
    syrups.json      # Syrup pools
    lpfarms.json     # LP farms
    dualfarms.json   # Dual farms
  base/
    syrups.json
    lpfarms.json
    dualfarms.json
```

### Syrup Pool Schema

Each syrup entry requires these fields:

```json
{
  "token": "0x...",              // Reward token address
  "stakingRewardAddress": "0x...", // Staking contract address (unique identifier)
  "name": "Stake QUICK - Earn USDC",
  "stakingToken": "0x...",       // Token users stake
  "baseToken": "0x...",          // Base token for price calculation
  "rate": 0.000002,              // Reward rate per second
  "ending": 1764482107,          // Unix timestamp when pool ends
  "lp": "",                      // LP token address (if applicable)
  "sponsored": false,            // Whether pool is sponsored
  "link": ""                     // External link (optional)
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

The sync script merges `active` + `closed` into a single array — classification happens automatically at build time.

#### Option 2: Edit source files directly

For manual additions:

```bash
# Edit the source file
vim src/chains/base/syrups.json

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

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build all lists
npm run build
```

## Disclaimer

Note filing an issue does not guarantee addition to this default staking list.
We do not review syrup/LP farm/Dual farm addition requests in any particular order, and we do not
guarantee that we will review your request to add the syrup/LP farm/Dual farm to the default list.
