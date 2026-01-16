const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const { CHAINS, STAKE_TYPES, getChainKeyByChainId } = require('../src/lib/constants');
const { buildList } = require('../src/lib/buildList');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');

describe('Staking Lists', () => {
  for (const stakeType of STAKE_TYPES) {
    const inputFile = path.join(DATA_DIR, `${stakeType}.json`);

    // Skip types without data file
    if (!fs.existsSync(inputFile)) continue;

    // Load data at test definition time (synchronous)
    const dataByChain = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

    describe(stakeType, () => {
      it('is a valid JSON object with chainId keys', () => {
        expect(dataByChain).to.be.an('object');
        expect(dataByChain).to.not.be.an('array');
      });

      it('all chainId keys are valid and exist in CHAINS', () => {
        const validChainIds = Object.values(CHAINS).map(c => String(c.chainId));
        for (const chainIdStr of Object.keys(dataByChain)) {
          expect(validChainIds, `Invalid chainId key: ${chainIdStr}`).to.include(chainIdStr);
        }
      });

      it('all chain arrays contain valid items with stakingRewardAddress', () => {
        for (const [chainIdStr, items] of Object.entries(dataByChain)) {
          expect(items, `${chainIdStr} should be an array`).to.be.an('array');
          
          for (const [idx, item] of items.entries()) {
            expect(item.stakingRewardAddress, `Chain ${chainIdStr} item ${idx} missing stakingRewardAddress`).to.be.a('string');
            expect(item.stakingRewardAddress.length, `Chain ${chainIdStr} item ${idx} has empty stakingRewardAddress`).to.be.greaterThan(0);
          }
        }
      });

      it('contains no duplicate stakingRewardAddress within each chain', () => {
        for (const [chainIdStr, items] of Object.entries(dataByChain)) {
          const seen = new Set();
          for (const item of items) {
            const addr = item.stakingRewardAddress?.toLowerCase();
            expect(seen.has(addr), `Chain ${chainIdStr} has duplicate: ${addr}`).to.be.false;
            seen.add(addr);
          }
        }
      });

      // Test per-chain builds
      for (const [chainIdStr, chainItems] of Object.entries(dataByChain)) {
        const chainId = parseInt(chainIdStr, 10);
        const chainKey = getChainKeyByChainId(chainId);
        
        if (!chainKey || chainItems.length === 0) continue;
        
        const chainConfig = CHAINS[chainKey];

        describe(`${chainConfig.name} (chainId: ${chainConfig.chainId})`, () => {
          let list;

          before(() => {
            list = buildList({
              name: `Test ${stakeType}`,
              chainId: chainConfig.chainId,
              logoURI: chainConfig.logoURI,
              items: chainItems
            });
          });

          it('classifies items correctly by ending timestamp', () => {
            const nowSeconds = Math.floor(Date.now() / 1000);

            for (const item of list.active) {
              // Active items should have no ending or ending in the future
              if (typeof item.ending === 'number') {
                expect(item.ending, `Active item should have ending >= now`).to.be.at.least(nowSeconds);
              }
            }

            for (const item of list.closed) {
              // Closed items should have ending in the past
              expect(item.ending, `Closed item should have ending field`).to.be.a('number');
              expect(item.ending, `Closed item should have ending < now`).to.be.lessThan(nowSeconds);
            }
          });

          it('version matches package.json', () => {
            const packageJson = require('../package.json');
            const expectedVersion = packageJson.version;
            const listVersion = `${list.version.major}.${list.version.minor}.${list.version.patch}`;

            expect(listVersion).to.equal(expectedVersion);
          });

          it('has correct chainId', () => {
            expect(list.chainId).to.equal(chainConfig.chainId);
          });
        });
      }
    });
  }
});
