'use strict'
// Test unzipping a file that was created with a non-node brotli lib,
// piped in as fast as possible.

const t = require('tap')
if (!require('zlib').BrotliDecompress) {
  t.plan(0, 'brotli not supported')
  process.exit(0)
}
const zlib = require('../')
const {resolve, basename} = require('path')
const {sync: mkdirp} = require('mkdirp')
const {sync: rimraf} = require('rimraf')
const tmpdir = resolve(__dirname, basename(__filename, '.js'))
mkdirp(tmpdir)
t.teardown(() => rimraf(tmpdir))

const decompress = new zlib.BrotliDecompress()

const fs = require('fs')

const fixture = resolve(__dirname, 'fixtures/person.jpg.br')
const unzippedFixture = resolve(__dirname, 'fixtures/person.jpg')
const outputFile = resolve(tmpdir, 'person.jpg')
const expect = fs.readFileSync(unzippedFixture)
const inp = fs.createReadStream(fixture)
const out = fs.createWriteStream(outputFile)

t.test('decompress and test output', t => {
  inp.pipe(decompress).pipe(out).on('close', () => {
    const actual = fs.readFileSync(outputFile)
    t.deepEqual(actual, expect)
    t.end()
  })
})
