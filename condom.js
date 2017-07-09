'use strict'

var fs = require('fs')
var {Transform, PassThrough} = require('stream')

var isBuiltinModule = require('is-builtin-module')
var globStream = require('glob-stream')
var split = require('split')

var requireRegExp = /require\s*\(\s*["']([^"']*)["']\s*\)/
var isCommentRegxp = /^\s*(\*|\/\/)/
var isNonLocalModuleRegExp = /^\./

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
  packageJson.optionalDependencies = packageJson.optionalDependencies || {}

  var allowDependencies = options.dependencies || true
  var allowPeerDependencies = options.peerDependencies || false
  var allowOptionalDependency = options.optionalDependencies || true

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
    var isComment = chunk.chunk.match(isCommentRegxp)
    if (isComment) return callback()

    var line = chunk.chunk
    let index = 0
    while (true) {
      var match = line.substr(index).match(requireRegExp)
      // no other matches
      if (!match) break
      var requiredModule = match[1]
      index += match.index + 1

      if (isNonLocalModuleRegExp.test(requiredModule)) continue
      if (isBuiltinModule(requiredModule)) continue

      if (allowDependencies && packageJson.dependencies[requiredModule]) {
        delete this.unusedPackages[requiredModule]
        continue
      }
      if (allowPeerDependencies && packageJson.peerDependencies[requiredModule]) {
        delete this.unusedPackages[requiredModule]
        continue
      }
      if (allowOptionalDependency && packageJson.optionalDependencies[requiredModule]) {
        delete this.unusedPackages[requiredModule]
        continue
      }

      var submoduleSplitted = requiredModule.split('/')
      if (submoduleSplitted.length > 1 && requiredModule[0] !== '@') {
        requiredModule = submoduleSplitted[0]
        if (allowDependencies && packageJson.dependencies[requiredModule]) {
          delete this.unusedPackages[requiredModule]
          continue
        }
        if (allowPeerDependencies && packageJson.peerDependencies[requiredModule]) {
          delete this.unusedPackages[requiredModule]
          continue
        }
        if (allowOptionalDependency && packageJson.optionalDependencies[requiredModule]) {
          delete this.unusedPackages[requiredModule]
          continue
        }
      }
      var c = Object.assign({}, {type: 'miss', requiredModule}, chunk)
      this.push(c)
    }

    callback()
  }
  filterRequireLineStream.setMaxListeners(Infinity)

  function onStreamEnd () {
    openedStream--
    var f = globStream.read()
    // no opened stream
    if (openedStream === 0) {
      // All files are done
      Object.keys(filterRequireLineStream.unusedPackages).forEach(packageName => {
        returnStream.write({ type: 'unused', packageName })
      })
      return filterRequireLineStream.end()
    }
    // no chunk to process
    if (!f) return

    openedStream++
    fs.createReadStream(f.path)
      .pipe(split())
      .pipe(new CountLineStream(f.path))
      .on('end', onStreamEnd)
      .pipe(filterRequireLineStream, {end: false})
  }

  filterRequireLineStream.unusedPackages = Object.assign({}, packageJson.dependencies, packageJson.optionalDependencies)

  var returnStream = new PassThrough({objectMode: true})
  process.nextTick(() => {
    filterRequireLineStream.pipe(returnStream)
  })
  return returnStream
}

module.exports = start
