'use strict';

// This test ensures that zlib throws a RangeError if the final buffer needs to
// be larger than kMaxLength and concatenation fails.
// https://github.com/nodejs/node/pull/1811

const t = require('tap')

// Change kMaxLength for zlib to trigger the error without having to allocate
// large Buffers.
const buffer = require('buffer');
const oldkMaxLength = buffer.kMaxLength;
buffer.kMaxLength = 128;
const zlib = require('../');
buffer.kMaxLength = oldkMaxLength;

const encoded = Buffer.from('G38A+CXCIrFAIAM=', 'base64');

t.test('async', t => {
  const dec = new zlib.BrotliDecompress()
  setTimeout(() => dec.end(encoded))
  return t.rejects(dec.concat(), RangeError)
})

t.test('sync', t => {
  t.throws(() => new zlib.BrotliDecompress().end(encoded), RangeError)
  t.end()
})
