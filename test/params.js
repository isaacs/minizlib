import t from 'tap'
import { constants, DeflateRaw } from '../dist/esm/index.js'
import fs from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const fixtures = fileURLToPath(new URL('fixtures', import.meta.url))
const file = fs.readFileSync(resolve(fixtures, 'person.jpg'))
const chunkSize = 12 * 1024
const opts = { level: 9, strategy: constants.Z_DEFAULT_STRATEGY }
const deflater = new DeflateRaw(opts)

const chunk1 = file.subarray(0, chunkSize)
const chunk2 = file.subarray(chunkSize)
const blkhdr = Buffer.from([0x00, 0x5a, 0x82, 0xa5, 0x7d])
const expected = Buffer.concat([blkhdr, chunk2])
let actual

deflater.write(chunk1)
do {} while (deflater.read())

// twice should be no-op
deflater.params(0, constants.Z_DEFAULT_STRATEGY)
deflater.params(0, constants.Z_DEFAULT_STRATEGY)

do {} while (deflater.read())
deflater.write(chunk2)
const bufs = []
for (let buf; (buf = deflater.read()); bufs.push(buf));
actual = Buffer.concat(bufs)

t.same({ ...actual }, expected)

t.throws(_ => deflater.params(Infinity))
t.throws(_ => deflater.params(0, 'nope'))
deflater.end()
deflater.read()
deflater.close()
deflater.close()
deflater.close()

t.throws(
  _ => deflater.params(0, 0),
  new Error('cannot switch params when binding is closed'),
)
