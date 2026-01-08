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

1. Edit the appropriate source file in `src/chains/<chain>/<type>.json`
2. Run tests: `npm test`
3. Build: `npm run build`
4. Commit and push

### Automatic Active/Closed Classification

Items are automatically classified based on the `ending` timestamp:

- If `ending` < now → **closed**
- If `ending` >= now or no `ending` field → **active**

This means you don't need to manually move items between active/closed arrays.

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
