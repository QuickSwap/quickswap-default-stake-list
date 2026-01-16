const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const { CHAINS, STAKE_TYPES, getChainKeyByChainId } = require('../src/lib/constants');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const BUILD_DIR = path.join(__dirname, '..', 'build');

describe('Source Data Validation', () => {
  for (const stakeType of STAKE_TYPES) {
    const inputFile = path.join(DATA_DIR, `${stakeType}.json`);

    // Skip types without data file
    if (!fs.existsSync(inputFile)) continue;

    // Load data at test definition time (synchronous)
    const dataByChain = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

    describe(`src/data/${stakeType}.json`, () => {
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
    });
  }
});

describe('Build Output Validation', () => {
  // First, run build to ensure output exists
  before(function() {
    this.timeout(10000);
    const { execSync } = require('child_process');
    execSync('npm run build', { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
  });

  for (const stakeType of STAKE_TYPES) {
    const buildFile = path.join(BUILD_DIR, `${stakeType}.json`);

    describe(`build/${stakeType}.json`, () => {
      let output;

      before(() => {
        output = JSON.parse(fs.readFileSync(buildFile, 'utf8'));
      });

      it('exists and is valid JSON', () => {
        expect(fs.existsSync(buildFile)).to.be.true;
        expect(output).to.be.an('object');
      });

      it('has required top-level fields', () => {
        expect(output.name).to.be.a('string');
        expect(output.timestamp).to.be.a('string');
        expect(output.version).to.be.an('object');
        expect(output.version.major).to.be.a('number');
        expect(output.version.minor).to.be.a('number');
        expect(output.version.patch).to.be.a('number');
        expect(output.chains).to.be.an('object');
      });

      it('version matches package.json', () => {
        const packageJson = require('../package.json');
        const expectedVersion = packageJson.version;
        const outputVersion = `${output.version.major}.${output.version.minor}.${output.version.patch}`;
        expect(outputVersion).to.equal(expectedVersion);
      });

      it('contains all supported chains', () => {
        for (const [chainKey, chainConfig] of Object.entries(CHAINS)) {
          const chainIdStr = String(chainConfig.chainId);
          expect(output.chains[chainIdStr], `Missing chain ${chainIdStr}`).to.be.an('object');
        }
      });

      // Test each chain's data
      for (const [chainKey, chainConfig] of Object.entries(CHAINS)) {
        const chainIdStr = String(chainConfig.chainId);

        describe(`chains.${chainIdStr} (${chainConfig.name})`, () => {
          it('has correct structure', function() {
            const chainData = output.chains[chainIdStr];
            expect(chainData.name).to.equal(chainConfig.name);
            expect(chainData.chainId).to.equal(chainConfig.chainId);
            expect(chainData.active).to.be.an('array');
            expect(chainData.closed).to.be.an('array');
          });

          it('classifies items correctly by ending timestamp', function() {
            const chainData = output.chains[chainIdStr];
            const nowSeconds = Math.floor(Date.now() / 1000);

            for (const item of chainData.active) {
              if (typeof item.ending === 'number') {
                expect(item.ending, `Active item should have ending >= now`).to.be.at.least(nowSeconds);
              }
            }

            for (const item of chainData.closed) {
              expect(item.ending, `Closed item should have ending field`).to.be.a('number');
              expect(item.ending, `Closed item should have ending < now`).to.be.lessThan(nowSeconds);
            }
          });
        });
      }
    });
  }
});
