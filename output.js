'use strict'

const through2 = require('through2')
const pump = require('pump')

module.exports = function (stream, outputStream) {
  var exitStatus = 0
  const options = {readableObjectMode: false, writableObjectMode: true}
  const transform = through2(options, function (data, enc, callback) {
    exitStatus = 1

    const type = data.type
    if (type === 'miss') {
      const lineNumber = data.line
      const filePath = data.filePath
      const requiredModule = data.requiredModule
      callback(null, 'Package ' + requiredModule + ' is required at ' + filePath + ':' + lineNumber + '\n')
    } else {
      const packageName = data.packageName
      callback(null, 'Unused package ' + packageName + '\n')
    }
  })
  transform.on('end', function (cb) {
    process.exit(exitStatus)
  })

  pump(stream, transform, outputStream)
}
