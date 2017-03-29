# minizlib

A smaller, faster, zlib stream built on
[minipass](http://npm.im/minipass) and Node.js's zlib binding.

**Current Status: Untested Beta**  It seems like this works, but I
can't be sure until I have finished writing tests for it.

This module was created to serve the needs of
[node-tar](http://npm.im/tar) v2.  If your needs are different, then
it may not be for you.

## How does this differ from the streams in `require('zlib')`?

First of all, there are no convenience methods to compress or
decompress a buffer.  If you want those, use the built-in `zlib` module.
This is only streams.

Node's built in zlib streams are built on top of `stream.Transform`.
They do the maximally safe thing with respect to consistent
asynchrony, buffering, and backpressure.

This module does support backpressure, and will buffer output chunks
that are not consumed, but is less of a mediator between the input and
output.  There is no high or low watermarks, no state objects, and so
on.  If you write, data will be emitted right away.  If you write
everything synchronously in one tick, and someone is listening to the
`data` event to consume it, then it'll all be emitted right away in
that same tick.  It is thus the responsibility of the reader and
writer to manage their own consumption.

Additionally, the compression and decompression is done on the main
thread, rather than offloading to a worker thread asynchronously.

The goal is to compress and decompress as fast as possible, even for
files that are too large to do all in one pass.
