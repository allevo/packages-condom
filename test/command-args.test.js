'use strict'

var path = require('path')
var tap = require('tap')
var childProcess = require('child_process')

const cliPath = path.resolve(__dirname, '..', 'index.js')
const example4Path = path.resolve(__dirname, 'data', 'example4')

tap.test('default flags', t => {
  t.plan(3)

  childProcess.execFile('node', [cliPath, example4Path], (error, stdout, stderr) => {
    t.equal(error.code, 1)
    t.match(stdout, 'bar is required')
    t.match(stdout, 'wow is required')
  })
})

tap.test('no-dependency', t => {
  t.plan(5)

  childProcess.execFile('node', [cliPath, example4Path, '--no-dependency'], (error, stdout, stderr) => {
    t.equal(error.code, 1)
    t.match(stdout, 'gearup is required')
    t.match(stdout, 'foo is required')
    t.match(stdout, 'bar is required')
    t.match(stdout, 'wow is required')
  })
})

tap.test('peer-dependency', t => {
  t.plan(1)

  childProcess.execFile('node', [cliPath, example4Path, '--peer-dependency'], (error, stdout, stderr) => {
    t.equal(error, null)
  })
})

tap.test('no-optional-dependency', t => {
  t.plan(4)

  childProcess.execFile('node', [cliPath, example4Path, '--no-optional-dependency'], (error, stdout, stderr) => {
    t.equal(error.code, 1)
    t.match(stdout, 'bar is required')
    t.match(stdout, 'wow is required')
    t.match(stdout, 'is is required')
  })
})

tap.test('glob-pattern', t => {
  t.plan(4)

  childProcess.execFile('node', [cliPath, example4Path, '--glob-pattern', '**/*.strange'], (error, stdout, stderr) => {
    t.equal(error.code, 1)
    t.match(stdout, 'gnats is required')
    t.match(stdout, 'Unused package gearup')
    t.match(stdout, 'Unused package is')
  })
})
