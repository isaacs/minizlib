import t from 'tap'
import { Unzip, constants } from '../dist/esm/index.js'
import fs from 'fs'
import { fileURLToPath } from 'url'

const data = Buffer.concat([
  Buffer.from([0x1f, 0x8b]),
  fs.readFileSync(fileURLToPath(import.meta.url)),
])
const stream = new Unzip()

stream.on('error', er => {
  const level = constants.Z_DEFAULT_LEVEL
  const strategy = constants.Z_DEFAULT_STRATEGY

  // these should be no-ops, and should not throw,
  // because we already raised an error.
  stream.params(level, strategy)
  stream.reset()

  t.match(er, { code: 'Z_DATA_ERROR' })
})
stream.end(data)
