'use strict'
const t = require('tap')
const zlib = require('../')

t.doesNotThrow(_ =>
  new zlib.Gzip({ flush: zlib.constants.Z_SYNC_FLUSH }))

t.throws(
  _ => new zlib.Gzip({ flush: 'foobar' }),
  new Error('Invalid flush flag: foobar'))

t.throws(
  _ => new zlib.Gzip({ flush: 10000 }),
  new Error('Invalid flush flag: 10000'))

t.doesNotThrow(_ =>
  new zlib.Gzip({ finishFlush: zlib.constants.Z_SYNC_FLUSH }))

t.throws(
  _ => new zlib.Gzip({ finishFlush: 'foobar' }),
  new Error('Invalid flush flag: foobar'))

t.throws(
  _ => new zlib.Gzip({ finishFlush: 10000 }),
  new Error('Invalid flush flag: 10000'))
