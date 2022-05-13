const packageJson = require('../package.json');
const { expect } = require('chai');
const Ajv = require('ajv');
const buildListSyrup = require('../src/buildListSyrup');
const buildListLPFarm = require('../src/buildListLPFarm');
const buildListDualFarm = require('../src/buildListDualFarm');

const ajv = new Ajv({ allErrors: true, format: 'full' });

describe('buildList', () => {
  const defaultSyrupList = buildListSyrup();
  const defaultLPFarmList = buildListLPFarm();
  const defaultDualFarmList = buildListDualFarm();

  it('contains no duplicate addresses', () => {
    const mapSyrup = {};
    const mapLPFarm = {};
    const mapDualFarm = {};
    for (let syrup of defaultSyrupList.syrups) {
      const key = syrup.stakingRewardAddress;
      expect(typeof mapSyrup[ key ])
        .to.equal('undefined');
      mapSyrup[ key ] = true;
    }
    for (let dualfarm of defaultDualFarmList.dualFarms) {
      const key = dualfarm.stakingRewardAddress;
      expect(typeof mapDualFarm[ key ])
        .to.equal('undefined');
      mapDualFarm[ key ] = true;
    }
    for (let lpfarm of defaultLPFarmList.lpFarms) {
      const key = lpfarm.stakingRewardAddress;
      expect(typeof mapLPFarm[ key ])
        .to.equal('undefined');
      mapLPFarm[ key ] = true;
    }
  });

  it('contains no duplicate symbols', () => {
    const mapSyrup = {};
    const mapLPFarm = {};
    const mapDualFarm = {};
    for (let syrup of defaultSyrupList.syrups) {
      const key = `${syrup.token}-${syrup.stakingToken}`;
      expect(typeof mapSyrup[ key ])
        .to.equal('undefined');
      mapSyrup[ key ] = true;
    }
    for (let dualfarm of defaultDualFarmList.dualFarms) {
      const key = `${dualfarm.tokens[0]}-${dualfarm.tokens[1]}`;
      expect(typeof mapDualFarm[ key ])
        .to.equal('undefined');
      mapDualFarm[ key ] = true;
    }
    for (let lpfarm of defaultLPFarmList.lpFarms) {
      const key = `${lpfarm.tokens[0]}-${lpfarm.tokens[1]}`;
      expect(typeof mapLPFarm[ key ])
        .to.equal('undefined');
      mapLPFarm[ key ] = true;
    }
  })

  it('version matches package.json', () => {
    expect(packageJson.version).to.match(/^\d+\.\d+\.\d+$/);
    expect(packageJson.version).to.equal(`${defaultSyrupList.version.major}.${defaultSyrupList.version.minor}.${defaultSyrupList.version.patch}`);
    expect(packageJson.version).to.equal(`${defaultDualFarmList.version.major}.${defaultDualFarmList.version.minor}.${defaultDualFarmList.version.patch}`);
    expect(packageJson.version).to.equal(`${defaultLPFarmList.version.major}.${defaultLPFarmList.version.minor}.${defaultLPFarmList.version.patch}`);
  });
});