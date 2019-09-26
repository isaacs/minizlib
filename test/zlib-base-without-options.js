// this should be pretty hard to hit, since the class isn't exposed,
// but just in case, it checks, so we should test that check.
const zlib = require('../')
const ZlibBase = Object.getPrototypeOf(Object.getPrototypeOf(
  zlib.Unzip.prototype
)).constructor

const t = require('tap')

t.throws(() => new ZlibBase(), {
  message: 'invalid options for ZlibBase constructor',
})

t.throws(() => new ZlibBase(null), {
  message: 'invalid options for ZlibBase constructor',
})

t.throws(() => new ZlibBase(42069), {
  message: 'invalid options for ZlibBase constructor',
})
