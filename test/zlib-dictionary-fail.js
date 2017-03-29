'use strict'
const t = require('tap')
const zlib = require('../')

// String "test" encoded with dictionary "dict".
const input = Buffer.from([0x78, 0xBB, 0x04, 0x09, 0x01, 0xA5])

{
  const stream = new zlib.Inflate()

  stream.on('error', err =>
    t.match(err, { message: /Missing dictionary/ }))

  stream.write(input)
}

{
  const stream = new zlib.Inflate({ dictionary: Buffer.from('fail') })

  stream.on('error', err =>
    t.match(err, { message: /Bad dictionary/ }))

  stream.write(input)
}

{
  const stream = new zlib.InflateRaw({ dictionary: Buffer.from('fail') })

  // It's not possible to separate invalid dict and invalid data when
  // using the raw format
  stream.on('error', err =>
    t.match(err, { message: /invalid/ }))

  stream.write(input)
}
