const { version } = require('../package.json');
const active = require('./syrups/active.json');
const ended = require('./syrups/ended.json');

module.exports = function buildList() {
  const parsed = version.split('.');
  return {
    'name': 'Quickswap Syrups',
    'timestamp': (new Date().toISOString()),
    'version': {
      'major': +parsed[ 0 ],
      'minor': +parsed[ 1 ],
      'patch': +parsed[ 2 ]
    },
    'tags': {},
    'logoURI': 'ipfs://QmQ9GCVmLQkbPohxKeCYkbpmwfTvHXrY64TmBsPQAZdbqZ',
    'keywords': [
      'quickswap',
      'default'
    ],
    active: [
      ...active
    ],
    closed: [
      ...ended
    ]
  };
};
