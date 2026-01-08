const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const { CHAINS, STAKE_TYPES } = require('../src/lib/constants');
const { buildList } = require('../src/lib/buildList');

const SRC_DIR = path.join(__dirname, '..', 'src', 'chains');

describe('Staking Lists', () => {
  for (const [chainKey, chainConfig] of Object.entries(CHAINS)) {
    const chainDir = path.join(SRC_DIR, chainKey);

    // Skip chains without data
    if (!fs.existsSync(chainDir)) continue;

    describe(`${chainConfig.name} (chainId: ${chainConfig.chainId})`, () => {
      for (const stakeType of STAKE_TYPES) {
        const inputFile = path.join(chainDir, `${stakeType}.json`);

        // Skip types without data
        if (!fs.existsSync(inputFile)) continue;

        describe(stakeType, () => {
          let items;
          let list;

          before(() => {
            items = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
            list = buildList({
              name: `Test ${stakeType}`,
              chainId: chainConfig.chainId,
              logoURI: chainConfig.logoURI,
              items
            });
          });

          it('contains no duplicate stakingRewardAddress', () => {
            const seen = new Set();
            const allItems = [...list.active, ...list.closed];

            for (const item of allItems) {
              const addr = item.stakingRewardAddress?.toLowerCase();
              if (!addr) continue;

              expect(seen.has(addr), `Duplicate stakingRewardAddress: ${addr}`).to.be.false;
              seen.add(addr);
            }
          });

          it('all items have required stakingRewardAddress field', () => {
            const allItems = [...list.active, ...list.closed];

            for (const [idx, item] of allItems.entries()) {
              expect(item.stakingRewardAddress, `Item ${idx} missing stakingRewardAddress`).to.be.a('string');
              expect(item.stakingRewardAddress.length, `Item ${idx} has empty stakingRewardAddress`).to.be.greaterThan(0);
            }
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
