import t from 'tap'
import { Gunzip, Gzip } from '../dist/esm/index.js'

const data = Buffer.from('hello world')

const stream = new Gzip({ portable: true })
const res = stream.end(data).read()
t.equal(res[9], 255)
const unc = new Gunzip({ encoding: 'utf8' }).end(res).read()
t.equal(unc, 'hello world')
t.end()
