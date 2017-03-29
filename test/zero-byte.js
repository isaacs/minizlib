'use strict'
const t = require('tap')
const zlib = require('../')
const gz = new zlib.Gzip()
const emptyBuffer = Buffer.alloc(0)
let received = 0
gz.on('data', function(c) {
  received += c.length
})

t.plan(2)
gz.on('end', _ => {
  t.equal(received, 20)
})
gz.write(emptyBuffer, _ => t.pass('called write cb'))
gz.end()
