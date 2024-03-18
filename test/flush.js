import t from 'tap'
import { Deflate, constants } from '../dist/esm/index.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
const fixtures = fileURLToPath(new URL('fixtures', import.meta.url))

const file = fs.readFileSync(path.resolve(fixtures, 'person.jpg'))
const chunkSize = 16
const opts = { level: 0 }
const deflater = new Deflate(opts)

const chunk = file.subarray(0, chunkSize)
const expectedNone = Buffer.from([0x78, 0x01])
const blkhdr = Buffer.from([0x00, 0x10, 0x00, 0xef, 0xff])
const adler32 = Buffer.from([0x00, 0x00, 0x00, 0xff, 0xff])
const expectedFull = Buffer.concat([blkhdr, chunk, adler32])
let actualNone
let actualFull

deflater.write(chunk)
deflater.flush(constants.Z_NO_FLUSH)
actualNone = deflater.read()
deflater.flush()
const bufs = []
let buf
while ((buf = deflater.read())) {
  bufs.push(buf)
}
actualFull = Buffer.concat(bufs)

t.same(actualNone, expectedNone)
t.same(actualFull, expectedFull)

deflater.end()
deflater.flush()
t.not(deflater.read(), null)
t.ok(deflater.ended)
deflater.flush()
t.equal(deflater.read(), null)
