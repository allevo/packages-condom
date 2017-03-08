'use strict'

var fs = require('fs')
var Transform = require('stream').Transform

var globStream = require('glob-stream')
var split = require('split')

var requireRegExp = /require\s*\(\s*["']([^"']*)["']\s*\)/
var isNonLocalModuleRegExp = /^\W/
var nodeModules = {
  assert: true,
  buffer: true,
  child_process: true,
  cluster: true,
  console: true,
  crypto: true,
  dns: true,
  domain: true,
  events: true,
  fs: true,
  http: true,
  https: true,
  net: true,
  os: true,
  path: true,
  punycode: true,
  querystring: true,
  readline: true,
  repl: true,
  stream: true,
  string_decoder: true,
  tls: true,
  tty: true,
  dgram: true,
  url: true,
  util: true,
  v8: true,
  vm: true,
  zlib: true
}

function getGlobStream (pattern, option) {
  var isFileFilter = new Transform({
    objectMode: true
  })
  isFileFilter._transform = function transform (chunk, encoding, callback) {
    fs.lstat(chunk.path, function lstatHandler (err, stats) {
      if (err) return callback(err)
      if (!stats.isFile()) return callback()
      callback(null, chunk)
    })
  }
  return globStream(pattern, option)
    .pipe(isFileFilter)
}

function CountLineStream (filePath) {
  Transform.call(this, {
    readableObjectMode: true,
    writableObjectMode: false
  })
  this.line = 0
  this.filePath = filePath
}
require('util').inherits(CountLineStream, Transform)

CountLineStream.prototype._transform = function countLineStreamTransform (chunk, encode, callback) {
  var obj = {
    chunk: chunk.toString(),
    line: this.line ++,
    filePath: this.filePath
  }
  callback(null, obj)
}

function start (options) {
  options = options || {}
  var globPattern = options.globPattern || ['**/*.js', '!node_modules/**/*', '!test/**/*', '!tests/**/*']
  var globOptions = options.globOptions || {}
  var packageJson = options.packageJson || {}
  packageJson.dependencies = packageJson.dependencies || {}
  packageJson.peerDependencies = packageJson.peerDependencies || {}

  globOptions.absolute = true
  var globStream = getGlobStream(globPattern, globOptions)

  var initialChunks = []
  var openedStream = 0
  function _start () {
    globStream.removeListener('data', onData)
    globStream.removeListener('end', _start)
    var initialStreams = initialChunks.map(function (c) {
      openedStream++
      return fs.createReadStream(c.path)
        .pipe(split())
        .pipe(new CountLineStream(c.path))
    })
    globStream.pause()
    initialStreams.forEach(function (f) { f.on('end', onStreamEnd) })
    initialStreams.forEach(function (f) { f.pipe(filterRequireLineStream, {end: false}) })
  }

  function onData (c) {
    initialChunks.push(c)
    if (initialChunks.length !== 4) return
    _start()
  }
  globStream.once('end', _start)
  globStream.on('data', onData)

  var filterRequireLineStream = new Transform({
    objectMode: true
  })
  filterRequireLineStream._transform = function transform (chunk, encoding, callback) {
    var match = chunk.chunk.match(requireRegExp)
    if (!match) return callback()
    var requiredModule = match[1]

    if (nodeModules[requiredModule]) return callback()
    if (packageJson.dependencies[requiredModule]) return callback()
    if (packageJson.peerDependencies[requiredModule]) return callback()
    if (isNonLocalModuleRegExp.test(requiredModule)) return callback()

    chunk.requiredModule = requiredModule
    callback(null, chunk)
  }
  filterRequireLineStream.setMaxListeners(Infinity)

  function onStreamEnd () {
    openedStream--
    var f = globStream.read()
    // no opened strem
    if (openedStream === 0) return filterRequireLineStream.end()
    // no chunk to process
    if (!f) return

    openedStream++
    fs.createReadStream(f.path)
      .pipe(split())
      .pipe(new CountLineStream(f.path))
      .on('end', onStreamEnd)
      .pipe(filterRequireLineStream, {end: false})
  }

  return filterRequireLineStream
}

module.exports = start
