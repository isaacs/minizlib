import t from 'tap'
import { Buffer } from 'buffer'
Object.defineProperty(Buffer, 'concat', { writable: false })

// need to await import so it comes after the prop change
const { Gzip } = await import('../dist/esm/index.js')
const gz = new Gzip()

t.plan(1)
gz.write('', _ => t.pass('called write cb'))
gz.end()
