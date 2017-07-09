'use strict'

var path = require('path')
var concatStream = require('concat-stream')

var condom = require('../condom')

var tap = require('tap')

tap.test('ok', function (t) {
  t.plan(3)
  var stream = condom({
    packageJson: require('./data/example1/package'),
    peerDependencies: true,
    globOptions: {
      cwd: path.join(__dirname, '/data/example1')
    }
  })

  var paths = {}
  stream.on('pipe', function (source) {
    source.on('pipe', function (s) {
      if (paths[s.filePath]) t.fail('File double scanned')
      paths[s.filePath] = 1
    })
  })

  stream.pipe(concatStream(function (data) {
    const missesPackages = data.filter(c => c.type === 'miss').reduce(function (s, c) {
      s[c.requiredModule] = 1
      return s
    }, {})
    t.same(missesPackages, { split: 1, express: 1, foo: 1, bar: 1, '@types/blablabla': 1 })

    const unusedPackages = data.filter(c => c.type === 'unused').map(c => c.packageName)
    t.same(unusedPackages, [])

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
  }))
})
