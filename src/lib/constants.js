/**
 * Chain configuration and constants
 */

const CHAINS = {
  polygon: {
    chainId: 137,
    name: 'Polygon',
    logoURI: 'ipfs://QmQ9GCVmLQkbPohxKeCYkbpmwfTvHXrY64TmBsPQAZdbqZ'
  },
  base: {
    chainId: 8453,
    name: 'Base',
    logoURI: 'ipfs://QmQ9GCVmLQkbPohxKeCYkbpmwfTvHXrY64TmBsPQAZdbqZ'
  }
};

const STAKE_TYPES = ['syrups', 'lpfarms', 'dualfarms'];

module.exports = { CHAINS, STAKE_TYPES };
