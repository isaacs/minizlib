'use strict'
const t = require('tap')
const zlib = require('../')

// String "test" encoded with dictionary "dict".
const input = Buffer.from([0x78, 0xBB, 0x04, 0x09, 0x01, 0xA5])

{
  const stream = new zlib.Inflate()

  stream.on('error', err =>
    t.match(err, {
      message: 'zlib: Missing dictionary',
      errno: 2,
      code: 'Z_NEED_DICT',
    }))

  stream.write(input)
}

{
  const stream = new zlib.Inflate({ dictionary: Buffer.from('fail') })

  stream.on('error', err =>
    t.match(err, {
      message: 'zlib: Bad dictionary',
      errno: 2,
      code: 'Z_NEED_DICT',
    }))

  stream.write(input)
}

{
  const stream = new zlib.InflateRaw({ dictionary: Buffer.from('fail') })

  // It's not possible to separate invalid dict and invalid data when
  // using the raw format
  stream.on('error', err =>
    t.match(err, {
      message: 'zlib: invalid stored block lengths',
      errno: -3,
      code: 'Z_DATA_ERROR',
    }))

  stream.write(input)
}
