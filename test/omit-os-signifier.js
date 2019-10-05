const zlib = require('../')

const data = Buffer.from('hello world')
const t = require('tap')

const stream = new zlib.Gzip({portable: true})
const res = stream.end(data).read()
t.equal(res[9], 255)
const unc = new zlib.Gunzip({encoding: 'utf8'}).end(res).read()
t.equal(unc, 'hello world')
t.end()
