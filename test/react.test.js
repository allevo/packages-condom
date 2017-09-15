'use strict'

var path = require('path')

var download = require('download-git-repo')
var tap = require('tap')
var condom = require('../condom')

download('facebook/react#b5ac963fb791d1298e7f396236383bc955f916c1', 'test/data/react', function (err) {
  if (err) throw err

  tap.test('react should be ok', function (t) {
    t.plan(1)

    var stream = condom({
      packageJson: require(path.join(__dirname, '/data/react', 'package.json')),
      globPattern: ['**/*.js', '!node_modules/**/*', '!test/**/*', '!tests/**/*', '!examples/**/*'],
      globOptions: {
        cwd: path.join(__dirname, '/data/react')
      }
    })

    stream.on('end', function () {
      t.ok(true)
    })
    stream.resume()
  })
})
