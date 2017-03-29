'use strict'
const t = require('tap')
const zlib = require('../')
const gz = new zlib.Gzip()
const emptyBuffer = Buffer.alloc(0)
let received = 0
gz.on('data', function(c) {
  received += c.length
})

t.plan(1)
gz.on('end', _ => {
  t.equal(received, 20)
})
gz.end(emptyBuffer)
