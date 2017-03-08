'use strict'

var globStream = require('glob-stream')
var Transform = require('stream').Transform
var fs = require('fs')
var path = require('path')
var split = require('split')

var basePath = '/Users/allevo/repos/prova'
var packageJson = require(path.join(basePath, 'package.json'))

function IsFileFilter () {
  Transform.call(this, {
    objectMode: true
  })
}
require('util').inherits(IsFileFilter, Transform)

IsFileFilter.prototype._transform = function isFileFilterTransform (chunk, encoding, callback) {
  fs.lstat(chunk.path, function (err, stats) {
    if (err) return callback(err)
    if (!stats.isFile()) return callback()
    callback(null, chunk)
  })
}

function getListFileStream (baseDir, pattern) {
  return globStream(pattern, {absolute: true, cwd: baseDir})
    .pipe(new IsFileFilter())
}

var s = getListFileStream(path, '**/*.js')

var startChunks = []
function onReadable () {
  var chunks = s.read()
  startChunks.push(chunks)
  if (startChunks.length > 4) {
    s.removeListener('readable', onReadable)
    startProcess(startChunks, s)
  }
}

s.on('readable', onReadable)

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
var filterRequireLineStream = new Transform({
  objectMode: true,
  transform (chunk, encoding, callback) {
    var match = chunk.chunk.match(requireRegExp)
    if (!match) return callback()
    var requiredModule = match[1]

    if (nodeModules[requiredModule]) return callback()
    if (packageJson.dependencies[requiredModule]) return callback()
    if (isNonLocalModuleRegExp.test(requiredModule)) return callback()

    chunk.requiredModule = requiredModule
    callback(null, chunk)
  }
})
filterRequireLineStream.setMaxListeners(Infinity)

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

function startProcess (startChunks, s) {
  var initialStreams = startChunks.map(c => fs.createReadStream(c.path).pipe(split()).pipe(new CountLineStream(c.path)))

  function onStreamEnd () {
    var c = s.read()
    if (c == null) return
    var newStream = fs.createReadStream(c.path).pipe(split()).pipe(new CountLineStream(c.path))

    newStream.on('end', onStreamEnd)
    newStream.pipe(filterRequireLineStream, {end: false})
  }

  initialStreams.forEach(f => {
    console.log('ENDED')
    f.on('end', onStreamEnd)
  })

  initialStreams.forEach(f => f.pipe(filterRequireLineStream, {end: false}))
}

filterRequireLineStream.on('data', c => {
  console.log(c)
})

var start = Date.now()
process.on('exit', function () {
  console.log('TIME', (Date.now() - start) / 1000, 's')
})

module.exports = start
