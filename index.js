'use strict'

var fs = require('fs')
var path = require('path')
var argv = require('minimist')(process.argv.slice(2))

var basePath = argv._.pop() + ''
if (!fs.lstatSync(basePath).isDirectory()) {
  throw new Error('First params should be a directory path')
}

var condom = require('./condom')

var stream = condom({
  globOptions: {
    cwd: basePath
  },
  packageJson: require(path.join(basePath, 'package.json'))
})

stream.on('data', function (d) {
  console.log(d)
})
