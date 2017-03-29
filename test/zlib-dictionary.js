'use strict'
// test compression/decompression with dictionary

const t = require('tap')
const zlib = require('../')

const spdyDict = Buffer.from([
  'optionsgetheadpostputdeletetraceacceptaccept-charsetaccept-encodingaccept-',
  'languageauthorizationexpectfromhostif-modified-sinceif-matchif-none-matchi',
  'f-rangeif-unmodifiedsincemax-forwardsproxy-authorizationrangerefererteuser',
  '-agent10010120020120220320420520630030130230330430530630740040140240340440',
  '5406407408409410411412413414415416417500501502503504505accept-rangesageeta',
  'glocationproxy-authenticatepublicretry-afterservervarywarningwww-authentic',
  'ateallowcontent-basecontent-encodingcache-controlconnectiondatetrailertran',
  'sfer-encodingupgradeviawarningcontent-languagecontent-lengthcontent-locati',
  'oncontent-md5content-rangecontent-typeetagexpireslast-modifiedset-cookieMo',
  'ndayTuesdayWednesdayThursdayFridaySaturdaySundayJanFebMarAprMayJunJulAugSe',
  'pOctNovDecchunkedtext/htmlimage/pngimage/jpgimage/gifapplication/xmlapplic',
  'ation/xhtmltext/plainpublicmax-agecharset=iso-8859-1utf-8gzipdeflateHTTP/1',
  '.1statusversionurl\0'
].join(''))

const input = [
  'HTTP/1.1 200 Ok',
  'Server: node.js',
  'Content-Length: 0',
  ''
].join('\r\n')

t.test('basic dictionary test', t => {
  t.plan(1)
  let output = ''
  const deflate = new zlib.Deflate({ dictionary: spdyDict })
  const inflate = new zlib.Inflate({ dictionary: spdyDict })
  inflate.setEncoding('utf-8')

  deflate.on('data', chunk => inflate.write(chunk))
  inflate.on('data', chunk => output += chunk)
  deflate.on('end', _ => inflate.end())
  inflate.on('end', _ => t.equal(input, output))

  deflate.write(input)
  deflate.end()
})

t.test('deflate reset dictionary test', t => {
  t.plan(1)
  let doneReset = false
  let output = ''
  const deflate = new zlib.Deflate({ dictionary: spdyDict })
  const inflate = new zlib.Inflate({ dictionary: spdyDict })
  inflate.setEncoding('utf-8')

  deflate.on('data', chunk => {
    if (doneReset)
      inflate.write(chunk)
  })
  inflate.on('data', chunk => output += chunk)
  deflate.on('end', _ => inflate.end())
  inflate.on('end', _ => t.equal(input, output))

  deflate.write(input)
  deflate.flush()
  deflate.reset()
  doneReset = true
  deflate.write(input)
  deflate.end()
})

t.test('raw dictionary test', t => {
  t.plan(1)
  let output = ''
  const deflate = new zlib.DeflateRaw({ dictionary: spdyDict })
  const inflate = new zlib.InflateRaw({ dictionary: spdyDict })
  inflate.setEncoding('utf-8')

  deflate.on('data', chunk => inflate.write(chunk))
  inflate.on('data', chunk => output += chunk)
  deflate.on('end', _ => inflate.end())
  inflate.on('end', _ => t.equal(input, output))

  deflate.write(input)
  deflate.end()
})

t.test('deflate raw reset dictionary test', t => {
  t.plan(1)
  let doneReset = false
  let output = ''
  const deflate = new zlib.DeflateRaw({ dictionary: spdyDict })
  const inflate = new zlib.InflateRaw({ dictionary: spdyDict })
  inflate.setEncoding('utf-8')

  deflate.on('data', chunk => {
    if (doneReset)
      inflate.write(chunk)
  })
  inflate.on('data', chunk => output += chunk)
  deflate.on('end', _ => inflate.end())
  inflate.on('end', _ => t.equal(input, output))

  deflate.write(input)
  deflate.flush()
  deflate.reset()
  doneReset = true
  deflate.write(input)
  deflate.end()
})
