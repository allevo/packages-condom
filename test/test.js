'use strict'

var path = require('path')

var condom = require('../condom')
var stream = condom({
  packageJson: require('./data/example1/package'),
  globOptions: {
    cwd: path.join(__dirname, '/data/example1')
  }
})

stream.on('data', function (d) {
  console.log(d)
})
stream.on('end', function () {
  console.log('STREAM, END')
})
stream.on('finish', function () {
  console.log('FINISH')
})
