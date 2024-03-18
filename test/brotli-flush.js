'use strict'
import t from 'tap'
import { BrotliCompress } from '../dist/esm/index.js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'

const fixture = fileURLToPath(
  new URL('fixtures/person.jpg', import.meta.url),
)
const file = readFileSync(fixture)
const chunkSize = 16
const deflater = new BrotliCompress()

const chunk = file.subarray(0, chunkSize)
const expectedFull = Buffer.from('iweA/9j/4AAQSkZJRgABAQEASA==', 'base64')

deflater.write(chunk)
deflater.flush()
const bufs = []
deflater.on('data', b => bufs.push(b))
const actualFull = Buffer.concat(bufs)
t.same(actualFull, expectedFull)
