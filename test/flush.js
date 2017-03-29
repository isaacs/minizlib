'use strict'
const t = require('tap')
const zlib = require('../')
const path = require('path')
const fixtures = path.resolve(__dirname, 'fixtures')
const fs = require('fs')

const file = fs.readFileSync(path.resolve(fixtures, 'person.jpg'))
const chunkSize = 16
const opts = { level: 0 }
const deflater = new zlib.Deflate(opts)

const chunk = file.slice(0, chunkSize)
const expectedNone = Buffer.from([0x78, 0x01])
const blkhdr = Buffer.from([0x00, 0x10, 0x00, 0xef, 0xff])
const adler32 = Buffer.from([0x00, 0x00, 0x00, 0xff, 0xff])
const expectedFull = Buffer.concat([blkhdr, chunk, adler32])
let actualNone
let actualFull

deflater.write(chunk)
deflater.flush(zlib.constants.Z_NO_FLUSH)
actualNone = deflater.read()
deflater.flush()
const bufs = []
let buf
while (buf = deflater.read()) {
  bufs.push(buf)
}
actualFull = Buffer.concat(bufs)

t.same(actualNone, expectedNone)
t.same(actualFull, expectedFull)

deflater.end()
deflater.flush()
t.notEqual(deflater.read(), null)
t.ok(deflater.ended)
deflater.flush()
t.equal(deflater.read(), null)
