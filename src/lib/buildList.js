/**
 * Generic list builder for staking data.
 * 
 * Classifies items as active/closed based on `ending` timestamp.
 * - If `ending` < now → closed
 * - If `ending` >= now OR no `ending` field → active
 */

const { version } = require('../../package.json');

/**
 * @param {Object} options
 * @param {string} options.name - List name (e.g., "Quickswap Syrups - Polygon")
 * @param {number} options.chainId - Chain ID
 * @param {string} options.logoURI - Logo URI
 * @param {Array} options.items - All items (will be classified by ending timestamp)
 * @returns {Object} Formatted list with active/closed arrays
 */
function buildList({ name, chainId, logoURI, items }) {
  const parsed = version.split('.');
  const nowSeconds = Math.floor(Date.now() / 1000);

  const active = [];
  const closed = [];

  for (const item of items) {
    // Classify by `ending` timestamp
    // If no `ending` or `ending` is in the future → active
    // If `ending` is in the past → closed
    const ending = item.ending;
    const isEnded = typeof ending === 'number' && ending < nowSeconds;

    if (isEnded) {
      closed.push(item);
    } else {
      active.push(item);
    }
  }

  return {
    name,
    chainId,
    timestamp: new Date().toISOString(),
    version: {
      major: +parsed[0],
      minor: +parsed[1],
      patch: +parsed[2]
    },
    logoURI,
    keywords: ['quickswap', 'staking'],
    active,
    closed
  };
}

module.exports = { buildList };
