'use strict';
const t = require('tap')
const assert = require('assert');
const zlib = require('../');
const path = require('path');
const fixtures = path.resolve(__dirname, 'fixtures')
const fs = require('fs');

const file = fs.readFileSync(path.resolve(fixtures, 'person.jpg'));
const chunkSize = 12 * 1024;
const opts = { level: 9, strategy: zlib.constants.Z_DEFAULT_STRATEGY };
const deflater = new zlib.DeflateRaw(opts);

const chunk1 = file.slice(0, chunkSize);
const chunk2 = file.slice(chunkSize);
const blkhdr = Buffer.from([0x00, 0x5a, 0x82, 0xa5, 0x7d]);
const expected = Buffer.concat([blkhdr, chunk2]);
let actual;

deflater.write(chunk1)
do {} while (deflater.read())

// twice should be no-op
deflater.params(0, zlib.constants.Z_DEFAULT_STRATEGY)
deflater.params(0, zlib.constants.Z_DEFAULT_STRATEGY)

do {} while (deflater.read())
deflater.write(chunk2)
const bufs = [];
for (let buf; buf = deflater.read(); bufs.push(buf));
actual = Buffer.concat(bufs);

t.same(actual, expected)

t.throws('invalid level', _ => deflater.params(Infinity))
t.throws('invalid strategy', _ => deflater.params(0, 'nope'))
deflater.end()
deflater.read()
deflater.close()
deflater.close()
deflater.close()

t.throws('params after end', _ => deflater.params(0, 0),
         new Error('cannot switch params when binding is closed'))
