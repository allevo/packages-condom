'use strict'

var path = require('path')
var condom = require('../condom')
var tap = require('tap')
var concatStream = require('concat-stream')

tap.test('unusedPackages work well', function (t) {
  t.plan(1)
  var stream = condom({
    packageJson: require('./data/example3/package'),
    peerDependencies: true,
    globOptions: {
      cwd: path.join(__dirname, '/data/example3')
    }
  })

  stream.pipe(concatStream((data) => {
    const unusedPackages = data.filter(c => c.type === 'unused').map(c => c.packageName)
    t.same(unusedPackages, [ 'foo', 'bar', 'is' ])
    t.end()
  }))
})
