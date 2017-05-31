'use strict'

var path = require('path')
var condom = require('../condom')
var tap = require('tap')

tap.test('unusedPackages work well', function (t) {
  t.plan(1)
  var stream = condom({
    packageJson: require('./data/example3/package'),
    peerDependencies: true,
    globOptions: {
      cwd: path.join(__dirname, '/data/example3')
    }
  })

  stream.on('end', function () {
    t.same(stream.unusedPackages, {
      bar: '^1.3.2',
      is: '^1.3.2',
      foo: '^1.3.2'
    })
    t.end()
  })
  stream.resume()
})
