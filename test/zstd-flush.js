'use strict'
import t from 'tap'
import { ZstdCompress } from '../dist/esm/index.js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import * as console from 'console'

const fixture = fileURLToPath(
  new URL('fixtures/person.jpg', import.meta.url),
)
const file = readFileSync(fixture)
const chunkSize = 16
const deflater = new ZstdCompress()

const chunk = file.subarray(0, chunkSize)
const expectedFull = Buffer.from('KLUv/QBYgAAA/9j/4AAQSkZJRgABAQEASA==', 'base64')

deflater.write(chunk)
deflater.flush()
const bufs = []
deflater.on('data', b => bufs.push(b))
const actualFull = Buffer.concat(bufs)
t.same(actualFull, expectedFull)
