import assert from 'assert'
import { Buffer } from 'buffer'
import { Minipass } from 'minipass'
import * as realZlib from 'zlib'
import { constants } from './constants.js'
export { constants } from './constants.js'

const OriginalBufferConcat = Buffer.concat
const desc = Object.getOwnPropertyDescriptor(Buffer, 'concat')
const noop = (args: Buffer[]) => args as unknown as Buffer
const passthroughBufferConcat =
  desc?.writable === true || desc?.set !== undefined
    ? (makeNoOp: boolean) => {
        Buffer.concat = makeNoOp ? noop : OriginalBufferConcat
      }
    : (_: boolean) => {}

const _superWrite = Symbol('_superWrite')

export class ZlibError extends Error {
  code?: string
  errno?: number
  constructor(err: NodeJS.ErrnoException | Error) {
    super('zlib: ' + err.message)
    this.code = (err as NodeJS.ErrnoException).code
    this.errno = (err as NodeJS.ErrnoException).errno
    /* c8 ignore next */
    if (!this.code) this.code = 'ZLIB_ERROR'

    this.message = 'zlib: ' + err.message
    Error.captureStackTrace(this, this.constructor)
  }

  get name() {
    return 'ZlibError'
  }
}

// the Zlib class they all inherit from
// This thing manages the queue of requests, and returns
// true or false if there is anything in the queue when
// you call the .write() method.
const _flushFlag = Symbol('flushFlag')

export type ChunkWithFlushFlag = Minipass.ContiguousData & {
  [_flushFlag]?: number
}

export type ZlibBaseOptions = Minipass.Options<Minipass.ContiguousData> & {
  flush?: number
  finishFlush?: number
  fullFlushFlag?: number
}
export type ZlibMode =
  | 'Gzip'
  | 'Gunzip'
  | 'Deflate'
  | 'Inflate'
  | 'DeflateRaw'
  | 'InflateRaw'
  | 'Unzip'
export type ZlibHandle =
  | realZlib.Gzip
  | realZlib.Gunzip
  | realZlib.Deflate
  | realZlib.Inflate
  | realZlib.DeflateRaw
  | realZlib.InflateRaw
export type BrotliMode = 'BrotliCompress' | 'BrotliDecompress'

abstract class ZlibBase extends Minipass<Buffer, ChunkWithFlushFlag> {
  #sawError: boolean = false
  #ended: boolean = false
  #flushFlag: number
  #finishFlushFlag: number
  #fullFlushFlag: number
  #handle?: ZlibHandle
  #onError: (err: ZlibError) => any

  get sawError() {
    return this.#sawError
  }
  get handle() {
    return this.#handle
  }
  /* c8 ignore start */
  get flushFlag() {
    return this.#flushFlag
  }
  /* c8 ignore stop */

  constructor(opts: ZlibBaseOptions, mode: ZlibMode | BrotliMode) {
    if (!opts || typeof opts !== 'object')
      throw new TypeError('invalid options for ZlibBase constructor')

    //@ts-ignore
    super(opts)

    /* c8 ignore start */
    this.#flushFlag = opts.flush ?? 0
    this.#finishFlushFlag = opts.finishFlush ?? 0
    this.#fullFlushFlag = opts.fullFlushFlag ?? 0
    /* c8 ignore stop */

    // this will throw if any options are invalid for the class selected
    try {
      // @types/node doesn't know that it exports the classes, but they're there
      //@ts-ignore
      this.#handle = new realZlib[mode](opts)
    } catch (er) {
      // make sure that all errors get decorated properly
      throw new ZlibError(er as NodeJS.ErrnoException)
    }

    this.#onError = err => {
      // no sense raising multiple errors, since we abort on the first one.
      if (this.#sawError) return

      this.#sawError = true

      // there is no way to cleanly recover.
      // continuing only obscures problems.
      this.close()
      this.emit('error', err)
    }

    this.#handle?.on('error', er => this.#onError(new ZlibError(er)))
    this.once('end', () => this.close)
  }

  close() {
    if (this.#handle) {
      this.#handle.close()
      this.#handle = undefined
      this.emit('close')
    }
  }

  reset() {
    if (!this.#sawError) {
      assert(this.#handle, 'zlib binding closed')
      //@ts-ignore
      return this.#handle.reset?.()
    }
  }

  flush(flushFlag?: number) {
    if (this.ended) return

    if (typeof flushFlag !== 'number') flushFlag = this.#fullFlushFlag

    this.write(Object.assign(Buffer.alloc(0), { [_flushFlag]: flushFlag }))
  }

  end(cb?: () => void): this
  end(chunk: ChunkWithFlushFlag, cb?: () => void): this
  end(
    chunk: ChunkWithFlushFlag,
    encoding?: Minipass.Encoding,
    cb?: () => void,
  ): this
  end(
    chunk?: ChunkWithFlushFlag | (() => void),
    encoding?: Minipass.Encoding | (() => void),
    cb?: () => void,
  ) {
    /* c8 ignore start */
    if (typeof chunk === 'function') {
      cb = chunk
      encoding = undefined
      chunk = undefined
    }
    if (typeof encoding === 'function') {
      cb = encoding
      encoding = undefined
    }
    /* c8 ignore stop */
    if (chunk) {
      if (encoding) this.write(chunk, encoding)
      else this.write(chunk)
    }
    this.flush(this.#finishFlushFlag)
    this.#ended = true
    return super.end(cb)
  }

  get ended() {
    return this.#ended
  }

  // overridden in the gzip classes to do portable writes
  [_superWrite](data: Buffer & { [_flushFlag]?: number }) {
    return super.write(data)
  }

  write(chunk: ChunkWithFlushFlag, cb?: () => void): boolean
  write(
    chunk: ChunkWithFlushFlag,
    encoding?: Minipass.Encoding,
    cb?: () => void,
  ): boolean
  write(
    chunk: ChunkWithFlushFlag,
    encoding?: Minipass.Encoding | (() => void),
    cb?: () => void,
  ) {
    // process the chunk using the sync process
    // then super.write() all the outputted chunks
    if (typeof encoding === 'function')
      (cb = encoding), (encoding = 'utf8')

    if (typeof chunk === 'string')
      chunk = Buffer.from(chunk as string, encoding as BufferEncoding)

    if (this.#sawError) return
    assert(this.#handle, 'zlib binding closed')

    // _processChunk tries to .close() the native handle after it's done, so we
    // intercept that by temporarily making it a no-op.
    // diving into the node:zlib internals a bit here
    const nativeHandle = (this.#handle as unknown as { _handle: any })
      ._handle
    const originalNativeClose = nativeHandle.close
    nativeHandle.close = () => {}
    const originalClose = this.#handle.close
    this.#handle.close = () => {}
    // It also calls `Buffer.concat()` at the end, which may be convenient
    // for some, but which we are not interested in as it slows us down.
    passthroughBufferConcat(true)
    let result: undefined | Buffer | Buffer[] = undefined
    try {
      const flushFlag =
        typeof chunk[_flushFlag] === 'number'
          ? chunk[_flushFlag]
          : this.#flushFlag
      result = (
        this.#handle as unknown as {
          _processChunk: (chunk: Buffer, flushFlag: number) => Buffer[]
        }
      )._processChunk(chunk as Buffer, flushFlag)
      // if we don't throw, reset it back how it was
      passthroughBufferConcat(false)
    } catch (err) {
      // or if we do, put Buffer.concat() back before we emit error
      // Error events call into user code, which may call Buffer.concat()
      passthroughBufferConcat(false)
      this.#onError(new ZlibError(err as NodeJS.ErrnoException))
    } finally {
      if (this.#handle) {
        // Core zlib resets `_handle` to null after attempting to close the
        // native handle. Our no-op handler prevented actual closure, but we
        // need to restore the `._handle` property.
        ;(this.#handle as unknown as { _handle: any })._handle =
          nativeHandle
        nativeHandle.close = originalNativeClose
        this.#handle.close = originalClose
        // `_processChunk()` adds an 'error' listener. If we don't remove it
        // after each call, these handlers start piling up.
        this.#handle.removeAllListeners('error')
        // make sure OUR error listener is still attached tho
      }
    }

    if (this.#handle)
      this.#handle.on('error', er => this.#onError(new ZlibError(er)))

    let writeReturn
    if (result) {
      if (Array.isArray(result) && result.length > 0) {
        const r = result[0]
        // The first buffer is always `handle._outBuffer`, which would be
        // re-used for later invocations; so, we always have to copy that one.
        writeReturn = this[_superWrite](Buffer.from(r as Buffer))
        for (let i = 1; i < result.length; i++) {
          writeReturn = this[_superWrite](result[i] as Buffer)
        }
      } else {
        // either a single Buffer or an empty array
        writeReturn = this[_superWrite](Buffer.from(result as Buffer | []))
      }
    }

    if (cb) cb()
    return writeReturn
  }
}

export type ZlibOptions = ZlibBaseOptions & {
  level?: number
  strategy?: number
}

export class Zlib extends ZlibBase {
  #level?: number
  #strategy?: number

  constructor(opts: ZlibOptions, mode: ZlibMode) {
    opts = opts || {}

    opts.flush = opts.flush || constants.Z_NO_FLUSH
    opts.finishFlush = opts.finishFlush || constants.Z_FINISH
    opts.fullFlushFlag = constants.Z_FULL_FLUSH
    super(opts, mode)

    this.#level = opts.level
    this.#strategy = opts.strategy
  }

  params(level: number, strategy: number) {
    if (this.sawError) return

    if (!this.handle)
      throw new Error('cannot switch params when binding is closed')

    // no way to test this without also not supporting params at all
    /* c8 ignore start */
    if (!(this.handle as { params?: any }).params)
      throw new Error('not supported in this implementation')
    /* c8 ignore stop */

    if (this.#level !== level || this.#strategy !== strategy) {
      this.flush(constants.Z_SYNC_FLUSH)
      assert(this.handle, 'zlib binding closed')
      // .params() calls .flush(), but the latter is always async in the
      // core zlib. We override .flush() temporarily to intercept that and
      // flush synchronously.
      const origFlush = this.handle.flush
      this.handle.flush = (
        flushFlag?: (() => void) | number,
        cb?: () => void,
      ) => {
        /* c8 ignore start */
        if (typeof flushFlag === 'function') {
          cb = flushFlag
          flushFlag = this.flushFlag
        }
        /* c8 ignore stop */
        this.flush(flushFlag)
        cb?.()
      }
      try {
        ;(
          this.handle as unknown as {
            params: (level?: number, strategy?: number) => void
          }
        ).params(level, strategy)
      } finally {
        this.handle.flush = origFlush
      }
      /* c8 ignore start */
      if (this.handle) {
        this.#level = level
        this.#strategy = strategy
      }
      /* c8 ignore stop */
    }
  }
}

// minimal 2-byte header
export class Deflate extends Zlib {
  constructor(opts: ZlibOptions) {
    super(opts, 'Deflate')
  }
}

export class Inflate extends Zlib {
  constructor(opts: ZlibOptions) {
    super(opts, 'Inflate')
  }
}

// gzip - bigger header, same deflate compression
export type GzipOptions = ZlibOptions & { portable?: boolean }
export class Gzip extends Zlib {
  #portable: boolean
  constructor(opts: GzipOptions) {
    super(opts, 'Gzip')
    this.#portable = opts && !!opts.portable
  }

  [_superWrite](data: Buffer & { [_flushFlag]?: number }) {
    if (!this.#portable) return super[_superWrite](data)

    // we'll always get the header emitted in one first chunk
    // overwrite the OS indicator byte with 0xFF
    this.#portable = false
    data[9] = 255
    return super[_superWrite](data)
  }
}

export class Gunzip extends Zlib {
  constructor(opts: ZlibOptions) {
    super(opts, 'Gunzip')
  }
}

// raw - no header
export class DeflateRaw extends Zlib {
  constructor(opts: ZlibOptions) {
    super(opts, 'DeflateRaw')
  }
}

export class InflateRaw extends Zlib {
  constructor(opts: ZlibOptions) {
    super(opts, 'InflateRaw')
  }
}

// auto-detect header.
export class Unzip extends Zlib {
  constructor(opts: ZlibOptions) {
    super(opts, 'Unzip')
  }
}

export class Brotli extends ZlibBase {
  constructor(opts: ZlibOptions, mode: BrotliMode) {
    opts = opts || {}

    opts.flush = opts.flush || constants.BROTLI_OPERATION_PROCESS
    opts.finishFlush =
      opts.finishFlush || constants.BROTLI_OPERATION_FINISH
    opts.fullFlushFlag = constants.BROTLI_OPERATION_FLUSH
    super(opts, mode)
  }
}

export class BrotliCompress extends Brotli {
  constructor(opts: ZlibOptions) {
    super(opts, 'BrotliCompress')
  }
}

export class BrotliDecompress extends Brotli {
  constructor(opts: ZlibOptions) {
    super(opts, 'BrotliDecompress')
  }
}
