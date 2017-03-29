'use strict'
const t = require('tap')
const zlib = require('../')
const path = require('path')
const fs = require('fs')
const util = require('util')
const stream = require('stream')
const EE = require('events').EventEmitter
const fixtures = path.resolve(__dirname, 'fixtures')

let zlibPairs = [
  [zlib.Deflate, zlib.Inflate],
  [zlib.Gzip, zlib.Gunzip],
  [zlib.Deflate, zlib.Unzip],
  [zlib.Gzip, zlib.Unzip],
  [zlib.DeflateRaw, zlib.InflateRaw]
]

// how fast to trickle through the slowstream
let trickle = [128, 1024, 1024 * 1024]

// tunable options for zlib classes.

// several different chunk sizes
let chunkSize = [128, 1024, 1024 * 16, 1024 * 1024]

// this is every possible value.
let level = [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
let windowBits = [8, 9, 10, 11, 12, 13, 14, 15]
let memLevel = [1, 2, 3, 4, 5, 6, 7, 8, 9]
let strategy = [0, 1, 2, 3, 4]

// it's nice in theory to test every combination, but it
// takes WAY too long.  Maybe a pummel test could do this?
if (!process.env.PUMMEL) {
  trickle = [1024]
  chunkSize = [1024 * 16]
  windowBits = [9]
  level = [6]
  memLevel = [8]
  strategy = [0]
}

let testFiles = ['person.jpg', 'elipses.txt', 'empty.txt']

if (process.env.FAST) {
  zlibPairs = [[zlib.Gzip, zlib.Unzip]]
  testFiles = ['person.jpg']
}

const tests = {}
testFiles.forEach(function(file) {
  tests[file] = fs.readFileSync(path.resolve(fixtures, file))
})


// stream that saves everything
class BufferStream extends EE {
  constructor () {
    super()
    this.chunks = []
    this.length = 0
    this.writable = true
    this.readable = true
  }

  write (c) {
    this.chunks.push(c)
    this.length += c.length
    return true
  }

  end (c) {
    if (c)
      this.write(c)

    // flatten
    const buf = Buffer.allocUnsafe(this.length)
    let i = 0
    this.chunks.forEach(c => {
      c.copy(buf, i)
      i += c.length
    })
    this.emit('data', buf)
    this.emit('end')
    return true
  }
}

class SlowStream extends stream.Stream {
  constructor (trickle) {
    super()
    this.trickle = trickle
    this.offset = 0
    this.readable = this.writable = true
    this.paused = false
  }

  write () {
    throw new Error('not implemented, just call ss.end(chunk)')
  }

  pause () {
    this.paused = true
    this.emit('pause')
  }

  resume () {
    const emit = () => {
      if (this.paused) return
      if (this.offset >= this.length) {
        this.ended = true
        return this.emit('end')
      }
      const end = Math.min(this.offset + this.trickle, this.length)
      const c = this.chunk.slice(this.offset, end)
      this.offset += c.length
      this.emit('data', c)
      process.nextTick(emit)
    }

    if (this.ended) return
    this.emit('resume')
    if (!this.chunk) return
    this.paused = false
    emit()
  }

  end (chunk) {
    // walk over the chunk in blocks.
    this.chunk = chunk
    this.length = chunk.length
    this.resume()
    return this.ended
  }
}


// for each of the files, make sure that compressing and
// decompressing results in the same data, for every combination
// of the options set above.
let failures = 0
let total = 0
let done = 0


const runTest =
  ( t, file, chunkSize, trickle, windowBits,
    level, memLevel, strategy, pair ) => {

  const test = tests[file]
  const Def = pair[0]
  const Inf = pair[1]
  const opts = {
    level: level,
    windowBits: windowBits,
    memLevel: memLevel,
    strategy: strategy
  }

  const def = new Def(opts)
  const inf = new Inf(opts)
  const ss = new SlowStream(trickle)
  const buf = new BufferStream()

  // verify that the same exact buffer comes out the other end.
  buf.on('data', function(c) {
    const msg = file
    let ok = true
    const testNum = ++done
    let i
    for (i = 0; i < Math.max(c.length, test.length); i++) {
      if (c[i] !== test[i]) {
        ok = false
        break
      }
    }
    t.ok(ok, msg, {
      testfile: file,
      type: Def.name + ' -> ' + Inf.name,
      position: i,
      options: opts,
      expect: test[i],
      actual: c[i],
      chunkSize: chunkSize
    })
    t.end()
  })

  // the magic happens here.
  // ss.pipe(def).pipe(inf).pipe(buf)
  ss.pipe(def)
  def.pipe(inf)
  inf.pipe(buf)
  ss.end(test)
}

Object.keys(tests).forEach(file => {
  t.test('file=' + file, t => {
    chunkSize.forEach(chunkSize => {
      t.test('chunkSize=' + chunkSize, t => {
        trickle.forEach(trickle => {
          t.test('trickle=' + trickle, t => {
            windowBits.forEach(windowBits => {
              t.test('windowBits=' + windowBits, t => {
                level.forEach(level => {
                  t.test('level=' + level, t => {
                    memLevel.forEach(memLevel => {
                      t.test('memLevel=' + memLevel, t => {
                        strategy.forEach(strategy => {
                          t.test('strategy=' + strategy, t => {
                            zlibPairs.forEach((pair, pairIndex) => {
                              t.test('pair=' + pairIndex, t => {
                                runTest(t, file, chunkSize, trickle,
                                        windowBits, level, memLevel,
                                        strategy, pair)
                              })
                            })
                            t.end()
                          })
                        })
                        t.end()
                      })
                    })
                    t.end()
                  })
                })
                t.end()
              })
            })
            t.end()
          })
        })
        t.end()
      })
    })
    t.end()
  })
})
