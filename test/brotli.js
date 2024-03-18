import t from 'tap'
import { constants, BrotliCompress } from '../dist/esm/index.js'
import fs from 'fs'
import { fileURLToPath } from 'url'

const fixture = fileURLToPath(
  new URL('fixtures/pss-vectors.json', import.meta.url),
)
const sampleBuffer = fs.readFileSync(fixture)

// Test some brotli-specific properties of the brotli streams that can not
// be easily covered through expanding zlib-only tests.

t.test('set quality param at stream creation', t => {
  // Test setting the quality parameter at stream creation:
  const sizes = []
  for (
    let quality = constants.BROTLI_MIN_QUALITY;
    quality <= constants.BROTLI_MAX_QUALITY;
    quality++
  ) {
    const encoded = new BrotliCompress({
      params: {
        [constants.BROTLI_PARAM_QUALITY]: quality,
      },
    })
      .end(sampleBuffer)
      .read()
    sizes.push(encoded.length)
  }

  // Increasing quality should roughly correspond to decreasing compressed size:
  for (let i = 0; i < sizes.length - 1; i++) {
    t.ok(
      sizes[i + 1] <= sizes[i] * 1.05,
      `size ${i + 1} should be smaller than size ${i}`,
    ) // 5 % margin of error.
  }
  t.ok(sizes[0] > sizes[sizes.length - 1], 'first size larger than last')

  t.end()
})

t.test('setting out of bound option valules or keys fails', t => {
  // Test that setting out-of-bounds option values or keys fails.
  t.throws(
    () => {
      new BrotliCompress({
        params: {
          10000: 0,
        },
      })
    },
    {
      code: 'ERR_BROTLI_INVALID_PARAM',
      message: '10000 is not a valid Brotli parameter',
    },
  )

  // Test that accidentally using duplicate keys fails.
  t.throws(
    () => {
      new BrotliCompress({
        params: {
          0: 0,
          '00': 0,
        },
      })
    },
    {
      code: 'ERR_BROTLI_INVALID_PARAM',
      message: '00 is not a valid Brotli parameter',
    },
  )

  t.throws(
    () => {
      new BrotliCompress({
        params: {
          // This is a boolean flag
          [constants.BROTLI_PARAM_DISABLE_LITERAL_CONTEXT_MODELING]: 42,
        },
      })
    },
    {
      code: 'ERR_ZLIB_INITIALIZATION_FAILED',
      message: 'Initialization failed',
    },
  )

  t.end()
})
