#!/usr/bin/env node
'use strict'

var fs = require('fs')
var path = require('path')
var argv = require('minimist')(process.argv.slice(2), {
  boolean: ['only-dependency', 'no-dependency', 'peer-dependency', 'no-optional-dependency'],
  string: 'glob-pattern'
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
  packageJson: require(path.resolve(path.join(basePath, 'package.json'))),
  dependencies: true,
  peerDependencies: false,
  optionalDependencies: true
}
if (argv['no-dependency']) {
  options.dependencies = false
}

if (argv['peer-dependency']) {
  options.peerDependencies = true
}
if (argv['no-optional-dependency']) {
  options.optionalDependencies = false
}
if (argv['glob-pattern']) {
  options.globPattern = argv['glob-pattern']
}

var stream = condom(options)
var output = require('./output')

output(stream, require('stdout-stream'))
