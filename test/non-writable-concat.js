'use strict'
const t = require('tap')
const Buffer = require('buffer').Buffer
Object.defineProperty(Buffer, 'concat', {writable: false})
const zlib = require('../')
const gz = new zlib.Gzip()

t.plan(1)
gz.write('', _ => t.pass('called write cb'))
gz.end()
