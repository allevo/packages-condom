'use strict'

var fs = require('fs')
var path = require('path')
var argv = require('minimist')(process.argv.slice(2), {
  boolean: ['only-dependency']
})

var basePath = argv._.pop() + ''
if (!fs.lstatSync(basePath).isDirectory()) {
  throw new Error('First params should be a directory path')
}

var condom = require('./condom')

var globOptions = {
  cwd: basePath
}
var options = {
  globOptions: globOptions,
  packageJson: require(path.join(basePath, 'package')),
  dependencies: true,
  peerDependencies: false,
  optionalDependency: true
}
if (argv['no-dependency']) {
  options.dependency = false
}

if (argv['no-peer-dependency']) {
  options.onlyDependency = false
}
if (argv['no-optional-dependency']) {
  options.onlyDependency = false
}

// TODO: add other parameters
var stream = condom(options)

stream.on('data', function (d) {
  console.log(d)
})
