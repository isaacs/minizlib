import t from 'tap'
import zlib from 'node:zlib'
import { Gunzip } from '../dist/esm/index.js'

t.test('gunzip works when Buffer.concat is frozen after load', t => {
  const original = Object.getOwnPropertyDescriptor(Buffer, 'concat')
  t.teardown(() => {
    Object.defineProperty(Buffer, 'concat', original)
  })

  const payload = Buffer.from('hello world')
  const gzipped = zlib.gzipSync(payload)
  Object.defineProperty(Buffer, 'concat', {
    writable: false,
    configurable: true,
  })

  const gunzip = new Gunzip()
  const chunks = []
  gunzip.on('data', chunk => chunks.push(chunk))
  gunzip.write(gzipped)
  gunzip.end()

  Object.defineProperty(Buffer, 'concat', original)
  t.equal(Buffer.concat(chunks).toString(), payload.toString())
  t.end()
})
