const t = require('tap')
const { Gzip } = require('../')

t.test('only raise once if emitted before writing', t => {
  t.plan(1)

  const gz = new Gzip()

  // dirty hack to get at the internal handle
  const kHandle = Object.getOwnPropertySymbols(gz)
    .filter(sym => sym.toString() === 'Symbol(handle)')[0]

  gz.once('error', er => t.match(er, { message: 'zlib: fart' }))
  const handle = gz[kHandle]
  handle.emit('error', new Error('fart'))
  handle.emit('error', new Error('poop'))
})

t.test('only raise once if emitted after writing', t => {
  t.plan(1)

  const gz = new Gzip()

  // dirty hack to get at the internal handle
  const kHandle = Object.getOwnPropertySymbols(gz)
    .filter(sym => sym.toString() === 'Symbol(handle)')[0]

  gz.once('error', er => t.match(er, { message: 'zlib: fart' }))

  gz.write('hello, ')

  const handle = gz[kHandle]
  handle.emit('error', new Error('fart'))
  handle.emit('error', new Error('poop'))
})

t.test('only raise once if emitted after writing after emitting', t => {
  t.plan(1)

  const gz = new Gzip()

  // dirty hack to get at the internal handle
  const kHandle = Object.getOwnPropertySymbols(gz)
    .filter(sym => sym.toString() === 'Symbol(handle)')[0]

  gz.once('error', er => t.match(er, { message: 'zlib: fart' }))

  gz.write('hello, ')

  const handle = gz[kHandle]
  handle.emit('error', new Error('fart'))
  gz.write(' world')
  handle.emit('error', new Error('poop'))
})
