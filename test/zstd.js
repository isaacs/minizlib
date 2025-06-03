import t from 'tap'
import { constants, ZstdCompress } from '../dist/esm/index.js'
import fs from 'fs'
import { fileURLToPath } from 'url'

const fixture = fileURLToPath(
  new URL('fixtures/pss-vectors.json', import.meta.url),
)
const sampleBuffer = fs.readFileSync(fixture)

// Test some zstd-specific properties of the zstd streams that can not
// be easily covered through expanding zlib-only tests.

t.test('set compression level at stream creation', t => {
  // Test setting the compression level at stream creation:
  const sizes = []
  for (
    let quality = 0;
    quality <= 5;
    quality++
  ) {
    const encoded = new ZstdCompress({
      params: {
        [constants.ZSTD_c_compressionLevel]: quality,
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
      new ZstdCompress({
        params: {
          10000: 0,
        },
      })
    },
    {
      code: 'ERR_ZSTD_INVALID_PARAM',
      errno: undefined,
      name: "ZlibError",
    },
  )

  // Test that accidentally using duplicate keys fails.
  t.throws(
    () => {
      new ZstdCompress({
        params: {
          0: 0,
          '00': 0,
        },
      })
    },
    {
      code: 'ERR_ZSTD_INVALID_PARAM',
      errno: undefined,
      name: "ZlibError",
    },
  )

  t.end()
})
