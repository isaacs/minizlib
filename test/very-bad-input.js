const fs = require('fs')
const zlib = require('../')
const data = Buffer.concat([Buffer.from([0x1f, 0x8b]), fs.readFileSync(__filename)])
const stream = new zlib.Unzip()
const t = require('tap')
stream.on('error', er => {
  const level = zlib.constants.Z_DEFAULT_LEVEL
  const strategy = zlib.constants.Z_DEFAULT_STRATEGY

  // these should be no-ops, and should not throw,
  // because we already raised an error.
  stream.params(level, strategy)
  stream.reset()

  t.match(er, { code: 'Z_DATA_ERROR' })
})
stream.end(data)
