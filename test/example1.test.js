'use strict'

var path = require('path')

var condom = require('../condom')

var tap = require('tap')

tap.test('ok', function (t) {
  t.plan(2)
  var stream = condom({
    packageJson: require('./data/example1/package'),
    peerDependencies: true,
    globOptions: {
      cwd: path.join(__dirname, '/data/example1')
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
  stream.on('end', function () {
    t.same(occurred, { split: 1, express: 1 })
    var expectedPaths = [
      path.join(__dirname, '/data/example1/index.js'),
      path.join(__dirname, '/data/example1/jquery-3.1.1_1.js'),
      path.join(__dirname, '/data/example1/jquery.js'),
      path.join(__dirname, '/data/example1/jquery_10.js'),
      path.join(__dirname, '/data/example1/jquery_11.js'),
      path.join(__dirname, '/data/example1/jquery_12.js'),
      path.join(__dirname, '/data/example1/jquery_13.js'),
      path.join(__dirname, '/data/example1/jquery_2.js'),
      path.join(__dirname, '/data/example1/jquery_3.js'),
      path.join(__dirname, '/data/example1/jquery_4.js'),
      path.join(__dirname, '/data/example1/jquery_5.js'),
      path.join(__dirname, '/data/example1/jquery_6.js'),
      path.join(__dirname, '/data/example1/jquery_7.js'),
      path.join(__dirname, '/data/example1/jquery_8.js'),
      path.join(__dirname, '/data/example1/jquery_9.js')
    ]
    t.same(Object.keys(paths), expectedPaths)
  })
})
