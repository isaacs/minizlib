// this should be pretty hard to hit, since the class isn't exposed,
// but just in case, it checks, so we should test that check.
import t from 'tap'
import { Unzip } from '../dist/esm/index.js'

const ZlibBase = Object.getPrototypeOf(
  Object.getPrototypeOf(Unzip.prototype),
).constructor

t.throws(() => new ZlibBase(), {
  message: 'invalid options for ZlibBase constructor',
})

t.throws(() => new ZlibBase(null), {
  message: 'invalid options for ZlibBase constructor',
})

t.throws(() => new ZlibBase(42069), {
  message: 'invalid options for ZlibBase constructor',
})
