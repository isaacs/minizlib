const t = require('tap')
const zlib = require('../')

t.equal(zlib.constants.Z_OK, 0, 'Z_OK should be 0')
zlib.constants.Z_OK = 1
t.equal(zlib.constants.Z_OK, 0, 'Z_OK should still be 0')
t.ok(Object.isFrozen(zlib.constants), 'zlib.constants should be frozen')
