const { version } = require('../package.json');
const active = require('./lpfarms/active.json');
const ended = require('./lpfarms/ended.json');

module.exports = function buildList() {
  const parsed = version.split('.');
  return {
    'name': 'Quickswap LP Farms',
    'timestamp': (new Date().toISOString()),
    'version': {
      'major': +parsed[ 0 ],
      'minor': +parsed[ 1 ],
      'patch': +parsed[ 2 ]
    },
    'tags': {},
    'logoURI': 'ipfs://QmQ9GCVmLQkbPohxKeCYkbpmwfTvHXrY64TmBsPQAZdbqZ',
    'keywords': [
      'uniswap',
      'default'
    ],
    lpFarms: [
      ...active,
      ...ended
    ]
  };
};
