/**
 * Chain configuration and constants
 * 
 * Unified multichain configuration - all staking data is stored in single
 * files per type (syrups.json, lpfarms.json, dualfarms.json) with chainId field.
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

/**
 * Get chain config by chainId
 * @param {number} chainId 
 * @returns {Object|undefined}
 */
function getChainByChainId(chainId) {
  return Object.values(CHAINS).find(c => c.chainId === chainId);
}

/**
 * Get chain key by chainId (e.g., 137 -> 'polygon')
 * @param {number} chainId 
 * @returns {string|undefined}
 */
function getChainKeyByChainId(chainId) {
  return Object.keys(CHAINS).find(key => CHAINS[key].chainId === chainId);
}

module.exports = { CHAINS, STAKE_TYPES, getChainByChainId, getChainKeyByChainId };
