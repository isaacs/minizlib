import t from 'tap'

t.test('pretend we do not have zstd', async t => {
  const miniz = await t.mockImport('../dist/esm/index.js', {
    'node:zlib': t.createMock(await import('node:zlib'), {
      BrotliCompress: undefined,
      BrotliDecompress: undefined,
    }),
  })

  t.throws(() => {
    new miniz.BrotliCompress({})
  }, {
    name: 'TypeError',
    message: 'Compression method not supported: BrotliCompress',
  })
})
