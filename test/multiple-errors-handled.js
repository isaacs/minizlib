import t from 'tap'
import { Gzip } from '../dist/esm/index.js'

t.test('only raise once if emitted before writing', t => {
  t.plan(1)

  const gz = new Gzip()

  gz.once('error', er => t.match(er, { message: 'zlib: fart' }))
  gz.handle.emit('error', new Error('fart'))
  gz.handle?.emit('error', new Error('poop'))
})

t.test('only raise once if emitted after writing', t => {
  t.plan(1)

  const gz = new Gzip()

  gz.once('error', er => t.match(er, { message: 'zlib: fart' }))

  gz.write('hello, ')

  gz.handle.emit('error', new Error('fart'))
  gz.handle?.emit('error', new Error('poop'))
})

t.test('only raise once if emitted after writing after emitting', t => {
  t.plan(1)

  const gz = new Gzip()

  gz.once('error', er => t.match(er, { message: 'zlib: fart' }))

  gz.write('hello, ')

  gz.handle.emit('error', new Error('fart'))
  gz.write(' world')
  gz.handle?.emit('error', new Error('poop'))
})
