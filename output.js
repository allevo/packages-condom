'use strict'

const through2 = require('through2')
const pump = require('pump')

module.exports = function (stream, outputStream) {
  var exitStatus = 0
  const options = {readableObjectMode: false, writableObjectMode: true}
  const transform = through2(options, function (data, enc, callback) {
    exitStatus = 1
    // console.log(data)
    const {line: lineNumber, filePath, requiredModule} = data

    callback(null, 'Package ' + requiredModule + ' is required at ' + filePath + ':' + lineNumber + '\n')
  })
  transform.on('end', function (cb) {
    console.log('Unused packages', stream.unusedPackages)
    process.exit(exitStatus)
  })

  pump(stream, transform, outputStream)
}
