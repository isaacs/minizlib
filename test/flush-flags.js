import t from 'tap'
import { Gzip, constants } from '../dist/esm/index.js'

t.doesNotThrow(_ => new Gzip({ flush: constants.Z_SYNC_FLUSH }))
t.throws(_ => new Gzip({ flush: 'foobar' }))
t.throws(_ => new Gzip({ flush: 10000 }))
t.doesNotThrow(_ => new Gzip({ finishFlush: constants.Z_SYNC_FLUSH }))
t.throws(_ => new Gzip({ finishFlush: 'foobar' }))
t.throws(_ => new Gzip({ finishFlush: 10000 }))
