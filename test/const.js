import t from 'tap'
import { constants } from '../dist/esm/index.js'

t.equal(constants.Z_OK, 0, 'Z_OK should be 0')
try { constants.Z_OK = 1 } catch {}
t.equal(constants.Z_OK, 0, 'Z_OK should still be 0')
t.ok(Object.isFrozen(constants), 'constants should be frozen')
