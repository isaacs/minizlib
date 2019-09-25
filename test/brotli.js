const {BrotliCompress, BrotliDecompress} = require('../')

const c = new BrotliCompress()
const d = new BrotliDecompress()

const fs = require('fs')
fs.createReadStream(__filename).pipe(c).pipe(d).pipe(process.stdout)
