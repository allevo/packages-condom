'use strict'

var path = require('path')
var tap = require('tap')
var childProcess = require('child_process')

const indexPath = path.resolve(__dirname, '..', 'index.js')
const example1Path = path.resolve(__dirname, 'data', 'example1')
const example3Path = path.resolve(__dirname, 'data', 'example3')

tap.test('exit code for missing deps', t => {
  t.plan(5)

  childProcess.execFile('node', [indexPath, example1Path], (error, stdout, stderr) => {
    t.equal(error.code, 1)
    t.match(stdout, 'split is required')
    t.match(stdout, 'pump is required')
    t.match(stdout, 'express is required')
    t.match(stdout, 'Unused package quiqui')
  })
})

tap.test('exit code for unused deps', t => {
  t.plan(5)

  childProcess.execFile('node', [indexPath, example3Path], (error, stdout, stderr) => {
    t.equal(error, null)
    t.match(stdout, 'Unused package foo')
    t.match(stdout, 'Unused package bar')
    t.match(stdout, 'Unused package is')
    t.notMatch(stdout, 'is required')
  })
})
