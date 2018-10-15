'use strict'
const core = require('zlib')
const miniz = require('minizlib')
const fs = require('fs')
const file = 'npm-5-8x.tgz'
const data = fs.readFileSync(file)

const N = +process.argv[2] || 10
let C = +process.argv[3] || 3

let n = 0
const doMini = () => {
  const miniunz = new miniz.Unzip()
  miniunz.on('end', () => {
    console.timeEnd('mini')
    if (++n < N)
      doMini()
    else {
      n = 0
      doCore()
    }
  })

  console.time('mini')
  miniunz.end(data)
  miniunz.resume()
}

const doCore = () => {
  const coreunz = new core.Unzip()
  coreunz.on('end', () => {
    console.timeEnd('core')
    if (++n < N)
      doCore()
    else if (--C > 0) {
      n = 0
      doMini()
    }
  })

  console.time('core')
  coreunz.end(data)
  coreunz.resume()
}

doMini()

/*
$ node bench.js
mini: 1062.121ms
mini: 992.747ms
mini: 981.529ms
mini: 939.813ms
mini: 1009.037ms
mini: 969.063ms
mini: 961.559ms
mini: 952.462ms
mini: 931.309ms
mini: 942.898ms
core: 1133.598ms
core: 1112.883ms
core: 1086.734ms
core: 1073.089ms
core: 1048.197ms
core: 1072.097ms
core: 1073.972ms
core: 1053.326ms
core: 1053.606ms
core: 1052.969ms
mini: 906.290ms
mini: 1001.500ms
mini: 1035.073ms
mini: 963.583ms
mini: 922.108ms
mini: 935.533ms
mini: 877.866ms
mini: 914.190ms
mini: 908.777ms
mini: 889.769ms
core: 1103.496ms
core: 1049.253ms
core: 1136.523ms
core: 1066.346ms
core: 1085.796ms
core: 1062.242ms
core: 1071.801ms
core: 1078.519ms
core: 1077.774ms
core: 1104.796ms
mini: 934.895ms
mini: 973.971ms
mini: 938.026ms
mini: 971.475ms
mini: 946.436ms
mini: 966.129ms
mini: 943.973ms
mini: 961.074ms
mini: 966.523ms
mini: 993.003ms
core: 1107.929ms
core: 1080.664ms
core: 1075.637ms
core: 1084.507ms
core: 1071.859ms
core: 1049.318ms
core: 1054.679ms
core: 1055.525ms
core: 1060.224ms
core: 1056.568ms
*/
