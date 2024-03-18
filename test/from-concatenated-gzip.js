import t from 'tap'
import corez from 'node:zlib'
import path from 'path'
import fs from 'fs'

import {
  Gzip,
  Gunzip,
  Unzip,
  Deflate,
  Inflate,
} from '../dist/esm/index.js'
import { fileURLToPath } from 'node:url'

// Test unzipping a gzip file that contains multiple concatenated "members"

const fixtures = fileURLToPath(new URL('fixtures', import.meta.url))

const method = Type => data => {
  const res = []
  const z = new Type()
  z.on('data', chunk => res.push(chunk))
  z.end(data)
  return Buffer.concat(res)
}

const gzip = method(Gzip)
const gunz = method(Gunzip)
const unzip = method(Unzip)
const deflate = method(Deflate)
const inflate = method(Inflate)

const abcEncoded = gzip('abc')
t.same(abcEncoded, corez.gzipSync('abc'))
const defEncoded = gzip('def')
t.same(defEncoded, corez.gzipSync('def'))

const data = Buffer.concat([abcEncoded, defEncoded])

t.equal(gunz(data).toString(), 'abcdef')
t.equal(unzip(data).toString(), 'abcdef')

// Multi-member support does not apply to zlib inflate/deflate.
t.equal(
  unzip(Buffer.concat([deflate('abc'), deflate('def')])).toString(),
  'abc',
  'result should match contents of first "member"',
)

// files that have the "right" magic bytes for starting a new gzip member
// in the middle of themselves, even if they are part of a single
// regularly compressed member
const pmmFileZlib = path.join(fixtures, 'pseudo-multimember-gzip.z')
const pmmFileGz = path.join(fixtures, 'pseudo-multimember-gzip.gz')

const pmmExpected = inflate(fs.readFileSync(pmmFileZlib))
const pmmResultBuffers = []

fs.createReadStream(pmmFileGz)
  .pipe(new Gunzip())
  .on('data', data => pmmResultBuffers.push(data))
  .on('end', _ =>
    t.same(
      Buffer.concat(pmmResultBuffers),
      pmmExpected,
      'result should match original random garbage',
    ),
  )

// test that the next gzip member can wrap around the input buffer boundary
const offs = [0, 1, 2, 3, 4, defEncoded.length]
offs.forEach(offset => {
  t.test('wraparound offset = ' + offset, t => {
    t.plan(1)
    const resultBuffers = []

    const unzip = new Gunzip()
      .on('error', err => {
        assert.ifError(err)
      })
      .on('data', data => resultBuffers.push(data))
      .on('end', _ => {
        t.equal(
          Buffer.concat(resultBuffers).toString(),
          'abcdef',
          'result should match original input',
          { offset: offset },
        )
      })

    // first write: write "abc" + the first bytes of "def"
    unzip.write(Buffer.concat([abcEncoded, defEncoded.slice(0, offset)]))

    // write remaining bytes of "def"
    unzip.end(defEncoded.slice(offset))
  })
})
