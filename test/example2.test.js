'use strict'

var path = require('path')

var condom = require('../condom')

var tap = require('tap')

tap.test('ok', function (t) {
  t.plan(1)
  var stream = condom({
    packageJson: require('./data/example2/package'),
    peerDependencies: true,
    globOptions: {
      cwd: path.join(__dirname, '/data/example2')
    }
  })

  var paths = {}
  stream.on('pipe', function (source) {
    if (paths[source.filePath]) t.fail('File double scanned')
    paths[source.filePath] = 1
  })

  var occurred = {}
  stream.on('data', function (d) {
    occurred[d.requiredModule] = occurred[d.requiredModule] || 0
    occurred[d.requiredModule]++
  })
  stream.on('finish', function () {
    t.same(occurred, {})
    t.end()
  })
})
