'use strict'
// Test compressing and uncompressing a string with zstd

import t from 'tap'
import {ZstdCompress, ZstdDecompress} from '../dist/esm/index.js'

const inputString =
  'ΩΩLorem ipsum dolor sit amet, consectetur adipiscing eli' +
  't. Morbi faucibus, purus at gravida dictum, libero arcu ' +
  'convallis lacus, in commodo libero metus eu nisi. Nullam' +
  ' commodo, neque nec porta placerat, nisi est fermentum a' +
  'ugue, vitae gravida tellus sapien sit amet tellus. Aenea' +
  'n non diam orci. Proin quis elit turpis. Suspendisse non' +
  ' diam ipsum. Suspendisse nec ullamcorper odio. Vestibulu' +
  'm arcu mi, sodales non suscipit id, ultrices ut massa. S' +
  'ed ac sem sit amet arcu malesuada fermentum. Nunc sed. '
const compressedString =
  'KLUv/WT5AF0JAGbXPCCgJUkH/8+rqgA3KaVsW+6LfK3JL' +
  'cnP+I/Gy1/3Qv9XDTQAMwA0AK+Ch9LCub6tnT62C7Quwr' +
  'HQHDhhNPcCQltMWOrafGy3KO2D79QZ95omy09vwp/TFEA' +
  'kEIlHOO99cOlZmfRizXQ79GvDoY9TxrTgBBfR+77Nd7Lk' +
  'OWlHaGW+aEwd2rSeegWaj9NsWAJJ0253u1jQpe3ByWLS5' +
  'i+24QhTAZygaf4UlqNER3XoAk7QYar9tjHHV4yHj+tC10' +
  '8zuqMBJ+X2hlpwUqX6vE3r3N7q5QYntVvn3N8zVDb9UfC' +
  'MCW1790yV3A88pgvkvQAniSWvFxMAELvECFu0tC1R9Ijs' +
  'ri5bt2kE/2mLoi2wCpkElnidDMS//DemxlNdHClyl6KeN' +
  'TCugmAGfEYAXA=='

t.test('compress then decompress', async t =>
  new ZstdCompress()
    .end(inputString)
    .concat()
    .then(async buffer => {
      t.ok(
        inputString.length > buffer.length,
        'buffer is shorter than input',
      )

      return new ZstdDecompress()
        .end(buffer)
        .concat()
        .then(buffer => t.equal(buffer.toString(), inputString))
    }),
)

t.test('decompress then check', t =>
  new ZstdDecompress({ encoding: 'utf8' })
    .end(compressedString, 'base64')
    .concat()
    .then(result => t.equal(result, inputString)),
)
