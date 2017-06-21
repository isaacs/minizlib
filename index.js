'use strict';
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var assert = require('assert');
var Buffer = require('buffer').Buffer;
var binding = process.binding('zlib');
var constants = exports.constants = require('./constants');
var MiniPass = require('minipass');
// translation table for return codes.
var codes = new Map([
    [constants.Z_OK, 'Z_OK'],
    [constants.Z_STREAM_END, 'Z_STREAM_END'],
    [constants.Z_NEED_DICT, 'Z_NEED_DICT'],
    [constants.Z_ERRNO, 'Z_ERRNO'],
    [constants.Z_STREAM_ERROR, 'Z_STREAM_ERROR'],
    [constants.Z_DATA_ERROR, 'Z_DATA_ERROR'],
    [constants.Z_MEM_ERROR, 'Z_MEM_ERROR'],
    [constants.Z_BUF_ERROR, 'Z_BUF_ERROR'],
    [constants.Z_VERSION_ERROR, 'Z_VERSION_ERROR']
]);
var validFlushFlags = new Set([
    constants.Z_NO_FLUSH,
    constants.Z_PARTIAL_FLUSH,
    constants.Z_SYNC_FLUSH,
    constants.Z_FULL_FLUSH,
    constants.Z_FINISH,
    constants.Z_BLOCK
]);
var strategies = new Set([
    constants.Z_FILTERED,
    constants.Z_HUFFMAN_ONLY,
    constants.Z_RLE,
    constants.Z_FIXED,
    constants.Z_DEFAULT_STRATEGY
]);
// the Zlib class they all inherit from
// This thing manages the queue of requests, and returns
// true or false if there is anything in the queue when
// you call the .write() method.
var _opts = Symbol('opts');
var _chunkSize = Symbol('chunkSize');
var _flushFlag = Symbol('flushFlag');
var _finishFlush = Symbol('finishFlush');
var _handle = Symbol('handle');
var _hadError = Symbol('hadError');
var _buffer = Symbol('buffer');
var _offset = Symbol('offset');
var _level = Symbol('level');
var _strategy = Symbol('strategy');
var _ended = Symbol('ended');
var Zlib = (function (_super) {
    __extends(Zlib, _super);
    function Zlib(opts, mode) {
        var _this = _super.call(this, opts) || this;
        _this[_ended] = false;
        _this[_opts] = opts = opts || {};
        _this[_chunkSize] = opts.chunkSize || constants.Z_DEFAULT_CHUNK;
        if (opts.flush && !validFlushFlags.has(opts.flush)) {
            throw new Error('Invalid flush flag: ' + opts.flush);
        }
        if (opts.finishFlush && !validFlushFlags.has(opts.finishFlush)) {
            throw new Error('Invalid flush flag: ' + opts.finishFlush);
        }
        _this[_flushFlag] = opts.flush || constants.Z_NO_FLUSH;
        _this[_finishFlush] = typeof opts.finishFlush !== 'undefined' ?
            opts.finishFlush : constants.Z_FINISH;
        if (opts.chunkSize) {
            if (opts.chunkSize < constants.Z_MIN_CHUNK) {
                throw new Error('Invalid chunk size: ' + opts.chunkSize);
            }
        }
        if (opts.windowBits) {
            if (opts.windowBits < constants.Z_MIN_WINDOWBITS ||
                opts.windowBits > constants.Z_MAX_WINDOWBITS) {
                throw new Error('Invalid windowBits: ' + opts.windowBits);
            }
        }
        if (opts.level) {
            if (opts.level < constants.Z_MIN_LEVEL ||
                opts.level > constants.Z_MAX_LEVEL) {
                throw new Error('Invalid compression level: ' + opts.level);
            }
        }
        if (opts.memLevel) {
            if (opts.memLevel < constants.Z_MIN_MEMLEVEL ||
                opts.memLevel > constants.Z_MAX_MEMLEVEL) {
                throw new Error('Invalid memLevel: ' + opts.memLevel);
            }
        }
        if (opts.strategy && !(strategies.has(opts.strategy)))
            throw new Error('Invalid strategy: ' + opts.strategy);
        if (opts.dictionary) {
            if (!(opts.dictionary instanceof Buffer)) {
                throw new Error('Invalid dictionary: it should be a Buffer instance');
            }
        }
        _this[_handle] = new binding.Zlib(mode);
        _this[_hadError] = false;
        _this[_handle].onerror = function (message, errno) {
            // there is no way to cleanly recover.
            // continuing only obscures problems.
            _this.close();
            _this[_hadError] = true;
            var error = new Error(message);
            error.errno = errno;
            error.code = codes.get(errno);
            _this.emit('error', error);
        };
        var level = typeof opts.level === 'number' ? opts.level
            : constants.Z_DEFAULT_COMPRESSION;
        var strategy = typeof opts.strategy === 'number' ? opts.strategy
            : constants.Z_DEFAULT_STRATEGY;
        _this[_handle].init(opts.windowBits || constants.Z_DEFAULT_WINDOWBITS, level, opts.memLevel || constants.Z_DEFAULT_MEMLEVEL, strategy, opts.dictionary);
        _this[_buffer] = Buffer.allocUnsafe(_this[_chunkSize]);
        _this[_offset] = 0;
        _this[_level] = level;
        _this[_strategy] = strategy;
        _this.once('end', _this.close);
        return _this;
    }
    Zlib.prototype.close = function () {
        if (this[_handle]) {
            this[_handle].close();
            this[_handle] = null;
            this.emit('close');
        }
    };
    Zlib.prototype.params = function (level, strategy) {
        if (!this[_handle])
            throw new Error('cannot switch params when binding is closed');
        // no way to test this without also not supporting params at all
        /* istanbul ignore if */
        if (!this[_handle].params)
            throw new Error('not supported in this implementation');
        if (level < constants.Z_MIN_LEVEL ||
            level > constants.Z_MAX_LEVEL) {
            throw new RangeError('Invalid compression level: ' + level);
        }
        if (!(strategies.has(strategy)))
            throw new TypeError('Invalid strategy: ' + strategy);
        if (this[_level] !== level || this[_strategy] !== strategy) {
            this.flush(constants.Z_SYNC_FLUSH);
            assert(this[_handle], 'zlib binding closed');
            this[_handle].params(level, strategy);
            /* istanbul ignore else */
            if (!this[_hadError]) {
                this[_level] = level;
                this[_strategy] = strategy;
            }
        }
    };
    Zlib.prototype.reset = function () {
        assert(this[_handle], 'zlib binding closed');
        return this[_handle].reset();
    };
    Zlib.prototype.flush = function (kind) {
        if (kind === undefined)
            kind = constants.Z_FULL_FLUSH;
        if (this.ended)
            return;
        var flushFlag = this[_flushFlag];
        this[_flushFlag] = kind;
        this.write(Buffer.alloc(0));
        this[_flushFlag] = flushFlag;
    };
    Zlib.prototype.end = function (chunk, encoding, cb) {
        if (chunk)
            this.write(chunk, encoding);
        this.flush(this[_finishFlush]);
        this[_ended] = true;
        return _super.prototype.end.call(this, null, null, cb);
    };
    Object.defineProperty(Zlib.prototype, "ended", {
        get: function () {
            return this[_ended];
        },
        enumerable: true,
        configurable: true
    });
    Zlib.prototype.write = function (chunk, encoding, cb) {
        // process the chunk using the sync process
        // then super.write() all the outputted chunks
        if (typeof encoding === 'function')
            cb = encoding, encoding = 'utf8';
        if (typeof chunk === 'string')
            chunk = new Buffer(chunk, encoding);
        var availInBefore = chunk && chunk.length;
        var availOutBefore = this[_chunkSize] - this[_offset];
        var inOff = 0; // the offset of the input buffer
        var flushFlag = this[_flushFlag];
        var writeReturn = true;
        assert(this[_handle], 'zlib binding closed');
        do {
            var res = this[_handle].writeSync(flushFlag, chunk, // in
            inOff, // in_off
            availInBefore, // in_len
            this[_buffer], // out
            this[_offset], //out_off
            availOutBefore // out_len
            );
            if (this[_hadError])
                break;
            var availInAfter = res[0];
            var availOutAfter = res[1];
            var have = availOutBefore - availOutAfter;
            assert(have >= 0, 'have should not go down');
            if (have > 0) {
                var out = this[_buffer].slice(this[_offset], this[_offset] + have);
                this[_offset] += have;
                // serve some output to the consumer.
                writeReturn = _super.prototype.write.call(this, out) && writeReturn;
            }
            // exhausted the output buffer, or used all the input create a new one.
            if (availOutAfter === 0 || this[_offset] >= this[_chunkSize]) {
                availOutBefore = this[_chunkSize];
                this[_offset] = 0;
                this[_buffer] = Buffer.allocUnsafe(this[_chunkSize]);
            }
            if (availOutAfter === 0) {
                // Not actually done.  Need to reprocess.
                // Also, update the availInBefore to the availInAfter value,
                // so that if we have to hit it a third (fourth, etc.) time,
                // it'll have the correct byte counts.
                inOff += (availInBefore - availInAfter);
                availInBefore = availInAfter;
                continue;
            }
            break;
        } while (!this[_hadError]);
        if (cb)
            cb();
        return writeReturn;
    };
    return Zlib;
}(MiniPass));
// minimal 2-byte header
var Deflate = (function (_super) {
    __extends(Deflate, _super);
    function Deflate(opts) {
        return _super.call(this, opts, constants.DEFLATE) || this;
    }
    return Deflate;
}(Zlib));
var Inflate = (function (_super) {
    __extends(Inflate, _super);
    function Inflate(opts) {
        return _super.call(this, opts, constants.INFLATE) || this;
    }
    return Inflate;
}(Zlib));
// gzip - bigger header, same deflate compression
var Gzip = (function (_super) {
    __extends(Gzip, _super);
    function Gzip(opts) {
        return _super.call(this, opts, constants.GZIP) || this;
    }
    return Gzip;
}(Zlib));
var Gunzip = (function (_super) {
    __extends(Gunzip, _super);
    function Gunzip(opts) {
        return _super.call(this, opts, constants.GUNZIP) || this;
    }
    return Gunzip;
}(Zlib));
// raw - no header
var DeflateRaw = (function (_super) {
    __extends(DeflateRaw, _super);
    function DeflateRaw(opts) {
        return _super.call(this, opts, constants.DEFLATERAW) || this;
    }
    return DeflateRaw;
}(Zlib));
var InflateRaw = (function (_super) {
    __extends(InflateRaw, _super);
    function InflateRaw(opts) {
        return _super.call(this, opts, constants.INFLATERAW) || this;
    }
    return InflateRaw;
}(Zlib));
// auto-detect header.
var Unzip = (function (_super) {
    __extends(Unzip, _super);
    function Unzip(opts) {
        return _super.call(this, opts, constants.UNZIP) || this;
    }
    return Unzip;
}(Zlib));
exports.Deflate = Deflate;
exports.Inflate = Inflate;
exports.Gzip = Gzip;
exports.Gunzip = Gunzip;
exports.DeflateRaw = DeflateRaw;
exports.InflateRaw = InflateRaw;
exports.Unzip = Unzip;
