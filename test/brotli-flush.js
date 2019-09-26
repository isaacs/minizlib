'use strict';
const t = require('tap')
if (!require('zlib').BrotliDecompress) {
  t.plan(0, 'brotli not supported')
  process.exit(0)
}
const zlib = require('../')
const {resolve} = require('path')
const fixture = resolve(__dirname, 'fixtures/person.jpg')
const fs = require('fs')
const file = fs.readFileSync(fixture)
const chunkSize = 16;
const deflater = new zlib.BrotliCompress();

const chunk = file.slice(0, chunkSize);
const expectedFull = Buffer.from('iweA/9j/4AAQSkZJRgABAQEASA==', 'base64');

deflater.write(chunk)
deflater.flush()
const bufs = []
deflater.on('data', b => bufs.push(b))
const actualFull = Buffer.concat(bufs)
t.deepEqual(actualFull, expectedFull)
