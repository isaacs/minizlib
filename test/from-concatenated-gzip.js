'use strict'
// Test unzipping a gzip file that contains multiple concatenated "members"

const t = require('tap')

if (process.version.match(/^v4/)) {
  return t.plan(0, 'concatenated zlib members not supported in node v4')
}

const zlib = require('../')
const corez = require('zlib')
const path = require('path')
const fs = require('fs')
const fixtures = path.resolve(__dirname, 'fixtures')

const method = Type => data => {
  const res = []
  const z = new Type()
  z.on('data', chunk => res.push(chunk))
  z.end(data)
  return Buffer.concat(res)
}

const gzip = method(zlib.Gzip)
const gunz = method(zlib.Gunzip)
const unzip = method(zlib.Unzip)
const deflate = method(zlib.Deflate)
const inflate = method(zlib.Inflate)

const abcEncoded = gzip('abc')
t.same(abcEncoded, corez.gzipSync('abc'))
const defEncoded = gzip('def')
t.same(defEncoded, corez.gzipSync('def'))

const data = Buffer.concat([
  abcEncoded,
  defEncoded
])

t.equal(gunz(data).toString(), 'abcdef')
t.equal(unzip(data).toString(), 'abcdef')

// Multi-member support does not apply to zlib inflate/deflate.
t.equal(unzip(Buffer.concat([
  deflate('abc'),
  deflate('def')
])).toString(), 'abc', 'result should match contents of first "member"')

// files that have the "right" magic bytes for starting a new gzip member
// in the middle of themselves, even if they are part of a single
// regularly compressed member
const pmmFileZlib = path.join(fixtures, 'pseudo-multimember-gzip.z')
const pmmFileGz = path.join(fixtures, 'pseudo-multimember-gzip.gz')

const pmmExpected = inflate(fs.readFileSync(pmmFileZlib))
const pmmResultBuffers = []

fs.createReadStream(pmmFileGz)
  .pipe(new zlib.Gunzip())
  .on('data', data => pmmResultBuffers.push(data))
  .on('end', _ =>
    t.same(Buffer.concat(pmmResultBuffers), pmmExpected,
           'result should match original random garbage'))

// test that the next gzip member can wrap around the input buffer boundary
const offs = [0, 1, 2, 3, 4, defEncoded.length]
offs.forEach(offset => {
  t.test('wraparound offset = ' + offset, t => {
    t.plan(1)
    const resultBuffers = []

    const unzip = new zlib.Gunzip()
      .on('error', (err) => {
        assert.ifError(err)
      })
      .on('data', (data) => resultBuffers.push(data))
      .on('end', _ => {
        t.equal(
          Buffer.concat(resultBuffers).toString(),
          'abcdef',
          'result should match original input',
          { offset: offset }
        )
      })

    // first write: write "abc" + the first bytes of "def"
    unzip.write(Buffer.concat([
      abcEncoded, defEncoded.slice(0, offset)
    ]))

    // write remaining bytes of "def"
    unzip.end(defEncoded.slice(offset))
  })
})
